"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { useLocale } from "@/hooks/useLocale";
import { showToast } from "./shared";

// ============================================================================
// Types
// ============================================================================

interface SMSSettingsProps {
  onBack?: () => void;
}

interface SMSPackage {
  id: string;
  credits: number;
  price: string;
  priceBrl: string;
  popular?: boolean;
}

interface SMSHistory {
  id: string;
  type: "reminder" | "campaign" | "confirmation";
  recipient: string;
  message: string;
  sentAt: string;
  status: "delivered" | "failed" | "pending";
}

interface SMSSettingsState {
  classReminders: boolean;
  reminderHours: number;
  confirmationSms: boolean;
  cancellationSms: boolean;
  marketingEnabled: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const SMS_PACKAGES: SMSPackage[] = [
  { id: "pack-250", credits: 250, price: "$5", priceBrl: "R$15" },
  { id: "pack-500", credits: 500, price: "$10", priceBrl: "R$29", popular: true },
  { id: "pack-1000", credits: 1000, price: "$18", priceBrl: "R$49" },
  { id: "pack-2500", credits: 2500, price: "$40", priceBrl: "R$109" },
];

const MOCK_HISTORY: SMSHistory[] = [
  {
    id: "1",
    type: "reminder",
    recipient: "+1 (555) 123-4567",
    message: "Reminder: Your Pilates class is tomorrow at 10am",
    sentAt: "2026-01-15T09:30:00",
    status: "delivered",
  },
  {
    id: "2",
    type: "confirmation",
    recipient: "+1 (555) 234-5678",
    message: "Booking confirmed: Yoga - Jan 16 at 2pm",
    sentAt: "2026-01-15T08:15:00",
    status: "delivered",
  },
  {
    id: "3",
    type: "campaign",
    recipient: "+1 (555) 345-6789",
    message: "January Special! 20% off class packages",
    sentAt: "2026-01-14T16:00:00",
    status: "delivered",
  },
  {
    id: "4",
    type: "reminder",
    recipient: "+1 (555) 456-7890",
    message: "Reminder: Your CrossFit class is tomorrow at 8am",
    sentAt: "2026-01-14T10:00:00",
    status: "failed",
  },
];

const INITIAL_SETTINGS: SMSSettingsState = {
  classReminders: true,
  reminderHours: 24,
  confirmationSms: true,
  cancellationSms: true,
  marketingEnabled: false,
};

// ============================================================================
// Translations
// ============================================================================

const TRANSLATIONS = {
  backToAddons: { "pt-BR": "Voltar para Add-ons", "en-US": "Back to Add-ons" },
  smsCredits: { "pt-BR": "Créditos SMS", "en-US": "SMS Credits" },
  manageCredits: {
    "pt-BR": "Gerencie seus créditos SMS para notificações e campanhas.",
    "en-US": "Manage your SMS credits for notifications and campaigns.",
  },
  currentBalance: { "pt-BR": "Saldo Atual", "en-US": "Current Balance" },
  creditsAvailable: { "pt-BR": "créditos disponíveis", "en-US": "credits available" },
  buyCredits: { "pt-BR": "Comprar Créditos", "en-US": "Buy Credits" },
  sentThisMonth: { "pt-BR": "Enviados este mês", "en-US": "Sent this month" },
  deliveryRate: { "pt-BR": "Taxa de entrega", "en-US": "Delivery rate" },
  remindersToday: { "pt-BR": "Lembretes hoje", "en-US": "Reminders today" },
  smsSettings: { "pt-BR": "Configurações de SMS", "en-US": "SMS Settings" },
  classReminders: { "pt-BR": "Lembretes de Aula", "en-US": "Class Reminders" },
  classRemindersDesc: {
    "pt-BR": "Enviar lembrete automático antes das aulas",
    "en-US": "Send automatic reminder before classes",
  },
  hoursBefore: { "pt-BR": "Horas de antecedência", "en-US": "Hours before" },
  hours: { "pt-BR": "horas", "en-US": "hours" },
  bookingConfirmation: { "pt-BR": "Confirmação de Reserva", "en-US": "Booking Confirmation" },
  bookingConfirmationDesc: {
    "pt-BR": "SMS quando cliente reserva uma aula",
    "en-US": "SMS when client books a class",
  },
  cancellationNotice: { "pt-BR": "Aviso de Cancelamento", "en-US": "Cancellation Notice" },
  cancellationNoticeDesc: {
    "pt-BR": "SMS quando uma aula é cancelada",
    "en-US": "SMS when a class is cancelled",
  },
  marketingCampaigns: { "pt-BR": "Campanhas de Marketing", "en-US": "Marketing Campaigns" },
  marketingCampaignsDesc: {
    "pt-BR": "Permitir envio de SMS promocionais",
    "en-US": "Allow sending promotional SMS",
  },
  recentHistory: { "pt-BR": "Histórico Recente", "en-US": "Recent History" },
  viewAll: { "pt-BR": "Ver tudo", "en-US": "View all" },
  reminder: { "pt-BR": "Lembrete", "en-US": "Reminder" },
  campaign: { "pt-BR": "Campanha", "en-US": "Campaign" },
  confirmation: { "pt-BR": "Confirmação", "en-US": "Confirmation" },
  delivered: { "pt-BR": "Entregue", "en-US": "Delivered" },
  failed: { "pt-BR": "Falhou", "en-US": "Failed" },
  pending: { "pt-BR": "Pendente", "en-US": "Pending" },
  buySmsCredits: { "pt-BR": "Comprar Créditos SMS", "en-US": "Buy SMS Credits" },
  selectPackage: {
    "pt-BR": "Selecione um pacote de créditos. Os créditos não expiram.",
    "en-US": "Select a credit package. Credits never expire.",
  },
  credits: { "pt-BR": "créditos", "en-US": "credits" },
  cancel: { "pt-BR": "Cancelar", "en-US": "Cancel" },
  purchase: { "pt-BR": "Comprar", "en-US": "Purchase" },
  processing: { "pt-BR": "Processando...", "en-US": "Processing..." },
  creditsAdded: {
    "pt-BR": (n: number) => `${n} créditos adicionados com sucesso!`,
    "en-US": (n: number) => `${n} credits added successfully!`,
  },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS;

// ============================================================================
// Hook: useSMSTranslations
// ============================================================================

function useSMSTranslations() {
  const { isBrazil, locale } = useLocale();
  const lang = isBrazil ? "pt-BR" : "en-US";

  const t = (key: TranslationKey): string => {
    const translation = TRANSLATIONS[key];
    if (typeof translation === "object" && lang in translation) {
      const value = translation[lang as keyof typeof translation];
      return typeof value === "string" ? value : "";
    }
    return key;
  };

  const getCreditsAddedMessage = (n: number): string => {
    return TRANSLATIONS.creditsAdded[lang](n);
  };

  return { t, getCreditsAddedMessage, isBrazil, locale };
}

// ============================================================================
// Icons
// ============================================================================

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const SMSIcon = () => (
  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
  </svg>
);

// ============================================================================
// Sub-components
// ============================================================================

interface CreditsBalanceCardProps {
  credits: number;
  onBuyCredits: () => void;
  t: (key: TranslationKey) => string;
}

function CreditsBalanceCard({ credits, onBuyCredits, t }: CreditsBalanceCardProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-purple-100 text-sm">{t("currentBalance")}</p>
          <p className="text-4xl font-bold mt-1">{credits.toLocaleString()}</p>
          <p className="text-purple-200 text-sm mt-1">{t("creditsAvailable")}</p>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
          <SMSIcon />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/20">
        <Button
          variant="secondary"
          onClick={onBuyCredits}
          className="bg-white text-purple-700 hover:bg-purple-50"
        >
          {t("buyCredits")}
        </Button>
      </div>
    </div>
  );
}

interface UsageStatsProps {
  t: (key: TranslationKey) => string;
}

function UsageStats({ t }: UsageStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-2xl font-bold text-gray-900">156</p>
        <p className="text-xs text-gray-500 mt-1">{t("sentThisMonth")}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-2xl font-bold text-gray-900">98%</p>
        <p className="text-xs text-gray-500 mt-1">{t("deliveryRate")}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-2xl font-bold text-gray-900">42</p>
        <p className="text-xs text-gray-500 mt-1">{t("remindersToday")}</p>
      </div>
    </div>
  );
}

