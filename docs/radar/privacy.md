# FlexiWell Radar — Política de Privacidade & Tratamento de Dados

**Última atualização:** [data]

A FlexiWell ("nós") opera o serviço **FlexiWell Radar** — análise de dados exportados de sistemas de gestão de estúdios. Esta política descreve como tratamos os dados que você (estúdio cliente) nos envia.

## 1. Quais dados recebemos

Apenas o que você exporta voluntariamente do seu CRM (Mindbody, Tecnofit, ou equivalente) e nos envia como arquivo CSV/XLSX. Tipicamente:

- Lista de membros: nome, e-mail, telefone (quando exportado), data de cadastro, plano atual, status, data da última visita
- Histórico de presenças: aulas, instrutores, datas, status (presente/no-show/cancelamento tardio)
- Pagamentos: valor, status, método, data, produto associado
- Planos e pacotes: nome, preço, vigência, número de membros ativos
- Agenda: aulas, capacidade, instrutor, horário
- Dados de agregadores (ClassPass/Wellhub/TotalPass): visitas e payouts, quando aplicável

**Não recebemos:** senhas, dados de cartão de crédito, dados de saúde sensível dos membros (anamnese, histórico médico), ou dados não exportados pelo CRM.

## 2. Como usamos

- **Exclusivamente para gerar a análise contratada.** Calculamos métricas, identificamos padrões, aplicamos modelos de scoring, geramos narrativas em linguagem natural via IA.
- **Não usamos** dados de um cliente para análises de outros clientes.
- **Não vendemos, não compartilhamos** dados com terceiros para fins comerciais.
- **Provedores de IA** (Groq, Google Gemini, OpenAI) recebem subsets agregados/anonimizados quando necessário pra geração de insights — **nunca dados pessoais identificáveis dos seus membros**. Configuramos pra zero data retention nos provedores quando essa opção existe.

## 3. Onde armazenamos

- **Banco de dados criptografado** (MongoDB Atlas, AES-256 at-rest, TLS em trânsito)
- **Hospedagem** em Vercel / Cloudflare (criptografia padrão)
- **Acesso restrito** apenas a operadores autorizados da FlexiWell sob NDA

## 4. Por quanto tempo

- Dados são automaticamente excluídos **90 dias após a entrega da análise**, salvo se você solicitar exclusão antes ou solicitar retenção mais longa para um próximo audit.
- Após exclusão, você não consegue mais acessar a URL token do dashboard. A análise pode ser regerada com novo upload.

## 5. Seus direitos (LGPD)

A qualquer momento você pode:

- **Solicitar exclusão imediata** dos seus dados — basta enviar e-mail para [privacy@flexiwell.com] ou WhatsApp [número]. Cumprimos em até 5 dias úteis.
- **Solicitar acesso** a uma cópia dos dados que armazenamos sobre o seu estúdio.
- **Retificar** dados incorretos.
- **Retirar consentimento** de uso a qualquer momento (interrompe o serviço).
- **Reclamar à ANPD** caso considere o tratamento inadequado.

## 6. Sub-processadores

Listamos os terceiros que processam dados em nosso nome:

| Sub-processador | Finalidade | Local |
|---|---|---|
| MongoDB Atlas | Banco de dados | Cloud (região: [tbd]) |
| Vercel | Hospedagem do dashboard | Edge global |
| Resend | E-mail transacional (notificações ao dono do estúdio) | US |
| Groq / Google Gemini | Geração de insights via LLM | US (zero retention configurado) |
| Stripe | Processamento de pagamento (não acessa dados do estúdio) | US |

## 7. Seus membros (titulares dos dados pessoais)

Os dados dos seus membros pertencem a eles e a você (controlador). A FlexiWell atua como **operadora**, processando sob sua instrução.

**Recomendamos** que você inclua na sua política de privacidade aos membros uma cláusula sobre uso de provedores de análise de dados (operadores), o que cobre o uso da FlexiWell.

## 8. Mudanças nesta política

Se atualizarmos esta política de forma material, te avisamos com 30 dias de antecedência por e-mail.

## 9. Contato

Dúvidas, exercícios de direitos, incidentes:

- **E-mail:** [privacy@flexiwell.com]
- **WhatsApp:** [número]
- **DPO/Encarregado:** [nome] — [email]
- **Endereço postal:** [endereço]

---

## English summary (US/EU clients)

For US clients: data handling is consistent with **CCPA** (California) and equivalent state laws. We do not sell personal data, do not use it for advertising, and provide deletion on request within 5 business days.

For EU clients (if any): we comply with **GDPR** principles. We act as a data processor under your instructions as controller. Data subjects' rights are exercisable through us or through you; we cooperate on request.

Full English version available on request: privacy@flexiwell.com.
