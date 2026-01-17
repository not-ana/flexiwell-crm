"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Toggle } from "@/components/ui/Toggle";
import { useLocale } from "@/hooks/useLocale";
import { showToast } from "./shared";

// ============================================================================
// Types
// ============================================================================

interface WhatsAppSettingsProps {
  onBack?: () => void;
}

interface WhatsAppStatus {
  connected: boolean;
  provider?: string;
  phoneNumber?: string;
  phoneNumberId?: string;
  qualityRating?: string;
  botEnabled?: boolean;
  botFeatures?: BotFeatureToggle;
  botCommands?: BotMenuCommand[];
  botWelcomeMessage?: string;
  error?: string;
  pendingRequest?: boolean;
}

interface BotFeatureToggle {
  viewClasses: boolean;
  confirmAttendance: boolean;
  cancelClass: boolean;
  bookNewClass: boolean;
  automaticReminders: boolean;
}

// Bot command types
type BotCommandAction =
  | "VIEW_CLASSES"
  | "BOOK_CLASS"
  | "MY_BOOKINGS"
  | "CANCEL_BOOKING"
  | "REMAINING_CREDITS"
  | "CONTACT_SUPPORT"
  | "CUSTOM_MESSAGE";

interface BotMenuCommand {
  id: string;
  trigger: string;
  label: string;
  action: BotCommandAction;
  customMessage?: string;
  enabled: boolean;
  order: number;
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_FEATURES: BotFeatureToggle = {
  viewClasses: true,
  confirmAttendance: true,
  cancelClass: true,
  bookNewClass: true,
  automaticReminders: true,
};

// ============================================================================
// Translations
// ============================================================================

const TRANSLATIONS = {
  backToAddons: { "pt-BR": "Voltar para Add-ons", "en-US": "Back to Add-ons" },
  title: { "pt-BR": "WhatsApp Business", "en-US": "WhatsApp Business" },
  description: {
    "pt-BR": "Permita que seus clientes vejam aulas, confirmem presença e cancelem via WhatsApp.",
    "en-US": "Let your clients check classes, confirm attendance, and cancel via WhatsApp.",
  },
  connected: { "pt-BR": "Conectado", "en-US": "Connected" },
  notConfigured: { "pt-BR": "Não configurado", "en-US": "Not configured" },
  checking: { "pt-BR": "Verificando...", "en-US": "Checking..." },
  testConnection: { "pt-BR": "Testar Conexão", "en-US": "Test Connection" },
  messagesThisMonth: { "pt-BR": "Mensagens este mês", "en-US": "Messages this month" },
  responseRate: { "pt-BR": "Taxa de resposta", "en-US": "Response rate" },
  botConfirmations: { "pt-BR": "Confirmações via bot", "en-US": "Bot confirmations" },
  botFeatures: { "pt-BR": "Recursos do Bot", "en-US": "Bot Features" },
  viewClasses: { "pt-BR": "Ver Aulas", "en-US": "View Classes" },
  viewClassesDesc: { "pt-BR": "Cliente visualiza suas aulas agendadas", "en-US": "Client views their upcoming scheduled classes" },
  confirmAttendance: { "pt-BR": "Confirmar Presença", "en-US": "Confirm Attendance" },
  confirmAttendanceDesc: { "pt-BR": "Cliente confirma presença para aulas", "en-US": "Client confirms attendance for classes" },
  cancelClass: { "pt-BR": "Cancelar Aula", "en-US": "Cancel Class" },
  cancelClassDesc: { "pt-BR": "Cliente cancela aula diretamente", "en-US": "Client cancels class directly" },
  bookNewClass: { "pt-BR": "Agendar Nova Aula", "en-US": "Book New Class" },
  bookNewClassDesc: { "pt-BR": "Cliente agenda novas aulas via WhatsApp", "en-US": "Client books new classes via WhatsApp" },
  automaticReminders: { "pt-BR": "Lembretes Automáticos", "en-US": "Automatic Reminders" },
  automaticRemindersDesc: { "pt-BR": "Enviar lembrete 24h antes da aula", "en-US": "Send reminder 24h before class" },
  connectionError: { "pt-BR": "Erro de conexão", "en-US": "Connection error" },
  contactSupport: {
    "pt-BR": "Entre em contato com o suporte para configurar o WhatsApp.",
    "en-US": "Contact support to configure WhatsApp.",
  },
  qualityRating: { "pt-BR": "Qualidade", "en-US": "Quality" },
  connectionSuccess: { "pt-BR": "WhatsApp conectado com sucesso!", "en-US": "WhatsApp connected successfully!" },
  connectionFailed: { "pt-BR": "Falha na conexão com WhatsApp", "en-US": "Failed to connect to WhatsApp" },
  savingSettings: { "pt-BR": "Salvando...", "en-US": "Saving..." },
  settingsSaved: { "pt-BR": "Configurações salvas!", "en-US": "Settings saved!" },
  // Request Activation
  activateTitle: { "pt-BR": "Ative o WhatsApp Bot", "en-US": "Activate WhatsApp Bot" },
  activateDescription: {
    "pt-BR": "Permita que seus clientes interajam com seu estúdio 24/7 via WhatsApp.",
    "en-US": "Let your clients interact with your studio 24/7 via WhatsApp.",
  },
  activateBenefit1: { "pt-BR": "Agendamento automático de aulas", "en-US": "Automatic class booking" },
  activateBenefit2: { "pt-BR": "Confirmação de presença via bot", "en-US": "Attendance confirmation via bot" },
  activateBenefit3: { "pt-BR": "Lembretes automáticos 24h antes", "en-US": "Automatic reminders 24h before" },
  activateBenefit4: { "pt-BR": "Cancelamentos sem ligar", "en-US": "Cancel without calling" },
  requestActivation: { "pt-BR": "Solicitar Ativação", "en-US": "Request Activation" },
  requesting: { "pt-BR": "Enviando...", "en-US": "Sending..." },
  requestSent: { "pt-BR": "Solicitação enviada!", "en-US": "Request sent!" },
  requestSentDesc: {
    "pt-BR": "Entraremos em contato em breve para configurar seu WhatsApp Bot.",
    "en-US": "We'll contact you soon to set up your WhatsApp Bot.",
  },
  pendingActivation: { "pt-BR": "Ativação Pendente", "en-US": "Pending Activation" },
  pendingActivationDesc: {
    "pt-BR": "Sua solicitação está sendo processada. Entraremos em contato em breve.",
    "en-US": "Your request is being processed. We'll contact you soon.",
  },
  // How it works section
  howItWorksTitle: { "pt-BR": "Como Funciona", "en-US": "How It Works" },
  howItWorksDesc: {
    "pt-BR": "Quando conectado, seus clientes podem interagir com seu estúdio pelo WhatsApp.",
    "en-US": "When connected, your clients can interact with your studio via WhatsApp.",
  },
  clientExperience: { "pt-BR": "Experiência do Cliente", "en-US": "Client Experience" },
  clientExperienceDesc: {
    "pt-BR": "Clientes enviam mensagem para seu número do WhatsApp Business e o bot responde automaticamente.",
    "en-US": "Clients message your WhatsApp Business number and the bot responds automatically.",
  },
  availableCommands: { "pt-BR": "Comandos Disponíveis", "en-US": "Available Commands" },
  commandMenu: { "pt-BR": "menu, oi, olá", "en-US": "menu, hi, hello" },
  commandMenuDesc: { "pt-BR": "Mostra o menu principal", "en-US": "Shows the main menu" },
  commandClasses: { "pt-BR": "aulas, minhas aulas", "en-US": "classes, my classes" },
  commandClassesDesc: { "pt-BR": "Lista aulas agendadas", "en-US": "Lists scheduled classes" },
  commandPlan: { "pt-BR": "plano", "en-US": "plan" },
  commandPlanDesc: { "pt-BR": "Mostra aulas restantes", "en-US": "Shows remaining classes" },
  commandBook: { "pt-BR": "agendar, marcar", "en-US": "book, schedule" },
  commandBookDesc: { "pt-BR": "Agenda uma nova aula", "en-US": "Books a new class" },
  commandCancel: { "pt-BR": "cancelar", "en-US": "cancel" },
  commandCancelDesc: { "pt-BR": "Cancela uma aula", "en-US": "Cancels a class" },
  commandConfirm: { "pt-BR": "confirmar presença", "en-US": "confirm attendance" },
  commandConfirmDesc: { "pt-BR": "Confirma presença em uma aula", "en-US": "Confirms attendance for a class" },
  commandHelp: { "pt-BR": "ajuda", "en-US": "help" },
  commandHelpDesc: { "pt-BR": "Lista comandos disponíveis", "en-US": "Lists available commands" },
  interactiveButtons: { "pt-BR": "Botões Interativos", "en-US": "Interactive Buttons" },
  interactiveButtonsDesc: {
    "pt-BR": "O bot também oferece botões clicáveis para facilitar a navegação.",
    "en-US": "The bot also provides clickable buttons for easier navigation.",
  },
  clientRegistration: { "pt-BR": "Registro de Clientes", "en-US": "Client Registration" },
  clientRegistrationDesc: {
    "pt-BR": "Clientes precisam ter o WhatsApp cadastrado no sistema para usar o bot. Vincule o número no cadastro do cliente.",
    "en-US": "Clients need their WhatsApp registered in the system to use the bot. Link their number in the client profile.",
  },
  exampleConversation: { "pt-BR": "Exemplo de Conversa", "en-US": "Example Conversation" },
  // Bot Commands Editor
  botCommandsTitle: { "pt-BR": "Menu do Bot", "en-US": "Bot Menu" },
  botCommandsDesc: { "pt-BR": "Configure os comandos que aparecem no menu do seu bot.", "en-US": "Configure the commands that appear in your bot menu." },
  welcomeMessage: { "pt-BR": "Mensagem de Boas-vindas", "en-US": "Welcome Message" },
  welcomeMessagePlaceholder: { "pt-BR": "Olá! Como posso ajudar?", "en-US": "Hello! How can I help you?" },
  addCommand: { "pt-BR": "Adicionar Comando", "en-US": "Add Command" },
  commandTrigger: { "pt-BR": "Gatilho", "en-US": "Trigger" },
  commandLabel: { "pt-BR": "Texto do Botão", "en-US": "Button Text" },
  commandAction: { "pt-BR": "Ação", "en-US": "Action" },
  customMessageLabel: { "pt-BR": "Mensagem Personalizada", "en-US": "Custom Message" },
  actionViewClasses: { "pt-BR": "Ver Aulas Disponíveis", "en-US": "View Available Classes" },
  actionBookClass: { "pt-BR": "Agendar Aula", "en-US": "Book Class" },
  actionMyBookings: { "pt-BR": "Minhas Reservas", "en-US": "My Bookings" },
  actionCancelBooking: { "pt-BR": "Cancelar Reserva", "en-US": "Cancel Booking" },
  actionRemainingCredits: { "pt-BR": "Créditos Restantes", "en-US": "Remaining Credits" },
  actionContactSupport: { "pt-BR": "Falar com Suporte", "en-US": "Contact Support" },
  actionCustomMessage: { "pt-BR": "Mensagem Personalizada", "en-US": "Custom Message" },
  deleteCommand: { "pt-BR": "Remover", "en-US": "Remove" },
  saveCommands: { "pt-BR": "Salvar Menu", "en-US": "Save Menu" },
  commandsSaved: { "pt-BR": "Menu salvo com sucesso!", "en-US": "Menu saved successfully!" },
  previewTitle: { "pt-BR": "Prévia do Menu", "en-US": "Menu Preview" },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS;

// ============================================================================
// Hook: useWhatsAppTranslations
// ============================================================================

function useWhatsAppTranslations() {
  const { isBrazil } = useLocale();
  const lang = isBrazil ? "pt-BR" : "en-US";

  const t = (key: TranslationKey): string => {
    const translation = TRANSLATIONS[key];
    if (typeof translation === "object" && lang in translation) {
      return translation[lang as keyof typeof translation];
    }
    return key;
  };

  return { t, isBrazil };
}

// ============================================================================
// Icons
// ============================================================================

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const WhatsAppIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// ============================================================================
// Sub-components
// ============================================================================

interface StatusCardProps {
  status: WhatsAppStatus | null;
  loading: boolean;
  onTestConnection: () => void;
  t: (key: TranslationKey) => string;
}

function StatusCard({ status, loading, onTestConnection, t }: StatusCardProps) {
  const isConnected = status?.connected ?? false;
  const hasError = status?.error;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isConnected ? "bg-green-100" : hasError ? "bg-red-100" : "bg-gray-100"
          }`}>
            <WhatsAppIcon className={`w-6 h-6 ${
              isConnected ? "text-green-600" : hasError ? "text-red-600" : "text-gray-400"
            }`} />
          </div>
          <div>
            <p className="font-medium text-gray-900">WhatsApp Bot</p>
            <p className="text-sm text-gray-500">
              {loading ? t("checking") : isConnected ? status?.phoneNumber || t("connected") : hasError ? t("connectionError") : t("notConfigured")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <LoadingSpinner />
              <span className="text-sm">{t("checking")}</span>
            </div>
          ) : isConnected ? (
            <>
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                <CheckIcon />
                {t("connected")}
              </span>
              <Button variant="secondary" onClick={onTestConnection}>
                {t("testConnection")}
              </Button>
            </>
          ) : hasError ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
              <XIcon />
              {t("connectionError")}
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
              {t("notConfigured")}
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{status?.error}</p>
          <p className="text-xs text-red-600 mt-2">{t("contactSupport")}</p>
        </div>
      )}

      {/* Stats when connected */}
      {isConnected && !hasError && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">{t("messagesThisMonth")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">{t("responseRate")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {status?.qualityRating === "GREEN" ? "Alta" : status?.qualityRating === "YELLOW" ? "Média" : "-"}
              </p>
              <p className="text-xs text-gray-500">{t("qualityRating")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BotFeature {
  key: keyof BotFeatureToggle;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

const BOT_FEATURES: BotFeature[] = [
  { key: "viewClasses", titleKey: "viewClasses", descKey: "viewClassesDesc" },
  { key: "confirmAttendance", titleKey: "confirmAttendance", descKey: "confirmAttendanceDesc" },
  { key: "cancelClass", titleKey: "cancelClass", descKey: "cancelClassDesc" },
  { key: "bookNewClass", titleKey: "bookNewClass", descKey: "bookNewClassDesc" },
  { key: "automaticReminders", titleKey: "automaticReminders", descKey: "automaticRemindersDesc" },
];

interface BotFeaturesCardProps {
  features: BotFeatureToggle;
  onToggle: (key: keyof BotFeatureToggle) => void;
  t: (key: TranslationKey) => string;
}

function BotFeaturesCard({ features, onToggle, t }: BotFeaturesCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{t("botFeatures")}</h3>
      <div className="space-y-4">
        {BOT_FEATURES.map((feature, idx) => (
          <div
            key={feature.key}
            className={`flex items-center justify-between py-3 ${
              idx < BOT_FEATURES.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{t(feature.titleKey)}</p>
              <p className="text-xs text-gray-500">{t(feature.descKey)}</p>
            </div>
            <Toggle
              enabled={features[feature.key]}
              onChange={() => onToggle(feature.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// RequestActivationCard Component - For requesting WhatsApp activation
// ============================================================================

interface RequestActivationCardProps {
  onRequestActivation: () => void;
  requesting: boolean;
  requestSent: boolean;
  pendingRequest: boolean;
  t: (key: TranslationKey) => string;
}

const BenefitCheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

function RequestActivationCard({ onRequestActivation, requesting, requestSent, pendingRequest, t }: RequestActivationCardProps) {
  const benefits = [
    t("activateBenefit1"),
    t("activateBenefit2"),
    t("activateBenefit3"),
    t("activateBenefit4"),
  ];

  // Show pending state if request was already sent previously
  if (pendingRequest) {
    return (
      <div className="bg-white border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t("pendingActivation")}</h3>
            <p className="text-sm text-gray-600 mt-1">{t("pendingActivationDesc")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show success state after request is sent
  if (requestSent) {
    return (
      <div className="bg-white border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckIcon />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-700">{t("requestSent")}</h3>
            <p className="text-sm text-gray-600 mt-1">{t("requestSentDesc")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <WhatsAppIcon className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t("activateTitle")}</h3>
          <p className="text-sm text-gray-600 mt-1">{t("activateDescription")}</p>
        </div>
      </div>

      {/* Benefits list */}
      <div className="space-y-3 mb-6">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <BenefitCheckIcon />
            <span className="text-sm text-gray-700">{benefit}</span>
          </div>
        ))}
      </div>

      {/* Request Button */}
      <Button
        onClick={onRequestActivation}
        disabled={requesting}
        className="w-full"
      >
        {requesting ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner />
            {t("requesting")}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <WhatsAppIcon className="w-5 h-5" />
            {t("requestActivation")}
          </span>
        )}
      </Button>
    </div>
  );
}

// ============================================================================
// BotCommandsEditor Component - Customizable bot menu
// ============================================================================

const DEFAULT_COMMANDS: BotMenuCommand[] = [
  { id: "1", trigger: "1", label: "📅 Ver Aulas", action: "VIEW_CLASSES", enabled: true, order: 1 },
  { id: "2", trigger: "2", label: "📖 Agendar", action: "BOOK_CLASS", enabled: true, order: 2 },
  { id: "3", trigger: "3", label: "📋 Minhas Reservas", action: "MY_BOOKINGS", enabled: true, order: 3 },
  { id: "4", trigger: "4", label: "❌ Cancelar", action: "CANCEL_BOOKING", enabled: true, order: 4 },
  { id: "5", trigger: "5", label: "💬 Suporte", action: "CONTACT_SUPPORT", enabled: true, order: 5 },
];

const ACTION_OPTIONS: { value: BotCommandAction; labelKey: TranslationKey }[] = [
  { value: "VIEW_CLASSES", labelKey: "actionViewClasses" },
  { value: "BOOK_CLASS", labelKey: "actionBookClass" },
  { value: "MY_BOOKINGS", labelKey: "actionMyBookings" },
  { value: "CANCEL_BOOKING", labelKey: "actionCancelBooking" },
  { value: "REMAINING_CREDITS", labelKey: "actionRemainingCredits" },
  { value: "CONTACT_SUPPORT", labelKey: "actionContactSupport" },
  { value: "CUSTOM_MESSAGE", labelKey: "actionCustomMessage" },
];

interface BotCommandsEditorProps {
  commands: BotMenuCommand[];
  welcomeMessage: string;
  onCommandsChange: (commands: BotMenuCommand[]) => void;
  onWelcomeMessageChange: (message: string) => void;
  onSave: () => void;
  saving: boolean;
  t: (key: TranslationKey) => string;
  isBrazil: boolean;
}

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const GripIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
  </svg>
);

function BotCommandsEditor({
  commands,
  welcomeMessage,
  onCommandsChange,
  onWelcomeMessageChange,
  onSave,
  saving,
  t,
  isBrazil,
}: BotCommandsEditorProps) {
  const addCommand = () => {
    const newId = String(Date.now());
    const newOrder = commands.length + 1;
    const newCommand: BotMenuCommand = {
      id: newId,
      trigger: String(newOrder),
      label: isBrazil ? "Novo Comando" : "New Command",
      action: "CUSTOM_MESSAGE",
      customMessage: "",
      enabled: true,
      order: newOrder,
    };
    onCommandsChange([...commands, newCommand]);
  };

  const updateCommand = (id: string, updates: Partial<BotMenuCommand>) => {
    onCommandsChange(
      commands.map((cmd) => (cmd.id === id ? { ...cmd, ...updates } : cmd))
    );
  };

  const deleteCommand = (id: string) => {
    const filtered = commands.filter((cmd) => cmd.id !== id);
    // Reorder triggers
    const reordered = filtered.map((cmd, idx) => ({
      ...cmd,
      trigger: String(idx + 1),
      order: idx + 1,
    }));
    onCommandsChange(reordered);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("botCommandsTitle")}</h3>
      <p className="text-sm text-gray-600 mb-6">{t("botCommandsDesc")}</p>

      {/* Welcome Message */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("welcomeMessage")}
        </label>
        <textarea
          value={welcomeMessage}
          onChange={(e) => onWelcomeMessageChange(e.target.value)}
          placeholder={t("welcomeMessagePlaceholder")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          rows={2}
        />
      </div>

      {/* Commands List */}
      <div className="space-y-3 mb-4">
        {commands.map((cmd) => (
          <div
            key={cmd.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            {/* Grip handle */}
            <div className="mt-2 cursor-move">
              <GripIcon />
            </div>

            {/* Trigger number */}
            <div className="w-12">
              <input
                type="text"
                value={cmd.trigger}
                onChange={(e) => updateCommand(cmd.id, { trigger: e.target.value })}
                className="w-full px-2 py-1.5 text-center border border-gray-300 rounded text-sm font-mono"
                maxLength={2}
              />
            </div>

            {/* Label */}
            <div className="flex-1">
              <input
                type="text"
                value={cmd.label}
                onChange={(e) => updateCommand(cmd.id, { label: e.target.value })}
                placeholder={t("commandLabel")}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Action select */}
            <div className="w-44">
              <select
                value={cmd.action}
                onChange={(e) => updateCommand(cmd.id, { action: e.target.value as BotCommandAction })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle enabled */}
            <Toggle
              enabled={cmd.enabled}
              onChange={() => updateCommand(cmd.id, { enabled: !cmd.enabled })}
            />

            {/* Delete button */}
            <button
              onClick={() => deleteCommand(cmd.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
              title={t("deleteCommand")}
            >
              <TrashIcon />
            </button>
          </div>
        ))}

        {/* Custom message input for CUSTOM_MESSAGE actions */}
        {commands
          .filter((cmd) => cmd.action === "CUSTOM_MESSAGE" && cmd.enabled)
          .map((cmd) => (
            <div key={`msg-${cmd.id}`} className="ml-8 pl-4 border-l-2 border-gray-200">
              <label className="block text-xs text-gray-500 mb-1">
                {t("customMessageLabel")} ({cmd.label})
              </label>
              <textarea
                value={cmd.customMessage || ""}
                onChange={(e) => updateCommand(cmd.id, { customMessage: e.target.value })}
                placeholder={isBrazil ? "Digite a mensagem que será enviada..." : "Enter the message to be sent..."}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                rows={2}
              />
            </div>
          ))}
      </div>

      {/* Add Command Button */}
      <button
        onClick={addCommand}
        className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium mb-6"
      >
        <PlusIcon />
        {t("addCommand")}
      </button>

      {/* Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t("previewTitle")}</h4>
        <div className="bg-gray-900 rounded-lg p-4">
          {/* Bot welcome message */}
          <div className="flex justify-start mb-3">
            <div className="bg-gray-700 text-white text-sm px-3 py-2 rounded-lg max-w-[85%]">
              <p className="mb-2">{welcomeMessage || t("welcomeMessagePlaceholder")}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {commands
                  .filter((cmd) => cmd.enabled)
                  .sort((a, b) => a.order - b.order)
                  .map((cmd) => (
                    <span
                      key={cmd.id}
                      className="bg-gray-600 px-2 py-1 rounded text-xs"
                    >
                      {cmd.label}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={onSave} disabled={saving} className="w-full">
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner />
            {t("savingSettings")}
          </span>
        ) : (
          t("saveCommands")
        )}
      </Button>
    </div>
  );
}

// ============================================================================
// HowItWorksCard Component - Explains how the bot works
// ============================================================================

interface HowItWorksCardProps {
  t: (key: TranslationKey) => string;
  isBrazil: boolean;
}

const MessageBubbleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const CommandIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

function HowItWorksCard({ t, isBrazil }: HowItWorksCardProps) {
  const commands = [
    { cmd: t("commandMenu"), desc: t("commandMenuDesc") },
    { cmd: t("commandClasses"), desc: t("commandClassesDesc") },
    { cmd: t("commandPlan"), desc: t("commandPlanDesc") },
    { cmd: t("commandBook"), desc: t("commandBookDesc") },
    { cmd: t("commandCancel"), desc: t("commandCancelDesc") },
    { cmd: t("commandConfirm"), desc: t("commandConfirmDesc") },
    { cmd: t("commandHelp"), desc: t("commandHelpDesc") },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("howItWorksTitle")}</h3>
      <p className="text-sm text-gray-600 mb-6">{t("howItWorksDesc")}</p>

      {/* Client Experience */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <MessageBubbleIcon />
          </div>
          <h4 className="font-medium text-gray-900">{t("clientExperience")}</h4>
        </div>
        <p className="text-sm text-gray-600 ml-10">{t("clientExperienceDesc")}</p>
      </div>

      {/* Available Commands */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            <CommandIcon />
          </div>
          <h4 className="font-medium text-gray-900">{t("availableCommands")}</h4>
        </div>
        <div className="ml-10 bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            {commands.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono text-gray-700 whitespace-nowrap">
                  {item.cmd}
                </code>
                <span className="text-sm text-gray-600">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Buttons */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <WhatsAppIcon className="w-5 h-5" />
          </div>
          <h4 className="font-medium text-gray-900">{t("interactiveButtons")}</h4>
        </div>
        <p className="text-sm text-gray-600 ml-10">{t("interactiveButtonsDesc")}</p>
      </div>

      {/* Client Registration Note */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <UserIcon />
          </div>
          <h4 className="font-medium text-gray-900">{t("clientRegistration")}</h4>
        </div>
        <p className="text-sm text-gray-600 ml-10">{t("clientRegistrationDesc")}</p>
      </div>

      {/* Example Conversation */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">{t("exampleConversation")}</h4>
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          {/* Client message */}
          <div className="flex justify-end">
            <div className="bg-green-600 text-white text-sm px-3 py-2 rounded-lg max-w-[80%]">
              {isBrazil ? "oi" : "hi"}
            </div>
          </div>
          {/* Bot response */}
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white text-sm px-3 py-2 rounded-lg max-w-[80%]">
              <p className="mb-2">{isBrazil ? "Olá Maria! 👋" : "Hello Maria! 👋"}</p>
              <p className="text-gray-300 text-xs mb-2">
                {isBrazil ? "O que você gostaria de fazer?" : "What would you like to do?"}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="bg-gray-600 px-2 py-1 rounded text-xs">
                  {isBrazil ? "📅 Ver Aulas" : "📅 View Classes"}
                </span>
                <span className="bg-gray-600 px-2 py-1 rounded text-xs">
                  {isBrazil ? "✅ Confirmar" : "✅ Confirm"}
                </span>
                <span className="bg-gray-600 px-2 py-1 rounded text-xs">
                  {isBrazil ? "📖 Agendar" : "📖 Book"}
                </span>
              </div>
            </div>
          </div>
          {/* Client clicks button */}
          <div className="flex justify-end">
            <div className="bg-green-600 text-white text-sm px-3 py-2 rounded-lg">
              {isBrazil ? "📅 Ver Aulas" : "📅 View Classes"}
            </div>
          </div>
          {/* Bot shows classes */}
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white text-sm px-3 py-2 rounded-lg max-w-[80%]">
              <p className="font-medium mb-1">{isBrazil ? "Suas próximas aulas:" : "Your upcoming classes:"}</p>
              <p className="text-xs text-gray-300">1. Pilates - {isBrazil ? "Seg" : "Mon"} 10:00</p>
              <p className="text-xs text-gray-300">2. Yoga - {isBrazil ? "Qua" : "Wed"} 14:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WhatsAppSettings({ onBack }: WhatsAppSettingsProps) {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<BotFeatureToggle>(INITIAL_FEATURES);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);
  // Bot commands state
  const [botCommands, setBotCommands] = useState<BotMenuCommand[]>(DEFAULT_COMMANDS);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [savingCommands, setSavingCommands] = useState(false);

  const { t, isBrazil } = useWhatsAppTranslations();

  // Check WhatsApp connection status on mount
  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/credentials", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        // Load bot features from server
        if (data.botFeatures) {
          setFeatures(data.botFeatures);
        }
        // Load bot commands from server
        if (data.botCommands && data.botCommands.length > 0) {
          setBotCommands(data.botCommands);
        }
        if (data.botWelcomeMessage) {
          setWelcomeMessage(data.botWelcomeMessage);
        }
      } else {
        setStatus({ connected: false, error: data.error || "Failed to check status" });
      }
    } catch (error) {
      console.error("Failed to check WhatsApp status:", error);
      setStatus({ connected: false, error: "Failed to connect" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequestActivation = async () => {
    setRequesting(true);
    try {
      const res = await fetch("/api/admin/whatsapp/request-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.ok) {
        setRequestSent(true);
        showToast(t("requestSent"));
      } else {
        const data = await res.json();
        showToast(data.error || t("connectionFailed"));
      }
    } catch (error) {
      console.error("Failed to request activation:", error);
      showToast(t("connectionFailed"));
    } finally {
      setRequesting(false);
    }
  };

  const handleToggleFeature = async (key: keyof BotFeatureToggle) => {
    const newFeatures = { ...features, [key]: !features[key] };
    setFeatures(newFeatures);

    // Save to server
    setSavingFeatures(true);
    try {
      const res = await fetch("/api/admin/whatsapp/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ botFeatures: newFeatures }),
      });

      if (res.ok) {
        showToast(t("settingsSaved"));
      }
    } catch (error) {
      console.error("Failed to save feature settings:", error);
      // Revert on error
      setFeatures(features);
    } finally {
      setSavingFeatures(false);
    }
  };

  const handleSaveCommands = async () => {
    setSavingCommands(true);
    try {
      const res = await fetch("/api/admin/whatsapp/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          botCommands,
          botWelcomeMessage: welcomeMessage,
        }),
      });

      if (res.ok) {
        showToast(t("commandsSaved"));
      }
    } catch (error) {
      console.error("Failed to save bot commands:", error);
      showToast(t("connectionFailed"));
    } finally {
      setSavingCommands(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <BackIcon />
            {t("backToAddons")}
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        <p className="text-sm text-gray-600 mt-1">{t("description")}</p>
      </div>

      {/* Status Card */}
      <StatusCard
        status={status}
        loading={loading}
        onTestConnection={checkStatus}
        t={t}
      />

      {/* Request Activation Card - when not connected */}
      {!status?.connected && !loading && (
        <RequestActivationCard
          onRequestActivation={handleRequestActivation}
          requesting={requesting}
          requestSent={requestSent}
          pendingRequest={status?.pendingRequest || false}
          t={t}
        />
      )}

      {/* Bot Features - only show when connected */}
      {status?.connected && (
        <div className="relative">
          {savingFeatures && (
            <div className="absolute top-2 right-2">
              <LoadingSpinner />
            </div>
          )}
          <BotFeaturesCard
            features={features}
            onToggle={handleToggleFeature}
            t={t}
          />
        </div>
      )}

      {/* Bot Commands Editor - only show when connected */}
      {status?.connected && (
        <BotCommandsEditor
          commands={botCommands}
          welcomeMessage={welcomeMessage}
          onCommandsChange={setBotCommands}
          onWelcomeMessageChange={setWelcomeMessage}
          onSave={handleSaveCommands}
          saving={savingCommands}
          t={t}
          isBrazil={isBrazil}
        />
      )}

      {/* How It Works - always show */}
      <HowItWorksCard t={t} isBrazil={isBrazil} />
    </div>
  );
}
