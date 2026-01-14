"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { pricingPlans, PlanTier, BillingPeriod } from "@/lib/config/pricing";
import { api, getStoredTokens } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";

type ClientSettingsTab = "profile" | "my-plan" | "payment-history";

const tabs: { id: ClientSettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "my-plan", label: "My Plan" },
  { id: "payment-history", label: "Payment History" },
];

// Helper to get initials from name
function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.[0]?.toUpperCase() || "";
  const last = lastName?.[0]?.toUpperCase() || "";
  return first + last || "??";
}

// Profile Settings Component
function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);
  const [pendingPhotoBase64, setPendingPhotoBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get<{
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
          avatar: string | null;
          name: string;
        }>("/api/profile");

        if (response.data) {
          const data = response.data;
          setFormData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
          });
          setAvatar(data.avatar);
          setOriginalAvatar(data.avatar);
        } else if (response.error) {
          console.error("Failed to fetch profile:", response.error);
          // Fallback to auth user data
          if (user) {
            const nameParts = user.name?.split(" ") || [];
            setFormData({
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
              email: user.email || "",
              phone: "",
            });
            setAvatar(user.avatar || null);
            setOriginalAvatar(user.avatar || null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCancel = async () => {
    // Refetch profile to reset
    setIsLoading(true);
    try {
      const response = await api.get<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        avatar: string | null;
      }>("/api/profile");

      if (response.data) {
        setFormData({
          firstName: response.data.firstName || "",
          lastName: response.data.lastName || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
        });
        setAvatar(response.data.avatar);
        setOriginalAvatar(response.data.avatar);
      }
      setPasswords({ current: "", new: "", confirm: "" });
      setPendingPhotoBase64(null);
      setError("");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validate passwords if changing (only when user actually wants to change password)
      if (passwords.new) {
        if (!passwords.current) {
          setError("Current password is required to change password");
          setIsSaving(false);
          return;
        }
        if (passwords.new !== passwords.confirm) {
          setError("New passwords do not match");
          setIsSaving(false);
          return;
        }
        if (passwords.new.length < 8) {
          setError("New password must be at least 8 characters");
          setIsSaving(false);
          return;
        }
      }

      const { accessToken } = getStoredTokens();
      const authHeaders: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        authHeaders["Authorization"] = `Bearer ${accessToken}`;
      }

      let newAvatarUrl: string | undefined;

      // Upload pending photo if there is one
      if (pendingPhotoBase64) {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            type: "profile",
            data: pendingPhotoBase64,
          }),
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Failed to upload photo");
        }

        newAvatarUrl = uploadData.url;
      }

      const updateData: Record<string, string | undefined> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      if (newAvatarUrl) {
        updateData.avatar = newAvatarUrl;
      }

      if (passwords.current && passwords.new) {
        updateData.currentPassword = passwords.current;
        updateData.newPassword = passwords.new;
      }

      const response = await api.put<{ success: boolean; error?: string; user?: { name: string; avatar?: string } }>("/api/profile", updateData);

      if (response.error) {
        throw new Error(response.error.error || "Failed to update profile");
      }

      // Update local state with new avatar
      if (newAvatarUrl) {
        setAvatar(newAvatarUrl);
        setOriginalAvatar(newAvatarUrl);
        setPendingPhotoBase64(null);
      }

      // Update AuthContext with new user data
      if (user) {
        updateUser({
          ...user,
          name: response.data?.user?.name || `${formData.firstName} ${formData.lastName}`.trim(),
          avatar: newAvatarUrl || avatar || undefined,
        });
      }

      setSuccess("Profile updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          setError("Image must be less than 2MB");
          return;
        }

        // Convert to base64 for preview only - actual upload happens on Save
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setPendingPhotoBase64(base64);
          setAvatar(base64); // Show preview immediately
          setError("");
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-600 mt-1">Update your personal information.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-6">
        {/* Avatar and Account Info */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg sm:text-xl font-semibold text-white">
                  {getInitials(formData.firstName, formData.lastName)}
                </span>
              </div>
            )}
            <div>
              <button
                onClick={handlePhotoChange}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Change photo
              </button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          {/* Account Info - Right side */}
          <div className="sm:ml-auto sm:text-right space-y-1">
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="text-sm text-gray-500">Email:</span>
              <span className="text-sm text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="text-sm text-gray-500">Type:</span>
              <span className="text-sm text-gray-900 capitalize">{user?.role}</span>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="text-sm text-gray-500">ID:</span>
              <span className="text-sm text-gray-400 font-mono text-xs">{user?.id}</span>
              <button
                type="button"
                onClick={() => {
                  if (user?.id) {
                    navigator.clipboard.writeText(user.id);
                  }
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Copy Account ID"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Password Section */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Change password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Account Settings Section */}
      <AccountSettings />
    </div>
  );
}

