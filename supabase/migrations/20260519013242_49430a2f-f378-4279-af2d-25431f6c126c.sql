
-- Policies (legal documents) and acceptances tracking

CREATE TABLE public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  content text NOT NULL DEFAULT '',
  is_required boolean NOT NULL DEFAULT false,
  required_for text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policies public read"
  ON public.policies FOR SELECT
  USING (is_active = true OR app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin manages policies"
  ON public.policies FOR ALL
  USING (app_private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.policy_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  policy_slug text NOT NULL,
  context text NOT NULL,
  business_id uuid,
  claim_id uuid,
  accepted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_acceptances_user ON public.policy_acceptances(user_id);
CREATE INDEX idx_policy_acceptances_business ON public.policy_acceptances(business_id);
CREATE INDEX idx_policy_acceptances_claim ON public.policy_acceptances(claim_id);

ALTER TABLE public.policy_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own acceptance"
  ON public.policy_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "view own or admin acceptances"
  ON public.policy_acceptances FOR SELECT
  USING (auth.uid() = user_id OR app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin deletes acceptances"
  ON public.policy_acceptances FOR DELETE
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

-- Seed the 10 required policies (admin can edit later)
INSERT INTO public.policies (slug, title, summary, content, is_required, required_for, sort_order) VALUES
('termos-de-uso', 'Termos de Uso', 'Regras gerais de utilização da plataforma Garavelo Tem.',
'1. ACEITAÇÃO DOS TERMOS
Ao criar uma conta ou utilizar a plataforma Garavelo Tem, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos de Uso.

2. SERVIÇO
O Garavelo Tem é uma vitrine digital que conecta moradores e comerciantes do Setor Garavelo (Aparecida de Goiânia/GO), permitindo a publicação de empresas, promoções e conteúdos locais.

3. CADASTRO
O usuário se compromete a fornecer dados verdadeiros, atualizados e completos. A plataforma poderá exigir validação por selfie, CPF, CNPJ e demais documentos.

4. CONTAS E SEGURANÇA
O usuário é responsável pela guarda das suas credenciais. Atividades realizadas com seu login são presumidas como sendo de sua autoria.

5. CONTEÚDO PUBLICADO
O usuário é integralmente responsável pelo conteúdo que publica (fotos, descrições, promoções, comentários), garantindo que não infringe direitos de terceiros.

6. CONDUTA PROIBIDA
É vedado publicar conteúdo ilegal, ofensivo, fraudulento, enganoso, discriminatório, violento ou que viole direitos autorais.

7. RESPONSABILIDADE
A plataforma atua como intermediadora e não se responsabiliza por relações comerciais firmadas entre usuários e empresas anunciantes.

8. SUSPENSÃO E EXCLUSÃO
A plataforma pode suspender ou excluir contas que violem estes Termos, sem aviso prévio em casos graves.

9. ALTERAÇÕES
Estes Termos podem ser atualizados a qualquer momento, sendo válida a versão publicada nesta página.

10. FORO
Fica eleito o foro da Comarca de Aparecida de Goiânia/GO para dirimir quaisquer questões.', true, ARRAY['signup'], 1),

('politica-de-privacidade', 'Política de Privacidade', 'Como coletamos, usamos e protegemos seus dados pessoais.',
'1. DADOS COLETADOS
Coletamos: nome completo, e-mail, telefone, CPF, RG, data de nascimento, selfie, endereço, dados de empresa (CNPJ, razão social), preferências e dados de navegação.

2. FINALIDADE
Os dados são usados para autenticação, prevenção a fraudes, comunicação, exibição pública de empresas e cumprimento de obrigações legais.

3. BASE LEGAL (LGPD Art. 7º)
Tratamos dados com base em: consentimento, execução de contrato, cumprimento de obrigação legal e legítimo interesse.

4. COMPARTILHAMENTO
Não vendemos dados. Podemos compartilhar com provedores de infraestrutura (hospedagem, e-mail, pagamentos) sob contrato de confidencialidade, e com autoridades mediante ordem legal.

5. ARMAZENAMENTO
Dados são armazenados em servidores seguros, com criptografia em trânsito (HTTPS) e em repouso quando aplicável.

6. RETENÇÃO
Mantemos dados pelo tempo necessário às finalidades informadas ou exigências legais. Contas excluídas têm dados pessoais removidos em até 90 dias.

7. DIREITOS DO TITULAR
Você pode solicitar a qualquer momento: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação e revogação do consentimento.

8. COOKIES
Utilizamos cookies essenciais para login e cookies analíticos para melhorar a experiência.

9. ENCARREGADO (DPO)
Contato para questões de privacidade: privacidade@garavelotem.com.', true, ARRAY['signup'], 2),

('termos-do-comerciante', 'Termos do Comerciante', 'Regras específicas para empresas anunciantes.',
'1. ELEGIBILIDADE
Pode anunciar como Pessoa Física (com CPF válido) ou Pessoa Jurídica (com CNPJ ativo na Receita Federal).

2. VERACIDADE
O comerciante garante que todas as informações da empresa (nome, endereço, contato, fotos, preços, promoções) são verdadeiras e atualizadas.

3. APROVAÇÃO
Toda empresa cadastrada passa por análise da equipe Garavelo Tem antes de ser publicada. Reservamo-nos o direito de recusar cadastros.

4. PROPRIEDADE
Apenas o legítimo dono/representante legal pode cadastrar uma empresa. O uso indevido (cadastro de empresas alheias) sujeita à exclusão e responsabilização.

5. PROMOÇÕES
Promoções publicadas devem ser honradas pelo comerciante. Preços, condições e prazos devem ser claros.

6. ATENDIMENTO
O comerciante é responsável pelo atendimento aos clientes que chegarem pela plataforma, incluindo entregas, trocas e devoluções.

7. PLANOS PAGOS
Os planos Pro oferecem benefícios adicionais conforme tabela vigente. Cancelamentos seguem as regras do gateway de pagamento.

8. SUSPENSÃO
Empresas que receberem reclamações reiteradas, descumprirem promoções ou violarem políticas podem ser suspensas ou excluídas.', true, ARRAY['business'], 3),

('politica-lgpd', 'Política LGPD', 'Conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).',
'1. CONTROLADOR
O Garavelo Tem atua como Controlador dos dados pessoais coletados na plataforma.

2. PRINCÍPIOS
Tratamos dados com finalidade, adequação, necessidade, livre acesso, qualidade, transparência, segurança, prevenção, não-discriminação e responsabilização.

3. CONSENTIMENTO
Coletamos consentimento expresso para tratamentos não cobertos por outras bases legais. O usuário pode revogá-lo a qualquer momento.

4. DADOS SENSÍVEIS
Selfie (dado biométrico) é tratada exclusivamente para validação de identidade e prevenção a fraudes. Não é compartilhada com terceiros.

5. DADOS DE MENORES
A plataforma exige idade mínima de 16 anos. Menores de 18 devem ter consentimento dos responsáveis quando aplicável.

6. INCIDENTES
Em caso de incidente de segurança que possa causar risco aos titulares, comunicaremos a ANPD e os afetados em prazo razoável.

7. RELATÓRIO DE IMPACTO
Mantemos registro das operações de tratamento e elaboramos RIPD quando aplicável.

8. CONTATO DO ENCARREGADO
privacidade@garavelotem.com', true, ARRAY['signup'], 4),

('aviso-legal', 'Aviso Legal', 'Limitações de responsabilidade e propriedade intelectual.',
'1. NATUREZA DO SERVIÇO
O Garavelo Tem é um classificado digital. Não somos parte das relações comerciais entre usuários e empresas anunciantes.

2. PROPRIEDADE INTELECTUAL
Marca, logotipo, layout, código e identidade visual do Garavelo Tem são protegidos por direitos autorais e marcários. Uso não autorizado é proibido.

3. CONTEÚDO DE TERCEIROS
Fotos, logos e descrições de empresas são de responsabilidade do anunciante, que declara possuir os direitos de uso.

4. LINKS EXTERNOS
A plataforma pode conter links para WhatsApp, redes sociais e sites externos. Não nos responsabilizamos pelo conteúdo desses sites.

5. DISPONIBILIDADE
Buscamos manter o serviço disponível 24/7, mas não garantimos ausência de interrupções por manutenção, falhas técnicas ou casos fortuitos.

6. ISENÇÃO
Não nos responsabilizamos por: prejuízos comerciais entre usuários, conteúdo publicado por terceiros, vírus em links externos, perdas de dados por uso indevido.', true, ARRAY['signup'], 5),

('checklist-juridico', 'Checklist Jurídico', 'Itens jurídicos do projeto Garavelo Tem.',
'Este documento descreve o checklist jurídico interno do projeto:

✔ Termos de Uso publicados
✔ Política de Privacidade publicada
✔ Termos do Comerciante publicados
✔ Política LGPD publicada
✔ Aviso Legal publicado
✔ Política de Anúncios Proibidos
✔ Política de Selo Verificado
✔ Política Anti-Golpe
✔ Registro de aceite dos usuários
✔ Encarregado de Dados (DPO) designado
✔ Canal de atendimento ao titular
✔ Validação biométrica (selfie) para prevenção a fraudes
✔ Validação de CNPJ via BrasilAPI
✔ Validação de CPF (algoritmo dos dígitos verificadores)
✔ Sistema de reivindicação de propriedade de página
✔ Painel administrativo com trilha de auditoria
✔ RLS (Row Level Security) ativo em todas as tabelas sensíveis', false, ARRAY[]::text[], 6),

('texto-aceite', 'Texto do Aceite', 'Texto exibido nas caixinhas de aceite dos formulários.',
'Li e concordo com os Termos de Uso, a Política de Privacidade, a Política LGPD e o Aviso Legal do Garavelo Tem, autorizando o tratamento dos meus dados pessoais conforme descrito.', false, ARRAY[]::text[], 7),

('anuncios-proibidos', 'Política de Anúncios Proibidos', 'Categorias de produtos e serviços não permitidos na plataforma.',
'É EXPRESSAMENTE PROIBIDO anunciar no Garavelo Tem:

1. Armas de fogo, munições e explosivos
2. Drogas ilícitas e parafernália associada
3. Bebidas alcoólicas sem alvará válido
4. Cigarros, cigarros eletrônicos e narguilés (regulamentação ANVISA)
5. Medicamentos controlados e produtos sem registro ANVISA
6. Animais silvestres e produtos da fauna protegida
7. Serviços de adivinhação, ocultismo ou que prometam resultados milagrosos
8. Serviços sexuais ou conteúdo adulto
9. Jogos de azar não regulamentados
10. Produtos falsificados, piratas ou réplicas
11. Documentos falsos (diplomas, CNH, RG, etc.)
12. Esquemas de pirâmide, marketing multinível enganoso
13. Empréstimos sem autorização do Banco Central
14. Curas milagrosas para doenças
15. Conteúdo discriminatório, racista, homofóbico ou de incitação ao ódio
16. Qualquer produto ou serviço que viole lei federal, estadual ou municipal

Anúncios que violem esta política serão removidos e a conta poderá ser suspensa permanentemente.', false, ARRAY['business'], 8),

('selo-verificado', 'Política do Selo Verificado', 'Como funciona e quem pode obter o selo azul.',
'O SELO VERIFICADO (azul) é concedido pela equipe Garavelo Tem após análise dos seguintes critérios:

1. CADASTRO COMPLETO
A empresa deve estar com todos os dados preenchidos: logo, capa, descrição, endereço, telefone, WhatsApp e horários.

2. DOCUMENTAÇÃO
- PJ: CNPJ ativo na Receita Federal, validado via BrasilAPI
- PF: CPF válido e selfie aprovada do titular

3. PRESENÇA REAL
Endereço físico verificável no Setor Garavelo ou região atendida.

4. CONDUTA
Sem reclamações graves ou comprovadas de descumprimento de promoções, golpes ou má-fé nos últimos 12 meses.

5. RENOVAÇÃO
O selo pode ser revogado a qualquer momento mediante reclamações comprovadas, fraude ou descumprimento das políticas.

O selo NÃO significa endosso da qualidade do produto/serviço, apenas que a empresa foi verificada como existente e legítima.', false, ARRAY[]::text[], 9),

('anti-golpe', 'Política Anti-Golpe', 'Como prevenimos e combatemos fraudes na plataforma.',
'O Garavelo Tem adota as seguintes medidas anti-golpe:

1. VALIDAÇÃO DE IDENTIDADE
- Selfie obrigatória no cadastro
- CPF validado pelo algoritmo dos dígitos verificadores
- CNPJ validado em tempo real via Receita Federal (BrasilAPI)

2. APROVAÇÃO MANUAL
Toda empresa passa por análise antes de ser publicada.

3. REIVINDICAÇÃO CONTROLADA
A transferência de propriedade de uma página exige formulário com dados pessoais/empresariais e análise da equipe.

4. DENÚNCIAS
Usuários podem denunciar anúncios suspeitos. Investigamos em até 48h úteis.

5. SINAIS DE ALERTA
Desconfie de:
- Preços muito abaixo do mercado
- Solicitações de pagamento antecipado por Pix sem comprovação
- Empresas que pedem dados bancários, senhas ou códigos
- Páginas recém-criadas sem histórico ou reviews

6. RECOMENDAÇÕES
- Sempre converse pelo WhatsApp oficial divulgado na plataforma
- Prefira pagar na entrega ou após receber o produto
- Verifique a existência do endereço físico
- Em caso de golpe, registre BO e nos comunique em juridico@garavelotem.com

7. SUSPENSÃO IMEDIATA
Contas envolvidas em golpes comprovados são banidas e os dados são preservados para entrega às autoridades mediante ordem judicial.', false, ARRAY[]::text[], 10);
