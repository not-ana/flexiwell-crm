"use client";

import { useState, useEffect, useMemo } from "react";

// ============================================================================
// Types
// ============================================================================

export type SupportedLocale = "pt-BR" | "en-US" | "es-ES";

export interface LocaleInfo {
  locale: SupportedLocale;
  language: string;
  country: string;
  isBrazil: boolean;
  isPortuguese: boolean;
  isSpanish: boolean;
  isEnglish: boolean;
}

// ============================================================================
// Locale Detection
// ============================================================================

function detectLocale(): SupportedLocale {
  if (typeof navigator === "undefined") {
    return "en-US";
  }

  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || "en-US";

  if (browserLang.startsWith("pt")) {
    return "pt-BR";
  }

  if (browserLang.startsWith("es")) {
    return "es-ES";
  }

  return "en-US";
}

// ============================================================================
// useLocale Hook
// ============================================================================

export function useLocale(): LocaleInfo {
  const [locale, setLocale] = useState<SupportedLocale>("en-US");

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  return useMemo(() => {
    const language = locale.split("-")[0];
    const country = locale.split("-")[1];

    return {
      locale,
      language,
      country,
      isBrazil: locale === "pt-BR",
      isPortuguese: language === "pt",
      isSpanish: language === "es",
      isEnglish: language === "en",
    };
  }, [locale]);
}

// ============================================================================
// Translation Helper
// ============================================================================

type TranslationKey = string;
type Translations = Record<SupportedLocale, string>;

export function useTranslation<T extends Record<TranslationKey, Translations>>(
  translations: T
) {
  const { locale } = useLocale();

  return useMemo(() => {
    const t = (key: keyof T): string => {
      const translation = translations[key];
      if (!translation) {
        console.warn(`Missing translation for key: ${String(key)}`);
        return String(key);
      }
      return translation[locale] || translation["en-US"] || String(key);
    };

    return { t, locale };
  }, [locale, translations]);
}

// ============================================================================
// Common Translations
// ============================================================================

export const commonTranslations = {
  save: {
    "pt-BR": "Salvar",
    "en-US": "Save",
    "es-ES": "Guardar",
  },
  cancel: {
    "pt-BR": "Cancelar",
    "en-US": "Cancel",
    "es-ES": "Cancelar",
  },
  delete: {
    "pt-BR": "Excluir",
    "en-US": "Delete",
    "es-ES": "Eliminar",
  },
  edit: {
    "pt-BR": "Editar",
    "en-US": "Edit",
    "es-ES": "Editar",
  },
  add: {
    "pt-BR": "Adicionar",
    "en-US": "Add",
    "es-ES": "Agregar",
  },
  back: {
    "pt-BR": "Voltar",
    "en-US": "Back",
    "es-ES": "Volver",
  },
  backToAddons: {
    "pt-BR": "Voltar para Add-ons",
    "en-US": "Back to Add-ons",
    "es-ES": "Volver a Add-ons",
  },
  configure: {
    "pt-BR": "Configurar",
    "en-US": "Configure",
    "es-ES": "Configurar",
  },
  processing: {
    "pt-BR": "Processando...",
    "en-US": "Processing...",
    "es-ES": "Procesando...",
  },
  saving: {
    "pt-BR": "Salvando...",
    "en-US": "Saving...",
    "es-ES": "Guardando...",
  },
  loading: {
    "pt-BR": "Carregando...",
    "en-US": "Loading...",
    "es-ES": "Cargando...",
  },
} as const;

export default useLocale;
