"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { storeTokens } from "@/lib/api/client";
import { getInitials } from "@/lib/utils/formatters";
import {
  DashboardIcon,
  ClassesIcon,
  NotificationIcon,
  SettingsIcon,
  ChevronIcon,
  ClientsIcon,
  LogoutIcon,
  SwitchIcon,
  PaymentIcon,
  CloseIcon,
  WaitlistIcon,
  UserIcon,
  GoogleIcon,
  ChatIcon,
} from "@/components/icons";

export type SidebarVariant = "client" | "admin" | "teacher";
export type AccountType = "admin" | "teacher";

interface Account {
  id: string;
  name: string;
  email: string;
  initials: string;
  type: SidebarVariant;
  isActive: boolean;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  type?: AccountType;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hasBadge?: boolean;
  onboardingId?: string;
}

export interface SidebarProps {
  variant?: SidebarVariant;
  notificationCount?: number;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

// Menu configurations per role
const menuConfigs: Record<SidebarVariant, { main: MenuItem[]; bottom: MenuItem[] }> = {
  client: {
    main: [],
    bottom: [],
  },
  admin: {
    main: [
      { name: "Overview", href: "/admin", icon: DashboardIcon, onboardingId: "sidebar-dashboard" },
      { name: "Clients", href: "/admin/clients", icon: ClientsIcon, onboardingId: "sidebar-clients" },
      { name: "Waitlist", href: "/admin/waitlist", icon: WaitlistIcon, onboardingId: "sidebar-waitlist" },
      { name: "Payments", href: "/admin/payments", icon: PaymentIcon, onboardingId: "sidebar-payments" },
    ],
    bottom: [
      { name: "Settings", href: "/admin/settings", icon: SettingsIcon, onboardingId: "sidebar-settings" },
      { name: "Support", href: "/admin/support", icon: ChatIcon },
    ],
  },
  teacher: {
    main: [
      { name: "Overview", href: "/teacher", icon: DashboardIcon, onboardingId: "sidebar-dashboard" },
      { name: "Schedule", href: "/teacher/classes", icon: ClassesIcon, onboardingId: "sidebar-classes" },
      { name: "Students", href: "/teacher/students", icon: ClientsIcon },
    ],
    bottom: [
      { name: "Settings", href: "/teacher/settings", icon: SettingsIcon, onboardingId: "sidebar-settings" },
      { name: "Support", href: "/teacher/support", icon: ChatIcon },
    ],
  },
};

// getInitials moved to @/lib/utils/formatters

const accountTypeStyles: Record<SidebarVariant, { bg: string; text: string; label: string }> = {
  client: { bg: "bg-primary-50", text: "text-primary-700", label: "Client" },
  admin: { bg: "bg-primary-100", text: "text-primary-700", label: "Admin" },
  teacher: { bg: "bg-primary-100", text: "text-primary-700", label: "Teacher" },
};

function AccountTypeBadge({ type }: { type: SidebarVariant }) {
  const style = accountTypeStyles[type];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

export default function Sidebar({ variant = "client", notificationCount = 0, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [addAccountStep, setAddAccountStep] = useState<"role" | "credentials">("role");
  const [newAccountRole, setNewAccountRole] = useState<AccountType>("admin");
  const [newAccountEmail, setNewAccountEmail] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when navigating
  useEffect(() => {
    if (onMobileClose) {
      onMobileClose();
    }
  }, [pathname]);

  // Get menu config based on variant
  const { main: mainMenuItems, bottom: bottomMenuItems } = menuConfigs[variant];

  // Create active account from real user data
  const activeAccount: Account = {
    id: user?.id || "0",
    name: user?.name || "User",
    email: user?.email || "",
    initials: getInitials(user?.name || ""),
    type: (user?.role as SidebarVariant) || variant,
    isActive: true,
  };

  // Dev-only account switcher: real login to different seed accounts
  const isDev = process.env.NODE_ENV === "development";
  const demoAccounts: Account[] = isDev ? ([
    { id: "demo-admin", name: "Sarah Mitchell", email: "admin@flexiwell.com", initials: "SM", type: "admin" as AccountType, isActive: false },
    { id: "demo-admin-empty", name: "New Admin", email: "newadmin@flexiwell.com", initials: "NA", type: "admin" as AccountType, isActive: false },
    { id: "demo-teacher", name: "Emily Ferreira", email: "emily@flexiwell.com", initials: "EF", type: "teacher" as AccountType, isActive: false },
    { id: "demo-teacher-empty", name: "New Teacher", email: "newteacher@flexiwell.com", initials: "NT", type: "teacher" as AccountType, isActive: false },
  ] as Account[]).filter(a => a.email !== activeAccount.email) : [];

  const accounts: Account[] = [activeAccount, ...demoAccounts];

  const handleSwitchAccount = async (accountId: string) => {
    const selectedAccount = accounts.find((a) => a.id === accountId);
    if (!selectedAccount || selectedAccount.email === activeAccount.email) return;

    setIsProfileMenuOpen(false);

    if (isDev) {
      // Real login to load the correct account data
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: selectedAccount.email, password: "password123" }),
        });
        const data = await res.json();
        if (res.ok && data.tokens) {
          storeTokens(data.tokens.accessToken, data.tokens.refreshToken);
          const redirectPath = selectedAccount.type === "admin" ? "/admin" : selectedAccount.type === "teacher" ? "/teacher" : "/dashboard";
          window.location.href = redirectPath;
        } else {
          console.error("Login failed:", data.error || res.status);
          alert(data.error || "Failed to switch account");
        }
      } catch (error) {
        console.error("Switch account failed:", error);
      }
    }
  };

  const handleSignOut = async () => {
    setShowSignOutModal(false);
    await logout();
  };

  const handleAddAccount = async () => {
    if (addAccountStep === "role") {
      setAddAccountStep("credentials");
      return;
    }

    setIsAddingAccount(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsAddingAccount(false);
    setShowAddAccountModal(false);
    setAddAccountStep("role");
    setNewAccountEmail("");
    setNewAccountPassword("");

    switch (newAccountRole) {
      case "admin":
        router.push("/admin");
        break;
      case "teacher":
        router.push("/teacher");
        break;
      default:
        router.push("/dashboard");
    }
  };

  const resetAddAccountModal = () => {
    setShowAddAccountModal(false);
    setAddAccountStep("role");
    setNewAccountRole("admin");
    setNewAccountEmail("");
    setNewAccountPassword("");
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] h-screen bg-white border-r border-gray-200 flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Mobile Close */}
        <div className="px-6 py-8 flex items-center justify-between">
          <Image
            src="/flexiwell-logo.svg"
            alt="Flexiwell"
            width={87}
            height={19}
            priority
          />
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

      {/* Main Menu */}
      <nav className="flex-1 px-4 overflow-y-auto">
        <ul className="space-y-1">
          {mainMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href || "#"}
                  data-onboarding={item.onboardingId}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-gray-50 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="flex-1">{item.name}</span>
                  {item.hasBadge && notificationCount > 0 && (
                    <span className="bg-gray-100 text-gray-700 text-sm font-medium px-2 py-0.5 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Menu */}
      <div className="px-4 pb-4">
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  data-onboarding={item.onboardingId}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-gray-50 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="flex-1">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-gray-200 relative" ref={menuRef}>
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 shrink-0 aspect-square rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700">{activeAccount.initials}</span>
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{activeAccount.name}</p>
              <AccountTypeBadge type={activeAccount.type} />
            </div>
            <p className="text-sm text-gray-600">{activeAccount.email}</p>
          </div>
          <ChevronIcon
            className="w-5 h-5 text-gray-500 transition-transform shrink-0"
            direction={isProfileMenuOpen ? "down" : "up"}
          />
        </button>

        {/* Profile Dropdown Menu */}
        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50">

            {/* Switch Account Section - Dev only */}
            {isDev && (
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <SwitchIcon className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs font-medium text-gray-500">Switch account</p>
                </div>
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    onClick={() => handleSwitchAccount(account.id)}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-700">{account.initials}</span>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
                        <AccountTypeBadge type={account.type} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">{account.email}</p>
                    </div>
                    {account.isActive ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary-600 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </button>
                ))}
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setShowAddAccountModal(true);
                  }}
                >
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-lg">+</span>
                  </div>
                  <span>Add account</span>
                </button>
              </div>
            )}

            {/* Sign Out */}
            <div className="py-1">
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setShowSignOutModal(true);
                }}
              >
                <LogoutIcon className="w-4 h-4 text-gray-500" />
                <span className="flex-1">Sign out</span>
                <span className="text-xs text-gray-400">Ctrl+Q</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </aside>

    {/* Add Account Modal - rendered outside sidebar for proper centering */}
    {showAddAccountModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
              {/* Header */}
              <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {addAccountStep === "role" ? "Add account" : "Sign in"}
                  </h3>
                  <button
                    onClick={resetAddAccountModal}
                    className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {addAccountStep === "role"
                    ? "Select the type of account you want to add."
                    : `Sign in to your ${newAccountRole} account.`}
                </p>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {addAccountStep === "role" ? (
                  <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                    {/* Admin */}
                    <button
                      type="button"
                      onClick={() => setNewAccountRole("admin")}
                      className={`w-full flex sm:flex-col items-center gap-3 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                        newAccountRole === "admin"
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        newAccountRole === "admin" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className={`text-sm font-medium ${newAccountRole === "admin" ? "text-primary-700" : "text-gray-700"}`}>
                        Admin
                      </span>
                    </button>

                    {/* Teacher */}
                    <button
                      type="button"
                      onClick={() => setNewAccountRole("teacher")}
                      className={`w-full flex sm:flex-col items-center gap-3 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                        newAccountRole === "teacher"
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        newAccountRole === "teacher" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className={`text-sm font-medium ${newAccountRole === "teacher" ? "text-primary-700" : "text-gray-700"}`}>
                        Teacher
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <a
                      href={`/api/auth/social/google?mode=login`}
                      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <GoogleIcon className="w-5 h-5" />
                      <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
                    </a>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={newAccountEmail}
                        onChange={(e) => setNewAccountEmail(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={newAccountPassword}
                        onChange={(e) => setNewAccountPassword(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                {addAccountStep === "credentials" && (
                  <button
                    onClick={() => setAddAccountStep("role")}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={resetAddAccountModal}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAccount}
                  disabled={addAccountStep === "credentials" && (!newAccountEmail || !newAccountPassword)}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingAccount ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                      </svg>
                      Signing in...
                    </span>
                  ) : addAccountStep === "role" ? (
                    "Continue"
                  ) : (
                    "Sign in"
                  )}
                </button>
          </div>
        </div>
      </div>
    )}

    {/* Sign Out Confirmation Modal - rendered outside sidebar for proper centering */}
    {showSignOutModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogoutIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Sign out?
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Are you sure you want to sign out of your account? You'll need to sign in again to access your data.
            </p>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => setShowSignOutModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
