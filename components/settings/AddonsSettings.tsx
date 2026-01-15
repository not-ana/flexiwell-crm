"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@/components/icons";

interface AddonsSettingsProps {
  onNavigate?: (tab: "whatsapp" | "sms" | "addons") => void;
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
  features: string[];
  featuresBrl?: string[];
  active?: boolean;
  comingSoon?: boolean;
}

const addons: Addon[] = [
  {
    id: "whatsapp-bot",
    name: "WhatsApp AI Bot",
    description: "Automated booking assistant that handles reservations 24/7 via WhatsApp. Includes 1,000 messages/month.",
    descriptionBrl: "Assistente de reservas automatizado 24/7 via WhatsApp. Inclui 1.000 mensagens/mês.",
    pricing: {
      usd: "$29",
      brl: "R$79",
      note: "/month",
      noteBrl: "/mês",
    },
    iconBg: "bg-green-500",
    iconColor: "text-white",
    features: [
      "1,000 messages/month included",
      "24/7 automated responses",
      "Book, cancel & reschedule classes",
      "Answer FAQs about schedules & plans",
    ],
    featuresBrl: [
      "1.000 mensagens/mês incluídas",
      "Respostas automáticas 24/7",
      "Agendar, cancelar e remarcar aulas",
      "Responder dúvidas sobre horários e planos",
    ],
    active: false,
  },
  {
    id: "extra-storage",
    name: "Extra Storage",
    description: "Additional cloud storage for photos, documents, and client files",
    descriptionBrl: "Armazenamento extra para fotos, documentos e arquivos de clientes",
    pricing: {
      usd: "$15",
      brl: "R$49",
      note: "/month per 50GB",
      noteBrl: "/mês por 50GB",
    },
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
  },
  {
    id: "sms-pack",
    name: "SMS Credits Pack",
    description: "Bulk SMS credits for notifications and marketing campaigns",
    descriptionBrl: "Créditos SMS para notificações e campanhas de marketing",
    pricing: {
      usd: "$25",
      brl: "R$69",
      note: "per 500 SMS",
      noteBrl: "por 500 SMS",
    },
    iconBg: "bg-purple-500",
    iconColor: "text-white",
    features: [
      "500 SMS credits",
      "Class reminders",
      "Marketing campaigns",
      "No expiration",
    ],
    featuresBrl: [
      "500 créditos de SMS",
      "Lembretes de aulas",
      "Campanhas de marketing",
      "Sem expiração",
    ],
    active: false,
  },
  {
    id: "advanced-reports",
    name: "Advanced Reports",
    description: "Detailed analytics and custom report builder for business insights",
    descriptionBrl: "Analytics detalhado e criador de relatórios personalizados",
    pricing: {
      usd: "",
      brl: "",
      note: "",
      noteBrl: "",
    },
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
  {
    id: "white-label",
    name: "White Label",
    description: "Remove FlexiWell branding and use your own logo and colors",
    descriptionBrl: "Remova a marca FlexiWell e use seu próprio logo e cores",
    pricing: {
      usd: "",
      brl: "",
      note: "",
      noteBrl: "",
    },
    iconBg: "bg-indigo-500",
    iconColor: "text-white",
    features: [
      "Custom branding",
      "Your logo everywhere",
      "Custom email domain",
      "Branded client portal",
    ],
    featuresBrl: [
      "Branding personalizado",
      "Seu logo em todo lugar",
      "Domínio de email customizado",
      "Portal do cliente com sua marca",
    ],
    comingSoon: true,
  },
];

// SVG icons for each addon
const AddonIcon = ({ id, className }: { id: string; className?: string }) => {
  switch (id) {
    case "whatsapp-bot":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      );
    case "extra-storage":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
        </svg>
      );
    case "sms-pack":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
        </svg>
      );
    case "advanced-reports":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
        </svg>
      );
    case "white-label":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 0 1 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/>
          <circle cx="6.5" cy="11.5" r="1.5"/>
          <circle cx="9.5" cy="7.5" r="1.5"/>
          <circle cx="14.5" cy="7.5" r="1.5"/>
          <circle cx="17.5" cy="11.5" r="1.5"/>
        </svg>
      );
    default:
      return null;
  }
};