// Map pricing plans for the UI
const availablePlans = pricingPlans
  .filter(p => !p.pricing.customPricing) // Exclude enterprise
  .map(p => ({
    id: p.id,
    name: p.name,
    priceMonthly: p.pricing.monthly,
    priceAnnual: p.pricing.annual,
    features: p.features.filter(f => f.included).slice(0, 4).map(f => f.name),
    popular: p.highlighted,
    limits: p.limits,
  }));

// Change Plan Modal
function ChangePlanModal({
  isOpen,
  onClose,
  currentPlanId,
  onPlanChanged,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId: string;
  onPlanChanged?: () => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!isOpen) return null;

  const currentPlanData = availablePlans.find(p => p.id === currentPlanId);
  const selectedPlanData = availablePlans.find(p => p.id === selectedPlan);
  const currentPrice = currentPlanData?.priceMonthly || 0;
  const newPrice = billingPeriod === "monthly" ? selectedPlanData?.priceMonthly : selectedPlanData?.priceAnnual;
  const isUpgrade = (newPrice || 0) > currentPrice;
  const isDowngrade = (newPrice || 0) < currentPrice;

  const handleRequestChange = () => {
    if (selectedPlan === currentPlanId) {
      setError("You're already on this plan.");
      return;
    }
    setError("");
    setShowConfirmModal(true);
  };

  const handleConfirmChange = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPlanTier: selectedPlan as PlanTier,
          newBillingPeriod: billingPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change plan");
      }

      setShowConfirmModal(false);
      onPlanChanged?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan");
      setShowConfirmModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const displayPrice = billingPeriod === "monthly"
    ? selectedPlanData?.priceMonthly
    : selectedPlanData?.priceAnnual;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Change Plan</h2>
          <p className="text-sm text-gray-600 mt-1">Select a new plan for your subscription</p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Billing Period Toggle */}
        <div className="px-6 pt-4">
          <div className="flex justify-center gap-2 p-1 bg-gray-100 rounded-lg w-fit mx-auto">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                billingPeriod === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual <span className="text-green-600 text-xs">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availablePlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPlan === plan.id
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                )}
                {currentPlanId === plan.id && (
                  <span className="absolute -top-2 right-2 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                    Current
                  </span>
                )}
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${billingPeriod === "monthly" ? plan.priceMonthly : plan.priceAnnual}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
                {billingPeriod === "annual" && (
                  <p className="text-xs text-green-600">Billed annually</p>
                )}
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRequestChange}
            disabled={selectedPlan === currentPlanId}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Select Plan"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              {/* Icon */}
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isUpgrade ? "bg-green-100" : "bg-amber-100"
              }`}>
                {isUpgrade ? (
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                {isUpgrade ? "Confirm Upgrade" : "Confirm Downgrade"}
              </h3>

              {/* Plan change summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 mb-1">Current Plan</p>
                    <p className="font-semibold text-gray-900">{currentPlanData?.name}</p>
                    <p className="text-sm text-gray-600">${currentPrice}/mo</p>
                  </div>
                  <div className="px-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 mb-1">New Plan</p>
                    <p className="font-semibold text-gray-900">{selectedPlanData?.name}</p>
                    <p className="text-sm text-gray-600">${newPrice}/mo</p>
                  </div>
                </div>
              </div>

              {/* Warning/Info message */}
              <div className={`p-3 rounded-lg mb-4 ${
                isUpgrade ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
              }`}>
                <p className={`text-sm ${isUpgrade ? "text-green-700" : "text-amber-700"}`}>
                  {isUpgrade
                    ? "Your new plan will be activated immediately. You will have access to more classes and features."
                    : "When downgrading, your remaining classes may be adjusted. Please check with the studio for details."}
                </p>
              </div>

              {/* Billing info */}
              <p className="text-xs text-gray-500 text-center">
                {billingPeriod === "annual"
                  ? `Billed annually at $${(newPrice || 0) * 12}/year`
                  : `Billed monthly at $${newPrice}/month`
                }
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChange}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2.5 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  isUpgrade
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isProcessing ? "Processing..." : isUpgrade ? "Confirm Upgrade" : "Confirm Downgrade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Update Payment - Uses Stripe Customer Portal
async function openStripePortal() {
  try {
    const response = await fetch("/api/stripe/portal", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to open payment portal");
    }

    // Redirect to Stripe Customer Portal
    window.location.href = data.url;
  } catch (error) {
    console.error("Portal error:", error);
    alert("Failed to open payment portal. Please try again.");
  }
}

// Update Payment Modal (simplified - redirects to Stripe)
function UpdatePaymentModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleOpenPortal = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open payment portal");
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open payment portal. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Payment Method</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your payment method securely</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-xs text-gray-500">Your payment info is encrypted and secure</p>
          </div>

          <p className="text-sm text-gray-600">
            You will be redirected to Stripe's secure portal to update your payment method.
          </p>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleOpenPortal}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Opening..." : "Open Stripe Portal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// My Plan Settings Component (Client's studio/gym membership)
function MyPlanSettings() {
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({
    id: "growth",
    name: "Growth",
    price: 99,
    period: "monthly" as BillingPeriod,
    status: "active",
    nextBilling: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current subscription
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/stripe/subscription");
        if (response.ok) {
          const data = await response.json();
          if (data.subscription) {
            const planData = pricingPlans.find(p => p.id === data.subscription.planTier);
            setCurrentPlan({
              id: data.subscription.planTier,
              name: planData?.name || data.subscription.planTier,
              price: data.subscription.billingPeriod === "monthly"
                ? planData?.pricing.monthly || 0
                : planData?.pricing.annual || 0,
              period: data.subscription.billingPeriod,
              status: data.subscription.status,
              nextBilling: data.subscription.currentPeriodEnd
                ? new Date(data.subscription.currentPeriodEnd * 1000).toLocaleDateString()
                : "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  const refreshSubscription = () => {
    setIsLoading(true);
    fetch("/api/stripe/subscription")
      .then(res => res.json())
      .then(data => {
        if (data.subscription) {
          const planData = pricingPlans.find(p => p.id === data.subscription.planTier);
          setCurrentPlan({
            id: data.subscription.planTier,
            name: planData?.name || data.subscription.planTier,
            price: data.subscription.billingPeriod === "monthly"
              ? planData?.pricing.monthly || 0
              : planData?.pricing.annual || 0,
            period: data.subscription.billingPeriod,
            status: data.subscription.status,
            nextBilling: data.subscription.currentPeriodEnd
              ? new Date(data.subscription.currentPeriodEnd * 1000).toLocaleDateString()
              : "",
          });
        }
      })
      .finally(() => setIsLoading(false));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">My Plan</h2>
        <p className="text-sm text-gray-600 mt-1">View your current membership plan at the studio.</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Current membership</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{currentPlan.name}</p>
            <p className="text-sm text-gray-500">${currentPlan.price}/{currentPlan.period}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            currentPlan.status === "active"
              ? "bg-green-50 text-green-700"
              : currentPlan.status === "trialing"
              ? "bg-blue-50 text-blue-700"
              : "bg-yellow-50 text-yellow-700"
          }`}>
            {currentPlan.status === "active" ? "Active" :
             currentPlan.status === "trialing" ? "Trial" :
             currentPlan.status.charAt(0).toUpperCase() + currentPlan.status.slice(1)}
          </span>
        </div>

        {currentPlan.nextBilling && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Next billing date</p>
              <p className="text-sm font-medium text-gray-900">{currentPlan.nextBilling}</p>
            </div>
            <button onClick={() => setShowChangePlanModal(true)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Change plan
            </button>
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Available plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-4 rounded-xl border-2 ${
                currentPlan.id === plan.id
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}
              {currentPlan.id === plan.id && (
                <span className="absolute -top-2 right-2 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                  Current
                </span>
              )}
              <h4 className="font-semibold text-gray-900">{plan.name}</h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${plan.priceMonthly}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              {currentPlan.id !== plan.id && (
                <button
                  onClick={() => setShowChangePlanModal(true)}
                  className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  {plan.priceMonthly > currentPlan.price ? "Upgrade" : "Downgrade"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Change Plan Modal */}
      <ChangePlanModal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
        currentPlanId={currentPlan.id}
        onPlanChanged={refreshSubscription}
      />
    </div>
  );
}

// Payment History Settings Component (Client's payments to studio)
interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  date: number;
  pdfUrl: string | null;
  description: string;
}

function PaymentHistorySettings() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch invoices on mount
  useEffect(() => {
    async function fetchInvoices() {
      try {
        const response = await fetch("/api/stripe/invoices?limit=10");
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices || []);
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const handleDownloadInvoice = (pdfUrl: string | null) => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Payment History</h2>
        <p className="text-sm text-gray-600 mt-1">View your payment history at the studio.</p>
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Payment method</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">CARD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Manage your payment method via Stripe
              </p>
              <p className="text-xs text-gray-500">Click Update to access your billing portal</p>
            </div>
          </div>
          <button onClick={() => setShowPaymentModal(true)} className="text-sm text-primary-600 hover:text-primary-700 font-medium self-end sm:self-auto">
            Update
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Billing history</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No invoices yet</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Invoice</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="py-3 text-sm text-gray-600">{formatDate(invoice.date)}</td>
                    <td className="py-3 text-sm text-gray-900">{invoice.number || invoice.description}</td>
                    <td className="py-3 text-sm text-gray-900">
                      ${invoice.amount.toFixed(2)} {invoice.currency}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        invoice.status === "paid"
                          ? "bg-green-50 text-green-700"
                          : invoice.status === "open"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-gray-50 text-gray-700"
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {invoice.pdfUrl ? (
                        <button
                          onClick={() => handleDownloadInvoice(invoice.pdfUrl)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Download
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Payment Modal */}
      <UpdatePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}

// Delete Account Confirmation Modal
function DeleteAccountModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { logout } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const CONFIRM_TEXT = "DELETE MY ACCOUNT";

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_TEXT) {
      setError(`Please type '${CONFIRM_TEXT}' to confirm`);
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          confirmText,
          password: password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Logout and redirect
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Delete account</h2>
              <p className="text-sm text-red-600">This action cannot be undone</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">By deleting your account:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• All your data will be permanently removed</li>
              <li>• You will lose access to all linked companies</li>
              <li>• Your class history will be anonymized</li>
              <li>• This action CANNOT be undone</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">{CONFIRM_TEXT}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_TEXT}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password (optional, for additional confirmation):
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== CONFIRM_TEXT}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete my account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Account Settings Component
function AccountSettings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string; joinedAt: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch linked companies
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await fetch("/api/company/verify-access");
        if (response.ok) {
          const data = await response.json();
          if (data.companies) {
            setCompanies(data.companies);
          }
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  return (
    <div className="space-y-6 mt-6">
      {/* Linked Companies */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Linked companies</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">You are not linked to any company.</p>
            <p className="text-xs text-gray-400">
              To link, use an invite code provided by the company.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{company.name}</p>
                  <p className="text-xs text-gray-500">
                    Joined on {new Date(company.joinedAt).toLocaleDateString("en-US")}
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-red-600 mb-2">Danger zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          Irreversible actions. Please be certain before proceeding.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete my account
        </button>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

export default function ClientSettingsPage() {
  const [activeTab, setActiveTab] = useState<ClientSettingsTab>("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "my-plan":
        return <MyPlanSettings />;
      case "payment-history":
        return <PaymentHistorySettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Settings</h1>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto">
          <nav className="flex gap-1 -mb-px min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
