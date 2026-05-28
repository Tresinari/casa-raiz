-- ============================================================
-- CASA RAIZ — Schema do banco de dados (Supabase)
-- Execute isso no SQL Editor do Supabase (uma vez só)
-- ============================================================

-- Tabela de produtos
create table if not exists produtos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  slug          text not null unique,
  descricao     text default '',
  preco         integer not null,          -- em centavos
  preco_original integer,                  -- preço "de" (riscado)
  categoria     text not null,
  imagens       text[] default '{}',       -- array de URLs públicas
  estoque       integer default 0,
  ativo         boolean default true,
  destaque      boolean default false,
  criado_em     timestamptz default now()
);

-- Tabela de pedidos
create table if not exists pedidos (
  id                uuid primary key default gen_random_uuid(),
  status            text default 'pendente',  -- pendente | aprovado | cancelado | enviado
  total             integer not null,          -- em centavos
  itens             jsonb not null,            -- snapshot dos itens no momento da compra
  cliente_nome      text not null,
  cliente_email     text not null,
  cliente_telefone  text,
  mp_payment_id     text,                      -- ID do pagamento no Mercado Pago
  mp_preference_id  text,
  criado_em         timestamptz default now()
);

-- Índices para busca rápida
create index if not exists idx_produtos_slug     on produtos(slug);
create index if not exists idx_produtos_categoria on produtos(categoria);
create index if not exists idx_produtos_ativo     on produtos(ativo);
create index if not exists idx_pedidos_status     on pedidos(status);

-- ── SEGURANÇA (Row Level Security) ─────────────────────────

-- Produtos: qualquer um pode LER produtos ativos
alter table produtos enable row level security;

create policy "loja pode ver produtos ativos"
  on produtos for select
  using (ativo = true);

create policy "admin pode tudo em produtos"
  on produtos for all
  using (auth.role() = 'authenticated');

-- Pedidos: só admin vê pedidos
alter table pedidos enable row level security;

create policy "admin pode tudo em pedidos"
  on pedidos for all
  using (auth.role() = 'authenticated');

-- Pedidos via API de webhook (service role ignora RLS)
-- O webhook do Mercado Pago usa a service role key, então não precisa de policy extra

-- ── STORAGE ────────────────────────────────────────────────

-- Crie o bucket "imagens" no Supabase Dashboard:
-- Storage → New bucket → Nome: imagens → Public: SIM

-- Política de upload: só admins fazem upload
-- (configure no Dashboard: Storage → imagens → Policies)
