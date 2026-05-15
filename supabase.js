/**
 * DEVVAULT - Supabase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Supabase project.
 * 2. Open Project Settings > API.
 * 3. Copy your Project URL into SUPABASE_URL.
 * 4. Copy your anon/public key into SUPABASE_ANON_KEY.
 *
 * IMPORTANT SECURITY NOTES:
 * - NEVER use the service_role key in frontend JavaScript.
 * - NEVER commit real credentials to a public GitHub repository.
 * - Only use the anon/public key here.
 */

const SUPABASE_URL = "https://lmqargtitwstnzeikpkr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_eeLe2jPqjdIC4Ijgn-BaFA_BB6oiuy8";

const isSupabaseConfigured =
  typeof supabase !== "undefined" &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY" &&
  /^https:\/\/.+\.supabase\.co$/.test(SUPABASE_URL);

let supabaseClient = null;

if (isSupabaseConfigured) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
} else {
  console.info(
    "DEVVAULT: Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di supabase.js agar database dan login aktif."
  );
}

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.isSupabaseConfigured = isSupabaseConfigured;
window.supabaseClient = supabaseClient;
