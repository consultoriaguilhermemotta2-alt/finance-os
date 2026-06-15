// ============================================================================
// SUPABASE — Browser client
// ----------------------------------------------------------------------------
// Usado em Client Components ("use client"). Lê a sessão dos cookies do
// navegador e mantém-na sincronizada (login, logout, refresh de token).
// ============================================================================

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
