import type { ShippingMethod } from "./types";

export const FREE_SHIPPING_THRESHOLD = 75;

export const shippingMethods: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "Delivered via USPS",
    price: 5.99,
    estimatedDays: "5–7 business days",
  },
  {
    id: "express",
    name: "Express Shipping",
    description: "Delivered via UPS",
    price: 12.99,
    estimatedDays: "2–3 business days",
  },
];

export function getShippingMethods(subtotal: number): ShippingMethod[] {
  const methods = [...shippingMethods];

  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    methods[0] = { ...methods[0], price: 0, isFree: true };
  }

  return methods;
}

export function getShippingCost(
  methodId: string,
  subtotal: number
): number {
  if (methodId === "standard" && subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  const method = shippingMethods.find((m) => m.id === methodId);
  return method?.price ?? 5.99;
}
