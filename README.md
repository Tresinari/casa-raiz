# Casa Raiz — E-commerce Full Stack

Stack 100% gratuita: **Next.js 14** + **Supabase** + **Mercado Pago** + **Vercel**

---

## Estrutura do projeto

```
casa-raiz/
├── app/
│   ├── page.tsx                    ← Home (Server Component)
│   ├── loja/page.tsx               ← Catálogo com filtros
│   ├── produto/[slug]/page.tsx     ← Página de produto
│   ├── admin/
│   │   ├── login/page.tsx          ← Login das donas
│   │   └── produtos/
│   │       ├── page.tsx            ← Lista de produtos
│   │       └── novo/page.tsx       ← Cadastrar/editar produto
│   └── api/                        ← (próximos passos: checkout, webhook MP)
├── components/
│   ├── loja/
│   │   ├── Header.tsx              ← Nav + carrinho drawer
│   │   ├── CardProduto.tsx         ← Card reutilizável
│   │   └── BotaoAdicionarCarrinho.tsx
│   └── admin/
├── hooks/
│   └── useCarrinho.tsx             ← Context + localStorage
├── lib/
│   ├── supabase.ts                 ← Client (browser)
│   ├── supabase-server.ts          ← Client (server)
│   └── types.ts                   ← Types + helpers
└── supabase-schema.sql             ← SQL para criar as tabelas
```

---

## Passo 1 — Rodar localmente

```bash
# 1. Descompacte o projeto e entre na pasta
cd casa-raiz

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de variáveis de ambiente
cp .env.local.example .env.local

# 4. Preencha o .env.local com suas chaves (ver Passo 2 e 3)

# 5. Rode o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

---

## Passo 2 — Criar o projeto no Supabase

1. Acesse **supabase.com** → "New project"
2. Nome: `casa-raiz` | Região: `South America (São Paulo)`
3. Depois de criar, vá em **Project Settings → API**
4. Copie:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL` no `.env.local`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local`

### Criar as tabelas

No painel do Supabase: **SQL Editor → New query**

Cole o conteúdo de `supabase-schema.sql` e clique em **Run**.

### Criar o bucket de imagens

**Storage → New bucket**
- Nome: `imagens`
- Public: **SIM** (para as fotos aparecerem na loja)

### Criar a conta admin das donas

**Authentication → Users → Invite user**
- E-mail das donas
- Elas recebem um e-mail para criar a senha

---

## Passo 3 — Configurar o Mercado Pago

1. Acesse **mercadopago.com.br** → Sua conta → Credenciais
2. Use as credenciais de **Produção**
3. Copie:
   - `Public key` → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
   - `Access token` → `MERCADOPAGO_ACCESS_TOKEN`

*(A API de pagamento será adicionada como próximo passo)*

---

## Passo 4 — Deploy na Vercel

```bash
# Instalar a CLI da Vercel
npm install -g vercel

# Fazer deploy (na primeira vez, cria o projeto)
vercel

# Em produção
vercel --prod
```

Ou conecte pelo GitHub:
1. Suba o código para um repositório GitHub
2. Acesse **vercel.com → New Project → Import do GitHub**
3. Adicione as variáveis de ambiente no painel da Vercel
4. Clique em Deploy

---

## Passo 5 — Domínio próprio

1. Compre `casaraiz.com.br` em **registro.br** (~R$ 40/ano)
2. No painel da Vercel: **Settings → Domains → Add**
3. Siga as instruções para apontar o DNS

---

## Próximos passos (checkout com Mercado Pago)

Ainda falta implementar:

1. **`app/api/checkout/route.ts`** — cria a preferência de pagamento no MP
2. **`app/api/webhook/route.ts`** — recebe confirmação de pagamento e atualiza pedido
3. **`app/checkout/page.tsx`** — formulário com dados do cliente antes de ir ao MP

Quando quiser, é só pedir que entrego esses três arquivos prontos.

---

## Como as donas usam o painel

1. Acessam `seudominio.com.br/admin/login`
2. Entram com o e-mail e senha que criamos no Supabase
3. Clicam em **+ Novo produto**
4. Preenchem nome, categoria, preço, sobem as fotos
5. Clicam em **Salvar produto**

Produto aparece na loja instantaneamente.

---

## Custos mensais

| Serviço | Plano gratuito | Limite |
|---------|---------------|--------|
| Vercel | Free | 100GB de banda/mês |
| Supabase | Free | 500MB banco + 1GB storage |
| Mercado Pago | Sem mensalidade | ~4,99% por transação |
| Domínio | — | R$ 40/ano no registro.br |

**Total fixo: R$ 3,33/mês** (só o domínio dividido por 12)
