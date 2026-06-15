-- ============================================================================
-- FINANCE OS — Schema Supabase
-- ----------------------------------------------------------------------------
-- Define as tabelas correspondentes a lib/types.ts, todas com `user_id`
-- referenciando auth.users e políticas de RLS restringindo cada usuário aos
-- seus próprios dados. Rode este script no SQL Editor do Supabase.
--
-- Status atual do app: ainda opera sobre dados em memória (lib/store.tsx),
-- semeados a partir de lib/mockData.ts e re-associados ao usuário logado.
-- Este schema é o passo seguinte: trocar useState() por chamadas reais ao
-- Supabase, mantendo as mesmas assinaturas de addX/updateX/deleteX.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ── ENTRADAS ─────────────────────────────────────────────────────────────────
create table if not exists entradas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  data date not null,
  categoria text not null,
  descricao text not null,
  valor numeric(12,2) not null,
  status text not null check (status in ('recebido', 'previsto')),
  forma_recebimento text not null,
  observacao text,
  created_at timestamptz default now()
);

alter table entradas enable row level security;
create policy "entradas_select_own" on entradas for select using (auth.uid() = user_id);
create policy "entradas_insert_own" on entradas for insert with check (auth.uid() = user_id);
create policy "entradas_update_own" on entradas for update using (auth.uid() = user_id);
create policy "entradas_delete_own" on entradas for delete using (auth.uid() = user_id);

-- ── SAÍDAS ───────────────────────────────────────────────────────────────────
create table if not exists saidas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  data date not null,
  categoria text not null,
  descricao text not null,
  valor numeric(12,2) not null,
  status text not null check (status in ('pago', 'pendente', 'atrasado')),
  forma_pagamento text not null,
  observacao text,
  created_at timestamptz default now()
);

alter table saidas enable row level security;
create policy "saidas_select_own" on saidas for select using (auth.uid() = user_id);
create policy "saidas_insert_own" on saidas for insert with check (auth.uid() = user_id);
create policy "saidas_update_own" on saidas for update using (auth.uid() = user_id);
create policy "saidas_delete_own" on saidas for delete using (auth.uid() = user_id);

-- ── CARTÕES ──────────────────────────────────────────────────────────────────
create table if not exists cartoes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null,
  responsavel text not null check (responsavel in ('Guilherme', 'Namorada', 'Pai', 'Outros')),
  cor text not null,
  limite numeric(12,2),
  dia_fechamento int,
  dia_vencimento int,
  created_at timestamptz default now()
);

alter table cartoes enable row level security;
create policy "cartoes_select_own" on cartoes for select using (auth.uid() = user_id);
create policy "cartoes_insert_own" on cartoes for insert with check (auth.uid() = user_id);
create policy "cartoes_update_own" on cartoes for update using (auth.uid() = user_id);
create policy "cartoes_delete_own" on cartoes for delete using (auth.uid() = user_id);

-- ── COMPRAS NO CARTÃO ────────────────────────────────────────────────────────
create table if not exists compras_cartao (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  cartao_id uuid not null references cartoes(id) on delete cascade,
  descricao text not null,
  valor_total numeric(12,2) not null,
  numero_parcelas int not null,
  valor_parcela numeric(12,2) not null,
  data_compra date not null,
  mes_inicial text not null, -- "yyyy-mm"
  created_at timestamptz default now()
);

alter table compras_cartao enable row level security;
create policy "compras_cartao_select_own" on compras_cartao for select using (auth.uid() = user_id);
create policy "compras_cartao_insert_own" on compras_cartao for insert with check (auth.uid() = user_id);
create policy "compras_cartao_update_own" on compras_cartao for update using (auth.uid() = user_id);
create policy "compras_cartao_delete_own" on compras_cartao for delete using (auth.uid() = user_id);

-- ── PARCELAS DO CARTÃO ───────────────────────────────────────────────────────
create table if not exists parcelas_cartao (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  compra_id uuid not null references compras_cartao(id) on delete cascade,
  numero int not null,
  mes_referencia text not null, -- "yyyy-mm"
  valor numeric(12,2) not null,
  status text not null check (status in ('paga', 'pendente')),
  unique (compra_id, numero)
);

alter table parcelas_cartao enable row level security;
create policy "parcelas_cartao_select_own" on parcelas_cartao for select using (auth.uid() = user_id);
create policy "parcelas_cartao_insert_own" on parcelas_cartao for insert with check (auth.uid() = user_id);
create policy "parcelas_cartao_update_own" on parcelas_cartao for update using (auth.uid() = user_id);
create policy "parcelas_cartao_delete_own" on parcelas_cartao for delete using (auth.uid() = user_id);

-- ── DÍVIDAS ──────────────────────────────────────────────────────────────────
create table if not exists dividas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null,
  credor text not null,
  valor_total numeric(12,2) not null,
  valor_pago numeric(12,2) not null default 0,
  numero_parcelas int not null,
  parcelas_pagas int not null default 0,
  vencimento date not null,
  status text not null check (status in ('em aberto', 'quitada', 'atrasada')),
  created_at timestamptz default now()
);

alter table dividas enable row level security;
create policy "dividas_select_own" on dividas for select using (auth.uid() = user_id);
create policy "dividas_insert_own" on dividas for insert with check (auth.uid() = user_id);
create policy "dividas_update_own" on dividas for update using (auth.uid() = user_id);
create policy "dividas_delete_own" on dividas for delete using (auth.uid() = user_id);

-- ── METAS ────────────────────────────────────────────────────────────────────
create table if not exists metas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null,
  valor_alvo numeric(12,2) not null,
  valor_atual numeric(12,2) not null default 0,
  prazo date not null,
  status text not null check (status in ('em andamento', 'concluída', 'pausada')),
  created_at timestamptz default now()
);

alter table metas enable row level security;
create policy "metas_select_own" on metas for select using (auth.uid() = user_id);
create policy "metas_insert_own" on metas for insert with check (auth.uid() = user_id);
create policy "metas_update_own" on metas for update using (auth.uid() = user_id);
create policy "metas_delete_own" on metas for delete using (auth.uid() = user_id);
