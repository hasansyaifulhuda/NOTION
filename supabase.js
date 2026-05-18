/**
 * DevVault - Supabase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://supabase.com and create a new project
 * 2. Go to Project Settings > API
 * 3. Copy your Project URL and replace YOUR_SUPABASE_URL below
 * 4. Copy your anon/public key and replace YOUR_SUPABASE_ANON_KEY below
 *
 * IMPORTANT:
 * - NEVER use your service_role key in the frontend
 * - Only use the anon/public key
 * - The anon key is safe to expose in browser code when RLS is properly configured
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://emhhdmdwkiwfemmtzrzb.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_vgSfkJ8JKvboivWgtoMoAw_yLoPaLb_';

  /**
   * Check if Supabase is properly configured
   * Returns false if placeholder values are still present
   */
  const isConfigured =
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON_KEY.length > 20;

  window.isSupabaseConfigured = isConfigured;

  if (isConfigured) {
    try {
      // Load Supabase client from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = function () {
        try {
          window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: false,
            },
          });
          // Dispatch event so app.js can proceed
          document.dispatchEvent(new CustomEvent('supabase:ready'));
        } catch (err) {
          console.error('[DevVault] Failed to create Supabase client:', err);
          window.supabaseClient = null;
          document.dispatchEvent(new CustomEvent('supabase:ready'));
        }
      };
      script.onerror = function () {
        console.warn('[DevVault] Failed to load Supabase SDK from CDN. Running in offline mode.');
        window.supabaseClient = null;
        document.dispatchEvent(new CustomEvent('supabase:ready'));
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error('[DevVault] Supabase initialization error:', err);
      window.supabaseClient = null;
      document.dispatchEvent(new CustomEvent('supabase:ready'));
    }
  } else {
    console.warn('[DevVault] Supabase is not configured. Running in demo/guest mode.');
    window.supabaseClient = null;
    // Still dispatch ready event so app initializes normally
    document.addEventListener('DOMContentLoaded', function () {
      document.dispatchEvent(new CustomEvent('supabase:ready'));
    });
  }
})();
