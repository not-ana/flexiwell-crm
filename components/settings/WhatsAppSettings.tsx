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
  qualityRating?: string;
  error?: string;
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
// Main Component
// ============================================================================

export function WhatsAppSettings({ onBack }: WhatsAppSettingsProps) {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<BotFeatureToggle>(INITIAL_FEATURES);

  const { t } = useWhatsAppTranslations();

  // Check WhatsApp connection status on mount
  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/status", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.connected) {
          showToast(t("connectionSuccess"));
        }
      } else {
        setStatus({ connected: false, error: "Failed to check status" });
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
        status={status}
        loading={loading}
        onTestConnection={checkStatus}
        t={t}
      />

      {/* Bot Features - only show when connected */}
      {status?.connected && (
        <BotFeaturesCard
          features={features}
          onToggle={handleToggleFeature}
          t={t}
        />
      )}
    </div>
  );
}
