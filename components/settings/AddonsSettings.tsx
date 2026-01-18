"use client";

import { useState, useEffect, ReactElement } from "react";
import Image from "next/image";
import { CheckCircleIcon } from "@/components/icons";
import { useLocale } from "@/hooks/useLocale";
import { addAddOnToSubscription, removeAddOnFromSubscription } from "@/lib/stripe/client";

// ============================================================================
// Types
// ============================================================================

interface AddonsSettingsProps {
  onNavigate?: (tab: "whatsapp" | "sms" | "sms-bot" | "addons") => void;
}

interface AddonPricing {
  usd: string;
  brl: string;
  note: string;
  noteBrl?: string;
}

interface Addon {
  id: string;
  name: string;
  description: string;
  descriptionBrl?: string;
  pricing: AddonPricing;
  iconBg: string;
  iconColor: string;
  iconImage?: string;
  features: string[];
  featuresBrl?: string[];
  active?: boolean;
  comingSoon?: boolean;
  includedInPlans?: string[];
  includedInPlansBrl?: string[];
  hasVariants?: boolean;
  requiredPlans?: string[]; // Plans that can access this add-on
}

type AddonNavigationId = "whatsapp-bot" | "sms-bot";

// ============================================================================
// Constants
// ============================================================================

const ADDON_NAVIGATION_MAP: Record<AddonNavigationId, "whatsapp" | "sms-bot"> = {
  "whatsapp-bot": "whatsapp",
  "sms-bot": "sms-bot",
};

// Map UI addon IDs to API addon IDs
const UI_TO_API_ADDON_ID: Record<string, string> = {
  "whatsapp-bot": "extra_whatsapp_msgs",
  "sms-bot": "sms_bundle",
  "extra-storage": "additional_storage",
};

const API_TO_UI_ADDON_ID: Record<string, string> = {
  "extra_whatsapp_msgs": "whatsapp-bot",
  "sms_bundle": "sms-bot",
  "additional_storage": "extra-storage",
};

const ADDONS: Addon[] = [
  {
    id: "whatsapp-bot",
    name: "WhatsApp Automation",
    description: "AI booking assistant + notifications via WhatsApp. Includes 1,000 messages/month with bot and bulk messaging.",
    descriptionBrl: "Assistente de reservas IA + notificações via WhatsApp. Inclui 1.000 mensagens/mês com bot e envio em massa.",
    pricing: { usd: "$29", brl: "R$79", note: "/month", noteBrl: "/mês" },
    iconBg: "bg-green-500",
    iconColor: "text-white",
    features: [
      "1,000 messages/month included",
      "AI bot for bookings & cancellations",
      "Class reminders & campaigns",
      "24/7 automated responses",
    ],
    featuresBrl: [
      "1.000 mensagens/mês incluídas",
      "Bot IA para agendamentos e cancelamentos",
      "Lembretes de aulas e campanhas",
      "Respostas automáticas 24/7",
    ],
    active: false,
    includedInPlans: ["Included in Business & Professional plans"],
    includedInPlansBrl: ["Incluso nos planos Business e Professional"],
    requiredPlans: ["business"], // Only available on business plan
  },
  {
    id: "sms-bot",
    name: "SMS Automation",
    description: "AI booking assistant + notifications via SMS. Includes 500 SMS/month. US market only.",
    descriptionBrl: "Assistente de reservas IA + notificações via SMS. Inclui 500 SMS/mês. Apenas mercado EUA.",
    pricing: { usd: "$19", brl: "R$49", note: "/month", noteBrl: "/mês" },
    iconBg: "bg-transparent",
    iconColor: "text-white",
    iconImage: "/message.svg",
    features: [
      "500 SMS/month included",
      "AI bot for bookings & cancellations",
      "Class reminders & campaigns",
      "24/7 automated responses",
    ],
    featuresBrl: [
      "500 SMS/mês incluídos",
      "Bot IA para agendamentos e cancelamentos",
      "Lembretes de aulas e campanhas",
      "Respostas automáticas 24/7",
    ],
    active: false,
    includedInPlans: ["Included in Business & Professional plans"],
    includedInPlansBrl: ["Incluso nos planos Business e Professional"],
    requiredPlans: ["starter", "growth", "business", "professional"], // Available on all plans
  },
  {
    id: "extra-storage",
    name: "Extra Storage",
    description: "Additional cloud storage for photos, documents, and client files",
    descriptionBrl: "Armazenamento extra para fotos, documentos e arquivos de clientes",
    pricing: { usd: "$15", brl: "R$49", note: "/month per 50GB", noteBrl: "/mês por 50GB" },
    iconBg: "bg-blue-500",
    iconColor: "text-white",
    features: [
      "50GB additional storage",
      "Client photo uploads",
      "Document management",
      "Automatic backups",
    ],
    featuresBrl: [
      "50GB de armazenamento adicional",
      "Upload de fotos de clientes",
      "Gerenciamento de documentos",
      "Backups automáticos",
    ],
    active: false,
    requiredPlans: ["starter", "growth", "business"], // Available on starter, growth, business
  },
  {
    id: "advanced-reports",
    name: "Advanced Reports",
    description: "Detailed analytics and custom report builder for business insights",
    descriptionBrl: "Analytics detalhado e criador de relatórios personalizados",
    pricing: { usd: "", brl: "", note: "", noteBrl: "" },
    iconBg: "bg-pink-500",
    iconColor: "text-white",
    features: [
      "Custom report builder",
      "Revenue forecasting",
      "Client retention metrics",
      "Export to Excel/PDF",
    ],
    featuresBrl: [
      "Criador de relatórios personalizado",
      "Previsão de receita",
      "Métricas de retenção de clientes",
      "Exportar para Excel/PDF",
    ],
    comingSoon: true,
  },
];

