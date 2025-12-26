"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  ClassesIcon,
  NotificationIcon,
  SettingsIcon,
  SupportIcon,
  ChevronIcon,
  ClientsIcon,
  UserIcon,
  DocumentIcon,
  LogoutIcon,
  SwitchIcon,
  IntegrationsIcon,
  ChatIcon,
  ReportIcon,
} from "@/components/icons";

export type AccountType = "client" | "admin" | "teacher";

interface Account {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
  type: AccountType;
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
  status?: string;
  requiresFeature?: string; // Feature key from PlanFeatures
}

export interface SidebarProps {
  variant?: AccountType;
  notificationCount?: number;
}

// Menu configurations per role
const menuConfigs: Record<AccountType, { main: MenuItem[]; bottom: MenuItem[] }> = {
  client: {
    main: [
      { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
      { name: "Classes", href: "/dashboard/classes", icon: ClassesIcon },
      { name: "Support", href: "/dashboard/support", icon: SupportIcon, status: "Online" },
    ],
    bottom: [],
  },
  admin: {
    main: [
      { name: "Dashboard", href: "/admin", icon: DashboardIcon },
      { name: "Clients", href: "/admin/clients", icon: ClientsIcon },
      { name: "Staff", href: "/admin/staff", icon: UserIcon },
      { name: "Conversations", href: "/admin/conversations", icon: ChatIcon, hasBadge: true, requiresFeature: "whatsappBot" },
      { name: "Reports", href: "/admin/reports", icon: ReportIcon, requiresFeature: "advancedReports" },
      { name: "Integrations", href: "/admin/integrations", icon: IntegrationsIcon, requiresFeature: "apiAccess" },
      { name: "Notifications", href: "/admin/notifications", icon: NotificationIcon, hasBadge: true },
    ],
    bottom: [
      { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
      { name: "Support", href: "/admin/support", icon: SupportIcon, status: "Online" },
    ],
  },
  teacher: {
    main: [
      { name: "Dashboard", href: "/teacher", icon: DashboardIcon },
      { name: "My Classes", href: "/teacher/classes", icon: ClassesIcon },
      { name: "My Students", href: "/teacher/students", icon: ClientsIcon },
      { name: "Notifications", href: "/teacher/notifications", icon: NotificationIcon, hasBadge: true },
    ],
    bottom: [
      { name: "Settings", href: "/teacher/settings", icon: SettingsIcon },
      { name: "Support", href: "/teacher/support", icon: SupportIcon, status: "Online" },
    ],
  },
};

// Mock accounts for switch account feature - 3 account types: Client, Admin, Teacher
const mockAccountsData: Record<AccountType, Account> = {
  client: { id: "1", name: "Olivia Rhye", email: "olivia@flexitrack.net", initials: "OR", type: "client", isActive: false },
  admin: { id: "2", name: "Ana Silva", email: "ana@flexiwell.com", initials: "AS", type: "admin", isActive: false },
  teacher: { id: "3", name: "Maria Santos", email: "maria@flexiwell.com", initials: "MS", type: "teacher", isActive: false },
};

const accountTypeStyles: Record<AccountType, { bg: string; text: string; label: string }> = {
  client: { bg: "bg-gray-100", text: "text-gray-700", label: "Client" },
  admin: { bg: "bg-purple-100", text: "text-purple-700", label: "Admin" },
  teacher: { bg: "bg-green-100", text: "text-green-700", label: "Teacher" },
};

function AccountTypeBadge({ type }: { type: AccountType }) {
  const style = accountTypeStyles[type];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

export default function Sidebar({ variant = "client", notificationCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get menu config based on variant
  const { main: mainMenuItems, bottom: bottomMenuItems } = menuConfigs[variant];

  // Build accounts list with current variant as active
  const accounts: Account[] = Object.values(mockAccountsData).map((account) => ({
    ...account,
    isActive: account.type === variant,
  }));

  const activeAccount = accounts.find((a) => a.isActive) || accounts[0];

  const handleSwitchAccount = (accountId: string) => {
    const selectedAccount = accounts.find((a) => a.id === accountId);
    if (!selectedAccount) return;

    setIsProfileMenuOpen(false);

    // Redirect based on account type
    switch (selectedAccount.type) {
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
    <aside className="w-[280px] h-screen bg-white border-r border-gray-200 flex flex-col overflow-visible">
      {/* Logo */}
      <div className="px-6 py-8">
        <Image
          src="/flexiwell-logo.svg"
          alt="Flexiwell"
          width={87}
          height={19}
          priority
        />
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {mainMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-gray-50 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="flex-1">{item.name}</span>
                  {item.status && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span className="w-2 h-2 bg-success-500 rounded-full" />
                      {item.status}
                    </span>
                  )}
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center overflow-hidden">
            {activeAccount.avatar ? (
              <img src={activeAccount.avatar} alt={activeAccount.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-primary-700">{activeAccount.initials}</span>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{activeAccount.name}</p>
              <AccountTypeBadge type={activeAccount.type} />
            </div>
            <p className="text-sm text-gray-600">{activeAccount.email}</p>
          </div>
          <ChevronIcon
            className="w-5 h-5 text-gray-400 transition-transform"
            direction={isProfileMenuOpen ? "down" : "up"}
          />
        </button>

        {/* Profile Dropdown Menu */}
        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
            {/* Menu Items */}
            <div className="py-1 border-b border-gray-100">
              <Link
                href={variant === "admin" ? "/admin/profile" : variant === "teacher" ? "/teacher/profile" : "/dashboard/profile"}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="flex-1">View profile</span>
                <span className="text-xs text-gray-400">Ctrl+K P</span>
              </Link>
              <Link
                href="/docs"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <DocumentIcon className="w-4 h-4 text-gray-500" />
                <span>Documentation</span>
              </Link>
            </div>

            {/* Switch Account Section */}
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
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{account.name}</p>
                      <AccountTypeBadge type={account.type} />
                    </div>
                    <p className="text-xs text-gray-500">{account.email}</p>
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
                  router.push("/login");
                }}
              >
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">+</span>
                </div>
                <span>Add account</span>
              </button>
            </div>

            {/* Sign Out */}
            <div className="py-1">
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  // Handle logout
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
  );
}
