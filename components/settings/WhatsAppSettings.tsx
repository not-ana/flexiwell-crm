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

interface WhatsAppSettingsProps {
  onBack?: () => void;
}

type WhatsAppPlan = "starter" | "pro" | "enterprise";

interface WhatsAppPlanDetails {
  name: string;
  priceUSD: string;
  priceBRL: string;
  features: {
    en: string[];
    pt: string[];
  };
  highlighted?: boolean;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
}

// ============================================================================
// Constants
// ============================================================================

const WHATSAPP_PLANS: Record<WhatsAppPlan, WhatsAppPlanDetails> = {
  starter: {
    name: "Starter",
    priceUSD: "$49/month",
    priceBRL: "R$149/mês",
    features: {
      en: [
        "View scheduled classes",
        "Confirm attendance",
        "500 conversations/month",
        "Basic automated messages",
      ],
      pt: [
        "Ver aulas agendadas",
        "Confirmar presença",
        "500 conversas/mês",
        "Mensagens automatizadas básicas",
      ],
    },
  },
  pro: {
    name: "Pro",
    priceUSD: "$99/month",
    priceBRL: "R$299/mês",
    features: {
      en: [
        "Everything in Starter",
        "Cancel classes",
        "Book new classes",
        "2,000 conversations/month",
        "Proactive notifications",
        "Automatic reminders",
      ],
      pt: [
        "Tudo do Starter",
        "Cancelar aulas",
        "Agendar novas aulas",
        "2.000 conversas/mês",
        "Notificações proativas",
        "Lembretes automáticos",
      ],
    },
    highlighted: true,
  },
  enterprise: {
    name: "Enterprise",
    priceUSD: "$199/month",
    priceBRL: "R$599/mês",
    features: {
      en: [
        "Everything in Pro",
        "Unlimited conversations",
        "Multiple phone numbers",
        "Advanced reports",
        "Priority support",
        "Custom integrations",
      ],
      pt: [
        "Tudo do Pro",
        "Conversas ilimitadas",
        "Múltiplos números",
        "Relatórios avançados",
        "Suporte prioritário",
        "Integrações customizadas",
      ],
    },
  },
};