const TRANSLATIONS = {
  title: { en: "Add-ons", pt: "Add-ons" },
  subtitle: {
    en: "Enhance your FlexiWell experience with extra features and capabilities.",
    pt: "Aprimore sua experiência FlexiWell com recursos extras.",
  },
  comingSoon: { en: "Coming Soon", pt: "Em breve" },
  active: { en: "Active", pt: "Ativo" },
  manage: { en: "Manage", pt: "Gerenciar" },
  addToPlan: { en: "Add to Plan", pt: "Adicionar ao Plano" },
  processing: { en: "Processing...", pt: "Processando..." },
  upgradeRequired: { en: "Upgrade Required", pt: "Upgrade Necessário" },
  requiresBusinessPlan: { en: "Requires Business plan", pt: "Requer plano Business" },
  customSolutionTitle: { en: "Need a custom solution?", pt: "Precisa de uma solução personalizada?" },
  customSolutionDesc: {
    en: "Contact our team to discuss enterprise features, custom integrations, or volume discounts.",
    pt: "Entre em contato para discutir recursos enterprise, integrações customizadas ou descontos por volume.",
  },
  contactSales: { en: "Contact Sales →", pt: "Falar com Vendas →" },
};

// ============================================================================
// Icons
// ============================================================================

const AddonIcon = ({ id, className }: { id: string; className?: string }) => {
  const icons: Record<string, ReactElement> = {
    "whatsapp-bot": (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    "sms-bot": (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
        <path d="M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
        <circle cx="8" cy="9" r="1"/><circle cx="16" cy="9" r="1"/>
      </svg>
    ),
    "extra-storage": (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
      </svg>
    ),
    "advanced-reports": (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
      </svg>
    ),
  };
  return icons[id] || null;
};

const CheckIcon = () => (
  <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const IncludedIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

function useAddonTranslations() {
  const { isBrazil } = useLocale();

  const t = (key: keyof typeof TRANSLATIONS) =>
    isBrazil ? (TRANSLATIONS[key] as { en: string; pt: string }).pt : (TRANSLATIONS[key] as { en: string; pt: string }).en;

  const getPrice = (addon: Addon) => isBrazil ? addon.pricing.brl : addon.pricing.usd;
  const getPriceNote = (addon: Addon) => isBrazil ? (addon.pricing.noteBrl || addon.pricing.note) : addon.pricing.note;
  const getDescription = (addon: Addon) => isBrazil && addon.descriptionBrl ? addon.descriptionBrl : addon.description;
  const getFeatures = (addon: Addon) => isBrazil && addon.featuresBrl ? addon.featuresBrl : addon.features;
  const getIncludedInPlans = (addon: Addon) => isBrazil && addon.includedInPlansBrl ? addon.includedInPlansBrl : addon.includedInPlans;

  return { t, getPrice, getPriceNote, getDescription, getFeatures, getIncludedInPlans };
}

// ============================================================================
// Sub-components
// ============================================================================

interface AddonCardProps {
  addon: Addon;
  isActive: boolean;
  isLoading: boolean;
  userPlan: string | null;
  translations: ReturnType<typeof useAddonTranslations>;
  onToggle: (addonId: string, currentlyActive: boolean) => void;
  onNavigate?: AddonsSettingsProps["onNavigate"];
}

function AddonCard({ addon, isActive, isLoading, userPlan, translations, onToggle, onNavigate }: AddonCardProps) {
  const { t, getPrice, getPriceNote, getDescription, getFeatures, getIncludedInPlans } = translations;

  // Check if user's plan requires upgrade to access this addon
  const needsUpgrade = addon.requiredPlans && userPlan && !addon.requiredPlans.includes(userPlan);

  const handleAction = () => {
    const navigationId = addon.id as AddonNavigationId;
    if (isActive && navigationId in ADDON_NAVIGATION_MAP && onNavigate) {
      onNavigate(ADDON_NAVIGATION_MAP[navigationId]);
    } else {
      onToggle(addon.id, isActive);
    }
  };

  return (
    <div
      className={`relative bg-white border rounded-xl p-5 transition-all ${
        isActive ? "border-primary-300 ring-1 ring-primary-100" : "border-gray-200 hover:border-gray-300"
      } ${addon.comingSoon ? "opacity-75" : ""}`}
    >
      {/* Status Badge */}
      {addon.comingSoon && (
        <span className="absolute top-3 right-3 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
          {t("comingSoon")}
        </span>
      )}
      {isActive && !addon.comingSoon && (
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <CheckCircleIcon className="w-3 h-3" />
          {t("active")}
        </span>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${addon.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden`}>
          {addon.iconImage ? (
            <Image src={addon.iconImage} alt={addon.name} width={48} height={48} className="w-full h-full object-cover" />
          ) : (
            <AddonIcon id={addon.id} className={`w-6 h-6 ${addon.iconColor}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{addon.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{getDescription(addon)}</p>
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{getPrice(addon)}</span>
          <span className="text-sm text-gray-500">{getPriceNote(addon)}</span>
        </div>
      </div>

      {/* Features */}
      <ul className="mt-4 space-y-2">
        {getFeatures(addon).map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>

      {/* Included in Plans Note */}
      {addon.includedInPlans && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700 font-medium flex items-center gap-1">
            <IncludedIcon />
            {getIncludedInPlans(addon)?.[0]}
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4">
        {addon.comingSoon ? (
          <button
            disabled
            className="w-full py-2 px-4 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
          >
            {t("comingSoon")}
          </button>
        ) : isActive ? (
          <button
            onClick={handleAction}
            disabled={isLoading}
            className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? t("processing") : t("manage")}
          </button>
        ) : needsUpgrade ? (
          <div className="space-y-2">
            <button
              disabled
              className="w-full py-2 px-4 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg cursor-not-allowed"
            >
              {t("upgradeRequired")}
            </button>
            <p className="text-xs text-center text-gray-500">{t("requiresBusinessPlan")}</p>
          </div>
        ) : (
          <button
            onClick={handleAction}
            disabled={isLoading}
            className="w-full py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? t("processing") : t("addToPlan")}
          </button>
        )}
      </div>
    </div>
  );
}

function CustomSolutionCard({ translations }: { translations: ReturnType<typeof useAddonTranslations> }) {
  const { t } = translations;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <InfoIcon />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">{t("customSolutionTitle")}</h3>
          <p className="text-sm text-gray-600 mt-1">{t("customSolutionDesc")}</p>
          <a
            href="mailto:ana@flexiwell.net?subject=Enterprise%20Features%20Inquiry"
            className="inline-flex items-center mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {t("contactSales")}
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AddonsSettings({ onNavigate }: AddonsSettingsProps) {
  const [activeAddons, setActiveAddons] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const translations = useAddonTranslations();
  const { t } = translations;

  // Load active add-ons and user plan from server on mount
  // First try Stripe subscription, then fall back to database
  useEffect(() => {
    async function loadActiveAddons() {
      try {
        // First try to get add-ons from Stripe subscription
        const stripeResponse = await fetch("/api/stripe/subscription");
        if (stripeResponse.ok) {
          const data = await stripeResponse.json();
          // Set user's plan tier from subscription data
          if (data.plan?.id) {
            setUserPlan(data.plan.id);
          }
          // Check addOns array from subscription
          if (data.addOns && Array.isArray(data.addOns)) {
            const addonsMap: Record<string, boolean> = {};
            data.addOns.forEach((addon: { id: string }) => {
              const uiAddonId = API_TO_UI_ADDON_ID[addon.id];
              if (uiAddonId) {
                addonsMap[uiAddonId] = true;
              }
            });
            setActiveAddons(addonsMap);
            return; // Successfully loaded from Stripe
          }
        }

        // Fall back to database for users without Stripe subscription
        const dbResponse = await fetch("/api/admin/addons");
        if (dbResponse.ok) {
          const data = await dbResponse.json();
          if (data.planTier) {
            setUserPlan(data.planTier);
          }
          if (data.activeAddOns && Array.isArray(data.activeAddOns)) {
            const addonsMap: Record<string, boolean> = {};
            data.activeAddOns.forEach((addOnId: string) => {
              // Support both API format (extra_whatsapp_msgs) and UI format (whatsapp-bot)
              const uiAddonId = API_TO_UI_ADDON_ID[addOnId] || addOnId;
              addonsMap[uiAddonId] = true;
            });
            setActiveAddons(addonsMap);
          }
        }
      } catch (err) {
        console.error("Failed to load active add-ons:", err);
      }
    }
    loadActiveAddons();
  }, []);

  const handleToggleAddon = async (addonId: string, currentlyActive: boolean) => {
    if (loading) return;

    const apiAddonId = UI_TO_API_ADDON_ID[addonId];
    if (!apiAddonId) {
      console.error("Unknown addon ID:", addonId);
      return;
    }

    setLoading(addonId);
    setError(null);

    try {
      if (currentlyActive) {
        // Remove add-on - try Stripe first, then fall back to database
        try {
          await removeAddOnFromSubscription({ addOnId: apiAddonId });
        } catch {
          // Fall back to database API
          const response = await fetch("/api/admin/addons", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addOnId: addonId }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to deactivate add-on");
          }
        }
      } else {
        // Add add-on - try Stripe first, then fall back to database
        try {
          await addAddOnToSubscription({ addOnId: apiAddonId });
        } catch {
          // Fall back to database API
          const response = await fetch("/api/admin/addons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addOnId: addonId }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to activate add-on");
          }
        }
      }
      setActiveAddons((prev) => ({ ...prev, [addonId]: !currentlyActive }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update add-on";
      setError(errorMessage);
      console.error("Failed to toggle add-on:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        <p className="text-sm text-gray-600 mt-1">{t("subtitle")}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Addons Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {ADDONS.map((addon) => (
          <AddonCard
            key={addon.id}
            addon={addon}
            isActive={activeAddons[addon.id] || addon.active || false}
            isLoading={loading === addon.id}
            userPlan={userPlan}
            translations={translations}
            onToggle={handleToggleAddon}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* Custom Solution */}
      <CustomSolutionCard translations={translations} />
    </div>
  );
}
