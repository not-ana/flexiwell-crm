"use client";

import { useState, type ReactNode, type ElementType } from "react";
import { ChevronDown } from "lucide-react";

export interface SettingsTab {
  id: string;
  label: string;
  icon: ElementType;
  description?: string;
}

export interface SettingsTabGroup {
  label: string;
  tabs: SettingsTab[];
}

interface SettingsLayoutProps {
  title?: string;
  tabs: SettingsTab[];
  groups?: SettingsTabGroup[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
}

export function SettingsLayout({
  title = "Settings",
  tabs,
  groups,
  activeTab,
  onTabChange,
  children,
}: SettingsLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentTab = tabs.find((t) => t.id === activeTab);

  const handleTabClick = (id: string) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>

          {/* Mobile: dropdown selector */}
          <div className="lg:hidden mt-4 pb-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 shadow-sm"
            >
              <span className="flex items-center gap-3">
                {currentTab && <currentTab.icon className="w-[18px] h-[18px] text-primary-600" />}
                {currentTab?.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {mobileMenuOpen && (
              <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-30 relative">
                {groups ? (
                  groups.map((group) => (
                    <div key={group.label}>
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{group.label}</span>
                      </div>
                      {group.tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                              isActive
                                ? "bg-primary-50 text-primary-700 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-primary-600" : "text-gray-400"}`} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                          isActive
                            ? "bg-primary-50 text-primary-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-primary-600" : "text-gray-400"}`} />
                        {tab.label}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Desktop: horizontal tabs */}
          <nav className="hidden lg:flex items-center gap-1 mt-6 overflow-x-auto -mb-px">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-primary-600 text-primary-700"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-10 max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
