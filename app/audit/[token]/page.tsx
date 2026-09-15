"use client";

// MOCKUP — Editorial-format FlexiWell Radar audit report.
//
// Per visual direction (project_radar_visual_direction.md, 2026-05-06):
//   - editorial report body (single column, serif headlines, prose with inline data)
//   - interactive islands ONLY where the action is the point (this week's focus)
//   - non-interactive data viz islands (charts, heatmap) embedded in prose
//   - no sidebar, no SaaS-dashboard tile grid
//
// i18n: PT / EN switcher in BrandBar. Mock prose data is bilingual (L type).
// Real implementation will swap mock data for AuditSnapshot + AuditInsights lookups.

import { useState, use, createContext, useContext } from "react";
import Image from "next/image";
import {
  CheckCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  CalendarDaysIcon,
  PhoneIcon,
  MailIcon,
  MessageCircleIcon,
  CreditCardIcon,
  Settings2Icon,
  TargetIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface PageProps {
  params: Promise<{ token: string }>;
}

// ===========================================================================
// I18N — Locale type, Context, helpers
// ===========================================================================

type Locale = "en" | "pt";
type L = { en: string; pt: string };

const LocaleContext = createContext<Locale>("en");
const useLocale = () => useContext(LocaleContext);

// Action urgency levels — visual scan for "what to do when"
type Urgency = "today" | "this-week" | "this-month" | "ongoing";

const urgencyStyle: Record<Urgency, { bg: string; text: string; ring: string }> = {
  today: { bg: "bg-red-50", text: "text-red-800", ring: "ring-1 ring-red-200/70" },
  "this-week": { bg: "bg-orange-50", text: "text-orange-800", ring: "ring-1 ring-orange-200/70" },
  "this-month": { bg: "bg-blue-50", text: "text-blue-800", ring: "ring-1 ring-blue-200/70" },
  ongoing: { bg: "bg-stone-100", text: "text-stone-600", ring: "ring-1 ring-stone-200" },
};

const urgencyLabel: Record<Urgency, L> = {
  today: { en: "Today", pt: "Hoje" },
  "this-week": { en: "This week", pt: "Esta semana" },
  "this-month": { en: "This month", pt: "Este mês" },
  ongoing: { en: "Ongoing", pt: "Contínuo" },
};

// Action type → icon mapping
type ActionType = "call" | "email" | "talk" | "payment" | "system" | "decide" | "outreach";

const actionIcon: Record<ActionType, LucideIcon> = {
  call: PhoneIcon,
  email: MailIcon,
  talk: MessageCircleIcon,
  payment: CreditCardIcon,
  system: Settings2Icon,
  decide: TargetIcon,
  outreach: UsersIcon,
};

// Composite type for an action with urgency + type
type Action = L & { urgency: Urgency; type: ActionType };

// Member case — named member impacted by a leak
type MemberCase = { name: string; detail: L };

// ===========================================================================
// CHROME STRINGS — UI text by locale
// ===========================================================================

const T = {
  brand: {
    refreshed: { en: "Refreshed", pt: "Atualizado em" } as L,
    switchToPortuguese: { en: "Switch to Portuguese", pt: "Mudar para português" } as L,
    switchToEnglish: { en: "Switch to English", pt: "Switch to English" } as L,
  },
  toc: {
    inThisReport: { en: "In this report", pt: "Neste relatório" } as L,
    refreshed: { en: "Refreshed", pt: "Atualizado" } as L,
    nextReview: { en: "Next review", pt: "Próxima revisão" } as L,
    totalRecoverable: { en: "Total recoverable", pt: "Total recuperável" } as L,
    perYear: { en: "per year", pt: "por ano" } as L,
    actions: { en: "Actions", pt: "Ações" } as L,
    context: { en: "Context", pt: "Contexto" } as L,
  },
  cover: {
    headlinePre: {
      en: ", you're leaving ",
      pt: ", você está deixando ",
    } as L,
    headlinePost: {
      en: " a year on the table.",
      pt: " por ano em cima da mesa.",
    } as L,
    lead1Pre: { en: "That's ", pt: "Isso são " } as L,
    lead1Post: {
      en:
        " a month leaking out right now. This audit isn't about recovering $52,400 once — it's about closing the gaps so the leak stops. 90 days to plug them; from there, $52,400/year becomes your new baseline, recurring every year — and compounding as retention and plan-fit improve.",
      pt:
        " por mês escapando agora. Esta auditoria não é sobre recuperar $52,400 uma vez — é sobre fechar as brechas pro vazamento parar. 90 dias pra fechar; daí em diante, $52,400/ano passa a ser seu novo baseline, recorrente todo ano — e composto à medida que retenção e plan-fit melhoram.",
    } as L,
    lead2Pre: { en: "We looked at ", pt: "Olhamos " } as L,
    lead2A: { en: " active members, ", pt: " alunas ativas, " } as L,
    lead2B: { en: " attendance records, ", pt: " registros de presença, " } as L,
    lead2C: { en: " transactions, and ", pt: " transações e " } as L,
    lead2D: {
      en: " ClassPass visits over the last 90 days. Three findings, ranked by what you can recover fastest.",
      pt: " visitas ClassPass nos últimos 90 dias. Três achados, ranqueados pelo que você pode recuperar mais rápido.",
    } as L,
  },
  summary: {
    eyebrow: { en: "Where to start", pt: "Por onde começar" } as L,
    h2: {
      en: "Three findings, ranked by what to do first.",
      pt: "Três achados, ranqueados pelo que fazer primeiro.",
    } as L,
    lead: {
      en:
        "The findings below aren't equal. One you can act on this week with no judgment calls. One needs your relationship and timing. One needs a decision that nobody else can make for you. Read in order — each finding has a step-by-step recovery playbook at the end.",
      pt:
        "Os achados abaixo não são iguais. Um você pode agir esta semana sem decisões difíceis. Um precisa do seu relacionamento e timing. Um precisa de uma decisão que ninguém mais pode tomar por você. Leia em ordem — cada achado tem um passo a passo de recuperação no fim.",
    } as L,
  },
  thisWeek: {
    h2: {
      en: "This week, reach out to these five.",
      pt: "Esta semana, fale com estas cinco.",
    } as L,
    lead: {
      en:
        "These members have stopped showing up but haven't cancelled. The pilates pattern is well-known — the longer they stay invisible, the harder they are to bring back. Reach out by Friday. Use whatever channel fits your relationship — call, WhatsApp, email.",
      pt:
        "Estas alunas pararam de aparecer mas não cancelaram. O padrão do pilates é conhecido — quanto mais tempo invisíveis, mais difíceis de trazer de volta. Fale com elas até sexta. Use o canal que combinar com a relação — ligação, WhatsApp, email.",
    } as L,
    ofContacted: { en: "of", pt: "de" } as L,
    contacted: { en: "contacted", pt: "contatadas" } as L,
    criticalSuffix: { en: "critical", pt: "crítica(s)" } as L,
    daysSinceLastClass: {
      en: "d since last class",
      pt: "d desde a última aula",
    } as L,
    markDone: { en: "Mark done", pt: "Marcar feito" } as L,
    done: { en: "Done", pt: "Feito" } as L,
    markAsContacted: { en: "Mark as contacted", pt: "Marcar como contatada" } as L,
    markAsNotContacted: {
      en: "Mark as not contacted",
      pt: "Marcar como não contatada",
    } as L,
  },
  finding: {
    f01eyebrow: { en: "Finding 01", pt: "Achado 01" } as L,
    f02eyebrow: { en: "Finding 02", pt: "Achado 02" } as L,
    f03eyebrow: { en: "Finding 03", pt: "Achado 03" } as L,
    perYear: { en: "/yr", pt: "/ano" } as L,
    perMonth: { en: "/ mo", pt: "/ mês" } as L,
    perVisit: { en: "/visit", pt: "/visita" } as L,
    recoverable: { en: "recoverable", pt: "recuperável" } as L,
    atRisk: { en: "at risk", pt: "em risco" } as L,
    lost: { en: "lost", pt: "perdido" } as L,
    f01h2: {
      en: "Money is slipping through, quietly.",
      pt: "O dinheiro está escapando, em silêncio.",
    } as L,
    f01lead: {
      en:
        "The biggest hidden cost in your studio isn't payroll or rent — it's the slow drip of revenue you never invoiced, never recovered, and never reactivated. Five patterns this month, ranked by what you can recover in 30 days.",
      pt:
        "O maior custo oculto do seu studio não é folha nem aluguel — é o gotejar lento de receita que você nunca cobrou, nunca recuperou e nunca reativou. Cinco padrões este mês, ranqueados pelo que dá pra recuperar em 30 dias.",
    } as L,
    f01churnPre: { en: "Your 90-day churn is ", pt: "Seu churn de 90 dias é " } as L,
    f01churnMid: { en: ", down from ", pt: ", abaixo dos " } as L,
    f01churnPost: {
      en: " in November. Improving — but the leaks above explain why it isn't lower.",
      pt: " de novembro. Melhorando — mas os vazamentos acima explicam por que não é menor.",
    } as L,
    f02h2: {
      en: "A small group is already telling you they'd pay more.",
      pt: "Um pequeno grupo já está te dizendo que pagaria mais.",
    } as L,
    f02leadA: {
      en:
        "A handful of members consistently spend more than their plan would suggest — they book workshops, buy retail, refer friends, attend 4×/week on an 8-pack. We found ",
      pt:
        "Um punhado de alunas consistentemente gasta mais do que o plano sugeriria — reservam workshops, compram retail, indicam amigas, vêm 4×/semana num pacote de 8. Encontramos ",
    } as L,
    f02leadB: {
      en: " of them. The top six, by upside if offered the right next step:",
      pt: ". As 6 do topo, por upside se receberem o próximo passo certo:",
    } as L,
    f02PlanMisA: { en: "Separately, ", pt: "Separadamente, " } as L,
    f02PlanMisB: {
      en: " members are on plans below their actual usage and ",
      pt: " alunas estão em planos abaixo do uso real e ",
    } as L,
    f02PlanMisC: {
      en: " are paying for more than they use (cancellation risk). Realigning both adds ",
      pt: " pagam por mais do que usam (risco de cancelamento). Realinhar os dois adiciona ",
    } as L,
    f02PlanMisD: { en: " a month.", pt: " por mês." } as L,
    f03h2: {
      en: "Your schedule and ClassPass are working against you.",
      pt: "Sua agenda e o ClassPass estão jogando contra você.",
    } as L,
    f03leadPre: { en: "Average fill rate is ", pt: "A ocupação média é " } as L,
    f03leadPost: {
      en:
        " — below the 70% profitability floor. Three slots are bleeding the most. Same room, same instructor — different hours, different outcomes. That's a schedule decision, not an instructor problem.",
      pt:
        " — abaixo do piso de 70% de rentabilidade. Três horários sangram mais. Mesma sala, mesma instrutora — horas diferentes, resultados diferentes. Isso é decisão de agenda, não problema de instrutor.",
    } as L,
    slotFillTitle: {
      en: "Slot fill rate · last 90 days",
      pt: "Ocupação por horário · últimos 90 dias",
    } as L,
    classpassThisMonth: {
      en: "ClassPass · this month",
      pt: "ClassPass · este mês",
    } as L,
    netLoss: { en: "Net loss", pt: "Prejuízo líquido" } as L,
    grossReceived: { en: "Gross received", pt: "Bruto recebido" } as L,
    estCost: {
      en: "Est. cost (instructor + reformer rateio)",
      pt: "Custo est. (instrutor + rateio reformer)",
    } as L,
    netMargin: { en: "Net margin", pt: "Margem líquida" } as L,
    f03ClosingPre: { en: "Plus ", pt: "Além disso, " } as L,
    f03ClosingPost: {
      en:
        " ClassPass users would likely pay direct if the channel closed — and at peak hours, every ClassPass seat is a paying member you turned away.",
      pt:
        " usuárias do ClassPass provavelmente pagariam direto se o canal fechasse — e nos horários de pico, cada vaga ClassPass é uma aluna pagante que você recusou.",
    } as L,
  },
  plan: {
    h2: {
      en: "What to do in the next 30 days.",
      pt: "O que fazer nos próximos 30 dias.",
    } as L,
    lead: {
      en:
        "One thing per week. Don't batch. The audit is a rhythm — and the rhythm matters more than perfection.",
      pt:
        "Uma coisa por semana. Não acumule. A auditoria é um ritmo — e o ritmo importa mais que a perfeição.",
    } as L,
    youAreHere: { en: "You are here", pt: "Você está aqui" } as L,
  },
  benchmark: {
    eyebrow: { en: "How you compare", pt: "Como você se compara" } as L,
    h2: {
      en: "Where you stand against your cohort.",
      pt: "Onde você está em relação ao seu grupo.",
    } as L,
    lead: {
      en:
        "Compared against 47 independent boutique pilates studios on Mindbody (US, 200-400 active members). Not a leaderboard — a reference frame. The signal isn't whether you beat the median; it's where the gaps are concentrated.",
      pt:
        "Comparado com 47 studios pilates boutique independentes no Mindbody (EUA, 200-400 alunas ativas). Não é leaderboard — é frame de referência. O sinal não é se você bate a mediana; é onde estão as lacunas.",
    } as L,
    you: { en: "You", pt: "Você" } as L,
    cohort: { en: "Cohort", pt: "Grupo" } as L,
    better: { en: "Better", pt: "Melhor" } as L,
    below: { en: "Below", pt: "Abaixo" } as L,
    closingPre: { en: "The pattern: ", pt: "O padrão: " } as L,
    closingHighlight: {
      en: "your studio works",
      pt: "seu studio funciona",
    } as L,
    closingPost: {
      en:
        " — retention and revenue per member are above the median. The gaps are operational (failed payments, slot fill, ClassPass). That's good news; operations are easier to fix than product.",
      pt:
        " — retenção e receita por aluna acima da mediana. As lacunas são operacionais (pagamentos falhados, ocupação, ClassPass). É boa notícia; operações são mais fáceis de consertar que produto.",
    } as L,
    gapsEyebrow: {
      en: "Where to focus · closing the gaps",
      pt: "Onde focar · fechando as lacunas",
    } as L,
    gapsH3: {
      en: "Three metrics below cohort. Three plans to close them.",
      pt: "Três métricas abaixo do grupo. Três planos para fechá-las.",
    } as L,
  },
  methodology: {
    eyebrow: { en: "Methodology", pt: "Metodologia" } as L,
    h2: {
      en: "What we looked at, and what we didn't.",
      pt: "O que olhamos, e o que não olhamos.",
    } as L,
    lead: {
      en:
        "Every number in this report is grounded in your own data. Where we estimate, we say so — and where the estimate could be wrong, we say by how much.",
      pt:
        "Todo número deste relatório está ancorado nos seus próprios dados. Onde estimamos, dizemos — e onde a estimativa pode estar errada, dizemos por quanto.",
    } as L,
    period: { en: "Period", pt: "Período" } as L,
    source: { en: "Source", pt: "Fonte" } as L,
    recordsAnalyzed: { en: "Records analyzed", pt: "Registros analisados" } as L,
    crossReferences: { en: "Cross-references", pt: "Cruzamentos" } as L,
    limitations: { en: "Limitations", pt: "Limitações" } as L,
  },
  closer: {
    eyebrow: { en: "Next Radar", pt: "Próximo Radar" } as L,
    headlinePre: { en: "See you on ", pt: "Vejo você em " } as L,
    headlinePost: { en: ".", pt: "." } as L,
    leadA: {
      en:
        "90 days from now I'll re-run your data, line it up against this month's baseline, and we'll spend 30 minutes together planning the next quarter. The numbers here will look different — that's the point.",
      pt:
        "Daqui a 90 dias eu rodo seus dados de novo, comparo com o baseline deste mês, e a gente passa 30 minutos planejando o próximo trimestre. Os números aqui vão estar diferentes — esse é o ponto.",
    } as L,
    leadB: {
      en:
        "Question between reviews? Message me on WhatsApp. I keep these channels open for studios on Radar.",
      pt:
        "Dúvida entre as revisões? Me chame no WhatsApp. Mantenho esses canais abertos para studios no Radar.",
    } as L,
    bookCta: { en: "Book quarterly review", pt: "Agendar revisão trimestral" } as L,
    whatsappCta: {
      en: "Message Ana on WhatsApp",
      pt: "Mensagem para Ana no WhatsApp",
    } as L,
    footer: {
      en: "Your private FlexiWell Radar dashboard. Bookmark this URL — it's yours.",
      pt: "Seu dashboard FlexiWell Radar privado. Salve esta URL — ela é sua.",
    } as L,
  },
  howToRecover: {
    eyebrow: { en: "Action plan", pt: "Plano de ação" } as L,
    h3: { en: "Step by step", pt: "Passo a passo" } as L,
  },
  heatmap: {
    fillRate: { en: "Fill rate", pt: "Ocupação" } as L,
    noClass: { en: "no class", pt: "sem aula" } as L,
  },
};

// ===========================================================================
// MOCK DATA
// ===========================================================================

const studio = {
  name: "Bella Pilates",
  city: "Austin, TX",
  reportMonth: { en: "April 2026", pt: "Abril 2026" } as L,
  reportPeriod: { en: "Feb 1 – Apr 30, 2026", pt: "1 Fev – 30 Abr 2026" } as L,
  lastRefreshedAt: { en: "April 28, 2026", pt: "28 de Abril de 2026" } as L,
  ownerFirstName: "Bella",
  nextReviewDate: { en: "Aug 4, 2026", pt: "4 de Agosto de 2026" } as L,
};

const stats = {
  activeMembers: 234,
  attendanceRecords: 2108,
  transactions: 156,
  classPassVisits: 87,
  churnRate90d: 8.1,
  churnRate90dPrior: 11.0,
  totalRecoverableAnnual: 52400,
  totalRecoverableMonthly: 4367,
};

const heroBreakdown = [
  {
    name: { en: "Money slipping through", pt: "Dinheiro escapando" } as L,
    value: 33000,
    color: "#dc2626",
  },
  {
    name: {
      en: "Under-charging the willing",
      pt: "Cobrando de menos de quem quer pagar mais",
    } as L,
    value: 14000,
    color: "#059669",
  },
  {
    name: {
      en: "Empty slots & ClassPass losses",
      pt: "Aulas vazias & ClassPass dando prejuízo",
    } as L,
    value: 5400,
    color: "#ea580c",
  },
];

const churnTrend = [
  { month: "Nov", value: 11.2 },
  { month: "Dec", value: 10.5 },
  { month: "Jan", value: 9.3 },
  { month: "Feb", value: 8.8 },
  { month: "Mar", value: 8.5 },
  { month: "Apr", value: 8.1 },
];

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

// This week's focus — the only interactive island
const thisWeek = [
  {
    id: "m1",
    name: "Sarah K.",
    daysSinceLastClass: 14,
    riskReason: {
      en: "Skipped after 3-class streak",
      pt: "Parou após sequência de 3 aulas",
    } as L,
    severity: "high" as const,
    suggestedAction: {
      en: "Quick warm check-in. Offer the Wednesday 6pm spot — that's her usual.",
      pt:
        "Mensagem rápida e amigável. Ofereça o horário da quarta às 19h — é o costume dela.",
    } as L,
  },
  {
    id: "m2",
    name: "Maria L.",
    daysSinceLastClass: 21,
    riskReason: {
      en: "No-shows last 2 bookings",
      pt: "No-show nas últimas 2 reservas",
    } as L,
    severity: "high" as const,
    suggestedAction: {
      en: "Ask if something changed. Hold a Saturday spot if she wants — low-pressure.",
      pt:
        "Pergunte se algo mudou. Segure um horário de sábado se ela quiser — sem pressão.",
    } as L,
  },
  {
    id: "m3",
    name: "Jen P.",
    daysSinceLastClass: 18,
    riskReason: {
      en: "Used to come 3x/week, now 0",
      pt: "Vinha 3x/semana, agora 0",
    } as L,
    severity: "critical" as const,
    suggestedAction: {
      en: "Personal reach-out — her 8am Tuesday is consistent. Worth a 5-min call.",
      pt:
        "Contato pessoal — a terça às 8h é consistente. Vale uma ligação de 5 min.",
    } as L,
  },
  {
    id: "m4",
    name: "Camila O.",
    daysSinceLastClass: 28,
    riskReason: {
      en: "Cancelled membership renewal",
      pt: "Cancelou a renovação da assinatura",
    } as L,
    severity: "critical" as const,
    suggestedAction: {
      en: "Win-back conversation. Probe what didn't fit; offer a different format/time.",
      pt:
        "Conversa de reconquista. Investigue o que não encaixou; ofereça outro formato/horário.",
    } as L,
  },
  {
    id: "m5",
    name: "Rachel D.",
    daysSinceLastClass: 12,
    riskReason: {
      en: "Health score dropped 30% this month",
      pt: "Health score caiu 30% este mês",
    } as L,
    severity: "medium" as const,
    suggestedAction: {
      en: "Light touch — offer a Thursday 7am spot. Don't over-explain.",
      pt: "Toque leve — ofereça quinta às 7h. Não explique demais.",
    } as L,
  },
];

// Finding 1 — Money slipping through
const slipping = {
  failedPayments: { count: 12, amount: 9420, recoverable: 8200 },
  ghosts: { count: 14, monthlyAtRisk: 1980 },
  winBack: { count: 8, recoverable: 4800 },
  unusedCredits: { count: 32, locked: 4540, recoverable: 3100 },
  noShows: {
    monthlyNoShows: 47,
    monthlyLateCancels: 18,
    monthlyLost: 1850,
    policyLeakage: 720,
  },
};

// Finding 2 — Hidden Spenders
const hiddenSpenders = {
  count: 22,
  totalUpsellPotential: 7800,
  ranking: [
    {
      name: "Megan A.",
      upside: 600,
      signal: {
        en: "Attending 4×/week on an 8-pack — over plan capacity",
        pt: "Vem 4×/semana num pacote de 8 — acima da capacidade do plano",
      } as L,
      offer: {
        en: "Migrate to Unlimited (+$50/mo)",
        pt: "Migrar para Ilimitado (+$50/mês)",
      } as L,
    },
    {
      name: "Rafael T.",
      upside: 480,
      signal: {
        en: "12-month tenure, never tried a private",
        pt: "12 meses de tenure, nunca tentou particular",
      } as L,
      offer: {
        en: "Offer a 1:1 reformer trial pack",
        pt: "Ofereça um pacote experimental de Reformer 1:1",
      } as L,
    },
    {
      name: "Olivia W.",
      upside: 420,
      signal: {
        en: "Booked the spring workshop — pays cash for events",
        pt: "Reservou o workshop de primavera — paga em dinheiro por eventos",
      } as L,
      offer: {
        en: "Invite to retreat package",
        pt: "Convide para o pacote de retiro",
      } as L,
    },
    {
      name: "Igor M.",
      upside: 380,
      signal: {
        en: "Buys retail consistently, on basic plan",
        pt: "Compra retail consistentemente, no plano básico",
      } as L,
      offer: {
        en: "Premium-plan retail bundle",
        pt: "Bundle plano premium + retail",
      } as L,
    },
    {
      name: "Sara H.",
      upside: 320,
      signal: {
        en: "Refers high-value friends, no recognition",
        pt: "Indica amigas de alto valor, sem reconhecimento",
      } as L,
      offer: {
        en: "VIP referral program",
        pt: "Programa de indicação VIP",
      } as L,
    },
    {
      name: "Bruno V.",
      upside: 280,
      signal: {
        en: "Anniversary in 2 weeks",
        pt: "Aniversário em 2 semanas",
      } as L,
      offer: {
        en: "Anniversary upgrade pack",
        pt: "Pacote upgrade de aniversário",
      } as L,
    },
  ],
};

const planMisalignment = {
  overusersCount: 18,
  underusersCount: 6,
  monthlyLift: 770,
};

// Finding 3 — Schedule & aggregator drag
const slotFill = {
  avgFillRate: 62,
  monthlyLeak: 1230,
};

const heatmapDays = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  pt: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
};
const heatmapHours = {
  en: ["6am", "7am", "8am", "9am", "12pm", "5pm", "6pm", "7pm"],
  pt: ["6h", "7h", "8h", "9h", "12h", "17h", "18h", "19h"],
};
const heatmapData: number[][] = [
  [38, 65, 72, 68, 47, -1, -1],
  [88, 92, 85, 90, 78, 75, -1],
  [95, 90, 92, 88, 82, 80, 65],
  [78, 72, 80, 75, 70, 88, -1],
  [55, 60, 41, 58, 52, -1, -1],
  [82, 85, 78, 80, 47, -1, -1],
  [88, 90, 85, 92, 70, -1, -1],
  [72, 75, 70, 78, 60, -1, -1],
];

