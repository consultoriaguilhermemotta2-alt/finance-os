"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, CreditCard,
  Landmark, Target, FileBarChart, Menu, X, BookText, LogOut,
} from "lucide-react";

const nav = [
  { href: "/",          label: "Dashboard",       icon: LayoutDashboard },
  { href: "/entradas",  label: "Entradas",        icon: ArrowDownToLine },
  { href: "/saidas",    label: "Saídas",          icon: ArrowUpFromLine },
  { href: "/cartoes",   label: "Cartões",         icon: CreditCard },
  { href: "/dividas",   label: "Dívidas",         icon: Landmark },
  { href: "/metas",     label: "Metas",           icon: Target },
  { href: "/relatorio", label: "Relatório mensal",icon: FileBarChart },
];

interface SidebarContentProps {
  userEmail: string;
  onLogout: () => void;
  loggingOut: boolean;
  onNavigate?: () => void;
}

function SidebarContent({ userEmail, onLogout, loggingOut, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full w-56 bg-surface">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
          <BookText size={15} className="text-gold" />
        </div>
        <div>
          <p className="font-display text-ink text-base leading-none">Finance OS</p>
          <p className="text-ink-mute text-xs mt-0.5">Ledger pessoal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-gold/12 text-gold border border-gold/25"
                  : "text-ink-soft hover:text-ink hover:bg-surface-2"
              }`}
            >
              <Icon size={15} className={active ? "text-gold" : "text-ink-mute"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-3 border-t border-border">
        {userEmail && (
          <p className="text-ink-soft text-xs truncate px-1 mb-2" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-ink-mute hover:text-expense hover:bg-expense-dim/30 transition-all disabled:opacity-50"
        >
          <LogOut size={15} />
          {loggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 border-r border-border">
        <SidebarContent userEmail={userEmail} onLogout={handleLogout} loggingOut={loggingOut} />
      </div>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-surface border border-border rounded-xl text-ink-soft shadow-lg"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/70 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Mobile sliding panel */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 border-r border-border transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full">
          <button onClick={() => setOpen(false)} className="absolute top-5 right-3 btn-icon" aria-label="Fechar menu">
            <X size={16} />
          </button>
          <SidebarContent userEmail={userEmail} onLogout={handleLogout} loggingOut={loggingOut} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
