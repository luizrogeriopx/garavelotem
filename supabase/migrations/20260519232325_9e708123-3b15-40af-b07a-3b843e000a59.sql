
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manages app_settings"
ON public.app_settings
FOR ALL
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (key, value) VALUES (
  'claim_invite_template',
$$Sua empresa está aparecendo gratuitamente no Garavelo Tem, uma nova plataforma digital da região, criada para ajudar comércios e serviços locais a ganharem mais visibilidade e novos clientes.

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

A reivindicação é rápida, gratuita e ajuda sua empresa a manter as informações sempre atualizadas na plataforma. 🚀$$
);
