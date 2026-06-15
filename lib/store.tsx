"use client";

// ============================================================================
// FINANCE OS — Data Provider
// ----------------------------------------------------------------------------
// Camada única de acesso a dados. Hoje opera sobre estado React inicializado
// com mockData. Quando o Supabase entrar:
//   1. Trocar `useState(mockX)` por `useEffect` + `supabase.from("x").select()`
//   2. Trocar cada `addX/updateX/deleteX` pelo equivalente
//      `.insert()/.update()/.delete()` do Supabase, mantendo a mesma
//      assinatura de função — os componentes não precisam mudar.
// ============================================================================

import { createContext, useContext, useState, ReactNode } from "react";
import type { Entrada, Saida, Cartao, CompraCartao, Divida, Meta, Responsavel } from "./types";
import {
  entradas as mockEntradas,
  saidas as mockSaidas,
  cartoes as mockCartoes,
  comprasCartao as mockCompras,
  dividas as mockDividas,
  metas as mockMetas,
} from "./mockData";
import { gerarParcelas } from "./utils";

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

interface FinanceContextType {
  entradas: Entrada[];
  saidas: Saida[];
  cartoes: Cartao[];
  comprasCartao: CompraCartao[];
  dividas: Divida[];
  metas: Meta[];

  addEntrada: (e: Omit<Entrada, "id" | "userId">) => void;
  updateEntrada: (id: string, patch: Partial<Entrada>) => void;
  deleteEntrada: (id: string) => void;

  addSaida: (s: Omit<Saida, "id" | "userId">) => void;
  updateSaida: (id: string, patch: Partial<Saida>) => void;
  deleteSaida: (id: string) => void;

  addCartao: (nome: string, responsavel: Responsavel, cor: string) => void;

  addCompraCartao: (input: {
    cartaoId: string;
    descricao: string;
    valorTotal: number;
    numeroParcelas: number;
    dataCompra: string;
    mesInicial: string;
  }) => void;
  toggleParcela: (compraId: string, numero: number) => void;
  deleteCompraCartao: (id: string) => void;

  addDivida: (d: Omit<Divida, "id" | "userId">) => void;
  updateDivida: (id: string, patch: Partial<Divida>) => void;
  deleteDivida: (id: string) => void;

  addMeta: (m: Omit<Meta, "id" | "userId">) => void;
  updateMeta: (id: string, patch: Partial<Meta>) => void;
  deleteMeta: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children, userId }: { children: ReactNode; userId: string }) {
  // Re-associa os dados de exemplo ao usuário autenticado (substitui o
  // placeholder SEED_USER_ID). Em produção, isto seria o resultado de
  // `supabase.from("entradas").select().eq("user_id", userId)` etc.
  const [entradas, setEntradas] = useState<Entrada[]>(() => mockEntradas.map((e) => ({ ...e, userId })));
  const [saidas, setSaidas] = useState<Saida[]>(() => mockSaidas.map((s) => ({ ...s, userId })));
  const [cartoes, setCartoes] = useState<Cartao[]>(() => mockCartoes.map((c) => ({ ...c, userId })));
  const [comprasCartao, setComprasCartao] = useState<CompraCartao[]>(() => mockCompras.map((c) => ({ ...c, userId })));
  const [dividas, setDividas] = useState<Divida[]>(() => mockDividas.map((d) => ({ ...d, userId })));
  const [metas, setMetas] = useState<Meta[]>(() => mockMetas.map((m) => ({ ...m, userId })));

  // ── Entradas ──
  const addEntrada: FinanceContextType["addEntrada"] = (e) =>
    setEntradas((p) => [{ ...e, id: uid("e"), userId }, ...p]);
  const updateEntrada: FinanceContextType["updateEntrada"] = (id, patch) =>
    setEntradas((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const deleteEntrada: FinanceContextType["deleteEntrada"] = (id) =>
    setEntradas((p) => p.filter((x) => x.id !== id));

  // ── Saídas ──
  const addSaida: FinanceContextType["addSaida"] = (s) =>
    setSaidas((p) => [{ ...s, id: uid("s"), userId }, ...p]);
  const updateSaida: FinanceContextType["updateSaida"] = (id, patch) =>
    setSaidas((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const deleteSaida: FinanceContextType["deleteSaida"] = (id) =>
    setSaidas((p) => p.filter((x) => x.id !== id));

  // ── Cartões ──
  const addCartao: FinanceContextType["addCartao"] = (nome, responsavel, cor) =>
    setCartoes((p) => [...p, { id: uid("cartao"), userId, nome, responsavel, cor }]);

  // ── Compras no cartão ──
  const addCompraCartao: FinanceContextType["addCompraCartao"] = (input) => {
    const valorParcela = Math.round((input.valorTotal / input.numeroParcelas) * 100) / 100;
    const nova: CompraCartao = {
      id: uid("compra"),
      userId,
      cartaoId: input.cartaoId,
      descricao: input.descricao,
      valorTotal: input.valorTotal,
      numeroParcelas: input.numeroParcelas,
      valorParcela,
      dataCompra: input.dataCompra,
      mesInicial: input.mesInicial,
      parcelas: gerarParcelas(input.valorTotal, input.numeroParcelas, input.mesInicial, 0),
    };
    setComprasCartao((p) => [nova, ...p]);
  };

  const toggleParcela: FinanceContextType["toggleParcela"] = (compraId, numero) =>
    setComprasCartao((p) =>
      p.map((c) =>
        c.id !== compraId
          ? c
          : {
              ...c,
              parcelas: c.parcelas.map((parc) =>
                parc.numero === numero
                  ? { ...parc, status: parc.status === "paga" ? "pendente" : "paga" }
                  : parc
              ),
            }
      )
    );

  const deleteCompraCartao: FinanceContextType["deleteCompraCartao"] = (id) =>
    setComprasCartao((p) => p.filter((c) => c.id !== id));

  // ── Dívidas ──
  const addDivida: FinanceContextType["addDivida"] = (d) =>
    setDividas((p) => [{ ...d, id: uid("divida"), userId }, ...p]);
  const updateDivida: FinanceContextType["updateDivida"] = (id, patch) =>
    setDividas((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const deleteDivida: FinanceContextType["deleteDivida"] = (id) =>
    setDividas((p) => p.filter((x) => x.id !== id));

  // ── Metas ──
  const addMeta: FinanceContextType["addMeta"] = (m) =>
    setMetas((p) => [{ ...m, id: uid("meta"), userId }, ...p]);
  const updateMeta: FinanceContextType["updateMeta"] = (id, patch) =>
    setMetas((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const deleteMeta: FinanceContextType["deleteMeta"] = (id) =>
    setMetas((p) => p.filter((x) => x.id !== id));

  return (
    <FinanceContext.Provider
      value={{
        entradas, saidas, cartoes, comprasCartao, dividas, metas,
        addEntrada, updateEntrada, deleteEntrada,
        addSaida, updateSaida, deleteSaida,
        addCartao,
        addCompraCartao, toggleParcela, deleteCompraCartao,
        addDivida, updateDivida, deleteDivida,
        addMeta, updateMeta, deleteMeta,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance precisa estar dentro de <FinanceProvider>");
  return ctx;
}
