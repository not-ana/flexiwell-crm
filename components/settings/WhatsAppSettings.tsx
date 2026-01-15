"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { showToast, Toggle } from "./shared";

interface WhatsAppSettingsProps {
  onBack?: () => void;
}

type WhatsAppPlan = "starter" | "pro" | "enterprise";

interface WhatsAppPlanDetails {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

const whatsappPlans: Record<WhatsAppPlan, WhatsAppPlanDetails> = {
  starter: {
    name: "Starter",
    price: "$49/month",
    features: [
      "View scheduled classes",
      "Confirm attendance",
      "500 conversations/month",
      "Basic automated messages",
    ],
  },
  pro: {
    name: "Pro",
    price: "$99/month",
    features: [
      "Everything in Starter",
      "Cancel classes",
      "Book new classes",
      "2,000 conversations/month",
      "Proactive notifications",
      "Automatic reminders",
    ],
    highlighted: true,
  },
  enterprise: {
    name: "Enterprise",
    price: "$199/month",
    features: [
      "Everything in Pro",
      "Unlimited conversations",
      "Multiple phone numbers",
      "Advanced reports",
      "Priority support",
      "Custom integrations",
    ],
  },
};

export function WhatsAppSettings({ onBack }: WhatsAppSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WhatsAppPlan>("pro");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: "",
    authToken: "",
    whatsappNumber: "",
  });

  // Load WhatsApp config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/whatsapp/status");
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setIsEnabled(true);
          }
        }
      } catch (error) {
        console.error("Failed to load WhatsApp config:", error);
      }
    }
    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.whatsappNumber) {
      showToast("All fields are required", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/whatsapp/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid: twilioConfig.accountSid,
          authToken: twilioConfig.authToken,
          phoneNumber: twilioConfig.whatsappNumber,
        }),
      });

      if (res.ok) {
        showToast("WhatsApp connected successfully");
        setShowConfigModal(false);
        setIsEnabled(true);
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to save configuration", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save configuration", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Add-ons
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-900">WhatsApp Business</h2>
        <p className="text-sm text-gray-600 mt-1">
          Let your clients check classes, confirm attendance, and cancel via WhatsApp.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">WhatsApp Bot</p>
              <p className="text-sm text-gray-500">
                {isEnabled ? "Active • " + whatsappPlans[selectedPlan].name + " Plan" : "Not configured"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Active
                </span>
                <Button variant="secondary" onClick={() => setShowConfigModal(true)}>
                  Configure
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowConfigModal(true)}>
                Enable WhatsApp
              </Button>
            )}
          </div>
        </div>

        {isEnabled && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-xs text-gray-500">Messages this month</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">89%</p>
                <p className="text-xs text-gray-500">Response rate</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-xs text-gray-500">Bot confirmations</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">WhatsApp Plans</h3>
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(whatsappPlans) as WhatsAppPlan[]).map((planKey) => {
            const plan = whatsappPlans[planKey];
            const isSelected = selectedPlan === planKey;
            return (
              <div
                key={planKey}
                className={`relative bg-white border-2 rounded-xl p-5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary-500 ring-2 ring-primary-100"
                    : "border-gray-200 hover:border-gray-300"
                } ${plan.highlighted ? "shadow-lg" : ""}`}
                onClick={() => setSelectedPlan(planKey)}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                      Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-4">
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{plan.price}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {isSelected ? "Current Plan" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bot Features */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Bot Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">View Classes</p>
              <p className="text-xs text-gray-500">Client views their upcoming scheduled classes</p>
            </div>
            <Toggle enabled={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Confirm Attendance</p>
              <p className="text-xs text-gray-500">Client confirms attendance for classes</p>
            </div>
            <Toggle enabled={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Cancel Class</p>
              <p className="text-xs text-gray-500">Client cancels class directly</p>
            </div>
            <Toggle enabled={selectedPlan !== "starter"} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Book New Class</p>
              <p className="text-xs text-gray-500">Client books new classes via WhatsApp</p>
            </div>
            <Toggle enabled={selectedPlan !== "starter"} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Automatic Reminders</p>
              <p className="text-xs text-gray-500">Send reminder 24h before class</p>
            </div>
            <Toggle enabled={selectedPlan !== "starter"} onChange={() => {}} />
          </div>
        </div>
      </div>

      {/* Twilio Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Configure Twilio</h3>
                </div>
                <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  To use WhatsApp Business, you need a Twilio account.
                  <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="font-medium underline ml-1">
                    Create free account
                  </a>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioConfig.accountSid}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Found in Twilio Console</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioConfig.authToken}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="+15551234567"
                  value={twilioConfig.whatsappNumber}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">WhatsApp approved number in Twilio</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Webhook URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-600 overflow-x-auto">
                    https://your-domain.com/api/webhook/whatsapp/twilio
                  </code>
                  <button className="px-3 py-2 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50">
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Configure this URL in Twilio Console → Messaging → WhatsApp Sandbox</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.whatsappNumber}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Save and Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
