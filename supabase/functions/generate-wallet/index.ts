import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Keypair } from "https://esm.sh/@solana/web3.js@1.98.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { Buffer } from "node:buffer";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the calling user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use the user's JWT to identify them
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Service-role client for privileged operations
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Check if user already has a wallet
    const { data: profile } = await admin
      .from("profiles")
      .select("wallet_address")
      .eq("user_id", userId)
      .single();

    if (profile?.wallet_address) {
      return new Response(
        JSON.stringify({ wallet_address: profile.wallet_address }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate Solana keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const secretKeyHex = Buffer.from(keypair.secretKey).toString("hex");

    // Store private key in Vault
    const { error: vaultError } = await admin.rpc("vault_store_wallet_key", {
      _user_id: userId,
      _secret_value: secretKeyHex,
    });
    if (vaultError) {
      console.error("Vault store error:", vaultError);
      return new Response(JSON.stringify({ error: "Failed to store key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save public address to profiles
    const { error: updateError } = await admin
      .from("profiles")
      .update({ wallet_address: publicKey })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save address" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ wallet_address: publicKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
