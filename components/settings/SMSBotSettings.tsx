"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Toggle } from "@/components/ui/Toggle";
import { useLocale } from "@/hooks/useLocale";
import { showToast } from "./shared";

// ============================================================================
// Types
// ============================================================================

interface SMSBotSettingsProps {
  onBack?: () => void;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_TWILIO_CONFIG: TwilioConfig = {
  accountSid: "",
  authToken: "",
  phoneNumber: "",
};

// ============================================================================
// Translations
// ============================================================================

const TRANSLATIONS = {
  backToAddons: { "pt-BR": "Voltar para Add-ons", "en-US": "Back to Add-ons" },
  title: { "pt-BR": "SMS AI Bot", "en-US": "SMS AI Bot" },
  description: {
    "pt-BR": "Permita que seus clientes agendem, cancelem e consultem aulas por SMS. Apenas mercado EUA.",
    "en-US": "Let your clients book, cancel, and check classes via SMS. US market only.",
  },
  usOnly: { "pt-BR": "Disponível apenas nos EUA", "en-US": "Available in US only" },
  usOnlyDesc: {
    "pt-BR": "O SMS Bot é destinado ao mercado americano. Para o Brasil, use o WhatsApp Bot que é mais popular e econômico.",
    "en-US": "SMS Bot is for the US market. For Brazil, use WhatsApp Bot which is more popular and cost-effective.",
  },
  active: { "pt-BR": "Ativo", "en-US": "Active" },
  twilioConfigured: { "pt-BR": "Ativo • Twilio configurado", "en-US": "Active • Twilio configured" },
  notConfigured: { "pt-BR": "Não configurado", "en-US": "Not configured" },
  configure: { "pt-BR": "Configurar", "en-US": "Configure" },
  enableSmsBot: { "pt-BR": "Ativar SMS Bot", "en-US": "Enable SMS Bot" },
  messagesThisMonth: { "pt-BR": "Mensagens este mês", "en-US": "Messages this month" },
  responseRate: { "pt-BR": "Taxa de resposta", "en-US": "Response rate" },
  botBookings: { "pt-BR": "Reservas via bot", "en-US": "Bot bookings" },
  pricing: { "pt-BR": "Preço", "en-US": "Pricing" },
  perMonth: { "pt-BR": "/mês", "en-US": "/month" },
  plusCredits: { "pt-BR": "+ créditos SMS", "en-US": "+ SMS credits" },
  pricingNote: { "pt-BR": "Nota:", "en-US": "Note:" },
  pricingNoteDesc: {
    "pt-BR": "O SMS Bot requer créditos SMS separados. Cada mensagem enviada/recebida consome 1 crédito.",
    "en-US": "SMS Bot requires separate SMS credits. Each message sent/received uses 1 credit.",
  },
  botFeatures: { "pt-BR": "Recursos do Bot", "en-US": "Bot Features" },
  viewClasses: { "pt-BR": "Ver Aulas", "en-US": "View Classes" },
  viewClassesDesc: { "pt-BR": "Cliente visualiza suas aulas agendadas", "en-US": "Client views their upcoming scheduled classes" },
  bookClasses: { "pt-BR": "Agendar Aulas", "en-US": "Book Classes" },
  bookClassesDesc: { "pt-BR": "Cliente agenda novas aulas por SMS", "en-US": "Client books new classes via SMS" },
  cancelClasses: { "pt-BR": "Cancelar Aulas", "en-US": "Cancel Classes" },
  cancelClassesDesc: { "pt-BR": "Cliente cancela aulas diretamente", "en-US": "Client cancels classes directly" },
  confirmAttendance: { "pt-BR": "Confirmar Presença", "en-US": "Confirm Attendance" },
  confirmAttendanceDesc: { "pt-BR": "Cliente confirma presença para aulas", "en-US": "Client confirms attendance for classes" },
  naturalLanguage: { "pt-BR": "Linguagem Natural", "en-US": "Natural Language" },
  naturalLanguageDesc: { "pt-BR": "Entende mensagens em linguagem natural", "en-US": "Understands natural language messages" },
  exampleConversation: { "pt-BR": "Exemplo de Conversa", "en-US": "Example Conversation" },
  configureTwilio: { "pt-BR": "Configurar Twilio SMS", "en-US": "Configure Twilio SMS" },
  twilioAccountNeeded: {
    "pt-BR": "Para usar o SMS Bot, você precisa de uma conta Twilio.",
    "en-US": "To use SMS Bot, you need a Twilio account.",
  },
  createFreeAccount: { "pt-BR": "Criar conta gratuita", "en-US": "Create free account" },
  foundInTwilio: { "pt-BR": "Encontrado no Console Twilio", "en-US": "Found in Twilio Console" },
  smsPhoneNumber: { "pt-BR": "Número SMS", "en-US": "SMS Phone Number" },
  smsEnabledNumber: { "pt-BR": "Número com SMS habilitado no Twilio", "en-US": "SMS-enabled number from Twilio" },
  webhookUrl: { "pt-BR": "Webhook URL", "en-US": "Webhook URL" },
  webhookInstructions: {
    "pt-BR": "Configure esta URL no Console Twilio → Phone Numbers → Seu Número → Messaging",
    "en-US": "Configure this URL in Twilio Console → Phone Numbers → Your Number → Messaging",
  },
  cancel: { "pt-BR": "Cancelar", "en-US": "Cancel" },
  saveAndEnable: { "pt-BR": "Salvar e Ativar", "en-US": "Save and Enable" },
  saving: { "pt-BR": "Salvando...", "en-US": "Saving..." },
  allFieldsRequired: { "pt-BR": "Todos os campos são obrigatórios", "en-US": "All fields are required" },
  connectedSuccess: { "pt-BR": "SMS Bot conectado com sucesso", "en-US": "SMS Bot connected successfully" },
  failedToSave: { "pt-BR": "Falha ao salvar configuração", "en-US": "Failed to save configuration" },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS;

// ============================================================================
// Hook: useSMSBotTranslations
// ============================================================================

function useSMSBotTranslations() {
  const { isBrazil, locale } = useLocale();
  const lang = isBrazil ? "pt-BR" : "en-US";

  const t = (key: TranslationKey): string => {
    const translation = TRANSLATIONS[key];
    if (typeof translation === "object" && lang in translation) {
      return translation[lang as keyof typeof translation];
    }
    return key;
  };

  return { t, isBrazil, locale };
}

// ============================================================================
// Icons
// ============================================================================

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SMSBotIcon = () => (
  <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
    <path d="M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
    <circle cx="8" cy="9" r="1" />
    <circle cx="16" cy="9" r="1" />
  </svg>
);

// ============================================================================
// Sub-components
// ============================================================================

interface USMarketNoticeProps {
  t: (key: TranslationKey) => string;
}

function USMarketNotice({ t }: USMarketNoticeProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <InfoIcon />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900">{t("usOnly")}</p>
          <p className="text-sm text-blue-700 mt-1">{t("usOnlyDesc")}</p>
        </div>
      </div>
    </div>
  );
}

interface StatusCardProps {
  isEnabled: boolean;
  onConfigure: () => void;
  t: (key: TranslationKey) => string;
  isBrazil: boolean;
}

function StatusCard({ isEnabled, onConfigure, t, isBrazil }: StatusCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <SMSBotIcon />
          </div>
          <div>
            <p className="font-medium text-gray-900">SMS AI Bot</p>
            <p className="text-sm text-gray-500">
              {isEnabled ? t("twilioConfigured") : t("notConfigured")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                {t("active")}
              </span>
              <Button variant="secondary" onClick={onConfigure}>
                {t("configure")}
              </Button>
            </>
          ) : (
            <Button onClick={onConfigure}>{t("enableSmsBot")}</Button>
          )}
        </div>
      </div>

