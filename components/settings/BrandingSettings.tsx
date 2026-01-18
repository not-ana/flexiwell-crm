"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { getStoredTokens } from "@/lib/api/client";
import { showToast } from "./shared";

const ALLOWED_PLANS = ["business", "professional", "enterprise"];

export function BrandingSettings() {
  const [branding, setBranding] = useState({
    customLogo: "",
    customFavicon: "",
    primaryColor: "#6938EF",
    accentColor: "#DD2590",
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  const hasAccess = userPlan && ALLOWED_PLANS.includes(userPlan);

  useEffect(() => {
    async function loadData() {
      try {
        // Load user plan
        const subRes = await fetch("/api/stripe/subscription");
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData.plan?.id) {
            setUserPlan(subData.plan.id);
          }
        }

        // Load branding settings
        const res = await fetch("/api/settings?section=branding");
        if (res.ok) {
          const data = await res.json();
          if (data.branding) {
            setBranding((prev) => ({ ...prev, ...data.branding }));
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const updateBranding = (key: string, value: string) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveBranding = async () => {
    if (!hasAccess) return;

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
    if (!hasAccess) return;

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
          showToast(
            `${type === "logo" ? "Logo" : "Favicon"} uploaded successfully`
          );
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Upload error:", error);
        showToast("Failed to upload image", "error");
      }
    };
    input.click();
  };

  const handleRemoveImage = (type: "logo" | "favicon") => {
    if (!hasAccess) return;

    if (type === "logo") {
      updateBranding("customLogo", "");
    } else {
      updateBranding("customFavicon", "");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-4 bg-gray-200 rounded w-72" />
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Branding</h2>
        <p className="text-sm text-gray-600 mt-1">
          Customize the look and feel of your studio's platform.
        </p>
      </div>

      {/* Upgrade Banner */}
      {!hasAccess && (
        <div className="bg-gradient-to-r from-primary-50 to-pink-50 border border-primary-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">Upgrade to Business</h3>
              <p className="text-sm text-gray-600 mt-1">
                Branding customization is available on Business and Professional plans. Upgrade to customize your logo, colors, and more.
              </p>
              <a
                href="/admin/settings?tab=subscription"
                className="inline-flex items-center mt-3 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Upgrade Plan
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Logo & Assets */}
      <div className={`bg-white border border-gray-200 rounded-xl p-6 ${!hasAccess ? "opacity-50 pointer-events-none" : ""}`}>
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Logo & Assets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Studio Logo
            </label>
            <div
              onClick={() => handleLogoUpload("logo")}
              className="border-2 border-dashed rounded-xl p-6 text-center border-gray-300 hover:border-primary-400 cursor-pointer transition-colors"
            >
              {branding.customLogo ? (
                <div className="flex flex-col items-center">
                  <img
                    src={branding.customLogo}
                    alt="Logo"
                    className="h-12 mb-2 object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage("logo");
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <svg
                    className="w-10 h-10 text-gray-400 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    SVG, PNG or JPG (max 2MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon
            </label>
            <div
              onClick={() => handleLogoUpload("favicon")}
              className="border-2 border-dashed rounded-xl p-6 text-center border-gray-300 hover:border-primary-400 cursor-pointer transition-colors"
            >
              {branding.customFavicon ? (
                <div className="flex flex-col items-center">
                  <img
                    src={branding.customFavicon}
                    alt="Favicon"
                    className="h-8 mb-2 object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage("favicon");
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <svg
                    className="w-10 h-10 text-gray-400 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">Click to upload favicon</p>
                  <p className="text-xs text-gray-400 mt-1">
                    ICO or PNG (32x32px)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Color Scheme */}
      <div className={`bg-white border border-gray-200 rounded-xl p-6 ${!hasAccess ? "opacity-50 pointer-events-none" : ""}`}>
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Color Scheme
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => updateBranding("primaryColor", e.target.value)}
                disabled={!hasAccess}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => updateBranding("primaryColor", e.target.value)}
                disabled={!hasAccess}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used for buttons, links, and accents
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.accentColor}
                onChange={(e) => updateBranding("accentColor", e.target.value)}
                disabled={!hasAccess}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
              />
              <input
                type="text"
                value={branding.accentColor}
                onChange={(e) => updateBranding("accentColor", e.target.value)}
                disabled={!hasAccess}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Secondary highlights and badges
            </p>
          </div>
        </div>

        {/* Color Preview */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
          <div className="flex flex-wrap items-center gap-4">
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
              style={{
                backgroundColor: branding.primaryColor + "20",
                color: branding.primaryColor,
              }}
              className="px-3 py-1 text-xs font-medium rounded-full"
            >
              Badge
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {hasAccess && (
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary">Cancel</Button>
          <Button onClick={handleSaveBranding} disabled={saving}>
            {saving ? "Saving..." : "Save Branding"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default BrandingSettings;
