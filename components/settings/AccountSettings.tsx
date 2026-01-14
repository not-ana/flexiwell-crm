"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleIcon } from "@/components/icons";

interface LinkedAccount {
  provider: "google";
  email: string;
  name?: string;
  avatar?: string;
  linkedAt: string;
}

// Delete Account Confirmation Modal
export function DeleteAccountModal({
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
export function AccountSettings({ hideAccountInfo = false }: { hideAccountInfo?: boolean } = {}) {
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string; joinedAt: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Fetch linked accounts
  const fetchLinkedAccounts = useCallback(async () => {
    try {
      const token = localStorage.getItem("flexiwell_access_token");
      const response = await fetch("/api/profile/linked-accounts", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLinkedAccounts(data.linkedAccounts || []);
      }
    } catch (error) {
      console.error("Failed to fetch linked accounts:", error);
    }
  }, []);

  // Check for success/error params from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const success = params.get("success");

    if (error) {
      setLinkError(decodeURIComponent(error));
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (success) {
      setLinkSuccess(decodeURIComponent(success));
      fetchLinkedAccounts();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchLinkedAccounts]);

  // Fetch linked accounts on mount
  useEffect(() => {
    fetchLinkedAccounts();
  }, [fetchLinkedAccounts]);

  // Handle linking Google account
  const handleLinkGoogle = () => {
    setIsLinkingGoogle(true);
    setLinkError(null);
    // Store current token in a cookie for the callback to verify
    const token = localStorage.getItem("flexiwell_access_token");
    if (token) {
      document.cookie = `flexiwell_access_token=${token}; path=/; max-age=600; SameSite=Lax`;
    }
    window.location.href = "/api/auth/social/google/authorize?mode=link";
  };

  // Handle unlinking Google account
  const handleUnlinkGoogle = async () => {
    setIsUnlinking(true);
    setLinkError(null);
    setLinkSuccess(null);

    try {
      const token = localStorage.getItem("flexiwell_access_token");
      const response = await fetch("/api/profile/linked-accounts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ provider: "google" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unlink account");
      }

      setLinkSuccess("Google account unlinked successfully");
      await fetchLinkedAccounts();
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Failed to unlink account");
    } finally {
      setIsUnlinking(false);
    }
  };

  const googleAccount = linkedAccounts.find((acc) => acc.provider === "google");

  // Fetch linked companies (for clients and teachers)
  useEffect(() => {
    async function fetchCompanies() {
      if (user?.role !== "client" && user?.role !== "teacher") {
        setIsLoading(false);
        return;
      }
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
  }, [user?.role]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Account</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your account settings.</p>
      </div>

      {/* Linked Companies - For clients and teachers (not admins who own the company) */}
      {(user?.role === "client" || user?.role === "teacher") && (
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
      )}

      {/* Linked Accounts Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Linked accounts</h3>
        <p className="text-sm text-gray-500 mb-4">
          Connect your social accounts for easier sign-in.
        </p>

        {/* Success/Error Messages */}
        {linkError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{linkError}</p>
          </div>
        )}
        {linkSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{linkSuccess}</p>
          </div>
        )}

        {/* Google Account */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Google</p>
              {googleAccount ? (
                <p className="text-xs text-gray-500">{googleAccount.email}</p>
              ) : (
                <p className="text-xs text-gray-400">Not connected</p>
              )}
            </div>
          </div>
          {googleAccount ? (
            <button
              onClick={handleUnlinkGoogle}
              disabled={isUnlinking}
              className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isUnlinking ? "Unlinking..." : "Unlink"}
            </button>
          ) : (
            <button
              onClick={handleLinkGoogle}
              disabled={isLinkingGoogle}
              className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              {isLinkingGoogle ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>
      </div>

      {/* Account Info - can be hidden if already shown in profile */}
      {!hideAccountInfo && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Account information</h3>
            <Link
              href={user?.role === "admin" ? "/admin/settings" : user?.role === "teacher" ? "/teacher/settings" : "/dashboard/settings"}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Edit profile
            </Link>
          </div>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "Profile"}
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold text-white">
                  {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || user?.email?.substring(0, 2).toUpperCase() || "??"}
                </span>
              </div>
            )}
            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Email:</span>
                <span className="text-sm text-gray-900 truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Type:</span>
                <span className="text-sm text-gray-900 capitalize">{user?.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">ID:</span>
                <span className="text-sm text-gray-400 font-mono text-xs truncate">{user?.id}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (user?.id) {
                      navigator.clipboard.writeText(user.id);
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors shrink-0"
                  title="Copy Account ID"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
