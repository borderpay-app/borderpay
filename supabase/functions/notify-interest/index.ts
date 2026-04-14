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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const locationMap: Record<string, string> = {
  'northern-ireland': 'Northern Ireland',
  'ireland': 'Ireland',
  'uk-other': 'UK (other)',
  'other': 'Other',
}

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
    const { error: dbError } = await supabaseAdmin
      .from('interest_registrations')
      .insert({
        name,
        email: email.toLowerCase(),
        company,
        location,
      })

    if (dbError) {
      // Duplicate key (already registered) — treat as success
      if (dbError.code === '23505') {
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.error('DB insert failed:', dbError.message)
      return new Response(
        JSON.stringify({ error: 'Failed to save registration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notification email
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeCompany = company ? escapeHtml(company) : '—'
    const safeLocation = locationMap[location] || escapeHtml(location)

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1A3A2A; border-bottom: 2px solid #1A3A2A; padding-bottom: 10px;">
          New Interest Registration — Border Pay
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px 0; color: #666; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${safeName}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}" style="color: #1A3A2A;">${safeEmail}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Company</td><td style="padding: 8px 0;">${safeCompany}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Location</td><td style="padding: 8px 0;">${safeLocation}</td></tr>
        </table>
        <p style="margin-top: 24px; font-size: 12px; color: #999;">
          This notification was sent from the Border Pay website interest form.
        </p>
      </div>
    `

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const PROJECT_ID = SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1]

    if (LOVABLE_API_KEY && PROJECT_ID) {
      const response = await fetch(`https://api.lovable.dev/v1/projects/${PROJECT_ID}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          to: NOTIFY_EMAIL,
          subject: `New Interest: ${safeName}${company ? ` (${escapeHtml(company)})` : ''}`,
          html,
        }),
      })

      if (!response.ok) {
        console.error('Email send failed:', await response.text())
      }
    } else {
      console.error('Missing LOVABLE_API_KEY or SUPABASE_URL — notification skipped')
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
