// ============================================================================
// SUPABASE — Server client (placeholder)
// ----------------------------------------------------------------------------
// Ver lib/supabase/client.ts para o passo a passo de integração.
// Este arquivo seria usado em Server Components / Route Handlers para ler
// dados com cookies de sessão (caso a V2 adicione autenticação).
// ============================================================================

// import { createServerClient } from "@supabase/ssr";
// import { cookies } from "next/headers";
//
// export async function createClient() {
//   const cookieStore = await cookies();
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() { return cookieStore.getAll(); },
//         setAll(toSet) {
//           try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
//           catch {}
//         },
//       },
//     }
//   );
// }

export {};
