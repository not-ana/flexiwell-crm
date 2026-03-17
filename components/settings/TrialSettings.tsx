"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { showToast } from "./shared";
import { TrialQRCode } from "./TrialQRCode";
import { CreditCard, Banknote, Building2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

type PaymentMethod = "card" | "cash" | "bank_transfer";

interface TrialBookingSettings {
  trialEnabled: boolean;
  trialPrice: number;
  dropInEnabled: boolean;
  dropInPrice: number;
  acceptedPaymentMethods: PaymentMethod[];
  requirePaymentUpfront: boolean;
  maxTrialsPerClient: number;
  postTrialCouponCode: string;
  postTrialDiscountPercent: number;
}

const DEFAULT_SETTINGS: TrialBookingSettings = {
  trialEnabled: true,
  trialPrice: 0,
  dropInEnabled: true,
  dropInPrice: 35,
  acceptedPaymentMethods: ["card", "cash"],
  requirePaymentUpfront: false,
  maxTrialsPerClient: 1,
  postTrialCouponCode: "FIRSTCLASS",
  postTrialDiscountPercent: 20,
};

const PAYMENT_METHODS: { id: PaymentMethod; label: string; description: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "Credit/Debit Card", description: "Via Stripe — charged online", icon: CreditCard },
  { id: "cash", label: "Cash", description: "Pay at the studio front desk", icon: Banknote },
  { id: "bank_transfer", label: "Bank Transfer", description: "Wire or ACH transfer", icon: Building2 },
];

// ── Toggle ─────────────────────────────────────────────────────────────

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${
        enabled ? "bg-primary-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function TrialSettings() {
  const [settings, setSettings] = useState<TrialBookingSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<TrialBookingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings?section=trialBooking");
        if (res.ok) {
          const data = await res.json();
          if (data.trialBooking) {
            const loaded = { ...DEFAULT_SETTINGS, ...data.trialBooking };
            setSettings(loaded);
            setOriginalSettings(loaded);
          }
        }
      } catch (error) {
        console.error("Failed to load trial settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "trialBooking", data: settings }),
      });

      if (res.ok) {
        setOriginalSettings(settings);
        setHasUnsavedChanges(false);
        showToast("Trial settings saved successfully", "success");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    const current = settings.acceptedPaymentMethods;
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];

    // Must have at least one payment method
    if (updated.length === 0) return;

    setSettings({ ...settings, acceptedPaymentMethods: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full size-8 border-2 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Trial & Drop-in</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure how walk-ins book trial classes and drop-ins at your studio.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          variant={hasUnsavedChanges ? "primary" : "secondary"}
        >
          {saving ? "Saving..." : hasUnsavedChanges ? "Save changes" : "Saved"}
        </Button>
      </div>

      {/* Trial Class */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Trial Class</h3>
        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable free trial</p>
              <p className="text-sm text-gray-600 mt-0.5">Allow new clients to book a trial class</p>
            </div>
            <Toggle
              enabled={settings.trialEnabled}
              onChange={() => setSettings({ ...settings, trialEnabled: !settings.trialEnabled })}
            />
          </div>

          {settings.trialEnabled && (
            <>
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Trial class price</p>
                  <p className="text-sm text-gray-600 mt-0.5">Set to $0 for a free trial</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    step={1}
                    value={settings.trialPrice}
                    onChange={(e) => setSettings({ ...settings, trialPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-20 px-3 py-2 text-sm text-center rounded-lg ring-1 ring-gray-300 shadow-xs focus:ring-2 focus:ring-primary-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Max trials per client</p>
                  <p className="text-sm text-gray-600 mt-0.5">How many free trials each email can use</p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.maxTrialsPerClient}
                  onChange={(e) => setSettings({ ...settings, maxTrialsPerClient: parseInt(e.target.value) || 1 })}
                  className="w-20 px-3 py-2 text-sm text-center rounded-lg ring-1 ring-gray-300 shadow-xs focus:ring-2 focus:ring-primary-600 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drop-in Class */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Drop-in Class</h3>
        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable drop-in</p>
              <p className="text-sm text-gray-600 mt-0.5">Allow clients to book a single class without a plan</p>
            </div>
            <Toggle
              enabled={settings.dropInEnabled}
              onChange={() => setSettings({ ...settings, dropInEnabled: !settings.dropInEnabled })}
            />
          </div>

          {settings.dropInEnabled && (
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Drop-in price</p>
                <p className="text-sm text-gray-600 mt-0.5">Price per single class</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  value={settings.dropInPrice}
                  onChange={(e) => setSettings({ ...settings, dropInPrice: Math.max(1, parseFloat(e.target.value) || 35) })}
                  className="w-20 px-3 py-2 text-sm text-center rounded-lg ring-1 ring-gray-300 shadow-xs focus:ring-2 focus:ring-primary-600 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Accepted Payment Methods</h3>
          <p className="text-sm text-gray-600 mt-1">
            Choose how clients can pay for trial and drop-in classes.
          </p>
        </div>

        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
          {PAYMENT_METHODS.map((method) => {
            const isActive = settings.acceptedPaymentMethods.includes(method.id);
            const Icon = method.icon;
            const isLast = settings.acceptedPaymentMethods.length === 1 && isActive;

            return (
              <div key={method.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? "bg-primary-100" : "bg-gray-100"}`}>
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {method.label}
                    </p>
                    <p className="text-xs text-gray-500">{method.description}</p>
                  </div>
                </div>
                <Toggle
                  enabled={isActive}
                  onChange={() => !isLast && togglePaymentMethod(method.id)}
                />
              </div>
            );
          })}
        </div>

        {/* Pay at studio option */}
        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs mt-3">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Allow &quot;pay at studio&quot;</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Clients can book without paying online and pay cash/card when they arrive
              </p>
            </div>
            <Toggle
              enabled={!settings.requirePaymentUpfront}
              onChange={() => setSettings({ ...settings, requirePaymentUpfront: !settings.requirePaymentUpfront })}
            />
          </div>
        </div>
      </div>

      {/* Post-Trial Conversion */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Post-Trial Conversion</h3>
        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Coupon code</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Sent via SMS after the trial class to convert into a plan
              </p>
            </div>
            <input
              type="text"
              value={settings.postTrialCouponCode}
              onChange={(e) => setSettings({ ...settings, postTrialCouponCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
              placeholder="FIRSTCLASS"
              className="w-36 px-3 py-2 text-sm text-center font-mono rounded-lg ring-1 ring-gray-300 shadow-xs focus:ring-2 focus:ring-primary-600 focus:outline-none uppercase"
            />
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Discount</p>
              <p className="text-sm text-gray-600 mt-0.5">Percentage off their first plan purchase</p>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                value={settings.postTrialDiscountPercent}
                onChange={(e) => setSettings({ ...settings, postTrialDiscountPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="w-20 px-3 py-2 text-sm text-center rounded-lg ring-1 ring-gray-300 shadow-xs focus:ring-2 focus:ring-primary-600 focus:outline-none"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Front Desk Display</h3>
        <TrialQRCode />
      </div>
    </div>
  );
}
