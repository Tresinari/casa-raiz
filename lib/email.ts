// lib/email.ts
// Funções de envio de e-mail com Resend

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const STORE_NAME = 'Casa Raiz'

// ── Helpers ───────────────────────────────────────────────

function formatarPreco(centavos: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

// Template base compartilhado por todos os e-mails
function templateBase(conteudo: string) {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${STORE_NAME}</title>
  </head>
  <body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

            <!-- Header -->
            <tr>
              <td style="background:#2E1208;padding:28px 32px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:600;color:#F4D8C5;letter-spacing:0.05em;">
                  Casa <span style="color:#E8C97A;">Raiz</span>
                </h1>
                <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(244,216,197,0.6);">
                  Tradição · Lar · Acolhimento
                </p>
              </td>
            </tr>

            <!-- Conteúdo -->
            <tr>
              <td style="background:#FDFAF5;padding:36px 32px;border-radius:0 0 8px 8px;border:1px solid #D4C9B0;border-top:none;">
                ${conteudo}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 0;text-align:center;">
                <p style="margin:0;font-size:11px;color:#8A7A60;">
                  © ${new Date().getFullYear()} ${STORE_NAME} · São Paulo, SP
                </p>
                <p style="margin:6px 0 0;font-size:11px;color:#8A7A60;">
                  <a href="https://instagram.com/casaraizmk" style="color:#B8922A;text-decoration:none;">@casaraizmk</a>
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `
}

// ── E-mail 1: Confirmação de pedido ──────────────────────

type ItemPedido = {
  produto: { nome: string; preco: number; imagens?: string[] }
  quantidade: number
}

type DadosPedido = {
  id: string
  cliente_nome: string
  cliente_email: string
  total: number
  itens: ItemPedido[]
}

export async function enviarConfirmacaoPedido(pedido: DadosPedido) {
  const itensHtml = pedido.itens.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EDE6D6;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:14px;color:#2A2218;font-family:Georgia,serif;">
              ${item.produto.nome}
              <span style="color:#8A7A60;font-size:13px;"> × ${item.quantidade}</span>
            </td>
            <td align="right" style="font-size:14px;font-weight:600;color:#5C4A2A;white-space:nowrap;">
              ${formatarPreco(item.produto.preco * item.quantidade)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const conteudo = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#2D4A2A;">
      Pedido confirmado! 🎉
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#5C4E38;line-height:1.6;">
      Olá, <strong>${pedido.cliente_nome}</strong>! Seu pagamento foi aprovado e seu pedido já está sendo preparado com carinho.
    </p>

    <!-- Número do pedido -->
    <div style="background:#F5F0E8;border:1px solid #D4C9B0;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8A7A60;">Número do pedido</p>
      <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#2A2218;font-family:monospace;">
        #${pedido.id.slice(0, 8).toUpperCase()}
      </p>
    </div>

    <!-- Itens -->
    <h3 style="margin:0 0 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8A7A60;font-weight:400;">
      Itens do pedido
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itensHtml}
    </table>

    <!-- Total -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="font-family:Georgia,serif;font-size:18px;font-weight:500;color:#2A2218;padding-top:12px;border-top:2px solid #D4C9B0;">
          Total
        </td>
        <td align="right" style="font-family:Georgia,serif;font-size:18px;font-weight:500;color:#5C4A2A;padding-top:12px;border-top:2px solid #D4C9B0;">
          ${formatarPreco(pedido.total)}
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#5C4E38;line-height:1.6;">
      Em breve entraremos em contato para combinar os detalhes da entrega. Qualquer dúvida, nos chame no WhatsApp ou pelo Instagram.
    </p>

    <p style="margin:20px 0 0;font-size:13px;color:#8A7A60;font-style:italic;">
      Com carinho,<br>Equipe Casa Raiz 🌿
    </p>
  `

  const { error } = await resend.emails.send({
    from: FROM,
    to: pedido.cliente_email,
    subject: `✅ Pedido #${pedido.id.slice(0, 8).toUpperCase()} confirmado — Casa Raiz`,
    html: templateBase(conteudo),
  })

  if (error) console.error('Erro ao enviar e-mail de confirmação:', error)
  return !error
}

// ── E-mail 2: Status atualizado (ex: enviado) ────────────

export async function enviarStatusAtualizado(
  pedido: DadosPedido & { status: string }
) {
  const mensagens: Record<string, { titulo: string; corpo: string; emoji: string }> = {
    enviado: {
      emoji: '📦',
      titulo: 'Seu pedido foi enviado!',
      corpo: 'Suas peças estão a caminho. Aguarde a entrega nos próximos dias úteis.',
    },
    cancelado: {
      emoji: '😕',
      titulo: 'Pedido cancelado',
      corpo: 'Seu pedido foi cancelado. Se tiver dúvidas, entre em contato conosco.',
    },
  }

  const msg = mensagens[pedido.status]
  if (!msg) return

  const conteudo = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#2D4A2A;">
      ${msg.emoji} ${msg.titulo}
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5C4E38;line-height:1.6;">
      Olá, <strong>${pedido.cliente_nome}</strong>! ${msg.corpo}
    </p>
    <div style="background:#F5F0E8;border:1px solid #D4C9B0;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8A7A60;">Número do pedido</p>
      <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#2A2218;font-family:monospace;">
        #${pedido.id.slice(0, 8).toUpperCase()}
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#8A7A60;font-style:italic;">
      Com carinho,<br>Equipe Casa Raiz 🌿
    </p>
  `

  const { error } = await resend.emails.send({
    from: FROM,
    to: pedido.cliente_email,
    subject: `${msg.emoji} Atualização do pedido #${pedido.id.slice(0, 8).toUpperCase()} — Casa Raiz`,
    html: templateBase(conteudo),
  })

  if (error) console.error('Erro ao enviar e-mail de status:', error)
  return !error
}

