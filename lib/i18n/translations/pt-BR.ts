// Brazilian Portuguese translations
// Focus: Support, Waitlist Management, Revenue Predictability

export const ptBR = {
  // Common
  common: {
    save: "Salvar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    delete: "Excluir",
    edit: "Editar",
    add: "Adicionar",
    search: "Buscar",
    filter: "Filtrar",
    loading: "Carregando...",
    error: "Erro",
    success: "Sucesso",
    warning: "Aviso",
    back: "Voltar",
    next: "Proximo",
    previous: "Anterior",
    close: "Fechar",
    yes: "Sim",
    no: "Nao",
    or: "ou",
    and: "e",
  },

  // Navigation
  nav: {
    dashboard: "Painel",
    schedule: "Agenda",
    clients: "Alunos",
    classes: "Aulas",
    bookings: "Reservas",
    waitlist: "Lista de Espera",
    payments: "Pagamentos",
    reports: "Relatorios",
    settings: "Configuracoes",
    support: "Suporte",
    logout: "Sair",
  },

  // Pricing & Plans
  pricing: {
    title: "Planos e Precos",
    subtitle: "Escolha o plano ideal para seu estudio",
    monthly: "Mensal",
    annual: "Anual",
    perMonth: "/mes",
    billedAnnually: "cobrado anualmente",
    save: "Economize",
    mostPopular: "Mais popular",
    bestForPredictability: "Melhor para previsibilidade",
    contactSales: "Fale com vendas",
    startFreeTrial: "Iniciar teste gratis",
    currentPlan: "Plano atual",
    upgrade: "Fazer upgrade",
    downgrade: "Fazer downgrade",

    // Plan names
    plans: {
      starter: {
        name: "Starter",
        description: "Para instrutores solo comecando.",
        tagline: "Para instrutores solo",
      },
      growth: {
        name: "Growth",
        description: "Para estudios em crescimento prontos para escalar.",
        tagline: "Para estudios em crescimento",
      },
      business: {
        name: "Business",
        description: "Maximize a receita com waitlist inteligente e insights preditivos.",
        tagline: "Otimizacao de receita",
      },
      enterprise: {
        name: "Enterprise",
        description: "Para redes de estudios e franquias com controle maximo.",
        tagline: "Solucao personalizada",
      },
    },

    // Features
    features: {
      onlineScheduling: "Agendamento online",
      clientPortal: "Portal do aluno",
      paymentProcessing: "Processamento de pagamentos",
      emailReminders: "Lembretes por email",
      calendarSync: "Sincronizacao de calendario",
      smsNotifications: "Notificacoes SMS",
      whatsappNotifications: "Notificacoes WhatsApp",
      messagingBot: "Bot de Mensagens",
      messagingBotTooltip: "Bot WhatsApp - agendamento automatizado, confirmacoes, lembretes",
      aiSupportAssistant: "Assistente de Suporte IA",
      smartWaitlist: "Lista de Espera Inteligente",
      smartWaitlistTooltip: "Prioridade por IA, preenchimento automatico de cancelamentos, reduz no-shows em 40%",
      cancellationPredictions: "Previsao de cancelamentos",
      cancellationPredictionsTooltip: "Previsoes baseadas em ML para preencher vagas proativamente",
      autoFillSpots: "Preenchimento automatico de vagas",
      revenueProtection: "Protecao de receita",
      revenueProtectionTooltip: "Taxas de cancelamento tardio, rastreamento de no-shows",
      customWaitlistRules: "Regras personalizadas de waitlist",
      wellhubGympass: "Wellhub/Gympass",
      basicReports: "Relatorios basicos",
      advancedReports: "Relatorios avancados",
      revenueAnalytics: "Analise de receita",
      revenueAnalyticsTooltip: "Dashboard completo de previsibilidade de fluxo de caixa",
      monthlyRevenueForecast: "Previsao de receita mensal",
      monthlyRevenueForecastTooltip: "Previsoes de receita de 30 dias baseadas em reservas",
      multiLocationAnalytics: "Analise multi-unidade",
      dataExport: "Exportacao de dados",
      emailSupport: "Suporte por email",
      chatSupport: "Suporte por chat",
      prioritySupport: "Suporte prioritario",
      dedicatedAccountManager: "Gerente de conta dedicado",
      apiAccess: "Acesso a API",
      whiteLabelBranding: "Marca propria (White-label)",
      customIntegrations: "Integracoes personalizadas",
    },

    // Limits
    limits: {
      clients: "alunos",
      teamMembers: "membros da equipe",
      locations: "unidades",
      storage: "armazenamento",
      unlimited: "ilimitado",
      msgsPerMonth: "msgs/mes",
      chatsPerMonth: "chats/mes",
    },
  },

  // Waitlist - Core feature
  waitlist: {
    title: "Lista de Espera Inteligente",
    subtitle: "Reduza a variacao de receita e aumente a previsibilidade de caixa",

    // Status
    status: {
      waiting: "Aguardando",
      notified: "Notificado",
      confirmed: "Confirmado",
      expired: "Expirado",
      declined: "Recusado",
    },

    // Priority
    priority: {
      vip: "VIP",
      high: "Alta",
      medium: "Media",
      low: "Baixa",
    },

    // Actions
    actions: {
      addToWaitlist: "Adicionar a lista de espera",
      removeFromWaitlist: "Remover da lista de espera",
      notifyNext: "Notificar proximo",
      notifyAll: "Notificar todos",
      confirmSpot: "Confirmar vaga",
      declineSpot: "Recusar vaga",
    },

    // Messages
    messages: {
      spotAvailable: "Vaga disponivel! Voce tem {minutes} minutos para confirmar.",
      addedToWaitlist: "Voce foi adicionado a lista de espera na posicao {position}.",
      confirmedFromWaitlist: "Sua vaga foi confirmada!",
      expiredOffer: "A oferta de vaga expirou.",
      queuePosition: "Sua posicao na fila: {position}",
    },

    // Settings
    settings: {
      enableSmartPriority: "Ativar prioridade inteligente",
      autoNotifyOnCancel: "Notificar automaticamente ao cancelar",
      notificationWindow: "Janela de notificacao (minutos)",
      maxWaitlistSize: "Tamanho maximo da lista",
      priorityByPlanType: "Priorizar por tipo de plano",
    },

    // Revenue impact
    revenue: {
      spotsFilledFromWaitlist: "Vagas preenchidas da waitlist",
      revenueRecovered: "Receita recuperada",
      noShowsReduced: "No-shows reduzidos",
      cancellationsPredicted: "Cancelamentos previstos",
    },
  },

  // Messaging Bot
  messaging: {
    title: "Bot de Mensagens",
    whatsappBot: "Bot WhatsApp",
    smsBot: "Bot SMS",

    // Bot responses
    bot: {
      greeting: "Ola! Sou o assistente virtual do {studioName}. Como posso ajudar?",
      bookingConfirmed: "Sua aula de {className} esta confirmada para {date} as {time}.",
      reminder24h: "Lembrete: Sua aula de {className} e amanha as {time}.",
      reminder2h: "Sua aula de {className} comeca em 2 horas. Nos vemos la!",
      cancellationReceived: "Cancelamento recebido. Voce gostaria de remarcar?",
      waitlistNotification: "Boa noticia! Uma vaga abriu para {className} em {date}. Responda SIM para confirmar.",
      waitlistConfirmed: "Vaga confirmada! Voce esta inscrito em {className} para {date} as {time}.",
      waitlistExpired: "A oferta de vaga expirou. Voce permanece na lista de espera.",
    },

    // Settings
    settings: {
      enableBot: "Ativar bot de mensagens",
      autoConfirmation: "Confirmacao automatica de reservas",
      autoReminders: "Lembretes automaticos",
      waitlistNotifications: "Notificacoes de waitlist",
      messageLimit: "Limite de mensagens/mes",
    },
  },

  // Support
  support: {
    title: "Suporte",
    newTicket: "Novo ticket",
    myTickets: "Meus tickets",
    aiAssistant: "Assistente IA",

    // Categories
    categories: {
      billing: "Cobranca",
      classes: "Aulas",
      technical: "Tecnico",
      feedback: "Feedback",
      other: "Outro",
    },

    // Priority
    priority: {
      low: "Baixa",
      medium: "Media",
      high: "Alta",
      urgent: "Urgente",
    },

    // Status
    status: {
      open: "Aberto",
      inProgress: "Em andamento",
      resolved: "Resolvido",
      closed: "Fechado",
    },
  },

  // Revenue & Analytics
  revenue: {
    title: "Analise de Receita",
    dashboard: "Dashboard de Receita",
    forecast: "Previsao",
    actual: "Realizado",
    variance: "Variacao",

    // Metrics
    metrics: {
      monthlyRecurring: "Receita mensal recorrente",
      projectedRevenue: "Receita projetada",
      actualRevenue: "Receita realizada",
      revenueVariance: "Variacao de receita",
      cashFlowPredictability: "Previsibilidade de caixa",
      occupancyRate: "Taxa de ocupacao",
      noShowRate: "Taxa de no-show",
      cancellationRate: "Taxa de cancelamento",
    },

    // Insights
    insights: {
      revenueAtRisk: "Receita em risco",
      predictedCancellations: "Cancelamentos previstos",
      waitlistConversions: "Conversoes da waitlist",
      recommendedActions: "Acoes recomendadas",
    },
  },

  // Notifications
  notifications: {
    title: "Notificacoes",
    email: "Email",
    whatsapp: "WhatsApp",
    sms: "SMS",
    push: "Push",

    // Types
    types: {
      bookingConfirmation: "Confirmacao de reserva",
      bookingReminder: "Lembrete de aula",
      bookingCancellation: "Cancelamento de reserva",
      waitlistNotification: "Notificacao de waitlist",
      paymentConfirmation: "Confirmacao de pagamento",
      planExpiring: "Plano expirando",
    },
  },

  // Errors
  errors: {
    generic: "Ocorreu um erro. Por favor, tente novamente.",
    notFound: "Nao encontrado",
    unauthorized: "Nao autorizado",
    forbidden: "Acesso negado",
    validation: "Por favor, verifique os dados informados.",
    network: "Erro de conexao. Verifique sua internet.",
  },
};

export type TranslationKeys = typeof ptBR;
