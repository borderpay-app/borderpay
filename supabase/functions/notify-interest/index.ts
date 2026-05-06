import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTIFY_EMAIL = 'hello@borderpay.app'
const RATE_LIMIT_WINDOW_MINUTES = 10
const MAX_REQUESTS_PER_WINDOW = 3

const VALID_LOCATIONS = ['northern-ireland', 'ireland', 'uk-other', 'other'] as const

const InterestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name too long'),
  email: z.string().trim().email('Invalid email').max(320, 'Email too long'),
  company: z.string().trim().max(200, 'Company name too long').nullish().transform(v => v || null),
  location: z.enum(VALID_LOCATIONS, { errorMap: () => ({ message: 'Invalid location' }) }),
})


function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

async function checkRateLimit(supabaseAdmin: ReturnType<typeof createClient>, email: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()

  const { count, error } = await supabaseAdmin
    .from('interest_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .gte('created_at', windowStart)

  if (error) {
    console.error('Rate limit check failed:', error.message)
    return { allowed: true }
  }

  if ((count ?? 0) >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: RATE_LIMIT_WINDOW_MINUTES * 60 }
  }

  return { allowed: true }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const parsed = InterestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { name, email, company, location } = parsed.data
    const supabaseAdmin = getSupabaseAdmin()

    // Rate limit check
    const rateLimit = await checkRateLimit(supabaseAdmin, email)
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfterSeconds ?? 600),
          },
        }
      )
    }

    // Insert into database (service role bypasses RLS)
    const registrationId = crypto.randomUUID()
    const { error: dbError } = await supabaseAdmin
      .from('interest_registrations')
      .insert({
        id: registrationId,
        name,
        email: email.toLowerCase(),
        company,
        location,
      })

    let alreadyRegistered = false
    if (dbError) {
      // Duplicate key (already registered) — still send confirmation, but don't double-notify admin
      if (dbError.code === '23505') {
        alreadyRegistered = true
      } else {
        console.error('DB insert failed:', dbError.message)
        return new Response(
          JSON.stringify({ error: 'Failed to save registration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Send confirmation email to the registrant (fire-and-forget — failures don't block success)
    try {
      const idempotencyKey = `interest-confirm-${email.toLowerCase()}`
      const { error: emailErr } = await supabaseAdmin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'interest-confirmation',
          recipientEmail: email,
          idempotencyKey,
          templateData: { name },
        },
      })
      if (emailErr) console.error('Confirmation email failed:', emailErr.message)
    } catch (e) {
      console.error('Confirmation email threw:', e)
    }

    if (alreadyRegistered) {
      return new Response(
        JSON.stringify({ success: true, alreadyRegistered: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notification email to admin via transactional email queue
    try {
      const { error: notifyErr } = await supabaseAdmin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'interest-notification',
          recipientEmail: NOTIFY_EMAIL,
          idempotencyKey: `interest-notify-${registrationId}`,
          templateData: { name, email, company, location },
        },
      })
      if (notifyErr) console.error('Notification email failed:', notifyErr.message)
    } catch (e) {
      console.error('Notification email threw:', e)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