// ── E-mail 3: Boas-vindas newsletter ────────────────────

export async function enviarBoasVindasNewsletter(email: string) {
  const conteudo = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#2D4A2A;">
      Bem-vindo(a) à família Casa Raiz! 🌿
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5C4E38;line-height:1.6;">
      Que alegria ter você aqui! A partir de agora você vai receber em primeira mão nossas novidades, lançamentos e ofertas exclusivas.
    </p>

    <!-- Cupom -->
    <div style="background:#2D4A2A;border-radius:8px;padding:20px 24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(244,216,197,0.7);">
        Seu cupom de boas-vindas
      </p>
      <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:28px;font-weight:600;color:#E8C97A;letter-spacing:0.1em;">
        BEMVINDO10
      </p>
      <p style="margin:0;font-size:13px;color:rgba(244,216,197,0.8);">
        10% de desconto na primeira compra
      </p>
    </div>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/loja"
        style="background:#E8C97A;color:#7b3728;text-decoration:none;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;padding:14px 28px;border-radius:4px;display:inline-block;font-weight:500;">
        Explorar coleção
      </a>
    </div>

    <p style="margin:0;font-size:13px;color:#8A7A60;font-style:italic;">
      Com carinho,<br>Equipe Casa Raiz 🌿
    </p>
  `

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: '🌿 Bem-vindo(a) à Casa Raiz — seu cupom de 10% está aqui!',
    html: templateBase(conteudo),
  })

  if (error) console.error('Erro ao enviar e-mail de newsletter:', error)
  return !error
}

export async function enviarCodigoRastreio(
  pedido: { id: string; cliente_nome: string; cliente_email: string },
  codigoRastreio: string
) {
  const conteudo = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#2D4A2A;">
      Seu pedido está a caminho! 📦
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#5C4E38;line-height:1.6;">
      Olá, <strong>${pedido.cliente_nome}</strong>! Seu pedido foi enviado e já pode ser rastreado.
    </p>

    <div style="background:#F5F0E8;border:1px solid #D4C9B0;border-radius:6px;padding:20px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8A7A60;">
        Código de rastreio
      </p>
      <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#2A2218;font-family:monospace;letter-spacing:0.1em;">
        ${codigoRastreio}
      </p>
      <a href="https://rastreamento.correios.com.br/app/index.php?objetos=${codigoRastreio}"
        target="_blank"
        style="background:#2D4A2A;color:#F4D8C5;text-decoration:none;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;padding:12px 24px;border-radius:4px;display:inline-block;">
        Rastrear nos Correios
      </a>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:#5C4E38;line-height:1.6;">
      O prazo de entrega varia conforme sua região. O código pode levar até 24h para aparecer no sistema dos Correios.
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#8A7A60;font-style:italic;">
      Com carinho,<br>Equipe Casa Raiz 🌿
    </p>
  `

  const { error } = await resend.emails.send({
    from: FROM,
    to: pedido.cliente_email,
    subject: `📦 Seu pedido #${pedido.id.slice(0, 8).toUpperCase()} foi enviado — Casa Raiz`,
    html: templateBase(conteudo),
  })

  if (error) console.error('Erro ao enviar rastreio:', error)
  return !error
}

