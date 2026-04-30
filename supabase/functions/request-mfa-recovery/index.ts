// Request MFA recovery: validate that the email belongs to an admin, generate a
// single-use token, store its hash, and email a recovery link.
// Always returns 200 with a generic message to prevent email enumeration.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOKEN_TTL_MINUTES = 30
const RATE_LIMIT_WINDOW_MIN = 15
const MAX_REQUESTS_PER_WINDOW = 3

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const GENERIC_RESPONSE = {
  message: 'If this email is registered as an admin, a recovery link has been sent.',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const redirectOrigin = typeof body.redirectOrigin === 'string' ? body.redirectOrigin : ''

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Find the user by email. listUsers is paginated; we filter manually.
    // For low admin counts this is fine.
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('email', email)
      .maybeSingle()

    // Always log the attempt to allow auditing without leaking existence.
    const ip = req.headers.get('x-forwarded-for') ?? null
    console.log(JSON.stringify({ event: 'mfa_recovery_request', email, hasProfile: !!profile, ip }))

    if (!profile) {
      return new Response(JSON.stringify(GENERIC_RESPONSE), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Must be admin
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.user_id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleRow) {
      return new Response(JSON.stringify(GENERIC_RESPONSE), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate-limit: max N unconsumed-or-recent tokens issued in the window for this user
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60_000).toISOString()
    const { count: recentCount } = await supabase
      .from('mfa_recovery_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.user_id)
      .gte('created_at', windowStart)

    if ((recentCount ?? 0) >= MAX_REQUESTS_PER_WINDOW) {
      // Still return generic to avoid leaking, but record it
      console.warn(JSON.stringify({ event: 'mfa_recovery_rate_limited', user_id: profile.user_id }))
      return new Response(JSON.stringify(GENERIC_RESPONSE), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = generateToken()
    const tokenHash = await sha256Hex(token)
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString()

    const { error: insErr } = await supabase.from('mfa_recovery_tokens').insert({
      user_id: profile.user_id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      requested_ip: ip,
    })
    if (insErr) {
      console.error('insert token failed', insErr)
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build link. Trust an allow-list of origins.
    const allowedOrigins = [
      'https://borderpay.app',
      'https://www.borderpay.app',
      'https://borderpay-express-interest.lovable.app',
    ]
    const origin = allowedOrigins.includes(redirectOrigin) ? redirectOrigin : 'https://borderpay.app'
    const recoveryUrl = `${origin}/auth/mfa-recovery?token=${token}`

    const { error: emailErr } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'mfa-recovery',
        recipientEmail: email,
        templateData: { recoveryUrl, expiresInMinutes: TOKEN_TTL_MINUTES },
      },
    })
    if (emailErr) {
      console.error('email send failed', emailErr)
      // Still return generic — token exists, user can re-request.
    }

    return new Response(JSON.stringify(GENERIC_RESPONSE), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('request-mfa-recovery error', err)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