const INITIAL_TWILIO_CONFIG: TwilioConfig = {
  accountSid: "",
  authToken: "",
  whatsappNumber: "",
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
  active: { "pt-BR": "Ativo", "en-US": "Active" },
  notConfigured: { "pt-BR": "Não configurado", "en-US": "Not configured" },
  configure: { "pt-BR": "Configurar", "en-US": "Configure" },
  enableWhatsApp: { "pt-BR": "Ativar WhatsApp", "en-US": "Enable WhatsApp" },
  messagesThisMonth: { "pt-BR": "Mensagens este mês", "en-US": "Messages this month" },
  responseRate: { "pt-BR": "Taxa de resposta", "en-US": "Response rate" },
  botConfirmations: { "pt-BR": "Confirmações via bot", "en-US": "Bot confirmations" },
  whatsappPlans: { "pt-BR": "Planos WhatsApp", "en-US": "WhatsApp Plans" },
  currentPlan: { "pt-BR": "Plano Atual", "en-US": "Current Plan" },
  select: { "pt-BR": "Selecionar", "en-US": "Select" },
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
  configureTwilio: { "pt-BR": "Configurar Twilio", "en-US": "Configure Twilio" },
  twilioAccountNeeded: {
    "pt-BR": "Para usar o WhatsApp Business, você precisa de uma conta Twilio.",
    "en-US": "To use WhatsApp Business, you need a Twilio account.",
  },
  createFreeAccount: { "pt-BR": "Criar conta gratuita", "en-US": "Create free account" },
  foundInTwilio: { "pt-BR": "Encontrado no Console Twilio", "en-US": "Found in Twilio Console" },
  whatsappNumber: { "pt-BR": "Número WhatsApp", "en-US": "WhatsApp Number" },
  whatsappApprovedNumber: { "pt-BR": "Número aprovado pelo WhatsApp no Twilio", "en-US": "WhatsApp approved number in Twilio" },
  webhookUrl: { "pt-BR": "Webhook URL", "en-US": "Webhook URL" },
  webhookInstructions: {
    "pt-BR": "Configure esta URL no Console Twilio → Messaging → WhatsApp Sandbox",
    "en-US": "Configure this URL in Twilio Console → Messaging → WhatsApp Sandbox",
  },
  cancel: { "pt-BR": "Cancelar", "en-US": "Cancel" },
  saveAndEnable: { "pt-BR": "Salvar e Ativar", "en-US": "Save and Enable" },
  saving: { "pt-BR": "Salvando...", "en-US": "Saving..." },
  allFieldsRequired: { "pt-BR": "Todos os campos são obrigatórios", "en-US": "All fields are required" },
  connectedSuccess: { "pt-BR": "WhatsApp conectado com sucesso", "en-US": "WhatsApp connected successfully" },
  failedToSave: { "pt-BR": "Falha ao salvar configuração", "en-US": "Failed to save configuration" },
  plan: { "pt-BR": "Plano", "en-US": "Plan" },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS;

// ============================================================================
// Hook: useWhatsAppTranslations
// ============================================================================

function useWhatsAppTranslations() {
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

const WhatsAppIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// ============================================================================
// Sub-components
// ============================================================================

interface StatusCardProps {
  isEnabled: boolean;
  selectedPlan: WhatsAppPlan;
  onConfigure: () => void;
  t: (key: TranslationKey) => string;
}

function StatusCard({ isEnabled, selectedPlan, onConfigure, t }: StatusCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <WhatsAppIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">WhatsApp Bot</p>
            <p className="text-sm text-gray-500">
              {isEnabled
                ? `${t("active")} • ${WHATSAPP_PLANS[selectedPlan].name} ${t("plan")}`
                : t("notConfigured")}
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
            <Button onClick={onConfigure}>{t("enableWhatsApp")}</Button>
          )}
        </div>
      </div>

      {isEnabled && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">1,247</p>
              <p className="text-xs text-gray-500">{t("messagesThisMonth")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">89%</p>
              <p className="text-xs text-gray-500">{t("responseRate")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">156</p>
              <p className="text-xs text-gray-500">{t("botConfirmations")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PlanCardProps {
  planKey: WhatsAppPlan;
  plan: WhatsAppPlanDetails;
  isSelected: boolean;
  onSelect: () => void;
  isBrazil: boolean;
  t: (key: TranslationKey) => string;
}

function PlanCard({ planKey, plan, isSelected, onSelect, isBrazil, t }: PlanCardProps) {
  const features = isBrazil ? plan.features.pt : plan.features.en;
  const price = isBrazil ? plan.priceBRL : plan.priceUSD;

  return (
    <div
      className={`relative bg-white border-2 rounded-xl p-5 transition-all cursor-pointer flex flex-col h-full ${
        isSelected
          ? "border-primary-500 ring-2 ring-primary-100"
          : "border-gray-200 hover:border-gray-300"
      } ${plan.highlighted ? "shadow-lg" : ""}`}
      onClick={onSelect}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
            Popular
          </span>
        </div>
      )}
      <div className="text-center mb-4">
        <h4 className="font-semibold text-gray-900">{plan.name}</h4>
        <p className="text-2xl font-bold text-gray-900 mt-1">{price}</p>
      </div>
      <ul className="space-y-2 flex-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
            isSelected
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isSelected ? t("currentPlan") : t("select")}
        </button>
      </div>
    </div>
  );
}

interface BotFeature {
  titleKey: TranslationKey;
  descKey: TranslationKey;
  requiresPro: boolean;
}

const BOT_FEATURES: BotFeature[] = [
  { titleKey: "viewClasses", descKey: "viewClassesDesc", requiresPro: false },
  { titleKey: "confirmAttendance", descKey: "confirmAttendanceDesc", requiresPro: false },
  { titleKey: "cancelClass", descKey: "cancelClassDesc", requiresPro: true },
  { titleKey: "bookNewClass", descKey: "bookNewClassDesc", requiresPro: true },
  { titleKey: "automaticReminders", descKey: "automaticRemindersDesc", requiresPro: true },
];

interface BotFeaturesCardProps {
  selectedPlan: WhatsAppPlan;
  t: (key: TranslationKey) => string;
}

function BotFeaturesCard({ selectedPlan, t }: BotFeaturesCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{t("botFeatures")}</h3>
      <div className="space-y-4">
        {BOT_FEATURES.map((feature, idx) => {
          const isEnabled = !feature.requiresPro || selectedPlan !== "starter";
          return (
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
              <Toggle enabled={isEnabled} onChange={() => {}} />
            </div>
          );
        })}
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
  const isValid = config.accountSid && config.authToken && config.whatsappNumber;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <WhatsAppIcon className="w-5 h-5 text-green-600" />
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
          label={t("whatsappNumber")}
          value={config.whatsappNumber}
          onChange={(e) => onConfigChange({ ...config, whatsappNumber: e.target.value })}
          placeholder="+15551234567"
          hint={t("whatsappApprovedNumber")}
        />

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">{t("webhookUrl")}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-600 overflow-x-auto">
              https://your-domain.com/api/webhook/whatsapp/twilio
            </code>
            <button className="px-3 py-2 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50">
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
        <Button onClick={onSave} disabled={!isValid || saving} className="flex-1">
          {saving ? t("saving") : t("saveAndEnable")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WhatsAppSettings({ onBack }: WhatsAppSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WhatsAppPlan>("pro");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>(INITIAL_TWILIO_CONFIG);

  const { t, isBrazil } = useWhatsAppTranslations();

  // Load WhatsApp config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/whatsapp/status");
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setIsEnabled(true);
          }
        }
      } catch (error) {
        console.error("Failed to load WhatsApp config:", error);
      }
    }
    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.whatsappNumber) {
      showToast(t("allFieldsRequired"), "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/whatsapp/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid: twilioConfig.accountSid,
          authToken: twilioConfig.authToken,
          phoneNumber: twilioConfig.whatsappNumber,
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

      {/* Status Card */}
      <StatusCard
        isEnabled={isEnabled}
        selectedPlan={selectedPlan}
        onConfigure={() => setShowConfigModal(true)}
        t={t}
      />

      {/* Pricing Plans */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">{t("whatsappPlans")}</h3>
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(WHATSAPP_PLANS) as WhatsAppPlan[]).map((planKey) => (
            <PlanCard
              key={planKey}
              planKey={planKey}
              plan={WHATSAPP_PLANS[planKey]}
              isSelected={selectedPlan === planKey}
              onSelect={() => setSelectedPlan(planKey)}
              isBrazil={isBrazil}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Bot Features */}
      <BotFeaturesCard selectedPlan={selectedPlan} t={t} />

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