const aggregator = {
  platform: "ClassPass",
  monthlyVisits: 87,
  monthlyGross: 687,
  monthlyCost: 2088,
  monthlyNet: -1401,
  perVisitGross: 7.9,
  perVisitCost: 24,
  cannibalizationCount: 6,
};

// Executive summary — densified preview of the 3 findings
const executiveSummary: Array<{
  finding: string;
  accent: string;
  amount: number;
  amountSuffix: L;
  title: L;
  framing: L;
  items: Array<{ what: L; outcome: L }>;
  deeper: L;
  anchor: string;
}> = [
  {
    finding: "01",
    accent: "text-red-700",
    amount: 33000,
    amountSuffix: { en: "/yr", pt: "/ano" },
    title: { en: "Money slipping through", pt: "Dinheiro escapando" },
    framing: {
      en: "Safe to act this week — top 3 leaks:",
      pt: "Seguro para agir esta semana — top 3 vazamentos:",
    },
    items: [
      {
        what: { en: "12 failed cards", pt: "12 cartões falhados" },
        outcome: {
          en: "$8.2K/yr recoverable",
          pt: "$8.2K/ano recuperável",
        },
      },
      {
        what: { en: "14 ghost members", pt: "14 ghost members" },
        outcome: { en: "$1.9K/mo at risk", pt: "$1.9K/mês em risco" },
      },
      {
        what: {
          en: "8 win-back candidates",
          pt: "8 candidatas de reconquista",
        },
        outcome: {
          en: "$4.8K/yr recoverable",
          pt: "$4.8K/ano recuperável",
        },
      },
    ],
    deeper: {
      en: "+ unused credits & no-shows policy below",
      pt: "+ créditos não usados & política de no-show abaixo",
    },
    anchor: "finding-01",
  },
  {
    finding: "02",
    accent: "text-emerald-700",
    amount: 14000,
    amountSuffix: { en: "/yr", pt: "/ano" },
    title: {
      en: "Under-charging the willing",
      pt: "Cobrando de menos de quem quer pagar mais",
    },
    framing: {
      en: "Needs your judgment — top 3 hidden spenders:",
      pt: "Precisa do seu julgamento — top 3 hidden spenders:",
    },
    items: [
      {
        what: {
          en: "Megan A. — 4×/wk on 8-pack",
          pt: "Megan A. — 4×/sem em pacote de 8",
        },
        outcome: {
          en: "→ Unlimited (+$50/mo)",
          pt: "→ Ilimitado (+$50/mês)",
        },
      },
      {
        what: {
          en: "Rafael T. — 12mo, never private",
          pt: "Rafael T. — 12m, nunca particular",
        },
        outcome: {
          en: "→ 1:1 Reformer trial",
          pt: "→ trial Reformer 1:1",
        },
      },
      {
        what: {
          en: "Olivia W. — pays cash for events",
          pt: "Olivia W. — paga eventos em cash",
        },
        outcome: {
          en: "→ retreat package",
          pt: "→ pacote retiro",
        },
      },
    ],
    deeper: {
      en: "+ 3 more ranked + plan misalignment below",
      pt: "+ 3 mais ranqueadas + desalinhamento de plano abaixo",
    },
    anchor: "finding-02",
  },
  {
    finding: "03",
    accent: "text-orange-700",
    amount: 5400,
    amountSuffix: { en: "/yr", pt: "/ano" },
    title: {
      en: "Empty slots & ClassPass losses",
      pt: "Aulas vazias & ClassPass dando prejuízo",
    },
    framing: {
      en: "Needs a decision — what's bleeding:",
      pt: "Precisa de uma decisão — o que está sangrando:",
    },
    items: [
      {
        what: {
          en: "Mon 6am Reformer",
          pt: "Seg 6h Reformer",
        },
        outcome: {
          en: "38% fill — decide this week",
          pt: "38% ocupação — decida esta semana",
        },
      },
      {
        what: { en: "Wed 12:30 Mat", pt: "Qua 12h30 Mat" },
        outcome: {
          en: "41% — A/B test reformat",
          pt: "41% — teste A/B mudar formato",
        },
      },
      {
        what: {
          en: "ClassPass net margin",
          pt: "ClassPass margem líquida",
        },
        outcome: {
          en: "−$1,401/mo — renegotiate or exit",
          pt: "−$1,401/mês — renegociar ou sair",
        },
      },
    ],
    deeper: {
      en: "+ heatmap & full ClassPass P&L below",
      pt: "+ heatmap & P&L completo do ClassPass abaixo",
    },
    anchor: "finding-03",
  },
];

// Per-finding step-by-step playbooks
const finding1Steps: Array<{ title: L; detail: L }> = [
  {
    title: { en: "Recover failed cards", pt: "Recuperar cartões falhados" },
    detail: {
      en:
        "Stripe dashboard → Failed payments → Re-charge the 12 cards expired ≤ 14 days. ~$8.2K recoverable in 7 days, zero conversation needed.",
      pt:
        "Painel Stripe → Pagamentos falhados → Re-cobrar os 12 cartões vencidos há ≤ 14 dias. ~$8.2K recuperáveis em 7 dias, sem conversa.",
    },
  },
  {
    title: {
      en: "Call (don't email) the 14 ghosts",
      pt: "Ligue (não emaile) para as 14 ghosts",
    },
    detail: {
      en:
        "Phone call confirms intent before next billing cycle. Script: 'Notei que você não veio em [X] semanas — tudo bem? Quer pausar ou seguir?' If 5 of 14 come back, +$1K/mo.",
      pt:
        "Ligação confirma intenção antes do próximo ciclo de cobrança. Script: 'Notei que você não veio em [X] semanas — tudo bem? Quer pausar ou seguir?' Se 5 das 14 voltarem, +$1K/mês.",
    },
  },
  {
    title: {
      en: "Win-back the 4 highest-tenure cancellers",
      pt: "Reconquistar as 4 canceladas com maior tenure",
    },
    detail: {
      en:
        "Andrea V. (14mo, cancelled 21d ago) and Carlos D. (cancelled 14d ago) come first. Personal message. No template, no discount on first contact — ask what didn't fit.",
      pt:
        "Andrea V. (14m, cancelou há 21d) e Carlos D. (há 14d) vêm primeiro. Mensagem pessoal. Sem template, sem desconto no primeiro contato — pergunte o que não encaixou.",
    },
  },
  {
    title: {
      en: "Extend credits before they expire",
      pt: "Estender créditos antes de vencer",
    },
    detail: {
      en:
        "32 unused packages. Auto-email at 12 days before expiry: 'Você tem 7 créditos vencendo. Quer estender 30 dias?' Reduces refund risk and re-engages dormant members.",
      pt:
        "32 pacotes não usados. Email automático 12 dias antes do vencimento: 'Você tem 7 créditos vencendo. Quer estender 30 dias?' Reduz risco de reembolso e reengaja alunas inativas.",
    },
  },
  {
    title: {
      en: "Tighten no-show policy",
      pt: "Apertar a política de no-show",
    },
    detail: {
      en:
        "47 no-shows + 18 late cancels per month. Charge $15 or lose the slot — your call. Whatever you pick, enforce within 30 days. Ambiguity is what makes this leak.",
      pt:
        "47 no-shows + 18 cancelamentos tardios por mês. Cobre $15 ou perca o horário — sua escolha. Decida e aplique em 30 dias. A ambiguidade é o que faz vazar.",
    },
  },
];

