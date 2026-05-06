import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTIFY_EMAIL = 'hello@borderpay.app'
const SITE_NAME = 'borderpay-express-interest'
const SENDER_DOMAIN = 'notify.borderpay.app'
const FROM_DOMAIN = 'borderpay.app'
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

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function enqueueTransactionalEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  body: {
    templateName: string
    recipientEmail: string
    idempotencyKey: string
    templateData?: Record<string, unknown>
  }
) {
  const template = TEMPLATES[body.templateName]
  if (!template) throw new Error(`Email template not found: ${body.templateName}`)

  const effectiveRecipient = template.to || body.recipientEmail
  const normalizedEmail = effectiveRecipient.toLowerCase()
  const messageId = crypto.randomUUID()

  const { data: suppressed, error: suppressionError } = await supabaseAdmin
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (suppressionError) throw new Error(`Suppression check failed: ${suppressionError.message}`)

  if (suppressed) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: body.templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })
    return
  }

  const { data: existingToken, error: tokenLookupError } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (tokenLookupError) throw new Error(`Token lookup failed: ${tokenLookupError.message}`)
  if (existingToken?.used_at) throw new Error('Email is unsubscribed but missing suppression record')

  let unsubscribeToken = existingToken?.token
  if (!unsubscribeToken) {
    unsubscribeToken = generateToken()
    const { error: tokenError } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .upsert({ token: unsubscribeToken, email: normalizedEmail }, { onConflict: 'email', ignoreDuplicates: true })
    if (tokenError) throw new Error(`Failed to create unsubscribe token: ${tokenError.message}`)
  }

  const templateData = body.templateData ?? {}
  const html = await renderAsync(React.createElement(template.component, templateData))
  const text = await renderAsync(React.createElement(template.component, templateData), { plainText: true })
  const subject = typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: body.templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: body.templateName,
      idempotency_key: body.idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: body.templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    })
    throw new Error(`Failed to enqueue email: ${enqueueError.message}`)
  }
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

  const authorizationHeader = req.headers.get('Authorization')

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
      await enqueueTransactionalEmail({
        templateName: 'interest-confirmation',
        recipientEmail: email,
        idempotencyKey,
        templateData: { name },
      }, authorizationHeader)
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
      await enqueueTransactionalEmail({
        templateName: 'interest-notification',
        recipientEmail: NOTIFY_EMAIL,
        idempotencyKey: `interest-notify-${registrationId}`,
        templateData: { name, email, company, location },
      }, authorizationHeader)
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