      {isEnabled && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">324</p>
              <p className="text-xs text-gray-500">{t("messagesThisMonth")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">92%</p>
              <p className="text-xs text-gray-500">{t("responseRate")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">47</p>
              <p className="text-xs text-gray-500">{t("botBookings")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PricingCardProps {
  t: (key: TranslationKey) => string;
  isBrazil: boolean;
}

function PricingCard({ t, isBrazil }: PricingCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-2">{t("pricing")}</h3>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-gray-900">{isBrazil ? "R$49" : "$19"}</span>
        <span className="text-gray-500">{t("perMonth")}</span>
        <span className="text-sm text-gray-500">{t("plusCredits")}</span>
      </div>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <span className="font-medium">{t("pricingNote")}</span> {t("pricingNoteDesc")}
        </p>
      </div>
    </div>
  );
}

interface BotFeature {
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

const BOT_FEATURES: BotFeature[] = [
  { titleKey: "viewClasses", descKey: "viewClassesDesc" },
  { titleKey: "bookClasses", descKey: "bookClassesDesc" },
  { titleKey: "cancelClasses", descKey: "cancelClassesDesc" },
  { titleKey: "confirmAttendance", descKey: "confirmAttendanceDesc" },
  { titleKey: "naturalLanguage", descKey: "naturalLanguageDesc" },
];

interface BotFeaturesCardProps {
  t: (key: TranslationKey) => string;
}

function BotFeaturesCard({ t }: BotFeaturesCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{t("botFeatures")}</h3>
      <div className="space-y-4">
        {BOT_FEATURES.map((feature, idx) => (
          <div
            key={feature.titleKey}
            className={`flex items-center justify-between py-3 ${
              idx < BOT_FEATURES.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{t(feature.titleKey)}</p>
              <p className="text-xs text-gray-500">{t(feature.descKey)}</p>
            </div>
            <Toggle enabled={true} onChange={() => {}} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ExampleConversation({ t }: { t: (key: TranslationKey) => string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{t("exampleConversation")}</h3>
      <div className="space-y-3 max-w-sm">
        <div className="flex justify-end">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm">
            Book yoga tomorrow
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-tl-sm text-sm">
            Sure! I found these Yoga classes for tomorrow:
            <br />
            1. Yoga Flow - 9am (3 spots)
            <br />
            2. Hot Yoga - 2pm (5 spots)
            <br />
            3. Yin Yoga - 6pm (2 spots)
            <br />
            Reply with 1, 2, or 3 to book.
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm">
            1
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-tl-sm text-sm">
            Done! You're booked for Yoga Flow tomorrow at 9am. See you there!
          </div>
        </div>
      </div>
    </div>
  );
}

interface TwilioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  config: TwilioConfig;
  onConfigChange: (config: TwilioConfig) => void;
  saving: boolean;
  t: (key: TranslationKey) => string;
}

function TwilioConfigModal({
  isOpen,
  onClose,
  onSave,
  config,
  onConfigChange,
  saving,
  t,
}: TwilioConfigModalProps) {
  const isValid = config.accountSid && config.authToken && config.phoneNumber;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
            </svg>
          </div>
          <ModalTitle>{t("configureTwilio")}</ModalTitle>
        </div>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {t("twilioAccountNeeded")}
            <a
              href="https://www.twilio.com/try-twilio"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline ml-1"
            >
              {t("createFreeAccount")}
            </a>
          </p>
        </div>

        <FormField
          label="Account SID"
          value={config.accountSid}
          onChange={(e) => onConfigChange({ ...config, accountSid: e.target.value })}
          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          hint={t("foundInTwilio")}
        />

        <FormField
          label="Auth Token"
          type="password"
          value={config.authToken}
          onChange={(e) => onConfigChange({ ...config, authToken: e.target.value })}
          placeholder="••••••••••••••••••••••••••••••••"
        />

        <FormField
          label={t("smsPhoneNumber")}
          value={config.phoneNumber}
          onChange={(e) => onConfigChange({ ...config, phoneNumber: e.target.value })}
          placeholder="+15551234567"
          hint={t("smsEnabledNumber")}
        />

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">{t("webhookUrl")}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-600 overflow-x-auto">
              https://your-domain.com/api/webhook/sms
            </code>
            <button className="px-3 py-2 text-xs font-medium text-purple-600 border border-purple-200 rounded hover:bg-purple-50">
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t("webhookInstructions")}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="flex-1">
          {t("cancel")}
        </Button>
        <Button
          onClick={onSave}
          disabled={!isValid || saving}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {saving ? t("saving") : t("saveAndEnable")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SMSBotSettings({ onBack }: SMSBotSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>(INITIAL_TWILIO_CONFIG);

  const { t, isBrazil } = useSMSBotTranslations();

  // Load SMS config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/sms/status");
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setIsEnabled(true);
          }
        }
      } catch (error) {
        console.error("Failed to load SMS config:", error);
      }
    }
    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.phoneNumber) {
      showToast(t("allFieldsRequired"), "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/sms/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid: twilioConfig.accountSid,
          authToken: twilioConfig.authToken,
          phoneNumber: twilioConfig.phoneNumber,
        }),
      });

      if (res.ok) {
        showToast(t("connectedSuccess"));
        setShowConfigModal(false);
        setIsEnabled(true);
      } else {
        const data = await res.json();
        showToast(data.error || t("failedToSave"), "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast(t("failedToSave"), "error");
    } finally {
      setSaving(false);
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

      {/* US Market Notice */}
      <USMarketNotice t={t} />

      {/* Status Card */}
      <StatusCard
        isEnabled={isEnabled}
        onConfigure={() => setShowConfigModal(true)}
        t={t}
        isBrazil={isBrazil}
      />

      {/* Pricing */}
      <PricingCard t={t} isBrazil={isBrazil} />

      {/* Bot Features */}
      <BotFeaturesCard t={t} />

      {/* Example Conversation */}
      <ExampleConversation t={t} />

      {/* Twilio Configuration Modal */}
      <TwilioConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveConfig}
        config={twilioConfig}
        onConfigChange={setTwilioConfig}
        saving={saving}
        t={t}
      />
    </div>
  );
}
