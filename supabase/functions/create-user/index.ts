import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateUserRequest {
  name: string;
  nikNis: string;
  role: 'siswa' | 'guru' | 'osis' | 'admin';
  kelas?: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { name, nikNis, role, kelas, password }: CreateUserRequest = await req.json()

    if (!name || !nikNis || !role || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate display ID
    const generateDisplayId = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    let displayId = generateDisplayId();
    
    // Check if display_id already exists
    let { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('display_id')
      .eq('display_id', displayId)
      .maybeSingle();

    while (existingUser) {
      displayId = generateDisplayId();
      const { data } = await supabaseAdmin
        .from('users')
        .select('display_id')
        .eq('display_id', displayId)
        .maybeSingle();
      existingUser = data;
    }

    // Create user in Supabase Auth
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: `${nikNis}@suarasekolah.id`,
      password: password,
      user_metadata: {
        full_name: name,
        nik_nis: nikNis,
        role: role,
        kelas: kelas
      }
    });

    if (authCreateError) {
      return new Response(
        JSON.stringify({ error: authCreateError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Insert into users table
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        nik_nis: nikNis,
        display_id: displayId,
        name: name,
        role: role,
        password_hash: 'handled_by_supabase_auth',
        kelas: kelas || null
      });

    if (insertError) {
      // If user table insert fails, clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create leaderboard entry
    const { error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .insert({
        user_id: authData.user.id,
        total_berita: 0,
        total_pengaduan: 0,
        points: 0
      });

    if (leaderboardError) {
      console.error('Failed to create leaderboard entry:', leaderboardError);
      // Don't fail the entire operation for leaderboard error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          name: name,
          nik_nis: nikNis,
          display_id: displayId,
          role: role,
          kelas: kelas
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})