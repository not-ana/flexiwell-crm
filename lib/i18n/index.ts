// Internationalization (i18n) Entry Point
// Multi-language support with focus on pt-BR and en-US

export * from "./config";
export { ptBR, type TranslationKeys } from "./translations/pt-BR";
export { enUS } from "./translations/en-US";

import { type Locale, defaultLocale } from "./config";
import { ptBR, type TranslationKeys } from "./translations/pt-BR";
import { enUS } from "./translations/en-US";

// Translation dictionary
const translations: Record<Locale, TranslationKeys> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "en-GB": enUS, // Use en-US as fallback for en-GB
  "es-ES": enUS, // Use en-US as fallback for es-ES (TODO: add es-ES translations)
};

// Get translations for a locale
export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] || translations[defaultLocale];
}

// Type-safe translation getter with dot notation
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

// Get a specific translation by key path
export function t(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
  const translations = getTranslations(locale);
  const keys = key.split(".");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== "string") {
    console.warn(`Translation key is not a string: ${key}`);
    return key;
  }

  // Replace parameters like {name} with actual values
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
      return params[paramKey]?.toString() ?? `{${paramKey}}`;
    });
  }

  return value;
}

// Create a bound translation function for a specific locale
export function createTranslator(locale: Locale) {
  return (key: TranslationKey, params?: Record<string, string | number>) => t(locale, key, params);
}

// Hook-friendly type for use in React components
export interface UseTranslationReturn {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  locale: Locale;
  translations: TranslationKeys;
}
