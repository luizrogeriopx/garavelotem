import { whatsappLink } from "./format";

export function claimInviteMessage(opts: { businessUrl: string; claimUrl: string }) {
  return `Sua empresa está aparecendo gratuitamente no Garavelo Tem, uma nova plataforma digital da região, criada para ajudar comércios e serviços locais a ganharem mais visibilidade e novos clientes.

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
${opts.businessUrl}

🔐 Reivindicar empresa gratuitamente:
${opts.claimUrl}

A reivindicação é rápida, gratuita e ajuda sua empresa a manter as informações sempre atualizadas na plataforma. 🚀`;
}

export function buildClaimInviteLink(opts: { whatsapp: string; slug: string; origin?: string }) {
  const origin =
    opts.origin ??
    (typeof window !== "undefined" ? window.location.origin : "https://garavelotem.com");
  const message = claimInviteMessage({
    businessUrl: `${origin}/empresa/${opts.slug}`,
    claimUrl: `${origin}/reivindicar`,
  });
  return whatsappLink(opts.whatsapp, message);
}
