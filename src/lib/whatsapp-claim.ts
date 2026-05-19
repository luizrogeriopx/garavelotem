export const DEFAULT_CLAIM_INVITE_TEMPLATE = `Sua empresa está aparecendo gratuitamente no Garavelo Tem, uma nova plataforma digital da região, criada para ajudar comércios e serviços locais a ganharem mais visibilidade e novos clientes.

Reivindique sua empresa, assim você poderá administrar o perfil gratuitamente e ter acesso a recursos como:

✅ Alterar descrição da empresa
✅ Atualizar telefone e WhatsApp
✅ Editar endereço e localização
✅ Adicionar fotos da empresa
✅ Atualizar categoria e serviços
✅ Informar horário de funcionamento
✅ Receber mais visibilidade na região
✅ Facilitar contato de novos clientes

🔗 Ver perfil da empresa:
{businessUrl}

🔐 Reivindicar empresa gratuitamente:
{claimUrl}

A reivindicação é rápida, gratuita e ajuda sua empresa a manter as informações sempre atualizadas na plataforma. 🚀`;

export function claimInviteMessage(opts: {
  businessUrl: string;
  claimUrl: string;
  template?: string | null;
}) {
  const tpl = (opts.template && opts.template.trim().length > 0)
    ? opts.template
    : DEFAULT_CLAIM_INVITE_TEMPLATE;
  return tpl
    .replaceAll("{businessUrl}", opts.businessUrl)
    .replaceAll("{claimUrl}", opts.claimUrl);
}

function normalizePhoneBR(phone: string) {
  let clean = (phone ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (!clean.startsWith("55") && (clean.length === 10 || clean.length === 11)) {
    clean = "55" + clean;
  }
  return clean;
}

export function buildClaimInviteLink(opts: {
  whatsapp: string;
  slug: string;
  username?: string | null;
  origin?: string;
  template?: string | null;
}) {
  const origin =
    opts.origin ??
    (typeof window !== "undefined" ? window.location.origin : "https://garavelotem.com");
  const businessUrl = opts.username
    ? `${origin}/${opts.username}`
    : `${origin}/empresa/${opts.slug}`;
  const message = claimInviteMessage({
    businessUrl,
    claimUrl: `${origin}/reivindicar`,
    template: opts.template,
  });
  const phone = normalizePhoneBR(opts.whatsapp);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}
