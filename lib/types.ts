// ============================================================================
// FINANCE OS — Tipos de domínio
// ----------------------------------------------------------------------------
// Cada interface aqui corresponde a uma tabela no Supabase (nomes sugeridos
// entre parênteses, ver supabase/schema.sql). Os campos usam snake_case
// apenas onde o Supabase normalmente exigiria (id, user_id, created_at) e
// camelCase no restante para manter o código React idiomático — o data
// layer (lib/store.tsx) é o único lugar que precisará mapear entre os dois.
//
// `userId` corresponde à coluna `user_id` (FK -> auth.users.id), usada pelas
// políticas de RLS para isolar os dados de cada usuário.
// ============================================================================

// ── ENTRADAS (tabela: entradas) ─────────────────────────────────────────────
export type CategoriaEntrada =
  | "Salário"
  | "Consultoria"
  | "Treino individualizado"
  | "Planilha"
  | "Bicos"
  | "Extras"
  | "Reembolsos"
  | "Outros";

export type StatusEntrada = "recebido" | "previsto";

export interface Entrada {
  id: string;
  userId: string;
  data: string; // ISO yyyy-mm-dd
  categoria: CategoriaEntrada;
  descricao: string;
  valor: number;
  status: StatusEntrada;
  formaRecebimento: string;
  observacao?: string;
}

// ── SAÍDAS (tabela: saidas) ─────────────────────────────────────────────────
export type CategoriaSaida =
  | "Moradia"
  | "Saúde"
  | "Pet"
  | "Assinaturas"
  | "Cuidados pessoais"
  | "Lazer"
  | "Transporte"
  | "Alimentação"
  | "Outros";

export type StatusSaida = "pago" | "pendente" | "atrasado";

export interface Saida {
  id: string;
  userId: string;
  data: string; // ISO yyyy-mm-dd
  categoria: CategoriaSaida;
  descricao: string;
  valor: number;
  status: StatusSaida;
  formaPagamento: string;
  observacao?: string;
}

// ── CARTÕES (tabela: cartoes) ───────────────────────────────────────────────
export type Responsavel = "Guilherme" | "Namorada" | "Pai" | "Outros";

export interface Cartao {
  id: string;
  userId: string;
  nome: string;
  responsavel: Responsavel;
  cor: string; // hex usado como acento visual do cartão
  limite?: number;
  diaFechamento?: number;
  diaVencimento?: number;
}

// ── COMPRAS NO CARTÃO (tabela: compras_cartao + parcelas_cartao) ────────────
export interface Parcela {
  numero: number; // 1-based
  mesReferencia: string; // "yyyy-mm" — mês em que a parcela é cobrada
  valor: number;
  status: "paga" | "pendente";
}

export interface CompraCartao {
  id: string;
  userId: string;
  cartaoId: string;
  descricao: string;
  valorTotal: number;
  numeroParcelas: number;
  valorParcela: number;
  dataCompra: string; // ISO yyyy-mm-dd
  mesInicial: string; // "yyyy-mm" — mês da 1ª parcela
  parcelas: Parcela[];
}

// ── DÍVIDAS (tabela: dividas) ───────────────────────────────────────────────
export type StatusDivida = "em aberto" | "quitada" | "atrasada";

export interface Divida {
  id: string;
  userId: string;
  nome: string;
  credor: string;
  valorTotal: number;
  valorPago: number;
  numeroParcelas: number;
  parcelasPagas: number;
  vencimento: string; // ISO yyyy-mm-dd — próximo vencimento
  status: StatusDivida;
}

// ── METAS (tabela: metas) ───────────────────────────────────────────────────
export type StatusMeta = "em andamento" | "concluída" | "pausada";

export interface Meta {
  id: string;
  userId: string;
  nome: string;
  valorAlvo: number;
  valorAtual: number;
  prazo: string; // ISO yyyy-mm-dd
  status: StatusMeta;
}
