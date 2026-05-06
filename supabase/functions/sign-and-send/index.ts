import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  clusterApiUrl,
} from "https://esm.sh/@solana/web3.js@1.98.4";
import {
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "https://esm.sh/@solana/spl-token@0.4.14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Circle EURC devnet mint
const EURC_MINT = new PublicKey("HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr");
const EURC_DECIMALS = 6;
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify JWT via getClaims
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // --- Parse body ---
    const body = await req.json();
    const { recipient_address, amount, mint } = body as {
      recipient_address: string;
      amount: number;
      mint?: string;
    };

    if (!recipient_address || typeof amount !== "number" || amount <= 0) {
      return json({ error: "Invalid parameters: recipient_address and amount required" }, 400);
    }

    // Validate recipient address
    let recipientPk: PublicKey;
    try {
      recipientPk = new PublicKey(recipient_address);
    } catch {
      return json({ error: "Invalid recipient Solana address" }, 400);
    }

    const tokenMint = mint ? new PublicKey(mint) : EURC_MINT;
    const decimals = EURC_DECIMALS; // Adjust if supporting multiple mints

    // --- Retrieve private key from Vault ---
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: secretKey, error: vaultErr } = await admin.rpc(
      "vault_retrieve_wallet_key",
      { _user_id: userId }
    );
    if (vaultErr || !secretKey) {
      console.error("Vault retrieval error:", vaultErr);
      return json({ error: "No custodial wallet found. Sign out and back in to generate one." }, 404);
    }

    // Reconstruct keypair from hex-encoded secret key
    const secretBytes = new Uint8Array(
      (secretKey as string).match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))
    );
    const keypair = Keypair.fromSecretKey(secretBytes);

    // --- Build transaction ---
    const senderAta = await getAssociatedTokenAddress(tokenMint, keypair.publicKey);
    const recipientAta = await getAssociatedTokenAddress(tokenMint, recipientPk);

    const tx = new Transaction();

    // Create recipient ATA if it doesn't exist
    try {
      await getAccount(connection, recipientAta);
    } catch {
      tx.add(
        createAssociatedTokenAccountInstruction(
          keypair.publicKey, // payer
          recipientAta,
          recipientPk,
          tokenMint
        )
      );
    }

    const amountUnits = BigInt(Math.round(amount * 10 ** decimals));
    tx.add(
      createTransferInstruction(
        senderAta,
        recipientAta,
        keypair.publicKey,
        amountUnits,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // --- Sign and send ---
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = keypair.publicKey;
    tx.sign(keypair);

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    // Wait for confirmation
    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    return json({ signature, status: "confirmed" });
  } catch (err: any) {
    console.error("sign-and-send error:", err);
    const msg = err?.message ?? String(err);

    // User-friendly errors
    if (/insufficient lamports|insufficient funds/i.test(msg)) {
      return json(
        { error: "Custodial wallet has no SOL for transaction fees. Fund it with devnet SOL first." },
        400
      );
    }
    if (/TokenAccountNotFound|could not find account/i.test(msg)) {
      return json(
        { error: "Custodial wallet has no token account for this mint. Receive tokens first." },
        400
      );
    }

    return json({ error: msg }, 500);
  }
});
