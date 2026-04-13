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
  onNavigate?: (tab: string) => void;
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

type AddonNavigationId = string;

// ============================================================================
// Constants
// ============================================================================

const ADDON_NAVIGATION_MAP: Record<string, string> = {};

// Map UI addon IDs to API addon IDs
const UI_TO_API_ADDON_ID: Record<string, string> = {
  "extra-storage": "additional_storage",
};

const API_TO_UI_ADDON_ID: Record<string, string> = {
  "additional_storage": "extra-storage",
};

const ADDONS: Addon[] = [
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
    requiredPlans: ["retention_pro"], // Available on retention_pro
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

const FREE_ADDONS: Addon[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept credit card payments and manage subscriptions",
    descriptionBrl: "Aceite pagamentos com cartão de crédito e gerencie assinaturas",
    pricing: { usd: "Free", brl: "Grátis", note: "", noteBrl: "" },
    iconBg: "bg-purple-500",
    iconColor: "text-white",
    iconImage: "/stripe.webp",
    features: [
      "Credit card processing",
      "Subscription management",
      "Invoicing",
      "Fraud protection",
    ],
    featuresBrl: [
      "Processamento de cartão",
      "Gerenciamento de assinaturas",
      "Billing",
      "Proteção contra fraude",
    ],
    active: false,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync your classes and appointments with Google Calendar",
    descriptionBrl: "Sincronize suas aulas e agendamentos com Google Calendar",
    pricing: { usd: "Free", brl: "Grátis", note: "", noteBrl: "" },
    iconBg: "bg-blue-500",
    iconColor: "text-white",
    features: [
      "Two-way sync",
      "Reminders",
      "Availability",
      "Room booking",
    ],
    featuresBrl: [
      "Sincronização bidirecional",
      "Lembretes",
      "Disponibilidade",
      "Reserva de salas",
    ],
    active: false,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing and newsletters for your clients",
    descriptionBrl: "E-mail marketing e newsletters para seus clientes",
    pricing: { usd: "Free", brl: "Grátis", note: "", noteBrl: "" },
    iconBg: "bg-yellow-500",
    iconColor: "text-white",
    features: [
      "Contact sync",
      "Automated campaigns",
      "Segmentation",
      "Analytics",
    ],
    featuresBrl: [
      "Sincronização de contatos",
      "Campanhas automáticas",
      "Segmentação",
      "Analytics",
    ],
    active: false,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect with 5000+ apps and automate workflows",
    descriptionBrl: "Conecte com 5000+ apps e automatize fluxos de trabalho",
    pricing: { usd: "Free", brl: "Grátis", note: "", noteBrl: "" },
    iconBg: "bg-orange-600",
    iconColor: "text-white",
    iconImage: "/zapier.png",
    features: [
      "5000+ app connections",
      "Workflow automation",
      "Triggers",
      "Actions",
    ],
    featuresBrl: [
      "5000+ conexões de apps",
      "Automação de fluxo de trabalho",
      "Gatilhos",
      "Ações",
    ],
    active: false,
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
  requiresBusinessPlan: { en: "Requires Retention Pro plan", pt: "Requer plano Retention Pro" },
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
        if (stripeResponse.status === 401) {
          setError("Authentication required");
          return;
        }
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
        if (dbResponse.status === 401) {
          setError("Authentication required");
          return;
        }
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
        setError("Failed to load add-ons");
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

      {/* Paid Addons Section */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Paid Add-ons</h3>
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
      </div>

      {/* Free Integrations Section */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Free Integrations</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {FREE_ADDONS.map((addon) => (
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
      </div>

      {/* Custom Solution */}
      <CustomSolutionCard translations={translations} />
    </div>
  );
}
