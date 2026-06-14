"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, CreditCard,
  Landmark, Target, FileBarChart, Menu, X, BookText,
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

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const Content = () => (
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

      <div className="px-5 py-4 border-t border-border">
        <p className="text-ink-mute text-xs">Dados de exemplo · pronto p/ Supabase</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 border-r border-border">
        <Content />
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
          <Content />
        </div>
      </div>
    </>
  );
}
