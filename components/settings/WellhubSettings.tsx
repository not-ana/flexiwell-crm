"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Toggle } from "@/components/ui/Toggle";
import { useLocale } from "@/hooks/useLocale";
import { showToast } from "./shared";

// ============================================================================
// Types
// ============================================================================

type MarketplaceProvider = "wellhub" | "totalpass" | "classpass";

interface WellhubSettingsProps {
  onBack?: () => void;
  provider?: MarketplaceProvider;
}

// Provider-specific configuration
const PROVIDER_CONFIG: Record<MarketplaceProvider, {
  name: string;
  color: string;
  icon: string;
  partnerPortal: string;
  apiEndpoint: string;
}> = {
  wellhub: {
    name: "Wellhub",
    color: "orange",
    icon: "W",
    partnerPortal: "https://partners.wellhub.com",
    apiEndpoint: "/api/admin/integrations/wellhub",
  },
  totalpass: {
    name: "TotalPass",
    color: "green",
    icon: "TP",
    partnerPortal: "https://parceiros.totalpass.com.br",
    apiEndpoint: "/api/admin/integrations/totalpass",
  },
  classpass: {
    name: "ClassPass",
    color: "purple",
    icon: "CP",
    partnerPortal: "https://partners.classpass.com",
    apiEndpoint: "/api/admin/integrations/classpass",
  },
};

interface WellhubStatus {
  connected: boolean;
  gymId?: string;
  gymName?: string;
  classesSynced?: number;
  totalBookings?: number;
  revenue?: number;
  lastSync?: string;
  error?: string;
}

interface WellhubConfig {
  autoSyncClasses: boolean;
  importClients: boolean;
  syncInterval: "hourly" | "daily" | "manual";
  defaultCapacity?: number;
}

// ============================================================================
// Translations
// ============================================================================