const finding2Steps: Array<{ title: L; detail: L }> = [
  {
    title: {
      en: "Talk to the top 3 face-to-face",
      pt: "Converse com as 3 do topo cara a cara",
    },
    detail: {
      en:
        "Megan A., Rafael T., Olivia W. Don't email — they're already paying you, the relationship can carry a direct conversation. 'Notei que você vem 4×/semana — quer testar o ilimitado por 30 dias?'",
      pt:
        "Megan A., Rafael T., Olivia W. Não emaile — elas já pagam, a relação aguenta conversa direta. 'Notei que você vem 4×/semana — quer testar o ilimitado por 30 dias?'",
    },
  },
  {
    title: {
      en: "Migrate the 18 over-users",
      pt: "Migre as 18 que usam acima do plano",
    },
    detail: {
      en:
        "These members are on plans below their actual usage — at risk of cancellation by frustration. Move them up before they leave. Frame as service, not upsell: 'Vi seu padrão — acho que o Unlimited te encaixa melhor.'",
      pt:
        "Estas alunas estão em planos abaixo do uso real — risco de cancelar por frustração. Mova antes que saiam. Enquadre como serviço, não upsell: 'Vi seu padrão — acho que o Ilimitado te encaixa melhor.'",
    },
  },
  {
    title: {
      en: "Formalize a VIP referral program",
      pt: "Formalize um programa de indicação VIP",
    },
    detail: {
      en:
        "Sara H. already refers high-value friends with no recognition. Build a tier: 1 month free for every 2 referrals who stay 60+ days. Costs you nothing if no one converts; locks in your best advocates if they do.",
      pt:
        "Sara H. já indica amigas de alto valor sem reconhecimento. Crie um tier: 1 mês grátis a cada 2 indicações que ficam 60+ dias. Não custa nada se ninguém converte; trava suas melhores advogadas se convertem.",
    },
  },
  {
    title: {
      en: "Anniversary upgrade campaign",
      pt: "Campanha de upgrade de aniversário",
    },
    detail: {
      en:
        "Bruno V. and 4 others hit tenure anniversaries in the next 60 days. Anniversary upgrade offers convert 40-60% in this segment. Personal note + bundled offer (e.g., 1 private + 1 retail item) outperforms a discount.",
      pt:
        "Bruno V. e mais 4 batem aniversário de tenure nos próximos 60 dias. Ofertas de upgrade de aniversário convertem 40-60% neste segmento. Bilhete pessoal + oferta combinada (ex: 1 particular + 1 item de retail) bate desconto.",
    },
  },
  {
    title: {
      en: "Down-sell the 6 under-users",
      pt: "Down-sell para as 6 que usam abaixo do plano",
    },
    detail: {
      en:
        "Counterintuitive: 6 members pay more than they use. Cancellation risk. Offer a smaller plan before they cancel. Keeping $89/mo beats losing $149/mo.",
      pt:
        "Contraintuitivo: 6 alunas pagam mais do que usam. Risco de cancelamento. Ofereça plano menor antes de cancelarem. Manter $89/mês bate perder $149/mês.",
    },
  },
];

const finding3Steps: Array<{ title: L; detail: L }> = [
  {
    title: {
      en: "Decide on the Mon 6am Reformer slot",
      pt: "Decida sobre o horário Seg 6h Reformer",
    },
    detail: {
      en:
        "38% fill rate, Júlia. Three options: (a) cancel and open 7am, (b) swap instructor, (c) reduce capacity from 8 to 6 reformers. No right answer — but deciding is the action. Sit with it for 48h, then commit.",
      pt:
        "38% de ocupação, Júlia. Três opções: (a) cancelar e abrir 7h, (b) trocar instrutor, (c) reduzir capacidade de 8 para 6 reformers. Não tem resposta certa — mas decidir é a ação. Pense por 48h e comprometa.",
    },
  },
  {
    title: {
      en: "Renegotiate ClassPass or exit",
      pt: "Renegocie ClassPass ou saia",
    },
    detail: {
      en:
        "You're losing $1.4K/mo at current rates. Negotiate a $24/visit minimum (your cost basis) or cancel the channel. ClassPass will counter — 'too high, average is $14' — hold firm or walk.",
      pt:
        "Você está perdendo $1.4K/mês nas taxas atuais. Negocie um mínimo de $24/visita (seu custo base) ou cancele o canal. ClassPass vai responder — 'alto demais, média é $14' — segure firme ou saia.",
    },
  },
  {
    title: {
      en: "If keeping ClassPass: restrict to off-peak",
      pt: "Se mantiver ClassPass: restrinja ao off-peak",
    },
    detail: {
      en:
        "Block ClassPass from 5pm–8pm slots where you're displacing paying members. Mornings and lunch slots are net positive — every off-peak ClassPass visit is found revenue.",
      pt:
        "Bloqueie ClassPass dos horários 17h–20h onde você desloca alunas pagantes. Manhãs e almoço são líquido positivo — toda visita ClassPass off-peak é receita encontrada.",
    },
  },
  {
    title: {
      en: "Reach out to the 6 ClassPass converters",
      pt: "Fale com as 6 conversíveis do ClassPass",
    },
    detail: {
      en:
        "These users would likely pay direct. Offer 10% off first month on a 3-month commit. Frame as upgrade ('priority booking, instructor of choice'), not as winning them away from ClassPass.",
      pt:
        "Estas usuárias provavelmente pagariam direto. Ofereça 10% off no primeiro mês com compromisso de 3 meses. Enquadre como upgrade ('reserva prioritária, instrutor de escolha'), não como tirar do ClassPass.",
    },
  },
  {
    title: {
      en: "A/B test the Wed 12:30 slot",
      pt: "Teste A/B o horário Qua 12h30",
    },
    detail: {
      en:
        "41% fill, Mat format with Marina. Same instructor, same time, different format. Test 4 weeks of Reformer instead of Mat. If fill > 60%, switch permanently.",
      pt:
        "41% de ocupação, formato Mat com Marina. Mesma instrutora, mesmo horário, formato diferente. Teste 4 semanas de Reformer no lugar do Mat. Se ocupação > 60%, troque permanente.",
    },
  },
];

// Benchmark cohort — independent boutique pilates studios on Mindbody (US, 200-400 members)
const benchmark: Array<{
  metric: L;
  you: string;
  cohort: string;
  verdict: "better" | "below";
  takeaway: L;
}> = [
  {
    metric: { en: "90-day churn rate", pt: "Churn de 90 dias" },
    you: "8.1%",
    cohort: "11.0%",
    verdict: "better",
    takeaway: {
      en: "Your members stick — the studio experience works.",
      pt: "Suas alunas ficam — a experiência do studio funciona.",
    },
  },
  {
    metric: { en: "Avg slot fill rate", pt: "Ocupação média" },
    you: "62%",
    cohort: "68%",
    verdict: "below",
    takeaway: {
      en: "Below profitability floor (70%). Schedule is the lever.",
      pt: "Abaixo do piso de rentabilidade (70%). A agenda é a alavanca.",
    },
  },
  {
    metric: { en: "ClassPass net margin", pt: "Margem líquida ClassPass" },
    you: "−$1,401/mo",
    cohort: "−$820/mo",
    verdict: "below",
    takeaway: {
      en:
        "Worse than median because your cost basis (reformer + instructor) is high.",
      pt:
        "Pior que a mediana porque seu custo base (reformer + instrutor) é alto.",
    },
  },
  {
    metric: {
      en: "Failed payment recovery",
      pt: "Recuperação de pagamentos falhados",
    },
    you: "0%",
    cohort: "35%",
    verdict: "below",
    takeaway: {
      en: "No recovery process running. Easiest line item to fix this month.",
      pt: "Sem processo de recuperação rodando. Item mais fácil de corrigir este mês.",
    },
  },
  {
    metric: {
      en: "Avg revenue per active member",
      pt: "Receita média por aluna ativa",
    },
    you: "$165/mo",
    cohort: "$148/mo",
    verdict: "better",
    takeaway: {
      en: "Your pricing is healthy. Don't discount to grow — fix retention.",
      pt: "Seu pricing está saudável. Não dê desconto para crescer — corrija retenção.",
    },
  },
];

// Action plans for each "Below" benchmark metric — closes the loop on flagged gaps
const closingTheGaps: Array<{
  metric: L;
  gap: L;
  accent: string;
  steps: Array<{ title: L; detail: L }>;
}> = [
  {
    metric: {
      en: "Failed payment recovery",
      pt: "Recuperação de pagamentos falhados",
    },
    gap: {
      en: "You're at 0%, cohort at 35%. Easiest line item to fix this month.",
      pt:
        "Você está em 0%, grupo em 35%. Item mais fácil de corrigir este mês.",
    },
    accent: "text-red-700",
    steps: [
      {
        title: {
          en: "Pull the failed payments report",
          pt: "Puxe o relatório de pagamentos falhados",
        },
        detail: {
          en:
            "Stripe dashboard → Payments → Failed. Filter last 90 days. ~15 minutes. Do this today.",
          pt:
            "Painel Stripe → Pagamentos → Falhados. Filtre últimos 90 dias. ~15 minutos. Faça hoje.",
        },
      },
      {
        title: {
          en: "Re-charge the 12 cards manually",
          pt: "Re-cobrar os 12 cartões manualmente",
        },
        detail: {
          en:
            "Use Stripe's card-on-file API or manual re-charge for the 8 cards expired ≤14 days. This week. About $8.2K recoverable, no conversation needed.",
          pt:
            "Use a API card-on-file do Stripe ou re-cobrança manual para os 8 cartões vencidos há ≤14 dias. Esta semana. Cerca de $8.2K recuperáveis, sem conversa.",
        },
      },
      {
        title: {
          en: "Enable Stripe Smart Retries",
          pt: "Ative o Stripe Smart Retries",
        },
        detail: {
          en:
            "Set-and-forget — automatically retries failed cards on the optimal day of the week. Brings baseline recovery to 35-50%, matching cohort median without further effort.",
          pt:
            "Configure e esqueça — re-tenta automaticamente cartões falhados no melhor dia da semana. Leva a recuperação baseline para 35-50%, igualando a mediana do grupo sem esforço extra.",
        },
      },
    ],
  },
  {
    metric: { en: "Slot fill rate", pt: "Ocupação por horário" },
    gap: {
      en: "You're at 62%, cohort at 68%. Below the 70% profitability floor.",
      pt:
        "Você está em 62%, grupo em 68%. Abaixo do piso de 70% de rentabilidade.",
    },
    accent: "text-amber-700",
    steps: [
      {
        title: {
          en: "Decide on the 3 worst slots",
          pt: "Decida sobre os 3 piores horários",
        },
        detail: {
          en:
            "Mon 6am Reformer (38% fill), Wed 12:30 Mat (41%), Fri 5:30 Reformer (47%). Three options each: cancel, swap instructor, change format. Status quo is not an option.",
          pt:
            "Seg 6h Reformer (38% ocupação), Qua 12h30 Mat (41%), Sex 17h30 Reformer (47%). Três opções para cada: cancelar, trocar instrutor, mudar formato. Status quo não é opção.",
        },
      },
      {
        title: {
          en: "Run a 30-day Reformer-only test",
          pt: "Rode um teste de 30 dias só Reformer",
        },
        detail: {
          en:
            "If fill rate jumps when low-performing Mat slots are removed, you have your answer. Reversible — no permanent commitment.",
          pt:
            "Se a ocupação subir quando os horários de Mat de baixa performance saírem, você tem a resposta. Reversível — sem compromisso permanente.",
        },
      },
      {
        title: {
          en: "Freeze new slot additions until you hit 70%",
          pt: "Congele novos horários até bater 70%",
        },
        detail: {
          en:
            "Adding capacity to a low-fill schedule makes the average worse, not better. Fix what you already have before opening new slots.",
          pt:
            "Adicionar capacidade a uma agenda com baixa ocupação piora a média, não melhora. Conserte o que você já tem antes de abrir horários novos.",
        },
      },
    ],
  },
  {
    metric: { en: "ClassPass net margin", pt: "Margem líquida ClassPass" },
    gap: {
      en:
        "You're at −$1,401/mo, cohort at −$820/mo. Worse than median because your cost basis is high.",
      pt:
        "Você está em −$1,401/mês, grupo em −$820/mês. Pior que a mediana porque seu custo base é alto.",
    },
    accent: "text-orange-700",
    steps: [
      {
        title: {
          en: "Confirm the per-visit P&L",
          pt: "Confirme o P&L por visita",
        },
        detail: {
          en:
            "Re-run instructor + reformer rateio cost basis with last 90 days of actuals. ClassPass will challenge your numbers in negotiation — have them tight.",
          pt:
            "Refaça o cálculo de custo instrutor + rateio do reformer com os últimos 90 dias reais. O ClassPass vai contestar seus números na negociação — tenha tudo apertado.",
        },
      },
      {
        title: {
          en: "Negotiate a $24/visit minimum",
          pt: "Negocie um mínimo de $24/visita",
        },
        detail: {
          en:
            "ClassPass will counter with averages ('most studios accept $14'). Hold firm. The credible threat of exit is your leverage; bring the P&L to the call.",
          pt:
            "O ClassPass vai responder com médias ('a maioria dos studios aceita $14'). Mantenha firme. A ameaça crível de sair é sua alavanca; leve o P&L para a call.",
        },
      },
      {
        title: {
          en: "If they refuse: restrict to off-peak only",
          pt: "Se recusarem: restrinja só ao off-peak",
        },
        detail: {
          en:
            "Block ClassPass from 5–8pm slots where you displace paying members. Mornings and lunch hours are net positive. Cancellation is the last resort, not the first.",
          pt:
            "Bloqueie ClassPass dos horários 17h–20h onde você desloca alunas pagantes. Manhãs e horário do almoço são líquido positivo. Cancelar é último recurso, não primeiro.",
        },
      },
    ],
  },
];

