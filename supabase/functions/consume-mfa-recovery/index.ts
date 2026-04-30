// Consume an MFA recovery token: validate, mark consumed, unenroll all TOTP factors,
// and issue a magic link so the user can sign in and re-enrol MFA.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    const redirectTo = typeof body.redirectTo === 'string' ? body.redirectTo : null

    if (!token || token.length < 32 || token.length > 128 || !/^[0-9a-f]+$/i.test(token)) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const tokenHash = await sha256Hex(token)
    const { data: row, error: lookupErr } = await supabase
      .from('mfa_recovery_tokens')
      .select('id, user_id, expires_at, consumed_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (lookupErr) {
      console.error('lookup failed', lookupErr)
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!row) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (row.consumed_at) {
      return new Response(JSON.stringify({ error: 'This recovery link has already been used' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: 'This recovery link has expired' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Atomically mark consumed (CAS on consumed_at IS NULL)
    const { data: updated, error: updErr } = await supabase
      .from('mfa_recovery_tokens')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('consumed_at', null)
      .select('id')
      .maybeSingle()

    if (updErr || !updated) {
      return new Response(JSON.stringify({ error: 'This recovery link has already been used' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Confirm the user is still an admin before stripping MFA
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', row.user_id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Account not eligible for MFA recovery' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Unenroll all TOTP factors for the user via admin API
    const { data: factorList, error: facErr } = await supabase.auth.admin.mfa.listFactors({
      userId: row.user_id,
    })
    if (facErr) {
      console.error('listFactors failed', facErr)
      return new Response(JSON.stringify({ error: 'Could not list MFA factors' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const factors = (factorList?.factors ?? [])
    for (const f of factors) {
      const { error: dErr } = await supabase.auth.admin.mfa.deleteFactor({
        userId: row.user_id,
        id: f.id,
      })
      if (dErr) console.error('deleteFactor failed', f.id, dErr)
    }

    // Get user email for magic link
    const { data: userRes } = await supabase.auth.admin.getUserById(row.user_id)
    const email = userRes?.user?.email
    if (!email) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Audit
    console.log(JSON.stringify({
      event: 'mfa_recovery_consumed',
      user_id: row.user_id,
      factors_removed: factors.length,
    }))

    // Generate a magic link so the user can sign in fresh and enroll a new factor
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectTo ?? undefined,
      },
    })
    if (linkErr) {
      console.error('generateLink failed', linkErr)
      // MFA was still removed — user can sign in with password
      return new Response(JSON.stringify({
        ok: true,
        factorsRemoved: factors.length,
        message: 'Two-factor reset. Please sign in with your password and re-enrol.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({
      ok: true,
      factorsRemoved: factors.length,
      magicLink: linkData?.properties?.action_link ?? null,
      message: 'Two-factor reset. Use the magic link or sign in with your password to re-enrol.',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('consume-mfa-recovery error', err)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
