"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { api, getStoredTokens } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { ReplayTourSection } from "@/components/settings/ReplayTourSection";

type ClientSettingsTab = "profile" | "payment-history";

const tabs: { id: ClientSettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
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
  const [showPasswordFields, setShowPasswordFields] = useState(false);

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

        {/* Password Section - Collapsible */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowPasswordFields(!showPasswordFields)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showPasswordFields ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Change password
          </button>

          {showPasswordFields && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  autoComplete="current-password"
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
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => {
            handleCancel();
            setShowPasswordFields(false);
          }}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Replay Tour Section */}
      <ReplayTourSection role="client" />

      {/* Account Settings Section */}
      <AccountSettings />
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
          <button
            onClick={async () => {
              try {
                const response = await fetch("/api/stripe/portal", { method: "POST" });
                const data = await response.json();
                if (response.ok) {
                  window.location.href = data.url;
                }
              } catch (error) {
                console.error("Portal error:", error);
              }
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium self-end sm:self-auto"
          >
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