export async function enviarNovoPedidoAdmin(pedido: DadosPedido) {
  const adminEmail = process.env.EMAIL_ADMIN
  if (!adminEmail) return

  const itensHtml = pedido.itens.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #EDE6D6;font-size:13px;color:#2A2218;font-family:Georgia,serif;">
        ${item.produto?.nome}
        ${(item as any).variante ? `<span style="color:#8A7A60;font-size:12px;"> — ${(item as any).variante.nome}</span>` : ''}
        <span style="color:#8A7A60;"> × ${item.quantidade}</span>
      </td>
      <td align="right" style="padding:8px 0;border-bottom:1px solid #EDE6D6;font-size:13px;font-weight:600;color:#5C4A2A;white-space:nowrap;">
        ${formatarPreco(((item as any).variante ? (item as any).variante.preco : item.produto?.preco) * item.quantidade)}
      </td>
    </tr>
  `).join('')

  const conteudo = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#2D4A2A;">
      🛍️ Novo pedido recebido!
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5C4E38;line-height:1.6;">
      Um novo pedido chegou e aguarda preparação.
    </p>

    <div style="background:#F5F0E8;border:1px solid #D4C9B0;border-radius:6px;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8A7A60;">Número do pedido</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#2A2218;font-family:monospace;">
        #${pedido.id.slice(0, 8).toUpperCase()}
      </p>
    </div>

    <div style="background:#F5F0E8;border:1px solid #D4C9B0;border-radius:6px;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8A7A60;">Cliente</p>
      <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#2A2218;">${pedido.cliente_nome}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#5C4E38;">${pedido.cliente_email}</p>
    </div>

    <h3 style="margin:0 0 10px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8A7A60;font-weight:400;">
      Itens do pedido
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itensHtml}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="font-family:Georgia,serif;font-size:18px;font-weight:500;color:#2A2218;padding-top:12px;border-top:2px solid #D4C9B0;">
          Total recebido
        </td>
        <td align="right" style="font-family:Georgia,serif;font-size:18px;font-weight:500;color:#5C4A2A;padding-top:12px;border-top:2px solid #D4C9B0;">
          ${formatarPreco(pedido.total)}
        </td>
      </tr>
    </table>

    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/pedidos"
      style="background:#2D4A2A;color:#F4D8C5;text-decoration:none;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;padding:12px 24px;border-radius:4px;display:inline-block;">
      Ver pedido no painel →
    </a>
  `

  const { error } = await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `🛍️ Novo pedido #${pedido.id.slice(0, 8).toUpperCase()} — ${formatarPreco(pedido.total)}`,
    html: templateBase(conteudo),
  })

  if (error) console.error('Erro ao notificar admin:', error)
}