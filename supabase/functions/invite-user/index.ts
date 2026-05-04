import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create a client with the caller's token to verify they're an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Verify caller identity and MFA (AAL2)
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (claimsData.claims.aal !== 'aal2') {
      return new Response(JSON.stringify({ error: 'MFA verification required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const callerId = claimsData.claims.sub

    // Check caller is admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, role } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile) {
      // User exists — just assign the role
      if (role) {
        await adminClient
          .from('user_roles')
          .upsert({ user_id: existingProfile.user_id, role }, { onConflict: 'user_id,role' })
      }
      return new Response(JSON.stringify({ status: 'existing', user_id: existingProfile.user_id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Invite new user via admin API — this triggers the auth-email-hook
    // which sends the branded invite email from borderpay.app
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { invited_role: role || 'user' },
      redirectTo: `https://borderpay.app/auth`,
    })

    if (inviteError) {
      console.error('Invite error:', inviteError)
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Pre-assign the role for when the user accepts the invite
    if (role && inviteData?.user?.id) {
      await adminClient
        .from('user_roles')
        .upsert({ user_id: inviteData.user.id, role }, { onConflict: 'user_id,role' })
    }

    return new Response(JSON.stringify({ status: 'invited', user_id: inviteData?.user?.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Invite function error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