interface SMSSettingItemProps {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  isLast?: boolean;
}

function SMSSettingItem({ title, description, enabled, onChange, isLast }: SMSSettingItemProps) {
  return (
    <div className={`flex items-center justify-between py-3 ${!isLast ? "border-b border-gray-100" : ""}`}>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}

interface ReminderHoursSelectorProps {
  value: number;
  onChange: (hours: number) => void;
  t: (key: TranslationKey) => string;
}

function ReminderHoursSelector({ value, onChange, t }: ReminderHoursSelectorProps) {
  const hours = t("hours");
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 pl-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{t("hoursBefore")}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
      >
        <option value={2}>2 {hours}</option>
        <option value={6}>6 {hours}</option>
        <option value={12}>12 {hours}</option>
        <option value={24}>24 {hours}</option>
        <option value={48}>48 {hours}</option>
      </select>
    </div>
  );
}

interface SMSHistoryItemProps {
  sms: SMSHistory;
  t: (key: TranslationKey) => string;
  locale: string;
}

function SMSHistoryItem({ sms, t, locale }: SMSHistoryItemProps) {
  const typeLabels: Record<SMSHistory["type"], TranslationKey> = {
    reminder: "reminder",
    campaign: "campaign",
    confirmation: "confirmation",
  };

  const typeBadgeClasses: Record<SMSHistory["type"], string> = {
    reminder: "bg-blue-100 text-blue-700",
    campaign: "bg-purple-100 text-purple-700",
    confirmation: "bg-green-100 text-green-700",
  };

  const statusLabels: Record<SMSHistory["status"], TranslationKey> = {
    delivered: "delivered",
    failed: "failed",
    pending: "pending",
  };

  const statusBadgeClasses: Record<SMSHistory["status"], string> = {
    delivered: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeBadgeClasses[sms.type]}`}>
            {t(typeLabels[sms.type])}
          </span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadgeClasses[sms.status]}`}>
            {t(statusLabels[sms.status])}
          </span>
        </div>
        <p className="text-sm text-gray-900 truncate">{sms.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{sms.recipient}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">
            {new Date(sms.sentAt).toLocaleString(locale, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

interface PackageCardProps {
  pkg: SMSPackage;
  isSelected: boolean;
  onSelect: () => void;
  isBrazil: boolean;
  t: (key: TranslationKey) => string;
}

function PackageCard({ pkg, isSelected, onSelect, isBrazil, t }: PackageCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
        isSelected ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {pkg.popular && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded-full">
          Popular
        </span>
      )}
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900">{pkg.credits.toLocaleString()}</p>
        <p className="text-xs text-gray-500">{t("credits")}</p>
        <p className="text-lg font-semibold text-purple-600 mt-2">
          {isBrazil ? pkg.priceBrl : pkg.price}
        </p>
      </div>
    </div>
  );
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  selectedPackage: string | null;
  onSelectPackage: (id: string) => void;
  purchasing: boolean;
  isBrazil: boolean;
  t: (key: TranslationKey) => string;
}

function PurchaseModal({
  isOpen,
  onClose,
  onPurchase,
  selectedPackage,
  onSelectPackage,
  purchasing,
  isBrazil,
  t,
}: PurchaseModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
            </svg>
          </div>
          <ModalTitle>{t("buySmsCredits")}</ModalTitle>
        </div>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-600 mb-4">{t("selectPackage")}</p>
        <div className="grid grid-cols-2 gap-3">
          {SMS_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={selectedPackage === pkg.id}
              onSelect={() => onSelectPackage(pkg.id)}
              isBrazil={isBrazil}
              t={t}
            />
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="flex-1">
          {t("cancel")}
        </Button>
        <Button
          onClick={onPurchase}
          disabled={!selectedPackage || purchasing}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {purchasing ? t("processing") : t("purchase")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SMSSettings({ onBack }: SMSSettingsProps) {
  const [credits, setCredits] = useState(347);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [settings, setSettings] = useState<SMSSettingsState>(INITIAL_SETTINGS);

  const { t, getCreditsAddedMessage, isBrazil, locale } = useSMSTranslations();

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setPurchasing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const pkg = SMS_PACKAGES.find((p) => p.id === selectedPackage);
    if (pkg) {
      setCredits((prev) => prev + pkg.credits);
      showToast(getCreditsAddedMessage(pkg.credits));
    }

    setPurchasing(false);
    setShowPurchaseModal(false);
    setSelectedPackage(null);
  };

  const toggleSetting = (key: keyof SMSSettingsState) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
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
        <h2 className="text-lg font-semibold text-gray-900">{t("smsCredits")}</h2>
        <p className="text-sm text-gray-600 mt-1">{t("manageCredits")}</p>
      </div>

      {/* Credits Balance Card */}
      <CreditsBalanceCard credits={credits} onBuyCredits={() => setShowPurchaseModal(true)} t={t} />

      {/* Usage Stats */}
      <UsageStats t={t} />

      {/* SMS Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">{t("smsSettings")}</h3>
        <div className="space-y-4">
          <SMSSettingItem
            title={t("classReminders")}
            description={t("classRemindersDesc")}
            enabled={settings.classReminders}
            onChange={() => toggleSetting("classReminders")}
          />

          {settings.classReminders && (
            <ReminderHoursSelector
              value={settings.reminderHours}
              onChange={(hours) => setSettings((s) => ({ ...s, reminderHours: hours }))}
              t={t}
            />
          )}

          <SMSSettingItem
            title={t("bookingConfirmation")}
            description={t("bookingConfirmationDesc")}
            enabled={settings.confirmationSms}
            onChange={() => toggleSetting("confirmationSms")}
          />

          <SMSSettingItem
            title={t("cancellationNotice")}
            description={t("cancellationNoticeDesc")}
            enabled={settings.cancellationSms}
            onChange={() => toggleSetting("cancellationSms")}
          />

          <SMSSettingItem
            title={t("marketingCampaigns")}
            description={t("marketingCampaignsDesc")}
            enabled={settings.marketingEnabled}
            onChange={() => toggleSetting("marketingEnabled")}
            isLast
          />
        </div>
      </div>

      {/* Recent SMS History */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{t("recentHistory")}</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            {t("viewAll")}
          </button>
        </div>
        <div className="space-y-3">
          {MOCK_HISTORY.map((sms) => (
            <SMSHistoryItem key={sms.id} sms={sms} t={t} locale={locale} />
          ))}
        </div>
      </div>

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchase}
        selectedPackage={selectedPackage}
        onSelectPackage={setSelectedPackage}
        purchasing={purchasing}
        isBrazil={isBrazil}
        t={t}
      />
    </div>
  );
}
