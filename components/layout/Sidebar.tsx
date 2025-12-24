"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  ClassesIcon,
  NotificationIcon,
  WaitlistIcon,
  SettingsIcon,
  SupportIcon,
  ChevronIcon,
} from "@/components/icons";

export interface User {
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

interface SidebarProps {
  user: User;
  notificationCount?: number;
}

const mainMenuItems = [
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { name: "Classes", href: "/dashboard/classes", icon: ClassesIcon },
  { name: "Notifications", href: "/dashboard/notifications", icon: NotificationIcon, hasBadge: true },
  { name: "Waitlist", href: "/dashboard/waitlist", icon: WaitlistIcon },
];

const bottomMenuItems = [
  { name: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
  { name: "Support", href: "/dashboard/support", icon: SupportIcon, status: "Online" },
];

export default function Sidebar({ user, notificationCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen bg-white border-r border-gray-200 flex flex-col">
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
      <div className="px-4 py-4 border-t border-gray-200">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-primary-700">{user.initials}</span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <ChevronIcon className="w-5 h-5 text-gray-400" direction="up" />
        </button>
      </div>
    </aside>
  );
}
