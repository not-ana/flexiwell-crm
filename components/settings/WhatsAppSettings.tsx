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

interface CloudApiConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  verifyToken: string;
}

interface BotFeatureToggle {
  viewClasses: boolean;
  confirmAttendance: boolean;
  cancelClass: boolean;
  bookNewClass: boolean;
  automaticReminders: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_CONFIG: CloudApiConfig = {
  phoneNumberId: "",
  accessToken: "",
  businessAccountId: "",
  verifyToken: "",
};

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
  configure: { "pt-BR": "Configurar", "en-US": "Configure" },
  enableWhatsApp: { "pt-BR": "Conectar WhatsApp", "en-US": "Connect WhatsApp" },
  disconnect: { "pt-BR": "Desconectar", "en-US": "Disconnect" },
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
  configureWhatsApp: { "pt-BR": "Configurar WhatsApp Business API", "en-US": "Configure WhatsApp Business API" },
  metaInstructions: {
    "pt-BR": "Você precisa criar um app no Meta Developer para usar o WhatsApp Business API.",
    "en-US": "You need to create an app on Meta Developer to use WhatsApp Business API.",
  },
  openMetaDeveloper: { "pt-BR": "Abrir Meta Developer", "en-US": "Open Meta Developer" },
  phoneNumberId: { "pt-BR": "Phone Number ID", "en-US": "Phone Number ID" },
  phoneNumberIdHint: { "pt-BR": "Encontrado em WhatsApp > API Setup", "en-US": "Found in WhatsApp > API Setup" },
  accessToken: { "pt-BR": "Access Token", "en-US": "Access Token" },
  accessTokenHint: { "pt-BR": "Token de acesso permanente", "en-US": "Permanent access token" },
  businessAccountId: { "pt-BR": "Business Account ID", "en-US": "Business Account ID" },
  businessAccountIdHint: { "pt-BR": "ID da conta WhatsApp Business", "en-US": "WhatsApp Business account ID" },
  verifyToken: { "pt-BR": "Verify Token", "en-US": "Verify Token" },
  verifyTokenHint: { "pt-BR": "Token para verificar webhook (você define)", "en-US": "Token to verify webhook (you define)" },
  webhookUrl: { "pt-BR": "Webhook URL", "en-US": "Webhook URL" },
  webhookInstructions: {
    "pt-BR": "Configure esta URL no Meta Developer > WhatsApp > Configuration",
    "en-US": "Configure this URL in Meta Developer > WhatsApp > Configuration",
  },
  cancel: { "pt-BR": "Cancelar", "en-US": "Cancel" },
  saveAndConnect: { "pt-BR": "Salvar e Conectar", "en-US": "Save and Connect" },
  saving: { "pt-BR": "Salvando...", "en-US": "Saving..." },
  allFieldsRequired: { "pt-BR": "Phone Number ID e Access Token são obrigatórios", "en-US": "Phone Number ID and Access Token are required" },
  connectedSuccess: { "pt-BR": "WhatsApp conectado com sucesso!", "en-US": "WhatsApp connected successfully!" },
  disconnectedSuccess: { "pt-BR": "WhatsApp desconectado", "en-US": "WhatsApp disconnected" },
  failedToSave: { "pt-BR": "Falha ao salvar configuração", "en-US": "Failed to save configuration" },
  copied: { "pt-BR": "Copiado!", "en-US": "Copied!" },
  copy: { "pt-BR": "Copiar", "en-US": "Copy" },
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

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// ============================================================================
// Sub-components
// ============================================================================

interface StatusCardProps {
  isConnected: boolean;
  onConfigure: () => void;
  onDisconnect: () => void;
  t: (key: TranslationKey) => string;
}

function StatusCard({ isConnected, onConfigure, onDisconnect, t }: StatusCardProps) {
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
              {isConnected ? t("connected") : t("notConfigured")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                {t("connected")}
              </span>
              <Button variant="secondary" onClick={onConfigure}>
                {t("configure")}
              </Button>
              <Button variant="secondary" onClick={onDisconnect} className="text-red-600 hover:text-red-700">
                {t("disconnect")}
              </Button>
            </>
          ) : (
            <Button onClick={onConfigure}>{t("enableWhatsApp")}</Button>
          )}
        </div>
      </div>

