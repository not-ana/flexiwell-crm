// Phone Utilities - Centralized phone formatting

import { BRAZIL_COUNTRY_CODE } from "./constants";

export function formatPhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (!digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    digits = BRAZIL_COUNTRY_CODE + digits;
  }

  return "+" + digits;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

export function isValidBrazilianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}
