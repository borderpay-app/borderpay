const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTIFY_EMAIL = 'contact@finteco.co.uk'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, company, location } = await req.json()

    if (!name || !email || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const locationMap: Record<string, string> = {
      'northern-ireland': 'Northern Ireland',
      'ireland': 'Ireland',
      'uk-other': 'UK (other)',
      'other': 'Other',
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1A3A2A; border-bottom: 2px solid #1A3A2A; padding-bottom: 10px;">
          New Interest Registration — Border Pay
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px 0; color: #666; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #1A3A2A;">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Company</td><td style="padding: 8px 0;">${company || '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Location</td><td style="padding: 8px 0;">${locationMap[location] || location}</td></tr>
        </table>
        <p style="margin-top: 24px; font-size: 12px; color: #999;">
          This notification was sent from the Border Pay website interest form.
        </p>
      </div>
    `

    // Use Supabase's built-in email via the auth admin API workaround
    // Send via a simple SMTP-like approach using the Lovable API
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const PROJECT_ID = SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1]

    if (!LOVABLE_API_KEY || !PROJECT_ID) {
      console.error('Missing LOVABLE_API_KEY or SUPABASE_URL')
      return new Response(
        JSON.stringify({ success: true, note: 'Registration saved, notification skipped' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notification via Lovable AI
    const response = await fetch(`https://api.lovable.dev/v1/projects/${PROJECT_ID}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        to: NOTIFY_EMAIL,
        subject: `New Interest: ${name}${company ? ` (${company})` : ''}`,
        html,
      }),
    })

    if (!response.ok) {
      console.error('Email send failed:', await response.text())
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