export function AddonsSettings({ onNavigate }: AddonsSettingsProps) {
  const [activeAddons, setActiveAddons] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);

  // Detect locale - for now using browser language, could use studio settings
  const isBrazil = typeof navigator !== 'undefined' && navigator.language?.startsWith('pt');

  const handleToggleAddon = async (addonId: string, currentlyActive: boolean) => {
    if (loading) return;

    setLoading(addonId);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setActiveAddons(prev => ({
      ...prev,
      [addonId]: !currentlyActive,
    }));

    setLoading(null);
  };

  const getPrice = (addon: Addon) => isBrazil ? addon.pricing.brl : addon.pricing.usd;
  const getPriceNote = (addon: Addon) => isBrazil ? (addon.pricing.noteBrl || addon.pricing.note) : addon.pricing.note;
  const getDescription = (addon: Addon) => isBrazil && addon.descriptionBrl ? addon.descriptionBrl : addon.description;
  const getFeatures = (addon: Addon) => isBrazil && addon.featuresBrl ? addon.featuresBrl : addon.features;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Add-ons</h2>
        <p className="text-sm text-gray-600 mt-1">
          {isBrazil
            ? "Aprimore sua experiência FlexiWell com recursos extras."
            : "Enhance your FlexiWell experience with extra features and capabilities."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {addons.map((addon) => {
          const isActive = activeAddons[addon.id] || addon.active;
          const isLoading = loading === addon.id;

          return (
            <div
              key={addon.id}
              className={`relative bg-white border rounded-xl p-5 transition-all ${
                isActive
                  ? "border-primary-300 ring-1 ring-primary-100"
                  : "border-gray-200 hover:border-gray-300"
              } ${addon.comingSoon ? "opacity-75" : ""}`}
            >
              {addon.comingSoon && (
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  {isBrazil ? "Em breve" : "Coming Soon"}
                </span>
              )}

              {isActive && !addon.comingSoon && (
                <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <CheckCircleIcon className="w-3 h-3" />
                  {isBrazil ? "Ativo" : "Active"}
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${addon.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <AddonIcon id={addon.id} className={`w-6 h-6 ${addon.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{addon.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{getDescription(addon)}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{getPrice(addon)}</span>
                  <span className="text-sm text-gray-500">{getPriceNote(addon)}</span>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {getFeatures(addon).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {addon.comingSoon ? (
                  <button
                    disabled
                    className="w-full py-2 px-4 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                  >
                    {isBrazil ? "Em breve" : "Coming Soon"}
                  </button>
                ) : isActive ? (
                  <button
                    onClick={() => {
                      if (addon.id === "whatsapp-bot" && onNavigate) {
                        onNavigate("whatsapp");
                      } else if (addon.id === "sms-pack" && onNavigate) {
                        onNavigate("sms");
                      } else {
                        handleToggleAddon(addon.id, true);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (isBrazil ? "Processando..." : "Processing...") : (isBrazil ? "Gerenciar" : "Manage")}
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleAddon(addon.id, false)}
                    disabled={isLoading}
                    className="w-full py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (isBrazil ? "Processando..." : "Processing...") : (isBrazil ? "Adicionar ao Plano" : "Add to Plan")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {isBrazil ? "Precisa de uma solução personalizada?" : "Need a custom solution?"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isBrazil
                ? "Entre em contato para discutir recursos enterprise, integrações customizadas ou descontos por volume."
                : "Contact our team to discuss enterprise features, custom integrations, or volume discounts."}
            </p>
            <a
              href="mailto:ana@flexiwell.net?subject=Enterprise%20Features%20Inquiry&body=Hi%20FlexiWell%20Team%2C%0A%0AI'm%20interested%20in%20learning%20more%20about%20enterprise%20features%2C%20custom%20integrations%2C%20or%20volume%20discounts.%0A%0APlease%20contact%20me%20to%20discuss%20my%20requirements.%0A%0AThank%20you!"
              className="inline-flex items-center mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {isBrazil ? "Falar com Vendas →" : "Contact Sales →"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
