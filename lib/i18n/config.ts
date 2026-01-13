// Internationalization (i18n) Configuration
// Supports: pt-BR (Brazilian Portuguese), en-US (American English), en-GB, es-ES

export const defaultLocale = "en-US" as const;
export const locales = ["pt-BR", "en-US", "en-GB", "es-ES"] as const;
export type Locale = (typeof locales)[number];

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  region: "BR" | "US" | "EU" | "GLOBAL";
  currency: "BRL" | "USD" | "EUR" | "GBP";
  dateFormat: string;
  timeFormat: "12h" | "24h";
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

export const localeConfigs: Record<Locale, LocaleConfig> = {
  "pt-BR": {
    code: "pt-BR",
    name: "Portuguese (Brazil)",
    nativeName: "Portugues (Brasil)",
    region: "BR",
    currency: "BRL",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "24h",
    numberFormat: {
      decimal: ",",
      thousands: ".",
    },
  },
  "en-US": {
    code: "en-US",
    name: "English (US)",
    nativeName: "English (US)",
    region: "US",
    currency: "USD",
    dateFormat: "MM/dd/yyyy",
    timeFormat: "12h",
    numberFormat: {
      decimal: ".",
      thousands: ",",
    },
  },
  "en-GB": {
    code: "en-GB",
    name: "English (UK)",
    nativeName: "English (UK)",
    region: "EU",
    currency: "GBP",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "24h",
    numberFormat: {
      decimal: ".",
      thousands: ",",
    },
  },
  "es-ES": {
    code: "es-ES",
    name: "Spanish (Spain)",
    nativeName: "Espanol (Espana)",
    region: "EU",
    currency: "EUR",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "24h",
    numberFormat: {
      decimal: ",",
      thousands: ".",
    },
  },
};

// Get locale config
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return localeConfigs[locale] || localeConfigs[defaultLocale];
}

// Detect locale from Accept-Language header
export function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferredLocales = acceptLanguage
    .split(",")
    .map((lang) => {
      const [locale, q = "1"] = lang.trim().split(";q=");
      return { locale: locale.trim(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { locale } of preferredLocales) {
    // Exact match
    if (locales.includes(locale as Locale)) {
      return locale as Locale;
    }
    // Language match (e.g., "pt" matches "pt-BR")
    const langMatch = locales.find((l) => l.startsWith(locale.split("-")[0]));
    if (langMatch) {
      return langMatch;
    }
  }

  return defaultLocale;
}

// Get region from locale
export function getRegionFromLocale(locale: Locale): "BR" | "US" | "EU" | "GLOBAL" {
  return localeConfigs[locale]?.region || "GLOBAL";
}

// Get currency from locale
export function getCurrencyFromLocale(locale: Locale): "BRL" | "USD" | "EUR" | "GBP" {
  return localeConfigs[locale]?.currency || "USD";
}

// Format date according to locale
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Format time according to locale
export function formatTime(date: Date, locale: Locale): string {
  const config = getLocaleConfig(locale);
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: config.timeFormat === "12h",
  });
}

// Format currency according to locale
export function formatCurrency(amount: number, locale: Locale, currency?: string): string {
  const config = getLocaleConfig(locale);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || config.currency,
  }).format(amount);
}
