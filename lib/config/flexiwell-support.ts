// FlexiWell CRM Support Bot Configuration
// This bot helps studio admins/owners with questions about using the FlexiWell CRM

export const flexiwellSupportConfig = {
  name: "FlexiWell Support",
  description: "AI support assistant for FlexiWell CRM administrators",

  // System prompt for the support bot
  systemPrompt: `Você é o assistente de suporte da FlexiWell, uma plataforma de CRM para estúdios de pilates, yoga e wellness.

Seu papel é ajudar os ADMINISTRADORES e DONOS DE ESTÚDIO que usam o FlexiWell CRM. Você NÃO está falando com clientes finais dos estúdios.

## Sobre o FlexiWell CRM

O FlexiWell é uma plataforma completa para gestão de estúdios que inclui:

### Funcionalidades Principais:
1. **Dashboard** - Visão geral do estúdio com métricas importantes
2. **Clientes** - Cadastro e gestão de alunos/clientes
3. **Agenda/Calendário** - Agendamento de aulas e sessões
4. **Lista de Espera (Waitlist)** - Gerenciamento de fila de espera para aulas
5. **Pagamentos** - Controle financeiro e cobranças
6. **Equipe (Staff)** - Gestão de instrutores e funcionários
7. **Relatórios** - Análises e métricas do negócio

### Planos Disponíveis:
- **Starter** (Gratuito): Até 25 clientes, 1 instrutor, funcionalidades básicas
- **Growth** (R$97/mês): Até 100 clientes, 3 instrutores, relatórios avançados
- **Business** (R$197/mês): Até 500 clientes, 10 instrutores, integrações, bot de IA
- **Enterprise** (R$397/mês): Clientes ilimitados, instrutores ilimitados, suporte prioritário

### Integrações:
- WhatsApp Business (para notificações e bot)
- Crisp (chat de suporte)
- Stripe/Asaas (pagamentos)
- Google Calendar

## Como Responder:

1. **Seja sempre prestativo e paciente** - Os admins podem ser novos na plataforma
2. **Dê instruções passo a passo** quando explicar como fazer algo
3. **Use exemplos práticos** relacionados a estúdios de wellness
4. **Se não souber algo**, diga que vai verificar ou sugira entrar em contato com suporte humano
5. **Responda em português** (a menos que o usuário escreva em outro idioma)

## Tópicos Comuns:

- Como cadastrar novos clientes
- Como criar/editar aulas na agenda
- Como configurar planos e preços
- Como processar pagamentos
- Como adicionar instrutores
- Como usar a lista de espera
- Como ver relatórios
- Problemas com login/acesso
- Dúvidas sobre planos e preços
- Como configurar integrações

## Escalação:

Se o admin tiver problemas técnicos graves, bugs, ou questões de cobrança/faturamento, sugira:
- Email: suporte@flexiwell.net
- Ou solicite falar com um humano

Lembre-se: Você está ajudando DONOS DE ESTÚDIO a usar melhor o sistema, não clientes finais.`,

  // Quick replies for common questions
  quickReplies: [
    {
      trigger: ["como cadastrar", "adicionar cliente", "novo cliente"],
      response: `Para cadastrar um novo cliente:

1. Acesse o menu **Clientes** no painel lateral
2. Clique no botão **"+ Novo Cliente"** no canto superior direito
3. Preencha os dados: nome, email, telefone
4. Selecione o plano do cliente (mensal, trimestral, etc.)
5. Clique em **Salvar**

O cliente receberá um email de boas-vindas automaticamente se você tiver configurado as notificações.`,
    },
    {
      trigger: ["criar aula", "agendar aula", "nova aula", "adicionar aula"],
      response: `Para criar uma nova aula:

1. Vá em **Dashboard** ou **Agenda**
2. Clique em **"+ Nova Aula"** ou clique diretamente no horário desejado
3. Preencha:
   - Nome da aula (ex: Pilates Reformer)
   - Instrutor responsável
   - Data e horário
   - Capacidade máxima
   - Recorrência (se for aula fixa)
4. Clique em **Salvar**

A aula aparecerá no calendário e os clientes poderão se inscrever.`,
    },
    {
      trigger: ["lista de espera", "waitlist", "fila de espera"],
      response: `A **Lista de Espera** funciona assim:

1. Quando uma aula atinge a capacidade máxima, novos interessados entram na fila
2. Acesse **Waitlist** no menu para ver todas as solicitações
3. Você pode:
   - **Aprovar** manualmente quando houver vaga
   - Configurar aprovação automática
4. O cliente é notificado quando conseguir a vaga

Para configurar a lista de espera de uma aula específica, edite a aula e ative a opção "Permitir lista de espera".`,
    },
    {
      trigger: ["plano", "preço", "quanto custa", "upgrade", "mudar plano"],
      response: `Os planos do FlexiWell são:

**Starter (Gratuito)**
- Até 25 clientes
- 1 instrutor
- Funcionalidades básicas

**Growth (R$97/mês)**
- Até 100 clientes
- 3 instrutores
- Relatórios avançados

**Business (R$197/mês)**
- Até 500 clientes
- 10 instrutores
- Bot de IA, integrações

**Enterprise (R$397/mês)**
- Ilimitado
- Suporte prioritário

Para mudar de plano: **Settings > Subscription > Upgrade**`,
    },
    {
      trigger: ["pagamento", "cobrança", "cobrar cliente"],
      response: `Para gerenciar pagamentos:

1. Acesse **Payments** no menu
2. Você verá todos os pagamentos pendentes e histórico
3. Para cobrar um cliente:
   - Vá no perfil do cliente
   - Clique em **"Gerar Cobrança"**
   - Selecione o valor e método

**Integrações de pagamento:**
- Stripe (cartão internacional)
- Asaas (PIX, boleto, cartão)

Configure em **Settings > Integrations > Payments**`,
    },
    {
      trigger: ["relatório", "report", "métricas", "analytics"],
      response: `Para acessar relatórios:

1. Vá em **Reports** no menu
2. Escolha o tipo de relatório:
   - **Receita**: faturamento por período
   - **Clientes**: novos, ativos, churn
   - **Aulas**: ocupação, mais populares
   - **Instrutores**: performance

3. Use os filtros para ajustar o período
4. Exporte em PDF ou Excel se precisar

💡 Dica: O Dashboard também mostra métricas resumidas em tempo real.`,
    },
  ],

  // Topics the bot can help with
  topics: [
    "Cadastro de clientes",
    "Agendamento de aulas",
    "Lista de espera",
    "Pagamentos e cobranças",
    "Gestão de instrutores",
    "Relatórios e métricas",
    "Configurações do sistema",
    "Planos e preços",
    "Integrações (WhatsApp, pagamentos)",
    "Problemas técnicos",
  ],

  // Escalation triggers
  escalationTriggers: [
    "falar com humano",
    "suporte humano",
    "atendente",
    "bug",
    "erro grave",
    "não funciona",
    "cobrança errada",
    "cancelar assinatura",
    "reembolso",
  ],
};

// Helper function to check if message matches quick reply
export function findQuickReply(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  for (const reply of flexiwellSupportConfig.quickReplies) {
    if (reply.trigger.some(t => lowerMessage.includes(t))) {
      return reply.response;
    }
  }

  return null;
}

// Check if should escalate to human
export function shouldEscalateToHuman(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return flexiwellSupportConfig.escalationTriggers.some(t =>
    lowerMessage.includes(t)
  );
}
