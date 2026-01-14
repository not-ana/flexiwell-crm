"use client";

/**
 * FUTURE FEATURE: Branding & White Label Settings
 *
 * This feature is currently hidden from all plans.
 * It can be enabled and sold as a premium add-on in the future.
 *
 * Features included:
 * - Custom logo & favicon
 * - Custom color scheme (primary & accent colors)
 * - Custom domain with SSL
 * - Hide "Powered by FlexiWell" branding
 * - Branded email templates
 *
 * Pricing: +$39/month (suggested)
 *
 * To enable:
 * 1. Add "branding" back to the tabs array in app/admin/settings/page.tsx
 * 2. Import and use this component in the settings page
 * 3. Create the necessary API endpoints for branding settings
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { getStoredTokens } from "@/lib/api/client";

// Toast notification helper
function showToast(message: string, type: "success" | "error" = "success") {
  const toast = document.createElement("div");
  toast.className = `fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white text-sm font-medium z-50 shadow-lg ${
    type === "success" ? "bg-green-600" : "bg-red-600"
  }`;
  toast.style.transform = "translateX(-50%)";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-primary-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function BrandingSettings() {
  const [branding, setBranding] = useState({
    whiteLabelEnabled: false,
    customLogo: "",
    customFavicon: "",
    primaryColor: "#6938EF",
    accentColor: "#DD2590",
    customDomain: "",
    hideFlexiwellBranding: false,
    customEmailHeader: "",
    customLoginBackground: "",
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock: Check if white label is available in current plan
  const isWhiteLabelAvailable = false; // Would come from plan context

  useEffect(() => {
    async function loadBranding() {
      try {
        const res = await fetch("/api/settings?section=branding");
        if (res.ok) {
          const data = await res.json();
          if (data.branding) {
            setBranding(prev => ({ ...prev, ...data.branding }));
          }
        }
      } catch (error) {
        console.error("Failed to load branding:", error);
      }
    }
    loadBranding();
  }, []);

  const updateBranding = (key: string, value: string | boolean) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "branding", data: branding }),
      });
      if (res.ok) {
        showToast("Branding saved successfully");
      } else {
        showToast("Failed to save branding", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save branding", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (type: "logo" | "favicon") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        showToast("Image must be less than 2MB", "error");
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const { accessToken } = getStoredTokens();
          const authHeaders: HeadersInit = {
            "Content-Type": "application/json",
          };
          if (accessToken) {
            authHeaders["Authorization"] = `Bearer ${accessToken}`;
          }

          const response = await fetch("/api/upload", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              type: "image",
              data: base64,
              filename: file.name,
              folder: type === "logo" ? "logos" : "favicons",
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to upload");
          }

          if (type === "logo") {
            updateBranding("customLogo", data.url);
          } else {
            updateBranding("customFavicon", data.url);
          }
          showToast(`${type === "logo" ? "Logo" : "Favicon"} uploaded successfully`);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Upload error:", error);
        showToast("Failed to upload image", "error");
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Branding & White Label</h2>
        <p className="text-sm text-gray-600 mt-1">Customize the look and feel of your studio's platform.</p>
      </div>

      {/* White Label Status */}
      <div className={`bg-white border rounded-xl p-6 ${isWhiteLabelAvailable ? "border-gray-200" : "border-primary-200 bg-primary-50/30"}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isWhiteLabelAvailable ? "bg-green-100" : "bg-primary-100"}`}>
              <svg className={`w-6 h-6 ${isWhiteLabelAvailable ? "text-green-600" : "text-primary-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">White Label Mode</h3>
                {isWhiteLabelAvailable ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>
                ) : (
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">Pro Feature</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {isWhiteLabelAvailable
                  ? "Your studio's branding is displayed to all users."
                  : "Remove FlexiWell branding and use your own logo, colors, and domain."}
              </p>
            </div>
          </div>
          {!isWhiteLabelAvailable ? (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Upgrade to Pro
            </button>
          ) : (
            <Toggle enabled={branding.whiteLabelEnabled} onChange={(v) => updateBranding("whiteLabelEnabled", v)} />
          )}
        </div>

        {!isWhiteLabelAvailable && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-primary-100">
            <p className="text-sm font-medium text-gray-900 mb-2">White Label includes:</p>
            <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom logo & favicon
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom color scheme
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom domain (studio.com)
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Branded email templates
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Remove "Powered by FlexiWell"
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom login page
              </li>
            </ul>
            <p className="text-sm text-primary-700 font-medium mt-3">+$39/month</p>
          </div>
        )}
      </div>

      {/* Logo & Assets */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Logo & Assets</h3>
        <div className="grid grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Studio Logo</label>
            <div
              onClick={() => isWhiteLabelAvailable && handleLogoUpload("logo")}
              className={`border-2 border-dashed rounded-xl p-6 text-center ${!isWhiteLabelAvailable ? "opacity-50 pointer-events-none" : "border-gray-300 hover:border-primary-400 cursor-pointer"}`}
            >
              {branding.customLogo ? (
                <div className="flex flex-col items-center">
                  <img src={branding.customLogo} alt="Logo" className="h-12 mb-2" />
                  <button
                    onClick={() => updateBranding("customLogo", "")}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">SVG, PNG or JPG (max 2MB)</p>
                </>
              )}
            </div>
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
            <div
              onClick={() => isWhiteLabelAvailable && handleLogoUpload("favicon")}
              className={`border-2 border-dashed rounded-xl p-6 text-center ${!isWhiteLabelAvailable ? "opacity-50 pointer-events-none" : "border-gray-300 hover:border-primary-400 cursor-pointer"}`}
            >
              {branding.customFavicon ? (
                <div className="flex flex-col items-center">
                  <img src={branding.customFavicon} alt="Favicon" className="h-8 mb-2" />
                  <button
                    onClick={() => updateBranding("customFavicon", "")}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600">Click to upload favicon</p>
                  <p className="text-xs text-gray-400 mt-1">ICO or PNG (32x32px)</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Color Scheme */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Color Scheme</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <div className={`flex items-center gap-3 ${!isWhiteLabelAvailable ? "opacity-50 pointer-events-none" : ""}`}>
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => updateBranding("primaryColor", e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => updateBranding("primaryColor", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Used for buttons, links, and accents</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
            <div className={`flex items-center gap-3 ${!isWhiteLabelAvailable ? "opacity-50 pointer-events-none" : ""}`}>
              <input
                type="color"
                value={branding.accentColor}
                onChange={(e) => updateBranding("accentColor", e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.accentColor}
                onChange={(e) => updateBranding("accentColor", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Secondary highlights and badges</p>
          </div>
        </div>

        {/* Color Preview */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
          <div className="flex items-center gap-4">
            <button
              style={{ backgroundColor: branding.primaryColor }}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg"
            >
              Primary Button
            </button>
            <button
              style={{ backgroundColor: branding.accentColor }}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg"
            >
              Accent Button
            </button>
            <span
              style={{ backgroundColor: branding.primaryColor + "20", color: branding.primaryColor }}
              className="px-3 py-1 text-xs font-medium rounded-full"
            >
              Badge
            </span>
          </div>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Custom Domain</h3>
        <p className="text-sm text-gray-600 mb-4">Use your own domain for a fully branded experience.</p>

        <div className={`space-y-4 ${!isWhiteLabelAvailable ? "opacity-50 pointer-events-none" : ""}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">https://</span>
              <input
                type="text"
                placeholder="app.yourstudio.com"
                value={branding.customDomain}
                onChange={(e) => updateBranding("customDomain", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Point your domain's CNAME record to <code className="bg-gray-100 px-1 rounded">app.flexiwell.net</code>
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-yellow-800">SSL certificates are automatically provisioned. DNS changes may take up to 48 hours.</p>
          </div>
        </div>
      </div>

      {/* Branding Options */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Branding Options</h3>
        <div className={`space-y-4 ${!isWhiteLabelAvailable ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Hide "Powered by FlexiWell"</p>
              <p className="text-sm text-gray-500">Remove FlexiWell attribution from footer</p>
            </div>
            <Toggle enabled={branding.hideFlexiwellBranding} onChange={(v) => updateBranding("hideFlexiwellBranding", v)} />
          </div>
        </div>
      </div>

      {isWhiteLabelAvailable && (
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary">Cancel</Button>
          <Button onClick={handleSaveBranding} disabled={saving}>
            {saving ? "Saving..." : "Save Branding"}
          </Button>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Unlock White Label mode and make FlexiWell truly yours. Your clients will only see your brand.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-baseline justify-center gap-1 mb-4">
                  <span className="text-3xl font-bold text-gray-900">$39</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Custom logo, colors & favicon
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Custom domain with SSL
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Branded email templates
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    No FlexiWell branding
                  </li>
                </ul>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Maybe later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.location.href = "/admin/billing?upgrade=true";
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandingSettings;