const methodology: {
  period: L;
  source: L;
  records: Array<{ label: L; value: string }>;
  crossReferences: L[];
  limitations: L[];
} = {
  period: {
    en: "Feb 1 – Apr 30, 2026 (90 days)",
    pt: "1 Fev – 30 Abr 2026 (90 dias)",
  },
  source: {
    en: "Mindbody CSV export — members, attendance, transactions, refunds",
    pt: "Export CSV do Mindbody — alunas, presença, transações, reembolsos",
  },
  records: [
    {
      label: { en: "Active members analyzed", pt: "Alunas ativas analisadas" },
      value: "234",
    },
    {
      label: { en: "Attendance records", pt: "Registros de presença" },
      value: "2,108",
    },
    {
      label: { en: "Transactions", pt: "Transações" },
      value: "156",
    },
    {
      label: { en: "ClassPass visits", pt: "Visitas ClassPass" },
      value: "87",
    },
    {
      label: { en: "Refunds + chargebacks", pt: "Reembolsos + chargebacks" },
      value: "9",
    },
  ],
  crossReferences: [
    {
      en:
        "Member tenure × attendance frequency × plan tier (to surface plan misalignment)",
      pt:
        "Tenure × frequência × tier do plano (para revelar desalinhamento de plano)",
    },
    {
      en:
        "Failed payment patterns × tenure × time-to-resolve (to estimate recovery rate)",
      pt:
        "Padrões de pagamento falhado × tenure × tempo de resolução (para estimar taxa de recuperação)",
    },
    {
      en:
        "Slot fill rate × instructor × day/time (to isolate schedule vs. instructor effects)",
      pt:
        "Ocupação × instrutor × dia/horário (para isolar efeitos de agenda vs. instrutor)",
    },
    {
      en:
        "ClassPass per-visit gross × estimated cost basis (instructor + reformer rateio)",
      pt:
        "Bruto ClassPass por visita × custo base estimado (instrutor + rateio reformer)",
    },
  ],
  limitations: [
    {
      en:
        "ClassPass cost basis uses estimated instructor + reformer rateio — Mindbody doesn't expose direct cost allocation per visit. Numbers are directional within ±15%.",
      pt:
        "O custo base do ClassPass usa estimativa de instrutor + rateio reformer — Mindbody não expõe alocação direta de custo por visita. Os números são direcionais dentro de ±15%.",
    },
    {
      en:
        "\"Hidden spenders\" upside assumes 60% conversion on offer — actual conversion varies by relationship quality.",
      pt:
        "O upside dos \"Hidden spenders\" assume 60% de conversão na oferta — conversão real varia pela qualidade da relação.",
    },
    {
      en:
        "Recoverable amounts assume action within 30 days; recovery rate decays roughly 15% per additional week of delay.",
      pt:
        "Valores recuperáveis assumem ação em 30 dias; a taxa de recuperação cai cerca de 15% por semana adicional de atraso.",
    },
    {
      en:
        "Cohort benchmarks are anchored on a sample of 47 independent boutique pilates studios (200-400 members) on Mindbody, US, sampled 2025-2026.",
      pt:
        "Os benchmarks do grupo são ancorados em uma amostra de 47 studios pilates boutique independentes (200-400 alunas) no Mindbody, EUA, amostrados em 2025-2026.",
    },
  ],
};

const planWeeks: Array<{ label: L; range: L; title: L; detail: L }> = [
  {
    label: { en: "Week 1", pt: "Semana 1" },
    range: { en: "Apr 28 – May 4", pt: "28 Abr – 4 Mai" },
    title: { en: "The five members above", pt: "As cinco alunas acima" },
    detail: {
      en: "Reach out to each. Track responses. Nothing else this week.",
      pt: "Fale com cada uma. Acompanhe as respostas. Nada mais esta semana.",
    },
  },
  {
    label: { en: "Week 2", pt: "Semana 2" },
    range: { en: "May 5 – May 11", pt: "5 Mai – 11 Mai" },
    title: {
      en: "Failed payments + win-back batch",
      pt: "Pagamentos falhados + lote de reconquista",
    },
    detail: {
      en:
        "Re-charge the 12 failed cards. Call 4 of the 8 cancelled in the last 60 days.",
      pt:
        "Re-cobrar os 12 cartões falhados. Ligar para 4 das 8 canceladas nos últimos 60 dias.",
    },
  },
  {
    label: { en: "Week 3", pt: "Semana 3" },
    range: { en: "May 12 – May 18", pt: "12 Mai – 18 Mai" },
    title: {
      en: "Hidden Spenders — top 6",
      pt: "Hidden Spenders — top 6",
    },
    detail: {
      en: "One offer at a time. Test what lands; don't blast.",
      pt: "Uma oferta por vez. Teste o que pega; não dispare em massa.",
    },
  },
  {
    label: { en: "Week 4", pt: "Semana 4" },
    range: { en: "May 19 – May 25", pt: "19 Mai – 25 Mai" },
    title: {
      en: "Schedule decision + 30-day call",
      pt: "Decisão de agenda + call de 30 dias",
    },
    detail: {
      en:
        "Decide the 6am Monday slot. Upload fresh CSV. Call with Ana to plan Q3.",
      pt:
        "Decida o horário das 6h de segunda. Suba CSV novo. Call com Ana para planejar o Q3.",
    },
  },
];

const tocItems: Array<{
  id: string;
  label: L;
  secondary: L;
  number: string;
  group: "actions" | "context";
  accent?: string;
}> = [
  {
    id: "summary",
    label: { en: "Where to start", pt: "Por onde começar" },
    secondary: { en: "1 min overview", pt: "1 min de overview" },
    number: "—",
    group: "actions",
  },
  {
    id: "this-week",
    label: { en: "This week", pt: "Esta semana" },
    secondary: { en: "5 members to call", pt: "5 alunas para falar" },
    number: "00",
    group: "actions",
    accent: "text-stone-900",
  },
  {
    id: "finding-01",
    label: { en: "Money slipping", pt: "Dinheiro escapando" },
    secondary: { en: "$33,000/yr", pt: "$33,000/ano" },
    number: "01",
    group: "actions",
    accent: "text-red-700",
  },
  {
    id: "finding-02",
    label: { en: "Under-charging", pt: "Cobrando de menos" },
    secondary: { en: "$14,000/yr", pt: "$14,000/ano" },
    number: "02",
    group: "actions",
    accent: "text-emerald-700",
  },
  {
    id: "finding-03",
    label: { en: "Empty slots & ClassPass", pt: "Aulas vazias & ClassPass" },
    secondary: { en: "$5,400/yr", pt: "$5,400/ano" },
    number: "03",
    group: "actions",
    accent: "text-orange-700",
  },
  {
    id: "plan",
    label: { en: "30-day plan", pt: "Plano de 30 dias" },
    secondary: { en: "Week-by-week", pt: "Semana a semana" },
    number: "—",
    group: "context",
  },
  {
    id: "benchmark",
    label: { en: "How you compare", pt: "Como você se compara" },
    secondary: { en: "vs 47 studios", pt: "vs 47 studios" },
    number: "—",
    group: "context",
  },
  {
    id: "methodology",
    label: { en: "Methodology", pt: "Metodologia" },
    secondary: { en: "90 days · Mindbody", pt: "90 dias · Mindbody" },
    number: "—",
    group: "context",
  },
  {
    id: "next",
    label: { en: "Next Radar", pt: "Próximo Radar" },
    secondary: { en: "Aug 4, 2026", pt: "4 Ago 2026" },
    number: "—",
    group: "context",
  },
];

const severityDot: Record<"critical" | "high" | "medium" | "low", string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-gray-400",
};

function heatmapStyle(value: number): { bg: string; border: string; text: string } {
  if (value < 0)
    return {
      bg: "bg-transparent",
      border: "border border-dashed border-stone-200",
      text: "text-transparent",
    };
  if (value < 30) return { bg: "bg-rose-300", border: "", text: "text-rose-950" };
  if (value < 50) return { bg: "bg-orange-200", border: "", text: "text-orange-900" };
  if (value < 70) return { bg: "bg-amber-100", border: "", text: "text-amber-900" };
  if (value < 85) return { bg: "bg-emerald-200", border: "", text: "text-emerald-900" };
  return { bg: "bg-emerald-400", border: "", text: "text-emerald-950" };
}

// ===========================================================================
// MAIN PAGE
// ===========================================================================

