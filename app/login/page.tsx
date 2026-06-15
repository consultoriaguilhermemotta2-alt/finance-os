"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, BookText, AlertCircle } from "lucide-react";

// ── Mensagens de erro amigáveis ─────────────────────────────────────────────
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Email ainda não confirmado. Verifique sua caixa de entrada.";
  if (m.includes("too many requests")) return "Muitas tentativas. Aguarde um momento e tente novamente.";
  if (m.includes("network")) return "Falha de conexão. Verifique sua internet e tente novamente.";
  return "Não foi possível entrar. Tente novamente.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Informe email e senha.");
      return;
    }

    setLoading(true);
    
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(friendlyError(authError.message));
      setLoading(false);
      return;
    }
    console.log("Login ok");

    window.location.href = redirectTo || "/";
    
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center mb-3">
            <BookText size={20} className="text-gold" />
          </div>
          <h1 className="font-display text-2xl text-ink">Finance OS</h1>
          <p className="text-ink-mute text-sm mt-1">Ledger pessoal</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="text-ink-mute text-xs mb-1 block">Email</label>
            <input
              type="email"
              className="input"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <label className="text-ink-mute text-xs mb-1 block">Senha</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-expense text-sm bg-expense-dim/40 border border-expense/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="text-ink-mute text-xs text-center mt-6">
          Acesso restrito — apenas usuários autorizados.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
