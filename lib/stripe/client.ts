// Stripe Client-side utilities
// This file is safe to import in client components

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

// Get the Stripe instance (singleton pattern)
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}

// Redirect to Stripe Checkout using URL (modern method)
// In newer versions of Stripe.js, use the checkout session URL directly
export async function redirectToCheckout(url: string): Promise<void> {
  if (!url) {
    throw new Error("Checkout URL is required");
  }

  // Redirect to the Stripe hosted checkout page
  window.location.href = url;
}

// Types for API responses
export interface CheckoutResponse {
  sessionId: string;
  url?: string;
}

export interface PortalResponse {
  url: string;
}

export interface SubscriptionResponse {
  id: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  trialStart: number | null;
  trialEnd: number | null;
  plan: {
    id: string;
    priceId: string;
    name: string;
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  };
  addOns: Array<{
    id: string;
    stripeItemId: string;
    name: string;
    amount: number;
    quantity: number;
  }>;
  upcomingInvoice: {
    amount: number;
    currency: string;
    date: number | null;
  } | null;
}

// API call helpers

// Create checkout session for a plan
export async function createCheckoutForPlan(params: {
  planTier: string;
  billingPeriod: "monthly" | "annual";
}): Promise<CheckoutResponse> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create checkout session");
  }

  return response.json();
}

// Create checkout session for an add-on
export async function createCheckoutForAddOn(params: {
  addOnId: string;
  quantity?: number;
}): Promise<CheckoutResponse> {
  const response = await fetch("/api/stripe/checkout/addon", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create add-on checkout");
  }

  return response.json();
}

// Open billing portal
export async function openBillingPortal(): Promise<void> {
  const response = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to open billing portal");
  }

  const { url } = await response.json();
  window.location.href = url;
}

// Get current subscription details
export async function getCurrentSubscription(): Promise<SubscriptionResponse | null> {
  const response = await fetch("/api/stripe/subscription");

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to get subscription");
  }

  return response.json();
}

// Change plan (upgrade/downgrade)
export async function changePlan(params: {
  newPlanTier: string;
  newBillingPeriod: "monthly" | "annual";
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/stripe/subscription/change", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to change plan");
  }

  return response.json();
}

// Preview plan change (see proration)
export async function previewPlanChange(params: {
  newPlanTier: string;
  newBillingPeriod: "monthly" | "annual";
}): Promise<{
  immediateCharge: number;
  nextInvoiceAmount: number;
  nextInvoiceDate: number | null;
  currency: string;
  lines: Array<{
    description: string;
    amount: number;
    proration: boolean;
  }>;
}> {
  const response = await fetch("/api/stripe/subscription/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to preview plan change");
  }

  return response.json();
}

// Cancel subscription
export async function cancelSubscription(params?: {
  immediately?: boolean;
  reason?: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/stripe/subscription/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params || {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to cancel subscription");
  }

  return response.json();
}

// Reactivate cancelled subscription
export async function reactivateSubscription(): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await fetch("/api/stripe/subscription/reactivate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reactivate subscription");
  }

  return response.json();
}

// Add an add-on to existing subscription
export async function addAddOnToSubscription(params: {
  addOnId: string;
  quantity?: number;
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/stripe/subscription/addons", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add add-on");
  }

  return response.json();
}

// Remove an add-on from subscription
export async function removeAddOnFromSubscription(params: {
  addOnId: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/stripe/subscription/addons", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove add-on");
  }

  return response.json();
}

// Get invoice history
export interface InvoiceResponse {
  id: string;
  number: string;
  amount: number;
  amountDue: number;
  currency: string;
  status: string;
  date: number;
  periodStart: number;
  periodEnd: number;
  pdfUrl: string | null;
  hostedUrl: string | null;
  description: string;
}

export async function getInvoices(): Promise<{
  invoices: InvoiceResponse[];
  hasMore: boolean;
}> {
  const response = await fetch("/api/stripe/invoices");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get invoices");
  }

  return response.json();
}
