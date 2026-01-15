"use client";

import { useState, useEffect, useCallback } from "react";

export type Currency = "USD" | "BRL" | "EUR" | "GBP";

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
  position: "before" | "after";
}

const currencyConfigs: Record<Currency, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    locale: "en-US",
    position: "before",
  },
  BRL: {
    code: "BRL",
    symbol: "R$",
    name: "Brazilian Real",
    locale: "pt-BR",
    position: "before",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    locale: "de-DE",
    position: "before",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    locale: "en-GB",
    position: "before",
  },
};

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrency() {
      try {
        const res = await fetch("/api/settings?section=general");
        if (res.ok) {
          const data = await res.json();
          if (data.general?.currency) {
            setCurrency(data.general.currency as Currency);
          }
        }
      } catch (error) {
        console.error("Failed to load currency setting:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCurrency();
  }, []);

  const config = currencyConfigs[currency];

  const formatCurrency = useCallback(
    (amount: number, options?: { compact?: boolean; showCode?: boolean }) => {
      const { compact = false, showCode = false } = options || {};

      if (compact && amount >= 1000) {
        const formatted = new Intl.NumberFormat(config.locale, {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(amount);
        return `${config.symbol}${formatted}`;
      }

      const formatted = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);

      if (showCode) {
        return `${config.symbol} ${formatted} ${currency}`;
      }

      return `${config.symbol} ${formatted}`;
    },
    [config, currency]
  );

  const formatCurrencyShort = useCallback(
    (amount: number) => {
      return `${config.symbol}${amount.toLocaleString(config.locale)}`;
    },
    [config]
  );

  return {
    currency,
    config,
    loading,
    formatCurrency,
    formatCurrencyShort,
    symbol: config.symbol,
    locale: config.locale,
  };
}

export { currencyConfigs };
export type { CurrencyConfig };