export default function AuditTokenPage({ params }: PageProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { token } = use(params);

  const [locale, setLocale] = useState<Locale>("en");
  const [contacted, setContacted] = useState<Record<string, boolean>>({});

  const toggleContacted = (id: string) => {
    setContacted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <LocaleContext.Provider value={locale}>
      <div className="min-h-screen bg-slate-50 text-stone-900">
        <BrandBar locale={locale} setLocale={setLocale} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:flex lg:gap-12 lg:justify-between">
          <article className="flex-1 min-w-0 lg:max-w-4xl">
            <section id="cover">
              <Cover />
            </section>
            <Divider />
            <section id="summary" className="scroll-mt-8">
              <ExecutiveSummary />
            </section>
            <Divider />
            <section id="this-week" className="scroll-mt-8">
              <ThisWeekIsland contacted={contacted} toggleContacted={toggleContacted} />
            </section>
            <Divider />
            <section id="finding-01" className="scroll-mt-8">
              <Finding1 />
            </section>
            <Divider />
            <section id="finding-02" className="scroll-mt-8">
              <Finding2 />
            </section>
            <Divider />
            <section id="finding-03" className="scroll-mt-8">
              <Finding3 />
            </section>
            <Divider />
            <section id="plan" className="scroll-mt-8">
              <ThirtyDayPlan />
            </section>
            <Divider />
            <section id="benchmark" className="scroll-mt-8">
              <Benchmark />
            </section>
            <Divider />
            <section id="methodology" className="scroll-mt-8">
              <Methodology />
            </section>
            <Divider />
            <section id="next" className="scroll-mt-8">
              <Closer />
            </section>
          </article>

          <TOCRail />
        </div>
      </div>
    </LocaleContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// TOC RAIL — desktop sticky table of contents
// ---------------------------------------------------------------------------

function TOCRail() {
  const locale = useLocale();
  const actionItems = tocItems.filter((t) => t.group === "actions");
  const contextItems = tocItems.filter((t) => t.group === "context");

  return (
    <aside className="hidden lg:block lg:w-60 lg:shrink-0">
      <div className="sticky top-8 space-y-7">
        {/* HEADLINE — total recoverable */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">
            {T.toc.totalRecoverable[locale]}
          </p>
          <p className="font-serif text-3xl font-semibold text-stone-900 tabular-nums leading-none">
            {fmtUSD(stats.totalRecoverableAnnual)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-stone-500 mt-1">
            {T.toc.perYear[locale]}
          </p>
        </div>

        {/* ACTIONS — primary nav with $ + accent */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-3">
            {T.toc.actions[locale]}
          </p>
          <nav className="space-y-3">
            {actionItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group block hover:bg-stone-50 -mx-2 px-2 py-1 rounded transition-colors"
              >
                <div className="flex items-baseline gap-2.5">
                  <span
                    className={`text-[11px] font-bold tabular-nums shrink-0 w-5 ${
                      item.accent ?? "text-stone-500"
                    }`}
                  >
                    {item.number}
                  </span>
                  <span className="text-sm font-semibold text-stone-900 leading-tight flex-1 min-w-0">
                    {item.label[locale]}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 tabular-nums ml-7 mt-0.5">
                  {item.secondary[locale]}
                </p>
              </a>
            ))}
          </nav>
        </div>

        {/* CONTEXT — secondary nav, less weight */}
        <div className="pt-5 border-t border-stone-200">
          <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-3">
            {T.toc.context[locale]}
          </p>
          <nav className="space-y-2">
            {contextItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group flex items-baseline justify-between gap-3 text-xs hover:text-stone-900 transition-colors"
              >
                <span className="text-stone-700 group-hover:text-stone-900 leading-tight">
                  {item.label[locale]}
                </span>
                <span className="text-[10px] text-stone-500 shrink-0 tabular-nums">
                  {item.secondary[locale]}
                </span>
              </a>
            ))}
          </nav>
        </div>

        {/* META — refresh + next review, compact */}
        <div className="pt-5 border-t border-stone-200 space-y-2.5">
          <div className="flex items-baseline justify-between text-[10px]">
            <span className="uppercase tracking-wider text-stone-500 font-medium">
              {T.toc.refreshed[locale]}
            </span>
            <span className="text-stone-700 tabular-nums">
              {studio.lastRefreshedAt[locale]}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-[10px]">
            <span className="uppercase tracking-wider text-stone-500 font-medium">
              {T.toc.nextReview[locale]}
            </span>
            <span className="text-stone-700 tabular-nums">
              {studio.nextReviewDate[locale]}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ===========================================================================
// COMPONENTS
// ===========================================================================

function BrandBar({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/flexiwell-logo.svg"
            alt="FlexiWell"
            width={104}
            height={23}
            priority
          />
          <span aria-hidden className="h-4 w-px bg-stone-300" />
          <span className="text-sm font-medium text-stone-600 tracking-wide">
            Radar
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-500">
            <RefreshCwIcon className="w-3 h-3" />
            <span>
              {T.brand.refreshed[locale]} {studio.lastRefreshedAt[locale]}
            </span>
          </div>
          {/* Segmented language toggle */}
          <div
            role="group"
            aria-label="Language"
            className="inline-flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200"
          >
            {(["en", "pt"] as const).map((l) => {
              const isActive = locale === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  aria-pressed={isActive}
                  aria-label={
                    l === "en" ? "Switch to English" : "Mudar para português"
                  }
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-md transition-all ${
                    isActive
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {l === "en" ? "EN" : "PT"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

function Divider() {
  return <hr className="my-12 sm:my-16 border-t border-stone-200" />;
}

// ---------------------------------------------------------------------------
// COVER — editorial hero
// ---------------------------------------------------------------------------

function Cover() {
  const locale = useLocale();
  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500 mb-6">
        FlexiWell Radar · {studio.reportMonth[locale]} · {studio.name}
      </p>

      <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-stone-900 leading-[1.05] tracking-tight">
        {studio.ownerFirstName}
        {T.cover.headlinePre[locale]}
        <span className="text-red-700 tabular-nums whitespace-nowrap">
          {fmtUSD(stats.totalRecoverableAnnual)}
        </span>
        {T.cover.headlinePost[locale]}
      </h1>

      <div className="mt-8 space-y-5 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        <p>
          {T.cover.lead1Pre[locale]}
          <span className="font-semibold text-stone-900 tabular-nums">
            {fmtUSD(stats.totalRecoverableMonthly)}
          </span>
          {T.cover.lead1Post[locale]}
        </p>
        <p>
          {T.cover.lead2Pre[locale]}
          <span className="font-semibold text-stone-900 tabular-nums">
            {stats.activeMembers}
          </span>
          {T.cover.lead2A[locale]}
          <span className="font-semibold text-stone-900 tabular-nums">
            {stats.attendanceRecords.toLocaleString()}
          </span>
          {T.cover.lead2B[locale]}
          <span className="font-semibold text-stone-900 tabular-nums">
            {stats.transactions}
          </span>
          {T.cover.lead2C[locale]}
          <span className="font-semibold text-stone-900 tabular-nums">
            {stats.classPassVisits}
          </span>
          {T.cover.lead2D[locale]}
        </p>
      </div>

      {/* Breakdown bar — visual island */}
      <div className="mt-10">
        <div className="flex items-center w-full h-2.5 rounded-full overflow-hidden bg-stone-100">
          {heroBreakdown.map((seg, i) => (
            <div
              key={seg.name.en}
              className="h-full"
              style={{
                width: `${(seg.value / stats.totalRecoverableAnnual) * 100}%`,
                background: seg.color,
                marginLeft: i > 0 ? 2 : 0,
              }}
              title={`${seg.name[locale]}: ${fmtUSD(seg.value)}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 mt-4">
          {heroBreakdown.map((seg, idx) => (
            <div key={seg.name.en} className="flex items-baseline gap-2.5">
              <span className="text-xs tabular-nums text-stone-500 font-medium">
                0{idx + 1}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                style={{ background: seg.color }}
              />
              <div className="min-w-0">
                <p className="text-sm text-stone-600">{seg.name[locale]}</p>
                <p className="text-base font-semibold text-stone-900 tabular-nums">
                  {fmtUSD(seg.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// THIS WEEK — interactive island (only place state lives)
// ---------------------------------------------------------------------------

function ThisWeekIsland({
  contacted,
  toggleContacted,
}: {
  contacted: Record<string, boolean>;
  toggleContacted: (id: string) => void;
}) {
  const locale = useLocale();
  const contactedCount = Object.values(contacted).filter(Boolean).length;
  const criticalCount = thisWeek.filter((m) => m.severity === "critical").length;

  return (
    <section>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
        {T.thisWeek.h2[locale]}
      </h2>
      <p className="mt-4 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        {T.thisWeek.lead[locale]}
      </p>

      <div className="mt-8 bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
          <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">
            <span className="tabular-nums">{contactedCount}</span>{" "}
            {T.thisWeek.ofContacted[locale]}{" "}
            <span className="tabular-nums">{thisWeek.length}</span>{" "}
            {T.thisWeek.contacted[locale]}
          </p>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 tabular-nums">
            {criticalCount} {T.thisWeek.criticalSuffix[locale]}
          </span>
        </div>
        <div className="divide-y divide-stone-100">
          {thisWeek.map((m) => {
            const isContacted = !!contacted[m.id];
            return (
              <div
                key={m.id}
                className={`px-5 sm:px-6 py-4 transition-colors ${
                  isContacted ? "bg-emerald-50/40" : "hover:bg-stone-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleContacted(m.id)}
                    aria-label={
                      isContacted
                        ? T.thisWeek.markAsNotContacted[locale]
                        : T.thisWeek.markAsContacted[locale]
                    }
                    className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isContacted
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-stone-300 hover:border-primary-500"
                    }`}
                  >
                    {isContacted && (
                      <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${severityDot[m.severity]}`}
                      />
                      <h3 className="font-semibold text-stone-900">{m.name}</h3>
                      <span className="text-xs text-stone-500 tabular-nums">
                        {m.daysSinceLastClass}
                        {T.thisWeek.daysSinceLastClass[locale]}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mb-2 flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {m.riskReason[locale]}
                    </p>
                    <p className="text-sm text-stone-800 leading-[1.7]">
                      {m.suggestedAction[locale]}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleContacted(m.id)}
                    className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isContacted
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-stone-900 text-white hover:bg-stone-800"
                    }`}
                  >
                    {isContacted ? T.thisWeek.done[locale] : T.thisWeek.markDone[locale]}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FINDING 1 — Money slipping through
// ---------------------------------------------------------------------------

function Finding1() {
  const locale = useLocale();
  const leaks: Array<{
    title: L;
    amount: string;
    label: L;
    problem: L;
    cases: MemberCase[];
    casesMore?: number;
    actions: Action[];
    decay: L;
    accent: string;
  }> = [
    {
      title: { en: "Failed payments", pt: "Pagamentos falhados" },
      amount: `${fmtUSD(slipping.failedPayments.recoverable)} ${T.finding.perYear[locale]}`,
      label: T.finding.recoverable,
      problem: {
        en: "12 cards quietly declined in the last 90 days. Mindbody's Autopay Detail report has a documented bug where some declined direct debits display as 'successful' — meaning you may not know these payments failed. Total unpaid: $9,420.",
        pt: "12 cartões falharam silenciosamente nos últimos 90 dias. O relatório Autopay Detail do Mindbody tem um bug documentado: alguns débitos rejeitados aparecem como 'bem-sucedidos' — ou seja, você pode não saber que falharam. Total não pago: $9,420.",
      },
      cases: [
        { name: "Diana R.", detail: { en: "Card expired 8d ago · $199/mo plan", pt: "Cartão venceu há 8d · plano $199/mês" } },
        { name: "Mike T.", detail: { en: "Declined 14d ago, no retry · $149/mo", pt: "Recusado há 14d, sem retry · $149/mês" } },
        { name: "Priya N.", detail: { en: "Chargeback 22d ago · $89/mo", pt: "Chargeback há 22d · $89/mês" } },
        { name: "James B.", detail: { en: "Card expired 12d ago · $199/mo", pt: "Cartão venceu há 12d · $199/mês" } },
        { name: "Sofia M.", detail: { en: "Declined 7d ago, insufficient funds · $129/mo", pt: "Recusado há 7d, saldo insuficiente · $129/mês" } },
        { name: "Kevin O.", detail: { en: "Chargeback 18d ago · $179/mo", pt: "Chargeback há 18d · $179/mês" } },
        { name: "Rachel L.", detail: { en: "Card expired 4d ago · $149/mo", pt: "Cartão venceu há 4d · $149/mês" } },
        { name: "Daniel P.", detail: { en: "Declined 21d ago · $99/mo", pt: "Recusado há 21d · $99/mês" } },
        { name: "Aisha K.", detail: { en: "Card expired 9d ago · $199/mo", pt: "Cartão venceu há 9d · $199/mês" } },
        { name: "Tom W.", detail: { en: "Declined 11d ago · $129/mo", pt: "Recusado há 11d · $129/mês" } },
        { name: "Mariana C.", detail: { en: "Chargeback 25d ago · $179/mo", pt: "Chargeback há 25d · $179/mês" } },
        { name: "Brian S.", detail: { en: "Card expired 6d ago · $99/mo", pt: "Cartão venceu há 6d · $99/mês" } },
      ],
      actions: [
        {
          urgency: "today",
          type: "system",
          en: "Open Stripe dashboard → Failed Payments → filter last 90 days",
          pt: "Abra o painel Stripe → Pagamentos Falhados → filtre últimos 90 dias",
        },
        {
          urgency: "this-week",
          type: "payment",
          en: "Re-charge the 8 cards expired ≤14 days (~$1,600 typically clears)",
          pt: "Re-cobre os 8 cartões vencidos há ≤14 dias (~$1,600 tipicamente compensam)",
        },
        {
          urgency: "this-week",
          type: "outreach",
          en: "Call or email the 4 cards that declined for non-expiration reasons",
          pt: "Ligue ou envie email para os 4 cartões que falharam por motivo que não vencimento",
        },
        {
          urgency: "ongoing",
          type: "system",
          en: "Enable Stripe Smart Retries to prevent future silent failures",
          pt: "Ative Stripe Smart Retries pra prevenir falhas silenciosas futuras",
        },
      ],
      decay: {
        en: "Recovery rate decays ~15% per week of delay. Act this week.",
        pt: "Taxa de recuperação cai ~15% por semana de atraso. Aja esta semana.",
      },
      accent: "border-l-red-400",
    },
    {
      title: { en: "Ghost members", pt: "Ghost members" },
      amount: `${fmtUSD(slipping.ghosts.monthlyAtRisk)} ${T.finding.perMonth[locale]}`,
      label: T.finding.atRisk,
      problem: {
        en: "14 members are paying autopay but haven't visited in 30+ days. The longer they stay invisible, the harder they are to retain — pilates members who skip 30+ days have ~3× higher cancellation risk than active ones. Mindbody's Retention Management report has the raw data but doesn't filter for 'paying-and-not-visiting.'",
        pt: "14 alunas pagam autopay mas não aparecem há 30+ dias. Quanto mais invisíveis, mais difíceis de reter — alunas que pulam 30+ dias têm ~3× mais risco de cancelar. O relatório Retention Management do Mindbody tem os dados mas não filtra 'paga-e-não-vem'.",
      },
      cases: [
        { name: "Karen P.", detail: { en: "32d no visit · was 2×/wk", pt: "32d sem visita · vinha 2×/sem" } },
        { name: "Roberto S.", detail: { en: "41d no visit · was 3×/wk", pt: "41d sem visita · vinha 3×/sem" } },
        { name: "Lin H.", detail: { en: "38d no visit · prefers instructor Marina", pt: "38d sem visita · prefere instrutora Marina" } },
        { name: "Patricia G.", detail: { en: "35d no visit · was 2×/wk evenings", pt: "35d sem visita · vinha 2×/sem à noite" } },
        { name: "Mark D.", detail: { en: "47d no visit · was inconsistent", pt: "47d sem visita · era inconsistente" } },
        { name: "Cassia M.", detail: { en: "33d no visit · stopped after holidays", pt: "33d sem visita · parou pós-feriados" } },
        { name: "Nigel R.", detail: { en: "40d no visit · last visit was a private", pt: "40d sem visita · última foi particular" } },
        { name: "Elena V.", detail: { en: "36d no visit · came Sat mornings only", pt: "36d sem visita · vinha sábados de manhã" } },
        { name: "Felipe T.", detail: { en: "45d no visit · 3 booked-not-attended before going dark", pt: "45d sem visita · 3 reservas-sem-presença antes de sumir" } },
        { name: "Hannah B.", detail: { en: "42d no visit · was 5×/wk regular", pt: "42d sem visita · era regular 5×/sem" } },
        { name: "Yusuf O.", detail: { en: "30d no visit (just hit threshold)", pt: "30d sem visita (acabou de bater threshold)" } },
        { name: "Camila P.", detail: { en: "39d no visit · prefers instructor Júlia", pt: "39d sem visita · prefere instrutora Júlia" } },
        { name: "Reza N.", detail: { en: "34d no visit · joined 6mo ago", pt: "34d sem visita · entrou há 6 meses" } },
        { name: "Stephanie A.", detail: { en: "50d no visit · oldest in this list", pt: "50d sem visita · mais antiga da lista" } },
      ],
      actions: [
        {
          urgency: "this-week",
          type: "call",
          en: "Phone call (not email) before next billing cycle — confirm intent",
          pt: "Ligação (não email) antes do próximo ciclo de cobrança — confirme intenção",
        },
        {
          urgency: "this-week",
          type: "call",
          en: "Use script: 'Notei que você não veio em [X] semanas — tudo bem? Quer pausar ou seguir?'",
          pt: "Use script: 'Notei que você não veio em [X] semanas — tudo bem? Quer pausar ou seguir?'",
        },
        {
          urgency: "ongoing",
          type: "talk",
          en: "If they want to pause: offer freeze instead of cancel (retention beats reactivation)",
          pt: "Se quiserem pausar: ofereça congelar em vez de cancelar (reter é mais fácil que reativar)",
        },
        {
          urgency: "ongoing",
          type: "system",
          en: "Track who returns — typically 5 of 14 reactivate after a check-in call",
          pt: "Acompanhe quem volta — tipicamente 5 das 14 reativam após uma ligação",
        },
      ],
      decay: {
        en: "Past 60 days inactive, recovery drops to ~20%. The 30–60d window is the action zone.",
        pt: "Após 60 dias inativas, recuperação cai pra ~20%. A janela 30–60d é a zona de ação.",
      },
      accent: "border-l-amber-400",
    },
    {
      title: {
        en: "Win-back candidates",
        pt: "Candidatas de reconquista",
      },
      amount: `${fmtUSD(slipping.winBack.recoverable)} ${T.finding.perYear[locale]}`,
      label: T.finding.recoverable,
      problem: {
        en: "8 members cancelled in the last 60 days. Pilates win-back rates are typically 25–35% if you reach out personally within 30 days — but drop below 10% after 90 days. Most cancellations aren't about you; they're life events (move, injury, schedule change) that resolve.",
        pt: "8 alunas cancelaram nos últimos 60 dias. Taxas de reconquista no pilates são tipicamente 25–35% se você falar pessoalmente em 30 dias — caem pra <10% após 90 dias. A maioria dos cancelamentos não é sobre você; são eventos de vida (mudança, lesão, agenda) que se resolvem.",
      },
      cases: [
        { name: "Andrea V.", detail: { en: "21d ago · 14mo tenure — TOP PRIORITY", pt: "há 21d · 14m de tenure — PRIORIDADE MÁXIMA" } },
        { name: "Carlos D.", detail: { en: "14d ago · never gave reason", pt: "há 14d · não deu motivo" } },
        { name: "Lisa F.", detail: { en: "28d ago · cited 'time'", pt: "há 28d · alegou 'tempo'" } },
        { name: "Fernando A.", detail: { en: "17d ago · cited price", pt: "há 17d · alegou preço" } },
        { name: "Miriam K.", detail: { en: "35d ago · joined competing gym", pt: "há 35d · entrou em academia concorrente" } },
        { name: "Ravi P.", detail: { en: "22d ago · no reason given", pt: "há 22d · sem motivo" } },
        { name: "Claire S.", detail: { en: "41d ago · moved further away", pt: "há 41d · mudou pra mais longe" } },
        { name: "Gabriel M.", detail: { en: "9d ago · cited injury", pt: "há 9d · alegou lesão" } },
      ],
      actions: [
        {
          urgency: "this-week",
          type: "outreach",
          en: "Personal message to top 4 by tenure — no template, no upfront discount",
          pt: "Mensagem pessoal para top 4 por tenure — sem template, sem desconto upfront",
        },
        {
          urgency: "this-week",
          type: "talk",
          en: "Open with: 'I noticed you cancelled — can I ask what didn't fit?' Listen first.",
          pt: "Abra com: 'Vi que você cancelou — posso perguntar o que não encaixou?' Ouça primeiro.",
        },
        {
          urgency: "ongoing",
          type: "talk",
          en: "Only offer alternative (different time, format, instructor) — not a discount on the same thing",
          pt: "Só ofereça alternativa (outro horário, formato, instrutor) — não desconto na mesma coisa",
        },
        {
          urgency: "ongoing",
          type: "system",
          en: "Track who returns — average 2–3 of 8 reactivate within 30 days when contacted personally",
          pt: "Acompanhe quem volta — média 2–3 das 8 reativam em 30 dias com contato pessoal",
        },
      ],
      decay: {
        en: "Win-back rate: ~30% in first 30d, ~15% in 30–60d, <10% past 90d. Speed matters.",
        pt: "Taxa de reconquista: ~30% nos primeiros 30d, ~15% em 30–60d, <10% após 90d. Velocidade importa.",
      },
      accent: "border-l-purple-400",
    },
    {
      title: {
        en: "Unused credits",
        pt: "Créditos não usados",
      },
      amount: `${fmtUSD(slipping.unusedCredits.recoverable)} ${T.finding.perYear[locale]}`,
      label: T.finding.recoverable,
      problem: {
        en: "32 packages worth $4,540 paid for, never used. Most owners don't see this as a problem until expiration — at which point the member is doubly upset (wasted money + felt unwelcome). The credits represent committed members who lost momentum.",
        pt: "32 pacotes no valor de $4,540 pagos, nunca usados. A maioria dos donos não percebe isso como problema até o vencimento — quando a aluna fica duplamente frustrada (dinheiro perdido + sensação de mal-acolhimento). Os créditos representam alunas comprometidas que perderam momentum.",
      },
      cases: [
        { name: "Bruna O.", detail: { en: "3 credits · expires in 8d", pt: "3 créditos · vence em 8d" } },
        { name: "Ines C.", detail: { en: "9 credits · expires in 6d", pt: "9 créditos · vence em 6d" } },
        { name: "Daniel R.", detail: { en: "6 credits · expires in 11d", pt: "6 créditos · vence em 11d" } },
        { name: "Beatriz F.", detail: { en: "7 credits · expires in 12d", pt: "7 créditos · vence em 12d" } },
        { name: "Hugo S.", detail: { en: "5 credits · expires in 15d", pt: "5 créditos · vence em 15d" } },
        { name: "Olivia W.", detail: { en: "4 credits · expires in 18d", pt: "4 créditos · vence em 18d" } },
        { name: "Pedro M.", detail: { en: "12 credits · no recent activity, expires in 21d", pt: "12 créditos · sem atividade, vence em 21d" } },
        { name: "Marina C.", detail: { en: "8 credits · expires in 24d", pt: "8 créditos · vence em 24d" } },
        { name: "Talia E.", detail: { en: "10 credits · expires in 28d", pt: "10 créditos · vence em 28d" } },
        { name: "Nicholas T.", detail: { en: "14 credits · 30d+ inactive, expires in 33d", pt: "14 créditos · 30d+ inativo, vence em 33d" } },
      ],
      casesMore: 22,
      actions: [
        {
          urgency: "this-week",
          type: "system",
          en: "Auto-email at 14 days before expiry: 'You have X credits expiring on [date]. Want to extend 30 days?'",
          pt: "Email automático 14 dias antes do vencimento: 'Você tem X créditos vencendo em [data]. Quer estender 30 dias?'",
        },
        {
          urgency: "ongoing",
          type: "talk",
          en: "Offer one-time extension (not refund) — moves the problem forward, retains the member",
          pt: "Ofereça uma extensão única (não reembolso) — empurra o problema, mantém a aluna",
        },
        {
          urgency: "this-week",
          type: "outreach",
          en: "For high-credit members (10+): personal message or call instead of email",
          pt: "Pra alunas com muitos créditos (10+): mensagem ou ligação pessoal em vez de email",
        },
        {
          urgency: "ongoing",
          type: "system",
          en: "Add expiration date to autopay confirmation emails going forward — prevents future stockpile",
          pt: "Adicione data de vencimento aos emails de confirmação de autopay daqui em diante — previne acúmulo futuro",
        },
      ],
      decay: {
        en: "Once expired, refund risk is high (chargebacks, bad reviews). Always extend before expiry.",
        pt: "Após vencer, risco de reembolso é alto (chargebacks, reviews ruins). Sempre estenda antes do vencimento.",
      },
      accent: "border-l-stone-400",
    },
    {
      title: {
        en: "No-shows & late cancels",
        pt: "No-shows & cancelamentos tardios",
      },
      amount: `${fmtUSD(slipping.noShows.monthlyLost + slipping.noShows.policyLeakage)} ${T.finding.perMonth[locale]}`,
      label: T.finding.lost,
      problem: {
        en: "47 no-shows + 18 late cancels per month. The slot you held can't be re-sold; the late cancel doesn't pay; the no-show often doesn't either. Worst slot: Mon 6am Reformer (Júlia) at 38% fill, where most no-shows concentrate. The leak isn't the policy — it's the lack of enforcement.",
        pt: "47 no-shows + 18 cancelamentos tardios por mês. O horário que você segurou não pode ser revendido; o cancelamento tardio não paga; o no-show geralmente também não. Pior horário: Seg 6h Reformer (Júlia) com 38% de ocupação, onde se concentram a maioria dos no-shows. O vazamento não é a política — é a falta de aplicação.",
      },
      cases: [
        { name: "Eduardo M.", detail: { en: "4 no-shows in 30d · mostly Mon 6am Reformer", pt: "4 no-shows em 30d · majoritariamente Seg 6h Reformer" } },
        { name: "Vivian H.", detail: { en: "5 no-shows + 2 late cancels in 60d", pt: "5 no-shows + 2 cancelamentos tardios em 60d" } },
        { name: "Rafael K.", detail: { en: "4 no-shows in 90d · all Tue evenings", pt: "4 no-shows em 90d · todas terças à noite" } },
      ],
      actions: [
        {
          urgency: "this-week",
          type: "decide",
          en: "Pick a policy: charge $15 / lose-the-slot / nothing — and enforce within 30 days",
          pt: "Escolha uma política: cobrar $15 / perder-o-horário / nada — e aplique em 30 dias",
        },
        {
          urgency: "this-month",
          type: "email",
          en: "Communicate change in advance — 1 month notice via email + announcement in class",
          pt: "Comunique mudança com antecedência — 1 mês de aviso por email + anúncio em aula",
        },
        {
          urgency: "ongoing",
          type: "system",
          en: "Auto-text reminder 12h before class — typically reduces no-shows by 30–40%",
          pt: "Mensagem automática 12h antes da aula — tipicamente reduz no-shows em 30–40%",
        },
        {
          urgency: "this-month",
          type: "talk",
          en: "For chronic no-show members (3+ in 30d): personal conversation about whether the schedule fits",
          pt: "Pra alunas crônicas (3+ no-shows em 30d): conversa pessoal sobre se o horário encaixa",
        },
      ],
      decay: {
        en: "Ambiguous policy = persistent leak. The decision matters more than which policy you pick.",
        pt: "Política ambígua = vazamento persistente. A decisão importa mais que qual política você escolhe.",
      },
      accent: "border-l-rose-400",
    },
  ];

  const leakLabels = {
    problem: { en: "What's happening", pt: "O que está acontecendo" } as L,
    yourCases: { en: "Your specific cases", pt: "Seus casos específicos" } as L,
    actions: { en: "What to do", pt: "O que fazer" } as L,
    timing: { en: "Timing", pt: "Timing" } as L,
  };

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-700 mb-3">
        {T.finding.f01eyebrow[locale]} · {fmtUSD(33000)}{T.finding.perYear[locale]}
      </p>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
        {T.finding.f01h2[locale]}
      </h2>

      <p className="mt-5 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        {T.finding.f01lead[locale]}
      </p>

      {/* Deep leak blocks — each with problem, your cases, actions, timing */}
      <div className="mt-10 space-y-12">
        {leaks.map((l) => (
          <article
            key={l.title.en}
            className={`border-l-2 pl-6 sm:pl-8 ${l.accent}`}
          >
            {/* Header — title + amount */}
            <header className="flex items-start justify-between gap-6 flex-wrap mb-5">
              <h3 className="font-serif text-2xl font-semibold text-stone-900 leading-tight flex-1 min-w-0">
                {l.title[locale]}
              </h3>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-xl font-semibold text-stone-900 tabular-nums leading-none">
                  {l.amount}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 mt-1">
                  {l.label[locale]}
                </p>
              </div>
            </header>

            {/* Problem */}
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500 mb-1.5">
                {leakLabels.problem[locale]}
              </p>
              <p className="font-serif text-base text-stone-800 leading-[1.7]">
                {l.problem[locale]}
              </p>
            </div>

            {/* Your specific cases — full list */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500">
                  {leakLabels.yourCases[locale]}
                </p>
                <p className="text-[10px] text-stone-500 tabular-nums uppercase tracking-wider">
                  {l.cases.length}
                  {l.casesMore ? ` of ${l.cases.length + l.casesMore}` : ""}{" "}
                  {locale === "pt" ? "membros" : "members"}
                </p>
              </div>
              <dl className="divide-y divide-stone-100 border-t border-b border-stone-200">
                {l.cases.map((c) => (
                  <div
                    key={c.name}
                    className="grid grid-cols-[7rem_1fr] sm:grid-cols-[9rem_1fr] gap-3 sm:gap-4 py-2 text-sm"
                  >
                    <dt className="font-semibold text-stone-900 leading-snug">
                      {c.name}
                    </dt>
                    <dd className="text-stone-700 leading-snug">
                      {c.detail[locale]}
                    </dd>
                  </div>
                ))}
              </dl>
              {l.casesMore !== undefined && l.casesMore > 0 && (
                <p className="text-[11px] text-stone-500 mt-3 italic leading-snug">
                  +{" "}{l.casesMore}{" "}
                  {locale === "pt"
                    ? "alunas adicionais no export completo · checklist clicável para acompanhamento em breve"
                    : "additional members in your full export · clickable checklist for tracking coming soon"}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500 mb-3">
                {leakLabels.actions[locale]}
              </p>
              <ol className="space-y-4">
                {l.actions.map((action, idx) => {
                  const Icon = actionIcon[action.type];
                  const u = urgencyStyle[action.urgency];
                  return (
                    <li
                      key={action.en}
                      className="grid grid-cols-[1.75rem_1fr] gap-3"
                    >
                      <span className="font-serif text-base font-semibold text-stone-500 tabular-nums pt-0.5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-stone-100 text-stone-600 shrink-0">
                            <Icon className="w-3 h-3" />
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded ${u.bg} ${u.text} ${u.ring}`}
                          >
                            {urgencyLabel[action.urgency][locale]}
                          </span>
                        </div>
                        <p className="text-sm text-stone-800 leading-[1.6]">
                          {action[locale]}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Timing / decay note */}
            <p className="text-xs text-stone-600 italic flex items-baseline gap-1.5 pt-3 border-t border-stone-100">
              <span className="not-italic font-semibold uppercase tracking-wider text-[10px] text-stone-500 shrink-0">
                {leakLabels.timing[locale]}
              </span>
              <span>{l.decay[locale]}</span>
            </p>
          </article>
        ))}
      </div>

      {/* Closing context — churn trend (compact) */}
      <div className="mt-10 pt-8 border-t border-stone-200 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-stone-700">
            {T.finding.f01churnPre[locale]}
            <span className="font-semibold text-stone-900 tabular-nums">
              {stats.churnRate90d}%
            </span>
            {T.finding.f01churnMid[locale]}
            <span className="font-semibold text-stone-900 tabular-nums">
              {stats.churnRate90dPrior}%
            </span>
            {T.finding.f01churnPost[locale]}
          </p>
        </div>
        <div className="w-full sm:w-44 h-12">
          <ChurnSparkline data={churnTrend} />
        </div>
      </div>

      {/* Step-by-step playbook — last so it ends with action */}
      <HowToRecover steps={finding1Steps} accent="text-red-700" />
    </section>
  );
}

// ---------------------------------------------------------------------------
// FINDING 2 — Hidden Spenders
// ---------------------------------------------------------------------------

function Finding2() {
  const locale = useLocale();

  const subFindings: Array<{
    title: L;
    amount: string;
    label: L;
    problem: L;
    cases: MemberCase[];
    casesMore?: number;
    actions: Action[];
    decay: L;
    accent: string;
  }> = [
    {
      title: { en: "Hidden Spenders", pt: "Hidden Spenders" },
      amount: `${fmtUSD(4660)} ${T.finding.perYear[locale]}`,
      label: { en: "upside", pt: "upside" },
      problem: {
        en: "22 members are spending above what their plan would predict — booking workshops, buying retail, attending 4×/week on a 4-pack, referring high-value friends. Each is signaling 'I'd pay more for the right next step.' Most owners miss this because no platform cross-references workshop bookings, retail purchases, and attendance frequency to surface ready-to-upsell members.",
        pt: "22 alunas gastam acima do que o plano sugeriria — reservam workshops, compram retail, vêm 4×/sem num pacote de 4, indicam amigas de alto valor. Cada uma sinaliza 'eu pagaria mais pelo próximo passo certo.' A maioria dos donos perde isso porque nenhuma plataforma cruza reservas de workshop, compras retail e frequência pra revelar quem está pronta pra upsell.",
      },
      cases: [
        { name: "Megan A.", detail: { en: "4×/wk on 8-pack — over capacity → Unlimited (+$50/mo) · $600/yr upside", pt: "4×/sem em pacote 8 — supera capacidade → Ilimitado (+$50/mês) · $600/ano upside" } },
        { name: "Rafael T.", detail: { en: "12mo tenure, never tried private → 1:1 Reformer trial · $480/yr", pt: "12m tenure, nunca tentou particular → trial Reformer 1:1 · $480/ano" } },
        { name: "Olivia W.", detail: { en: "Booked spring workshop, pays cash for events → retreat package · $420/yr", pt: "Reservou workshop primavera, paga eventos cash → pacote retiro · $420/ano" } },
        { name: "Igor M.", detail: { en: "Buys retail consistently, on basic plan → premium-plan retail bundle · $380/yr", pt: "Compra retail consistente, plano básico → bundle premium + retail · $380/ano" } },
        { name: "Sara H.", detail: { en: "Refers 3 high-value friends, no recognition → VIP referral program · $320/yr", pt: "Indica 3 amigas alto valor sem reconhecimento → programa indicação VIP · $320/ano" } },
        { name: "Bruno V.", detail: { en: "Anniversary in 2 weeks → anniversary upgrade pack · $280/yr", pt: "Aniversário em 2 semanas → pacote upgrade aniversário · $280/ano" } },
        { name: "Sophia P.", detail: { en: "Booked 2 quarterly retreats → VIP retreat tier · $240/yr", pt: "Reservou 2 retiros trimestrais → tier VIP retiro · $240/ano" } },
        { name: "Marco T.", detail: { en: "8mo, 5×/wk Reformer-only → Unlimited +$70/mo · $220/yr", pt: "8m, 5×/sem só Reformer → Ilimitado +$70/mês · $220/ano" } },
        { name: "Helena R.", detail: { en: "90% of retail purchased, standard plan → premium retail bundle · $200/yr", pt: "90% retail comprado, plano standard → bundle premium retail · $200/ano" } },
        { name: "Felix N.", detail: { en: "Workshop attendee 4× this year → annual workshop pack · $180/yr", pt: "Workshop 4× este ano → pacote anual workshop · $180/ano" } },
        { name: "Júlia C.", detail: { en: "Referred 3 friends in last 90d → VIP referral · $160/yr", pt: "Indicou 3 amigas em 90d → VIP referral · $160/ano" } },
        { name: "Antonio M.", detail: { en: "24mo, never tried duo → duo trial pack · $150/yr", pt: "24m, nunca tentou duo → trial duo · $150/ano" } },
        { name: "Nina K.", detail: { en: "Bought spring pack at full price → premier subscription · $140/yr", pt: "Pacote primavera preço cheio → assinatura premier · $140/ano" } },
        { name: "Vitor R.", detail: { en: "Privates 2×/wk on basic plan → premier upgrade · $130/yr", pt: "Privates 2×/sem em plano básico → upgrade premier · $130/ano" } },
        { name: "Aline B.", detail: { en: "18mo anniversary in 30d → milestone upgrade · $120/yr", pt: "Aniversário 18m em 30d → upgrade milestone · $120/ano" } },
        { name: "Murilo D.", detail: { en: "Buys gift cards monthly → annual giving pack · $110/yr", pt: "Compra gift cards mensalmente → pacote anual gifts · $110/ano" } },
        { name: "Luiza A.", detail: { en: "3yr high-tier client → loyalty pack · $100/yr", pt: "Cliente alto-valor há 3 anos → pacote loyalty · $100/ano" } },
        { name: "Edu S.", detail: { en: "Books duos with spouse → couple subscription · $95/yr", pt: "Reserva duos com cônjuge → assinatura casal · $95/ano" } },
        { name: "Bia M.", detail: { en: "6mo, 4×/wk Mat → Unlimited · $90/yr", pt: "6m, 4×/sem Mat → Ilimitado · $90/ano" } },
        { name: "Caio O.", detail: { en: "Saturday workshop regular → weekend pack · $85/yr", pt: "Workshop sábado regular → pacote fim de semana · $85/ano" } },
        { name: "Vivi T.", detail: { en: "First-time at premium event → VIP intro · $80/yr", pt: "Primeira em evento premium → intro VIP · $80/ano" } },
        { name: "Marina L.", detail: { en: "2yr Reformer regular, never Pilates Wall → wall trial · $80/yr", pt: "2 anos Reformer, nunca Pilates Wall → trial wall · $80/ano" } },
      ],
      actions: [
        {
          urgency: "this-week",
          type: "talk",
          en: "Personal conversation with the top 3 (Megan, Rafael, Olivia) — face-to-face, not email",
          pt: "Conversa pessoal com as top 3 (Megan, Rafael, Olivia) — cara a cara, não email",
        },
        {
          urgency: "this-week",
          type: "system",
          en: "Prepare migration scripts: 'Notei que você vem 4×/sem — quer testar o Unlimited 30 dias?'",
          pt: "Prepare scripts de migração: 'Notei que você vem 4×/sem — quer testar o Ilimitado 30 dias?'",
        },
        {
          urgency: "this-month",
          type: "decide",
          en: "Decide on VIP referral structure — '1 month free per 2 referrals who stay 60+ days' is industry-standard",
          pt: "Decida estrutura do VIP referral — '1 mês grátis por 2 indicações que ficam 60+ dias' é padrão da indústria",
        },
        {
          urgency: "ongoing",
          type: "system",
          en: "Anniversary upgrade campaign — auto-trigger 30 days before tenure milestones (12mo, 18mo, 24mo)",
          pt: "Campanha upgrade aniversário — disparo automático 30d antes de marcos (12m, 18m, 24m)",
        },
      ],
      decay: {
        en: "Anniversary windows convert 40-60%; outside them, 10-15%. Time outreach to milestones.",
        pt: "Janelas de aniversário convertem 40-60%; fora delas, 10-15%. Sincronize outreach com marcos.",
      },
      accent: "border-l-emerald-400",
    },
    {
      title: {
        en: "Plan misalignment",
        pt: "Desalinhamento de plano",
      },
      amount: `${fmtUSD(planMisalignment.monthlyLift)} ${T.finding.perMonth[locale]}`,
      label: { en: "monthly lift", pt: "lift mensal" },
      problem: {
        en: "18 members are paying for less than they actually use (over-users — at risk of cancelling from frustration when they hit limits) and 6 are paying for far more than they use (under-users — at risk of cancelling because they're not getting their money's worth). Realigning both directions captures $770/mo of lift while reducing two distinct churn risks.",
        pt: "18 alunas pagam por menos do que realmente usam (over-users — risco de cancelar por frustração ao bater limites) e 6 pagam por muito mais do que usam (under-users — risco de cancelar por não sentir valor). Realinhar nas duas direções captura $770/mês de lift enquanto reduz dois riscos de churn distintos.",
      },
      cases: [
        { name: "José A.", detail: { en: "[OVER] 4-pack ($89/mo), comes 4×/wk → Unlimited ($149/mo) +$60/mo", pt: "[OVER] Pacote 4 ($89/mês), vem 4×/sem → Ilimitado ($149/mês) +$60/mês" } },
        { name: "Sandra K.", detail: { en: "[OVER] 8-pack ($129/mo), comes 5×/wk → Unlimited +$20/mo", pt: "[OVER] Pacote 8 ($129/mês), vem 5×/sem → Ilimitado +$20/mês" } },
        { name: "Otavio R.", detail: { en: "[OVER] 4-pack, comes 4×/wk regular → Unlimited", pt: "[OVER] Pacote 4, vem 4×/sem regular → Ilimitado" } },
        { name: "Patricia M.", detail: { en: "[OVER] Basic plan, comes 6×/wk → Premium Unlimited", pt: "[OVER] Plano básico, vem 6×/sem → Ilimitado premium" } },
        { name: "Henrique S.", detail: { en: "[OVER] 8-pack, comes 4×/wk → Unlimited", pt: "[OVER] Pacote 8, vem 4×/sem → Ilimitado" } },
        { name: "Camila B.", detail: { en: "[OVER] 4-pack, comes 5×/wk → Unlimited", pt: "[OVER] Pacote 4, vem 5×/sem → Ilimitado" } },
        { name: "Roberto T.", detail: { en: "[OVER] 8-pack, comes 6×/wk → Premium Unlimited", pt: "[OVER] Pacote 8, vem 6×/sem → Ilimitado premium" } },
        { name: "Adriana L.", detail: { en: "[OVER] 4-pack, comes 4×/wk → Unlimited", pt: "[OVER] Pacote 4, vem 4×/sem → Ilimitado" } },
        { name: "Daniel V.", detail: { en: "[OVER] 4-pack, comes 4×/wk → Unlimited", pt: "[OVER] Pacote 4, vem 4×/sem → Ilimitado" } },
        { name: "Marcia P.", detail: { en: "[OVER] 8-pack, comes 5×/wk → Unlimited", pt: "[OVER] Pacote 8, vem 5×/sem → Ilimitado" } },
        { name: "Túlio C.", detail: { en: "[OVER] 4-pack, comes 4×/wk → Unlimited", pt: "[OVER] Pacote 4, vem 4×/sem → Ilimitado" } },
        { name: "Beatriz N.", detail: { en: "[OVER] 8-pack, comes 4-5×/wk → Unlimited", pt: "[OVER] Pacote 8, vem 4-5×/sem → Ilimitado" } },
        { name: "Inácio R.", detail: { en: "[OVER] 4-pack, comes 4×/wk → Unlimited", pt: "[OVER] Pacote 4, vem 4×/sem → Ilimitado" } },
        { name: "Maria F.", detail: { en: "[OVER] 8-pack, comes 5×/wk → Unlimited", pt: "[OVER] Pacote 8, vem 5×/sem → Ilimitado" } },
        { name: "Cristina Z.", detail: { en: "[OVER] 4-pack, comes 4×/wk → Unlimited", pt: "[OVER] Pacote 4, vem 4×/sem → Ilimitado" } },
        { name: "Sergio H.", detail: { en: "[OVER] 4-pack, comes 4×/wk → Unlimited", pt: "[OVER] Pacote 4, vem 4×/sem → Ilimitado" } },
        { name: "Lara D.", detail: { en: "[OVER] 8-pack, comes 6×/wk → Premium Unlimited", pt: "[OVER] Pacote 8, vem 6×/sem → Ilimitado premium" } },
        { name: "Felipe G.", detail: { en: "[OVER] 4-pack, comes 4×/wk → Unlimited", pt: "[OVER] Pacote 4, vem 4×/sem → Ilimitado" } },
        { name: "Cláudia P.", detail: { en: "[UNDER] Unlimited ($149/mo), comes 1×/wk → 4-pack ($89/mo) saves $60/mo", pt: "[UNDER] Ilimitado ($149/mês), vem 1×/sem → Pacote 4 ($89/mês) economiza $60/mês" } },
        { name: "Davi M.", detail: { en: "[UNDER] Unlimited, comes 2×/wk → 8-pack ($129/mo)", pt: "[UNDER] Ilimitado, vem 2×/sem → Pacote 8 ($129/mês)" } },
        { name: "Luana R.", detail: { en: "[UNDER] Unlimited, comes 1×/wk → 4-pack", pt: "[UNDER] Ilimitado, vem 1×/sem → Pacote 4" } },
        { name: "Tiago O.", detail: { en: "[UNDER] Unlimited, comes 2×/2wk → drop-in", pt: "[UNDER] Ilimitado, vem 2×/quinzena → drop-in" } },
        { name: "Renata C.", detail: { en: "[UNDER] Unlimited, comes 1×/wk → 4-pack", pt: "[UNDER] Ilimitado, vem 1×/sem → Pacote 4" } },
        { name: "Vinícius P.", detail: { en: "[UNDER] Unlimited, comes 2×/wk → 8-pack", pt: "[UNDER] Ilimitado, vem 2×/sem → Pacote 8" } },
      ],
      actions: [
        {
          urgency: "this-week",
          type: "talk",
          en: "Migrate over-users up — frame as service: 'I noticed your pattern. Unlimited fits you better.'",
          pt: "Migrar over-users pra cima — enquadre como serviço: 'Notei seu padrão. Ilimitado encaixa melhor em você.'",
        },
        {
          urgency: "this-week",
          type: "talk",
          en: "Down-sell offer to under-users BEFORE they cancel — keeping $89/mo beats losing $149/mo",
          pt: "Oferta de down-sell para under-users ANTES de cancelarem — manter $89/mês bate perder $149/mês",
        },
        {
          urgency: "ongoing",
          type: "system",
          en: "Set quarterly plan-fit review — auto-flag any member whose usage diverges 50%+ from plan",
          pt: "Revisão trimestral de plan-fit — flag automático em qualquer aluna com uso divergindo 50%+ do plano",
        },
        {
          urgency: "ongoing",
          type: "system",
          en: "Track conversion rate on each migration — refine scripts based on what works",
          pt: "Acompanhe taxa de conversão de cada migração — refine scripts pelo que funciona",
        },
      ],
      decay: {
        en: "Over-users churn risk peaks around month 3-6 of frustration. Under-users at month 4-8 of guilt. Act quickly on both.",
        pt: "Risco de churn de over-users pico em mês 3-6 de frustração. Under-users em mês 4-8 de culpa. Aja rápido nos dois.",
      },
      accent: "border-l-emerald-400",
    },
  ];

  const leakLabels = {
    problem: { en: "What's happening", pt: "O que está acontecendo" } as L,
    yourCases: { en: "Your specific cases", pt: "Seus casos específicos" } as L,
    actions: { en: "What to do", pt: "O que fazer" } as L,
    timing: { en: "Timing", pt: "Timing" } as L,
  };

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 mb-3">
        {T.finding.f02eyebrow[locale]} · {fmtUSD(14000)}{T.finding.perYear[locale]}
      </p>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
        {T.finding.f02h2[locale]}
      </h2>

      <p className="mt-5 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        {T.finding.f02leadA[locale]}
        <span className="font-semibold text-stone-900 tabular-nums">
          {hiddenSpenders.count}
        </span>
        {T.finding.f02leadB[locale]}
      </p>

      {/* Bar chart island — visual context for top 6 hidden spenders */}
      <div className="mt-8 bg-white border border-stone-200 rounded-xl p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-4">
          {locale === "pt" ? "Top 6 hidden spenders por upside anual" : "Top 6 hidden spenders by annual upside"}
        </p>
        <HiddenSpendersBar data={hiddenSpenders.ranking} />
      </div>

      {/* Deep sub-finding blocks */}
      <div className="mt-12 space-y-12">
        {subFindings.map((s) => (
          <article
            key={s.title.en}
            className={`border-l-2 pl-6 sm:pl-8 ${s.accent}`}
          >
            <header className="flex items-start justify-between gap-6 flex-wrap mb-5">
              <h3 className="font-serif text-2xl font-semibold text-stone-900 leading-tight flex-1 min-w-0">
                {s.title[locale]}
              </h3>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-xl font-semibold text-stone-900 tabular-nums leading-none">
                  {s.amount}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 mt-1">
                  {s.label[locale]}
                </p>
              </div>
            </header>

            {/* Problem */}
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500 mb-1.5">
                {leakLabels.problem[locale]}
              </p>
              <p className="font-serif text-base text-stone-800 leading-[1.7]">
                {s.problem[locale]}
              </p>
            </div>

            {/* Cases */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500">
                  {leakLabels.yourCases[locale]}
                </p>
                <p className="text-[10px] text-stone-500 tabular-nums uppercase tracking-wider">
                  {s.cases.length}
                  {s.casesMore ? ` of ${s.cases.length + s.casesMore}` : ""}{" "}
                  {locale === "pt" ? "membros" : "members"}
                </p>
              </div>
              <dl className="divide-y divide-stone-100 border-t border-b border-stone-200">
                {s.cases.map((c) => (
                  <div
                    key={c.name}
                    className="grid grid-cols-[7rem_1fr] sm:grid-cols-[9rem_1fr] gap-3 sm:gap-4 py-2 text-sm"
                  >
                    <dt className="font-semibold text-stone-900 leading-snug">
                      {c.name}
                    </dt>
                    <dd className="text-stone-700 leading-snug">
                      {c.detail[locale]}
                    </dd>
                  </div>
                ))}
              </dl>
              {s.casesMore !== undefined && s.casesMore > 0 && (
                <p className="text-[11px] text-stone-500 mt-3 italic leading-snug">
                  +{" "}{s.casesMore}{" "}
                  {locale === "pt"
                    ? "alunas adicionais no export completo · checklist clicável para acompanhamento em breve"
                    : "additional members in your full export · clickable checklist for tracking coming soon"}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500 mb-3">
                {leakLabels.actions[locale]}
              </p>
              <ol className="space-y-4">
                {s.actions.map((action, idx) => {
                  const Icon = actionIcon[action.type];
                  const u = urgencyStyle[action.urgency];
                  return (
                    <li
                      key={action.en}
                      className="grid grid-cols-[1.75rem_1fr] gap-3"
                    >
                      <span className="font-serif text-base font-semibold text-stone-500 tabular-nums pt-0.5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-stone-100 text-stone-600 shrink-0">
                            <Icon className="w-3 h-3" />
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded ${u.bg} ${u.text} ${u.ring}`}
                          >
                            {urgencyLabel[action.urgency][locale]}
                          </span>
                        </div>
                        <p className="text-sm text-stone-800 leading-[1.6]">
                          {action[locale]}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Timing */}
            <p className="text-xs text-stone-600 italic flex items-baseline gap-1.5 pt-3 border-t border-stone-100">
              <span className="not-italic font-semibold uppercase tracking-wider text-[10px] text-stone-500 shrink-0">
                {leakLabels.timing[locale]}
              </span>
              <span>{s.decay[locale]}</span>
            </p>
          </article>
        ))}
      </div>

      {/* Step-by-step playbook — strategic summary */}
      <HowToRecover steps={finding2Steps} accent="text-emerald-700" />
    </section>
  );
}

// ---------------------------------------------------------------------------
// FINDING 3 — Schedule + Aggregator drag
// ---------------------------------------------------------------------------

function Finding3() {
  const locale = useLocale();
  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-orange-700 mb-3">
        {T.finding.f03eyebrow[locale]} · {fmtUSD(5400)}{T.finding.perYear[locale]}
      </p>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
        {T.finding.f03h2[locale]}
      </h2>

      <p className="mt-5 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        {T.finding.f03leadPre[locale]}
        <span className="font-semibold text-stone-900 tabular-nums">
          {slotFill.avgFillRate}%
        </span>
        {T.finding.f03leadPost[locale]}
      </p>

      {/* Heatmap island */}
      <div className="mt-8 bg-white border border-stone-200 rounded-xl p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-5">
          {T.finding.slotFillTitle[locale]}
        </p>
        <SlotFillHeatmap />
      </div>

      {/* ClassPass breakdown — compact card */}
      <div className="mt-8 bg-white border border-stone-200 rounded-xl p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">
            {T.finding.classpassThisMonth[locale]}
          </p>
          <p className="text-xs uppercase tracking-wider font-semibold text-red-700">
            {T.finding.netLoss[locale]}
          </p>
        </div>
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-baseline justify-between">
            <dt className="text-stone-600">{T.finding.grossReceived[locale]}</dt>
            <dd className="font-medium text-stone-900 tabular-nums">
              {fmtUSD(aggregator.monthlyGross)} {T.finding.perMonth[locale]} · ${aggregator.perVisitGross.toFixed(2)}
              {T.finding.perVisit[locale]}
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-stone-600">{T.finding.estCost[locale]}</dt>
            <dd className="font-medium text-stone-900 tabular-nums">
              −{fmtUSD(aggregator.monthlyCost)} {T.finding.perMonth[locale]} · ${aggregator.perVisitCost}
              {T.finding.perVisit[locale]}
            </dd>
          </div>
          <div className="flex items-baseline justify-between pt-2 border-t border-stone-100">
            <dt className="font-semibold text-stone-900">{T.finding.netMargin[locale]}</dt>
            <dd className="font-semibold text-red-700 tabular-nums">
              −{fmtUSD(Math.abs(aggregator.monthlyNet))} {T.finding.perMonth[locale]}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-6 text-sm text-stone-800 leading-[1.7]">
        {T.finding.f03ClosingPre[locale]}
        <span className="font-semibold text-stone-900 tabular-nums">
          {aggregator.cannibalizationCount}
        </span>
        {T.finding.f03ClosingPost[locale]}
      </p>

      {/* Step-by-step playbook */}
      <HowToRecover steps={finding3Steps} accent="text-orange-700" />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 30-day plan
// ---------------------------------------------------------------------------

function ThirtyDayPlan() {
  const locale = useLocale();
  return (
    <section>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
        {T.plan.h2[locale]}
      </h2>
      <p className="mt-4 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        {T.plan.lead[locale]}
      </p>

      <ol className="mt-10 space-y-6">
        {planWeeks.map((w, idx) => {
          const isCurrent = idx === 0;
          return (
            <li key={w.label.en} className="flex gap-5">
              <div className="shrink-0 pt-0.5">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-serif text-sm font-semibold tabular-nums ${
                    isCurrent ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {idx + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                  <p className="text-xs uppercase tracking-wider font-medium text-stone-500 tabular-nums">
                    {w.range[locale]}
                  </p>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
                      {T.plan.youAreHere[locale]}
                    </span>
                  )}
                </div>
                <p className="font-serif text-xl font-semibold text-stone-900 mb-1.5">
                  {w.title[locale]}
                </p>
                <p className="font-serif text-base text-stone-800 leading-[1.7]">
                  {w.detail[locale]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Closer — quarterly review CTA
// ---------------------------------------------------------------------------

function Closer() {
  const locale = useLocale();
  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500 mb-3">
        {T.closer.eyebrow[locale]}
      </p>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
        {T.closer.headlinePre[locale]}
        <span className="tabular-nums whitespace-nowrap">
          {studio.nextReviewDate[locale]}
        </span>
        {T.closer.headlinePost[locale]}
      </h2>

      <div className="mt-6 space-y-5 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        <p>{T.closer.leadA[locale]}</p>
        <p>{T.closer.leadB[locale]}</p>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <a
          href="#"
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm rounded-lg transition-colors"
        >
          <CalendarDaysIcon className="w-4 h-4" />
          {T.closer.bookCta[locale]}
        </a>
        <a
          href="#"
          className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-900 font-medium text-sm rounded-lg transition-colors"
        >
          {T.closer.whatsappCta[locale]}
        </a>
      </div>

      <p className="mt-12 text-center text-xs text-stone-500">
        {T.closer.footer[locale]}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HowToRecover — reusable step-by-step playbook (used in each Finding)
// ---------------------------------------------------------------------------

function HowToRecover({
  steps,
  accent,
}: {
  steps: Array<{ title: L; detail: L }>;
  accent: string;
}) {
  const locale = useLocale();
  // Map text-* accent to bg-* for the top border bar
  const accentBg = accent
    .replace("text-", "bg-")
    .replace("-700", "-500");
  return (
    <div className="mt-12 sm:mt-14 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
      <div className={`h-1 ${accentBg}`} aria-hidden />
      <div className="p-6 sm:p-8">
        <div className="flex items-baseline gap-2 mb-1">
          <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${accent}`}>
            ▸ {T.howToRecover.eyebrow[locale]}
          </p>
          <span className="text-stone-300">·</span>
          <p className="text-[11px] uppercase tracking-wider text-stone-500 font-medium tabular-nums">
            {steps.length} {locale === "pt" ? "passos" : "steps"}
          </p>
        </div>
        <h3 className="font-serif text-2xl font-semibold text-stone-900 mb-7 leading-tight">
          {T.howToRecover.h3[locale]}
        </h3>
        <ol className="space-y-5">
          {steps.map((step, idx) => (
            <li key={step.title.en} className="grid grid-cols-[2.25rem_1fr] gap-4 sm:gap-5">
              <span className="font-serif text-lg font-semibold text-stone-500 tabular-nums leading-tight pt-0.5">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 mb-1 leading-snug">
                  {step.title[locale]}
                </p>
                <p className="text-sm text-stone-700 leading-[1.7]">
                  {step.detail[locale]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExecutiveSummary — preview of the 3 findings, sets expectations
// ---------------------------------------------------------------------------

function ExecutiveSummary() {
  const locale = useLocale();
  const totalRecoverable = executiveSummary.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500 mb-3">
        {T.summary.eyebrow[locale]}
      </p>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
        {T.summary.h2[locale]}
      </h2>

      <p className="mt-5 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        {T.summary.lead[locale]}
      </p>

      <ol className="mt-10 space-y-10">
        {executiveSummary.map((item) => {
          const pct = Math.round((item.amount / totalRecoverable) * 100);
          const barBg = item.accent
            .replace("text-", "bg-")
            .replace("-700", "-500");
          return (
            <li key={item.finding} className="border-t border-stone-200 pt-7">
              {/* Header row: number + title + amount */}
              <div className="flex items-baseline gap-4 mb-3 flex-wrap">
                <span
                  className={`font-serif text-2xl font-semibold tabular-nums ${item.accent}`}
                >
                  {item.finding}
                </span>
                <h3 className="font-serif text-2xl font-semibold text-stone-900 leading-snug flex-1 min-w-0">
                  {item.title[locale]}
                </h3>
                <span className="font-serif text-2xl font-semibold text-stone-900 tabular-nums whitespace-nowrap">
                  {fmtUSD(item.amount)}
                  <span className="text-base font-normal text-stone-500">
                    {item.amountSuffix[locale]}
                  </span>
                </span>
              </div>

              {/* Money proportion bar — visual share of total */}
              <div className="mb-4">
                <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barBg}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 mt-1.5 tabular-nums">
                  {pct}%{" "}
                  {locale === "pt"
                    ? "do total recuperável"
                    : "of total recoverable"}
                </p>
              </div>

              {/* Framing line */}
              <p
                className={`text-sm font-medium ${item.accent} mb-4 flex items-baseline gap-1.5`}
              >
                <span aria-hidden>▸</span>
                <span>{item.framing[locale]}</span>
              </p>

            {/* Specific items */}
            <ul className="space-y-2 mb-3">
              {item.items.map((it) => (
                <li
                  key={it.what.en}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-6 gap-y-0.5 text-[15px]"
                >
                  <span className="text-stone-800 leading-snug flex items-baseline gap-2">
                    <span className="text-stone-400" aria-hidden>
                      •
                    </span>
                    <span>{it.what[locale]}</span>
                  </span>
                  <span className="text-stone-700 leading-snug sm:text-right pl-5 sm:pl-0 font-medium">
                    {it.outcome[locale]}
                  </span>
                </li>
              ))}
            </ul>

              {/* Deeper link */}
              <a
                href={`#${item.anchor}`}
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 transition-colors mt-1"
              >
                {item.deeper[locale]}
                <span aria-hidden>↓</span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Benchmark — How you compare to cohort
// ---------------------------------------------------------------------------

function Benchmark() {
  const locale = useLocale();
  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500 mb-3">
        {T.benchmark.eyebrow[locale]}
      </p>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
        {T.benchmark.h2[locale]}
      </h2>

      <p className="mt-5 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        {T.benchmark.lead[locale]}
      </p>

      <dl className="mt-10 divide-y divide-stone-200 border-t border-b border-stone-200">
        {benchmark.map((b) => {
          const isBetter = b.verdict === "better";
          return (
            <div
              key={b.metric.en}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-6 gap-y-1 py-5 items-baseline"
            >
              <div className="min-w-0 sm:col-span-1">
                <dt className="font-semibold text-stone-900">{b.metric[locale]}</dt>
                <dd className="text-sm text-stone-700 leading-[1.7] mt-1 sm:max-w-md">
                  {b.takeaway[locale]}
                </dd>
              </div>
              <dd className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-0.5">
                  {T.benchmark.you[locale]}
                </p>
                <p className="text-base font-semibold text-stone-900 tabular-nums">
                  {b.you}
                </p>
              </dd>
              <dd className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-0.5">
                  {T.benchmark.cohort[locale]}
                </p>
                <p className="text-base font-medium text-stone-600 tabular-nums">
                  {b.cohort}
                </p>
              </dd>
              <dd className="text-right shrink-0">
                <span
                  className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isBetter
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isBetter ? T.benchmark.better[locale] : T.benchmark.below[locale]}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-8 font-serif text-base text-stone-800 leading-[1.7]">
        {T.benchmark.closingPre[locale]}
        <span className="font-semibold text-stone-900">
          {T.benchmark.closingHighlight[locale]}
        </span>
        {T.benchmark.closingPost[locale]}
      </p>

      {/* Closing the gaps — step-by-step per "Below" metric */}
      <div className="mt-14 pt-12 border-t border-stone-200">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500 mb-3">
          {T.benchmark.gapsEyebrow[locale]}
        </p>
        <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
          {T.benchmark.gapsH3[locale]}
        </h3>

        <div className="mt-10 space-y-12">
          {closingTheGaps.map((g) => (
            <div key={g.metric.en}>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${g.accent} mb-2`}
              >
                {g.metric[locale]}
              </p>
              <p className="font-serif text-base text-stone-800 leading-[1.7] mb-5">
                {g.gap[locale]}
              </p>
              <ol className="space-y-4">
                {g.steps.map((step, idx) => (
                  <li
                    key={step.title.en}
                    className="grid grid-cols-[2.25rem_1fr] gap-4 sm:gap-5"
                  >
                    <span className="font-serif text-lg font-semibold text-stone-500 tabular-nums leading-tight pt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 mb-1 leading-snug">
                        {step.title[locale]}
                      </p>
                      <p className="text-sm text-stone-700 leading-[1.7]">
                        {step.detail[locale]}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Methodology — proof of work, what we looked at, limitations
// ---------------------------------------------------------------------------

function Methodology() {
  const locale = useLocale();
  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500 mb-3">
        {T.methodology.eyebrow[locale]}
      </p>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
        {T.methodology.h2[locale]}
      </h2>

      <p className="mt-5 font-serif text-[17px] sm:text-lg text-stone-800 leading-[1.7]">
        {T.methodology.lead[locale]}
      </p>

      {/* SCOPE — period + source + records as a single panel */}
      <div className="mt-10 border-t border-b border-stone-200 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">
              {T.methodology.period[locale]}
            </p>
            <p className="font-serif text-base text-stone-900 leading-snug tabular-nums">
              {methodology.period[locale]}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">
              {T.methodology.source[locale]}
            </p>
            <p className="font-serif text-base text-stone-900 leading-snug">
              {methodology.source[locale]}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-7 border-t border-stone-100">
          <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-5">
            {T.methodology.recordsAnalyzed[locale]}
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-5">
            {methodology.records.map((r) => (
              <div key={r.label.en} className="min-w-0">
                <dd className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 tabular-nums leading-none mb-1.5">
                  {r.value}
                </dd>
                <dt className="text-xs text-stone-600 leading-snug">
                  {r.label[locale]}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* METHOD — cross-references as a real subsection */}
      <div className="mt-12">
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-stone-900 leading-snug mb-4">
          {T.methodology.crossReferences[locale]}
        </h3>
        <ul className="space-y-3">
          {methodology.crossReferences.map((line) => (
            <li
              key={line.en}
              className="text-[15px] text-stone-800 leading-[1.7] pl-6 relative before:content-['→'] before:absolute before:left-0 before:top-0.5 before:text-stone-500 before:font-semibold"
            >
              {line[locale]}
            </li>
          ))}
        </ul>
      </div>

      {/* CAVEATS — limitations */}
      <div className="mt-10">
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-stone-900 leading-snug mb-4">
          {T.methodology.limitations[locale]}
        </h3>
        <ul className="space-y-3.5">
          {methodology.limitations.map((line) => (
            <li
              key={line.en}
              className="text-[15px] text-stone-700 leading-[1.7] pl-6 relative before:content-['—'] before:absolute before:left-0 before:top-0 before:text-stone-500 before:font-semibold"
            >
              {line[locale]}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ===========================================================================
// CHART COMPONENTS
// ===========================================================================

function ChurnSparkline({ data }: { data: Array<{ month: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#ea580c"
          strokeWidth={2}
          fill="url(#churnGradient)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function HiddenSpendersBar({
  data,
}: {
  data: Array<{ name: string; upside: number }>;
}) {
  const locale = useLocale();
  const upsideLabel = locale === "pt" ? "Upside/ano" : "Upside/yr";
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#a8a29e" }}
            tickFormatter={(v) => `$${v}`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#44403c" }}
            width={70}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid #e7e5e4",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => [
              fmtUSD(Number(value)),
              String(name) === "upside" ? upsideLabel : String(name),
            ]}
            cursor={{ fill: "rgba(16, 185, 129, 0.06)" }}
          />
          <Bar dataKey="upside" fill="#10b981" radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SlotFillHeatmap() {
  const locale = useLocale();
  const days = heatmapDays[locale];
  const hours = heatmapHours[locale];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 pl-12">
        {days.map((d) => (
          <div
            key={d}
            className="flex-1 text-center text-[10px] font-semibold uppercase tracking-wider text-stone-500"
          >
            {d}
          </div>
        ))}
      </div>

      {hours.map((hour, rowIdx) => (
        <div key={hour} className="flex items-center gap-1">
          <div className="w-10 text-right text-[10px] text-stone-500 pr-2 tabular-nums">
            {hour}
          </div>
          {days.map((d, colIdx) => {
            const value = heatmapData[rowIdx]?.[colIdx] ?? -1;
            const s = heatmapStyle(value);
            return (
              <div
                key={`${hour}-${d}`}
                title={
                  value >= 0
                    ? `${d} ${hour}: ${value}% ${T.heatmap.fillRate[locale].toLowerCase()}`
                    : `${d} ${hour}: ${T.heatmap.noClass[locale]}`
                }
                className={`flex-1 h-7 rounded flex items-center justify-center text-[10px] font-medium tabular-nums cursor-default transition-opacity hover:opacity-80 ${s.bg} ${s.border} ${s.text}`}
              >
                {value >= 0 ? value : ""}
              </div>
            );
          })}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-stone-100 text-[10px] text-stone-500">
        <span className="font-medium uppercase tracking-wider">
          {T.heatmap.fillRate[locale]}
        </span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-300" />
          <span>&lt;30</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-200" />
          <span>30–50</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-100" />
          <span>50–70</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200" />
          <span>70–85</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
          <span>85+</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-stone-300" />
          <span>{T.heatmap.noClass[locale]}</span>
        </div>
      </div>
    </div>
  );
}