const TRANSLATIONS = {
  backToIntegrations: { "pt-BR": "Voltar para Integrações", "en-US": "Back to Integrations" },
  title: { "pt-BR": "Wellhub", "en-US": "Wellhub" },
  description: {
    "pt-BR": "Conecte seu estúdio ao Wellhub e receba reservas de funcionários de empresas parceiras.",
    "en-US": "Connect your studio to Wellhub and receive bookings from partner company employees.",
  },
  connected: { "pt-BR": "Conectado", "en-US": "Connected" },
  notConfigured: { "pt-BR": "Não configurado", "en-US": "Not configured" },
  checking: { "pt-BR": "Verificando...", "en-US": "Checking..." },
  // Connection form
  connectTitle: { "pt-BR": "Conectar ao Wellhub", "en-US": "Connect to Wellhub" },
  connectDescription: {
    "pt-BR": "Insira suas credenciais do painel de parceiros Wellhub para conectar.",
    "en-US": "Enter your Wellhub partner dashboard credentials to connect.",
  },
  gymIdLabel: { "pt-BR": "ID do Estúdio (Gym ID)", "en-US": "Gym ID" },
  gymIdPlaceholder: { "pt-BR": "Ex: gym_12345", "en-US": "e.g. gym_12345" },
  gymIdHelp: { "pt-BR": "Encontrado no painel de parceiros Wellhub", "en-US": "Found in your Wellhub partner dashboard" },
  apiKeyLabel: { "pt-BR": "Chave de API", "en-US": "API Key" },
  apiKeyPlaceholder: { "pt-BR": "Sua chave de API do Wellhub", "en-US": "Your Wellhub API key" },
  apiKeyHelp: { "pt-BR": "Gerada nas configurações do parceiro", "en-US": "Generated in partner settings" },
  connectButton: { "pt-BR": "Conectar", "en-US": "Connect" },
  connecting: { "pt-BR": "Conectando...", "en-US": "Connecting..." },
  connectionSuccess: { "pt-BR": "Wellhub conectado com sucesso!", "en-US": "Wellhub connected successfully!" },
  connectionFailed: { "pt-BR": "Falha ao conectar ao Wellhub", "en-US": "Failed to connect to Wellhub" },
  // Stats
  classesSynced: { "pt-BR": "Aulas Sincronizadas", "en-US": "Classes Synced" },
  totalBookings: { "pt-BR": "Reservas", "en-US": "Bookings" },
  revenue: { "pt-BR": "Receita", "en-US": "Revenue" },
  lastSync: { "pt-BR": "Última sincronização", "en-US": "Last sync" },
  // Settings
  settingsTitle: { "pt-BR": "Configurações", "en-US": "Settings" },
  autoSyncClasses: { "pt-BR": "Sincronização automática", "en-US": "Auto-sync classes" },
  autoSyncClassesDesc: { "pt-BR": "Sincronizar agenda automaticamente com Wellhub", "en-US": "Automatically sync schedule with Wellhub" },
  importClients: { "pt-BR": "Importar perfis de clientes", "en-US": "Import client profiles" },
  importClientsDesc: { "pt-BR": "Criar perfil de clientes que reservam via Wellhub", "en-US": "Create profiles for clients who book via Wellhub" },
  syncIntervalLabel: { "pt-BR": "Frequência de sincronização", "en-US": "Sync frequency" },
  syncHourly: { "pt-BR": "A cada hora", "en-US": "Hourly" },
  syncDaily: { "pt-BR": "Diariamente", "en-US": "Daily" },
  syncManual: { "pt-BR": "Manual", "en-US": "Manual" },
  syncNow: { "pt-BR": "Sincronizar Agora", "en-US": "Sync Now" },
  syncing: { "pt-BR": "Sincronizando...", "en-US": "Syncing..." },
  syncSuccess: { "pt-BR": "Sincronizado com sucesso!", "en-US": "Synced successfully!" },
  saveSettings: { "pt-BR": "Salvar Configurações", "en-US": "Save Settings" },
  saving: { "pt-BR": "Salvando...", "en-US": "Saving..." },
  settingsSaved: { "pt-BR": "Configurações salvas!", "en-US": "Settings saved!" },
  disconnect: { "pt-BR": "Desconectar", "en-US": "Disconnect" },
  disconnecting: { "pt-BR": "Desconectando...", "en-US": "Disconnecting..." },
  disconnectConfirm: { "pt-BR": "Tem certeza que deseja desconectar o Wellhub?", "en-US": "Are you sure you want to disconnect Wellhub?" },
  disconnected: { "pt-BR": "Wellhub desconectado", "en-US": "Wellhub disconnected" },
  // Benefits
  benefitsTitle: { "pt-BR": "Benefícios do Wellhub", "en-US": "Wellhub Benefits" },
  benefit1: { "pt-BR": "Acesso a milhares de funcionários de empresas parceiras", "en-US": "Access to thousands of partner company employees" },
  benefit2: { "pt-BR": "Pagamentos garantidos pela Wellhub", "en-US": "Guaranteed payments by Wellhub" },
  benefit3: { "pt-BR": "Visibilidade no app Wellhub", "en-US": "Visibility in the Wellhub app" },
  benefit4: { "pt-BR": "Sincronização automática de agenda", "en-US": "Automatic schedule sync" },
  // Help
  needHelp: { "pt-BR": "Precisa de ajuda?", "en-US": "Need help?" },
  helpLink: { "pt-BR": "Acesse o portal de parceiros Wellhub", "en-US": "Visit the Wellhub partner portal" },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS;

// ============================================================================
// Hook: useWellhubTranslations
// ============================================================================

function useWellhubTranslations() {
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

const WellhubIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="#FF6B35" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">W</text>
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

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const BenefitCheckIcon = () => (
  <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// ============================================================================
// Sub-components
// ============================================================================

interface ProviderConfigType {
  name: string;
  color: string;
  icon: string;
  partnerPortal: string;
  apiEndpoint: string;
}

const COLOR_CLASSES: Record<string, { bg: string; bgLight: string; text: string }> = {
  orange: { bg: "bg-orange-500", bgLight: "bg-orange-100", text: "text-orange-600" },
  green: { bg: "bg-green-500", bgLight: "bg-green-100", text: "text-green-600" },
  purple: { bg: "bg-purple-500", bgLight: "bg-purple-100", text: "text-purple-600" },
};

interface StatusCardProps {
  status: WellhubStatus | null;
  loading: boolean;
  t: (key: TranslationKey) => string;
  isBrazil: boolean;
  providerConfig: ProviderConfigType;
}

function StatusCard({ status, loading, t, isBrazil, providerConfig }: StatusCardProps) {
  const isConnected = status?.connected ?? false;
  const hasError = status?.error;
  const colorClass = COLOR_CLASSES[providerConfig.color] || COLOR_CLASSES.orange;

  const formatCurrency = (value: number) => {
    return isBrazil
      ? `R$ ${value.toLocaleString("pt-BR")}`
      : `$${value.toLocaleString("en-US")}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isConnected ? colorClass.bgLight : hasError ? "bg-red-100" : "bg-gray-100"
          }`}>
            <span className={`font-bold text-lg ${
              isConnected ? colorClass.text : hasError ? "text-red-600" : "text-gray-400"
            }`}>{providerConfig.icon}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{providerConfig.name}</p>
            <p className="text-sm text-gray-500">
              {loading ? t("checking") : isConnected ? status?.gymName || t("connected") : hasError ? status?.error : t("notConfigured")}
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
            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              <CheckIcon />
              {t("connected")}
            </span>
          ) : hasError ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
              <XIcon />
              {status?.error}
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
              {t("notConfigured")}
            </span>
          )}
        </div>
      </div>

      {/* Stats when connected */}
      {isConnected && !hasError && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{status?.classesSynced ?? 0}</p>
              <p className="text-xs text-gray-500">{t("classesSynced")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{status?.totalBookings ?? 0}</p>
              <p className="text-xs text-gray-500">{t("totalBookings")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(status?.revenue ?? 0)}
              </p>
              <p className="text-xs text-gray-500">{t("revenue")}</p>
            </div>
          </div>
          {status?.lastSync && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              {t("lastSync")}: {new Date(status.lastSync).toLocaleString(isBrazil ? "pt-BR" : "en-US")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Connection Form Component
// ============================================================================

interface ConnectionFormProps {
  onConnect: (gymId: string, apiKey: string) => Promise<void>;
  connecting: boolean;
  t: (key: TranslationKey) => string;
  providerConfig: ProviderConfigType;
}

function ConnectionForm({ onConnect, connecting, t, providerConfig }: ConnectionFormProps) {
  const [gymId, setGymId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const colorClass = COLOR_CLASSES[providerConfig.color] || COLOR_CLASSES.orange;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConnect(gymId, apiKey);
  };

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
    t("benefit4"),
  ];

  const bgLightClass = providerConfig.color === "green" ? "bg-green-50" : providerConfig.color === "purple" ? "bg-purple-50" : "bg-orange-50";
  const textColorClass = providerConfig.color === "green" ? "text-green-600" : providerConfig.color === "purple" ? "text-purple-600" : "text-orange-600";
  const hoverTextColorClass = providerConfig.color === "green" ? "hover:text-green-700" : providerConfig.color === "purple" ? "hover:text-purple-700" : "hover:text-orange-700";
  const buttonBgClass = providerConfig.color === "green" ? "bg-green-500 hover:bg-green-600" : providerConfig.color === "purple" ? "bg-purple-500 hover:bg-purple-600" : "bg-orange-500 hover:bg-orange-600";
  const focusRingClass = providerConfig.color === "green" ? "focus:ring-green-500 focus:border-green-500" : providerConfig.color === "purple" ? "focus:ring-purple-500 focus:border-purple-500" : "focus:ring-orange-500 focus:border-orange-500";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-xl ${colorClass.bgLight} flex items-center justify-center flex-shrink-0`}>
          <span className={`font-bold text-lg ${colorClass.text}`}>{providerConfig.icon}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t("connectTitle").replace("Wellhub", providerConfig.name)}</h3>
          <p className="text-sm text-gray-600 mt-1">{t("connectDescription").replace("Wellhub", providerConfig.name)}</p>
        </div>
      </div>

      {/* Benefits */}
      <div className={`mb-6 p-4 ${bgLightClass} rounded-lg`}>
        <h4 className="text-sm font-medium text-gray-900 mb-3">{t("benefitsTitle").replace("Wellhub", providerConfig.name)}</h4>
        <div className="space-y-2">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <svg className={`w-5 h-5 ${textColorClass} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-700">{benefit.replace("Wellhub", providerConfig.name)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("gymIdLabel")}
          </label>
          <input
            type="text"
            value={gymId}
            onChange={(e) => setGymId(e.target.value)}
            placeholder={t("gymIdPlaceholder")}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${focusRingClass}`}
            required
          />
          <p className="text-xs text-gray-500 mt-1">{t("gymIdHelp").replace("Wellhub", providerConfig.name)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("apiKeyLabel")}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t("apiKeyPlaceholder").replace("Wellhub", providerConfig.name)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${focusRingClass}`}
            required
          />
          <p className="text-xs text-gray-500 mt-1">{t("apiKeyHelp")}</p>
        </div>

        <Button
          type="submit"
          disabled={connecting || !gymId || !apiKey}
          className={`w-full ${buttonBgClass}`}
        >
          {connecting ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              {t("connecting")}
            </span>
          ) : (
            t("connectButton")
          )}
        </Button>
      </form>

      {/* Help link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">{t("needHelp")}</p>
        <a
          href={providerConfig.partnerPortal}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-sm ${textColorClass} ${hoverTextColorClass} font-medium mt-1`}
        >
          {t("helpLink").replace("Wellhub", providerConfig.name)}
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// Settings Card Component
// ============================================================================

interface SettingsCardProps {
  config: WellhubConfig;
  onConfigChange: (config: WellhubConfig) => void;
  onSave: () => Promise<void>;
  onSync: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  saving: boolean;
  syncing: boolean;
  disconnecting: boolean;
  t: (key: TranslationKey) => string;
  providerConfig: ProviderConfigType;
}

function SettingsCard({
  config,
  onConfigChange,
  onSave,
  onSync,
  onDisconnect,
  saving,
  syncing,
  disconnecting,
  t,
  providerConfig,
}: SettingsCardProps) {
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const buttonBgClass = providerConfig.color === "green" ? "bg-green-500 hover:bg-green-600" : providerConfig.color === "purple" ? "bg-purple-500 hover:bg-purple-600" : "bg-orange-500 hover:bg-orange-600";
  const focusRingClass = providerConfig.color === "green" ? "focus:ring-green-500 focus:border-green-500" : providerConfig.color === "purple" ? "focus:ring-purple-500 focus:border-purple-500" : "focus:ring-orange-500 focus:border-orange-500";

  const handleDisconnect = async () => {
    if (showDisconnectConfirm) {
      await onDisconnect();
      setShowDisconnectConfirm(false);
    } else {
      setShowDisconnectConfirm(true);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("settingsTitle")}</h3>

      <div className="space-y-4">
        {/* Auto-sync toggle */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{t("autoSyncClasses")}</p>
            <p className="text-xs text-gray-500">{t("autoSyncClassesDesc")}</p>
          </div>
          <Toggle
            enabled={config.autoSyncClasses}
            onChange={() => onConfigChange({ ...config, autoSyncClasses: !config.autoSyncClasses })}
          />
        </div>

        {/* Import clients toggle */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{t("importClients")}</p>
            <p className="text-xs text-gray-500">{t("importClientsDesc")}</p>
          </div>
          <Toggle
            enabled={config.importClients}
            onChange={() => onConfigChange({ ...config, importClients: !config.importClients })}
          />
        </div>

        {/* Sync interval */}
        {config.autoSyncClasses && (
          <div className="py-3 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t("syncIntervalLabel")}
            </label>
            <select
              value={config.syncInterval}
              onChange={(e) => onConfigChange({ ...config, syncInterval: e.target.value as WellhubConfig["syncInterval"] })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 ${focusRingClass}`}
            >
              <option value="hourly">{t("syncHourly")}</option>
              <option value="daily">{t("syncDaily")}</option>
              <option value="manual">{t("syncManual")}</option>
            </select>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <div className="flex gap-3">
            <Button
              onClick={onSync}
              disabled={syncing}
              variant="secondary"
              className="flex-1"
            >
              {syncing ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  {t("syncing")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <RefreshIcon />
                  {t("syncNow")}
                </span>
              )}
            </Button>

            <Button
              onClick={onSave}
              disabled={saving}
              className={`flex-1 ${buttonBgClass}`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  {t("saving")}
                </span>
              ) : (
                t("saveSettings")
              )}
            </Button>
          </div>

          {/* Disconnect */}
          <div className="pt-4 border-t border-gray-200">
            {showDisconnectConfirm ? (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-700">{t("disconnectConfirm")}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    {disconnecting ? t("disconnecting") : t("disconnect")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDisconnect}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {t("disconnect")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WellhubSettings({ onBack, provider = "wellhub" }: WellhubSettingsProps) {
  const [status, setStatus] = useState<WellhubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [config, setConfig] = useState<WellhubConfig>({
    autoSyncClasses: true,
    importClients: false,
    syncInterval: "daily",
  });

  const { t, isBrazil } = useWellhubTranslations();
  const providerConfig = PROVIDER_CONFIG[provider];

  // Check connection status for the current provider
  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations/status", {
        credentials: "include",
      });
      const data = await res.json();
      const providerData = data[provider];
      if (res.ok && providerData) {
        setStatus({
          connected: providerData.connected,
          lastSync: providerData.lastSync,
          classesSynced: providerData.classesSynced || 0,
          totalBookings: providerData.totalBookings || 0,
          revenue: providerData.revenue || 0,
          gymName: providerData.gymName,
          gymId: providerData.gymId,
        });
        // Load config if available
        if (providerData.config) {
          setConfig(providerData.config);
        }
      } else {
        setStatus({ connected: false });
      }
    } catch (error) {
      console.error(`Failed to check ${providerConfig.name} status:`, error);
      setStatus({ connected: false, error: "Failed to check status" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const handleConnect = async (gymId: string, apiKey: string) => {
    setConnecting(true);
    try {
      const res = await fetch(providerConfig.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gymId, apiKey }),
      });

      if (res.ok) {
        showToast(t("connectionSuccess"));
        await checkStatus();
      } else {
        const data = await res.json();
        showToast(data.error || t("connectionFailed"));
      }
    } catch (error) {
      console.error(`Failed to connect ${providerConfig.name}:`, error);
      showToast(t("connectionFailed"));
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(providerConfig.apiEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ config }),
      });

      if (res.ok) {
        showToast(t("settingsSaved"));
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${providerConfig.apiEndpoint}/sync`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        showToast(t("syncSuccess"));
        await checkStatus();
      }
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch(providerConfig.apiEndpoint, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        showToast(t("disconnected"));
        setStatus({ connected: false });
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setDisconnecting(false);
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
            {t("backToIntegrations")}
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-900">{providerConfig.name}</h2>
        <p className="text-sm text-gray-600 mt-1">{t("description")}</p>
      </div>

      {/* Status Card */}
      <StatusCard status={status} loading={loading} t={t} isBrazil={isBrazil} providerConfig={providerConfig} />

      {/* Connection Form or Settings based on status */}
      {!loading && !status?.connected && (
        <ConnectionForm
          onConnect={handleConnect}
          connecting={connecting}
          t={t}
          providerConfig={providerConfig}
        />
      )}

      {status?.connected && (
        <SettingsCard
          config={config}
          onConfigChange={setConfig}
          onSave={handleSaveSettings}
          onSync={handleSync}
          onDisconnect={handleDisconnect}
          saving={saving}
          syncing={syncing}
          disconnecting={disconnecting}
          t={t}
          providerConfig={providerConfig}
        />
      )}
    </div>
  );
}