      {isConnected && (
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
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">{t("botConfirmations")}</p>
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

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  config: CloudApiConfig;
  onConfigChange: (config: CloudApiConfig) => void;
  saving: boolean;
  t: (key: TranslationKey) => string;
}

function ConfigModal({
  isOpen,
  onClose,
  onSave,
  config,
  onConfigChange,
  saving,
  t,
}: ConfigModalProps) {
  const isValid = config.phoneNumberId && config.accessToken;
  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhook/whatsapp`
    : "https://flexiwell.net/api/webhook/whatsapp";

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    showToast(t("copied"));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <WhatsAppIcon className="w-5 h-5 text-green-600" />
          </div>
          <ModalTitle>{t("configureWhatsApp")}</ModalTitle>
        </div>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {t("metaInstructions")}
          </p>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            {t("openMetaDeveloper")}
            <ExternalLinkIcon />
          </a>
        </div>

        <FormField
          label={t("phoneNumberId")}
          value={config.phoneNumberId}
          onChange={(e) => onConfigChange({ ...config, phoneNumberId: e.target.value })}
          placeholder="1234567890123456"
          hint={t("phoneNumberIdHint")}
        />

        <FormField
          label={t("accessToken")}
          type="password"
          value={config.accessToken}
          onChange={(e) => onConfigChange({ ...config, accessToken: e.target.value })}
          placeholder="EAAxxxxxxx..."
          hint={t("accessTokenHint")}
        />

        <FormField
          label={t("businessAccountId")}
          value={config.businessAccountId}
          onChange={(e) => onConfigChange({ ...config, businessAccountId: e.target.value })}
          placeholder="9876543210"
          hint={t("businessAccountIdHint")}
        />

        <FormField
          label={t("verifyToken")}
          value={config.verifyToken}
          onChange={(e) => onConfigChange({ ...config, verifyToken: e.target.value })}
          placeholder="flexiwell_whatsapp_2024"
          hint={t("verifyTokenHint")}
        />

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">{t("webhookUrl")}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-600 overflow-x-auto">
              {webhookUrl}
            </code>
            <button
              onClick={() => handleCopy(webhookUrl)}
              className="px-3 py-2 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50"
            >
              {t("copy")}
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
          {saving ? t("saving") : t("saveAndConnect")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WhatsAppSettings({ onBack }: WhatsAppSettingsProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<CloudApiConfig>(INITIAL_CONFIG);
  const [features, setFeatures] = useState<BotFeatureToggle>(INITIAL_FEATURES);

  const { t } = useWhatsAppTranslations();

  // Load WhatsApp config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/integrations/status");
        if (res.ok) {
          const data = await res.json();
          const whatsapp = data.integrations?.find((i: { id: string }) => i.id === "whatsapp");
          if (whatsapp?.status === "connected") {
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error("Failed to load WhatsApp config:", error);
      }
    }
    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!config.phoneNumberId || !config.accessToken) {
      showToast(t("allFieldsRequired"), "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: "whatsapp",
          credentials: {
            provider: "cloud-api",
            phoneNumberId: config.phoneNumberId,
            accessToken: config.accessToken,
            businessAccountId: config.businessAccountId,
            verifyToken: config.verifyToken,
          },
        }),
      });

      if (res.ok) {
        showToast(t("connectedSuccess"));
        setShowConfigModal(false);
        setIsConnected(true);
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

  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/admin/integrations?id=whatsapp", {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(t("disconnectedSuccess"));
        setIsConnected(false);
        setConfig(INITIAL_CONFIG);
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const handleToggleFeature = (key: keyof BotFeatureToggle) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
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
        isConnected={isConnected}
        onConfigure={() => setShowConfigModal(true)}
        onDisconnect={handleDisconnect}
        t={t}
      />

      {/* Bot Features */}
      {isConnected && (
        <BotFeaturesCard
          features={features}
          onToggle={handleToggleFeature}
          t={t}
        />
      )}

      {/* Configuration Modal */}
      <ConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveConfig}
        config={config}
        onConfigChange={setConfig}
        saving={saving}
        t={t}
      />
    </div>
  );
}
