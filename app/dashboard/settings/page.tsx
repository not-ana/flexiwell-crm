"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { PlusIcon, TrashIcon, ChevronIcon } from "@/components/icons";
import {
  FormConfig,
  FormSection,
  FormField,
  FieldType,
  getClientFormConfig,
  saveClientFormConfig,
  resetClientFormConfig,
  defaultClientFormConfig,
} from "@/lib/formConfig";

type SettingsTab = "my-details" | "profile" | "password" | "team" | "appearance" | "billing" | "email" | "notifications" | "integrations" | "api";

const tabs: { id: SettingsTab; label: string; badge?: number }[] = [
  { id: "my-details", label: "My details" },
  { id: "profile", label: "Profile" },
  { id: "password", label: "Password" },
  { id: "team", label: "Team" },
  { id: "appearance", label: "Appearance" },
  { id: "billing", label: "Billing" },
  { id: "email", label: "Email" },
  { id: "notifications", label: "Notifications", badge: 2 },
  { id: "integrations", label: "Integrations" },
  { id: "api", label: "API" },
];

const brandColors = [
  { color: "#1a1a1a", name: "Black" },
  { color: "#22c55e", name: "Green" },
  { color: "#06b6d4", name: "Cyan" },
  { color: "#3b82f6", name: "Blue" },
  { color: "#6366f1", name: "Indigo" },
  { color: "#8b5cf6", name: "Violet" },
  { color: "#a855f7", name: "Purple" },
  { color: "#ec4899", name: "Pink" },
  { color: "#f97316", name: "Orange" },
];

const fieldTypeLabels: Record<FieldType, string> = {
  text: "Text",
  textarea: "Text Area",
  email: "Email",
  url: "URL",
  file: "File Upload",
  checkbox: "Checkbox",
  checkboxGroup: "Checkbox Group",
  socialLink: "Social Link",
};

// Form Builder Component (for the API tab)
function FormBuilderSettings() {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const config = getClientFormConfig();
    setFormConfig(config);
    if (config.sections.length > 0) {
      setActiveSection(config.sections[0].id);
    }
  }, []);

  const handleSave = () => {
    if (formConfig) {
      saveClientFormConfig(formConfig);
      setHasChanges(false);
      alert("Settings saved successfully!");
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset to default settings?")) {
      resetClientFormConfig();
      setFormConfig(defaultClientFormConfig);
      setActiveSection(defaultClientFormConfig.sections[0]?.id || "");
      setHasChanges(false);
    }
  };

  const addSection = () => {
    if (!formConfig) return;
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      fields: [],
    };
    setFormConfig({
      ...formConfig,
      sections: [...formConfig.sections, newSection],
    });
    setActiveSection(newSection.id);
    setHasChanges(true);
  };

  const removeSection = (sectionId: string) => {
    if (!formConfig) return;
    if (formConfig.sections.length <= 1) {
      alert("You need at least one section.");
      return;
    }
    const newSections = formConfig.sections.filter((s) => s.id !== sectionId);
    setFormConfig({ ...formConfig, sections: newSections });
    if (activeSection === sectionId) {
      setActiveSection(newSections[0]?.id || "");
    }
    setHasChanges(true);
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    if (!formConfig) return;
    setFormConfig({
      ...formConfig,
      sections: formConfig.sections.map((s) =>
        s.id === sectionId ? { ...s, title } : s
      ),
    });
    setHasChanges(true);
  };

  const addField = (sectionId: string) => {
    if (!formConfig) return;
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
      placeholder: "",
    };
    setFormConfig({
      ...formConfig,
      sections: formConfig.sections.map((s) =>
        s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
      ),
    });
    setEditingField(newField);
    setHasChanges(true);
  };

  const updateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    if (!formConfig) return;
    setFormConfig({
      ...formConfig,
      sections: formConfig.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : s
      ),
    });
    setHasChanges(true);
  };

  const removeField = (sectionId: string, fieldId: string) => {
    if (!formConfig) return;
    setFormConfig({
      ...formConfig,
      sections: formConfig.sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s
      ),
    });
    setEditingField(null);
    setHasChanges(true);
  };

  if (!formConfig) {
    return <div className="flex items-center justify-center py-12"><p>Loading...</p></div>;
  }

  const currentSection = formConfig.sections.find((s) => s.id === activeSection);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Client Registration Form</h2>
          <p className="text-sm text-gray-600 mt-1">Configure the fields for client registration.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleReset}>Reset to Default</Button>
          <Button onClick={handleSave} disabled={!hasChanges}>Save Changes</Button>
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr_280px] gap-6">
        {/* Sections List */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Sections</h3>
            <button onClick={addSection} className="p-1 text-gray-400 hover:text-gray-600">
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-1">
            {formConfig.sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === section.id
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate">{section.title}</span>
                  {formConfig.sections.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Fields List */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          {currentSection && (
            <>
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 uppercase">Section Title</label>
                <input
                  type="text"
                  value={currentSection.title}
                  onChange={(e) => updateSectionTitle(currentSection.id, e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Fields</h3>
                <button
                  onClick={() => addField(currentSection.id)}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Field
                </button>
              </div>
              {currentSection.fields.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No fields in this section. Click &quot;Add Field&quot; to get started.
                </p>
              ) : (
                <ul className="space-y-2">
                  {currentSection.fields.map((field) => (
                    <li
                      key={field.id}
                      onClick={() => setEditingField(field)}
                      className={`flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        editingField?.id === field.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{field.label || "(No label)"}</p>
                        <p className="text-xs text-gray-500">{fieldTypeLabels[field.type]}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeField(currentSection.id, field.id); }}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Field Editor */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Edit Field</h3>
          {editingField && currentSection ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Type</label>
                <select
                  value={editingField.type}
                  onChange={(e) => updateField(currentSection.id, editingField.id, { type: e.target.value as FieldType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(fieldTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Label</label>
                <input
                  type="text"
                  value={editingField.label}
                  onChange={(e) => updateField(currentSection.id, editingField.id, { label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Placeholder</label>
                <input
                  type="text"
                  value={editingField.placeholder || ""}
                  onChange={(e) => updateField(currentSection.id, editingField.id, { placeholder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={editingField.required || false}
                  onChange={(e) => updateField(currentSection.id, editingField.id, { required: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="required" className="text-sm text-gray-700">Required field</label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Select a field to edit.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Appearance Settings Component
function AppearanceSettings() {
  const [selectedColor, setSelectedColor] = useState("#7F56D9");
  const [customColor, setCustomColor] = useState("#7F56D9");
  const [displayMode, setDisplayMode] = useState<"system" | "light" | "dark">("system");
  const [transparentSidebar, setTransparentSidebar] = useState(true);
  const [language, setLanguage] = useState("en-US");
  const [bannerStyle, setBannerStyle] = useState<"default" | "simplified" | "custom">("simplified");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
        <p className="text-sm text-gray-600 mt-1">Change how your dashboard looks and feels.</p>
      </div>

      {/* Company Logo */}
      <div className="flex items-center justify-between py-5 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Company logo</h3>
          <p className="text-sm text-gray-500">Update your company logo.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            Replace logo
          </button>
        </div>
      </div>

      {/* Brand Color */}
      <div className="flex items-center justify-between py-5 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Brand color</h3>
          <p className="text-sm text-gray-500">Select or customize your brand color.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {brandColors.map((c) => (
              <button
                key={c.color}
                onClick={() => setSelectedColor(c.color)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  selectedColor === c.color ? "ring-2 ring-offset-2 ring-primary-600" : ""
                }`}
                style={{ backgroundColor: c.color }}
              >
                {selectedColor === c.color && (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-2">Custom</span>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-gray-200"
              style={{ backgroundColor: customColor }}
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                setSelectedColor(e.target.value);
              }}
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Display Preference */}
      <div className="py-5 border-b border-gray-200">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900">Display preference</h3>
          <p className="text-sm text-gray-500">Switch between light and dark modes.</p>
        </div>
        <div className="flex gap-4">
          {[
            { id: "system", label: "System preference" },
            { id: "light", label: "Light mode" },
            { id: "dark", label: "Dark mode" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setDisplayMode(mode.id as typeof displayMode)}
              className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                displayMode === mode.id ? "border-primary-600" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-40 h-24 ${mode.id === "dark" ? "bg-gray-900" : "bg-gray-100"} p-2`}>
                <div className={`h-full rounded-lg ${mode.id === "dark" ? "bg-gray-800" : "bg-white"} p-2`}>
                  <div className={`w-full h-2 rounded ${mode.id === "dark" ? "bg-gray-700" : "bg-gray-200"} mb-1`} />
                  <div className={`w-3/4 h-2 rounded ${mode.id === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
              </div>
              <div className="p-2 text-center">
                <span className="text-sm font-medium text-gray-900">{mode.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transparent Sidebar */}
      <div className="flex items-center justify-between py-5 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Transparent sidebar</h3>
          <p className="text-sm text-gray-500">Make the sidebar transparent.</p>
        </div>
        <button
          onClick={() => setTransparentSidebar(!transparentSidebar)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            transparentSidebar ? "bg-primary-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              transparentSidebar ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {/* Language */}
      <div className="flex items-center justify-between py-5 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Language</h3>
          <p className="text-sm text-gray-500">Default language for public dashboard.</p>
        </div>
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="en-US">English (US)</option>
            <option value="pt-BR">Português (BR)</option>
            <option value="es">Español</option>
          </select>
          <span className="absolute left-3 top-1/2 -translate-y-1/2">🇺🇸</span>
          <ChevronIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" direction="down" />
        </div>
      </div>

      {/* Banner Appearance */}
      <div className="py-5 border-b border-gray-200">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900">Banner appearance</h3>
          <p className="text-sm text-gray-500">Change how banners appear to visitors.</p>
        </div>
        <div className="flex gap-4">
          {[
            { id: "default", label: "Default", desc: "Default solid brand color." },
            { id: "simplified", label: "Simplified", desc: "Minimal and simplified." },
            { id: "custom", label: "Custom styling", desc: "Manage styling with CSS." },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => setBannerStyle(style.id as typeof bannerStyle)}
              className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                bannerStyle === style.id ? "border-primary-600" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="w-40 h-24 bg-gray-100 p-2 flex items-center justify-center">
                {style.id === "default" && (
                  <div className="w-full h-full bg-primary-100 rounded-lg" />
                )}
                {style.id === "simplified" && (
                  <div className="w-full h-full bg-primary-50 rounded-lg border border-primary-200" />
                )}
                {style.id === "custom" && (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-500 font-mono">&lt;/&gt; Edit CSS</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-sm font-medium text-gray-900">{style.label}</p>
                <p className="text-xs text-gray-500">{style.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button className="text-sm text-gray-600 hover:text-gray-900">Reset to default</button>
        <div className="flex gap-3">
          <Button variant="secondary">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function MyDetailsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">My details</h2>
        <p className="text-sm text-gray-600 mt-1">Update your personal information.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-gray-500">Personal details settings coming soon...</p>
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your public profile information.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-gray-500">Profile settings coming soon...</p>
      </div>
    </div>
  );
}

function PasswordSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Password</h2>
        <p className="text-sm text-gray-600 mt-1">Update your password and security settings.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-gray-500">Password settings coming soon...</p>
      </div>
    </div>
  );
}

type StaffRole = "admin" | "teacher";
type StaffStatus = "active" | "invited" | "inactive";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  avatar?: string;
  initials: string;
  joinDate: string;
  lastActive?: string;
  classes?: number;
}

const mockStaff: StaffMember[] = [
  {
    id: "1",
    name: "Ana Silva",
    email: "ana@flexiwell.com",
    role: "admin",
    status: "active",
    initials: "AS",
    joinDate: "Dec 1, 2024",
    lastActive: "Just now",
  },
  {
    id: "2",
    name: "Carlos Mendes",
    email: "carlos@flexiwell.com",
    role: "admin",
    status: "active",
    initials: "CM",
    joinDate: "Dec 15, 2024",
    lastActive: "2 hours ago",
  },
  {
    id: "3",
    name: "Maria Santos",
    email: "maria@flexiwell.com",
    role: "teacher",
    status: "active",
    initials: "MS",
    joinDate: "Jan 2, 2025",
    lastActive: "1 day ago",
    classes: 12,
  },
  {
    id: "4",
    name: "Pedro Costa",
    email: "pedro@flexiwell.com",
    role: "teacher",
    status: "active",
    initials: "PC",
    joinDate: "Jan 5, 2025",
    lastActive: "3 hours ago",
    classes: 8,
  },
  {
    id: "5",
    name: "Julia Oliveira",
    email: "julia@flexiwell.com",
    role: "teacher",
    status: "invited",
    initials: "JO",
    joinDate: "Jan 20, 2025",
    classes: 0,
  },
  {
    id: "6",
    name: "Roberto Lima",
    email: "roberto@flexiwell.com",
    role: "teacher",
    status: "inactive",
    initials: "RL",
    joinDate: "Nov 10, 2024",
    lastActive: "2 weeks ago",
    classes: 5,
  },
];

const rolePermissions: Record<StaffRole, string[]> = {
  admin: [
    "Full access to all features",
    "Manage billing and subscriptions",
    "Add/remove team members",
    "Manage clients and classes",
    "View all reports and analytics",
  ],
  teacher: [
    "View assigned classes",
    "Mark attendance",
    "View own schedule",
    "Message clients",
    "Limited dashboard access",
  ],
};

function StaffAvatar({ name, initials, avatar }: { name: string; initials: string; avatar?: string }) {
  const colors = ["bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return avatar ? (
    <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
  ) : (
    <div className={`w-10 h-10 ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: StaffRole }) {
  const styles: Record<StaffRole, string> = {
    admin: "bg-purple-50 text-purple-700 border-purple-200",
    teacher: "bg-green-50 text-green-700 border-green-200",
  };

  const labels: Record<StaffRole, string> = {
    admin: "Admin",
    teacher: "Teacher",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[role]}`}>
      {labels[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: StaffStatus }) {
  const styles: Record<StaffStatus, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    invited: "bg-yellow-50 text-yellow-700 border-yellow-200",
    inactive: "bg-gray-50 text-gray-600 border-gray-200",
  };

  const labels: Record<StaffStatus, string> = {
    active: "Active",
    invited: "Invited",
    inactive: "Inactive",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TeamSettings() {
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [roleFilter, setRoleFilter] = useState<"all" | StaffRole>("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("teacher");

  const filteredStaff = staff.filter((member) => {
    if (roleFilter === "all") return true;
    return member.role === roleFilter;
  });

  const stats = {
    total: staff.length,
    admins: staff.filter((s) => s.role === "admin").length,
    teachers: staff.filter((s) => s.role === "teacher").length,
  };

  const handleInvite = () => {
    if (!inviteEmail) return;
    const newMember: StaffMember = {
      id: `${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "invited",
      initials: inviteEmail.slice(0, 2).toUpperCase(),
      joinDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setStaff([...staff, newMember]);
    setInviteEmail("");
    setShowInviteModal(false);
  };

  const handleChangeRole = (memberId: string, newRole: StaffRole) => {
    setStaff(staff.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      setStaff(staff.filter((m) => m.id !== memberId));
    }
  };

  const handleResendInvite = (memberId: string) => {
    alert("Invitation resent!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your team members and their permissions.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPermissionsModal(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            View permissions
          </button>
          <Button onClick={() => setShowInviteModal(true)} leftIcon={<PlusIcon className="w-4 h-4" />}>
            Invite member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total members</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Admins</p>
          <p className="text-2xl font-semibold text-purple-600 mt-1">{stats.admins}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Teachers</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{stats.teachers}</p>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white border border-gray-200 rounded-xl">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex gap-1">
            {(["all", "admin", "teacher"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  roleFilter === role
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {role === "all" ? "All members" : role.charAt(0).toUpperCase() + role.slice(1) + "s"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <StaffAvatar name={member.name} initials={member.initials} avatar={member.avatar} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={member.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {member.joinDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {member.lastActive || "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {member.status === "invited" && (
                        <button
                          onClick={() => handleResendInvite(member.id)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Resend
                        </button>
                      )}
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as StaffRole)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite team member</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {inviteRole === "admin"
                      ? "Admins can manage clients, classes, and teachers."
                      : "Teachers can view their schedule and mark attendance."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" fullWidth onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button fullWidth onClick={handleInvite}>
                  Send invite
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Role permissions</h3>
              <div className="grid grid-cols-2 gap-6">
                {(["admin", "teacher"] as StaffRole[]).map((role) => (
                  <div key={role} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <RoleBadge role={role} />
                    </div>
                    <ul className="space-y-2">
                      {rolePermissions[role].map((permission, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button variant="secondary" onClick={() => setShowPermissionsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your billing information and subscription.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-gray-500">Billing settings coming soon...</p>
      </div>
    </div>
  );
}

function EmailSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Email</h2>
        <p className="text-sm text-gray-600 mt-1">Configure your email preferences and templates.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-gray-500">Email settings coming soon...</p>
      </div>
    </div>
  );
}

type NotificationChannel = "none" | "in-app" | "email";
type UserRole = "admin" | "teacher";

interface NotificationSetting {
  id: string;
  label: string;
  value: NotificationChannel;
}

interface NotificationGroup {
  title: string;
  description: string;
  settings: NotificationSetting[];
}

const defaultGeneralNotifications: NotificationSetting[] = [
  { id: "mentioned", label: "I'm mentioned in a message", value: "in-app" },
  { id: "replies", label: "Someone replies to any message", value: "in-app" },
  { id: "assigned", label: "I'm assigned a task", value: "in-app" },
  { id: "overdue", label: "A task is overdue", value: "in-app" },
  { id: "status-updated", label: "A task status is updated", value: "email" },
];

const defaultSummaryNotifications: NotificationSetting[] = [
  { id: "daily", label: "Daily summary", value: "email" },
  { id: "weekly", label: "Weekly summary", value: "email" },
  { id: "monthly", label: "Monthly summary", value: "none" },
  { id: "quarterly", label: "Quarterly summary", value: "none" },
];

const adminNotifications: NotificationSetting[] = [
  { id: "new-signup", label: "New client sign up", value: "in-app" },
  { id: "payment-received", label: "Payment received", value: "email" },
  { id: "payment-failed", label: "Payment failed", value: "email" },
  { id: "subscription-canceled", label: "Subscription canceled", value: "email" },
  { id: "revenue-milestone", label: "Revenue milestone reached", value: "in-app" },
  { id: "new-client", label: "New client registered", value: "in-app" },
  { id: "class-full", label: "Class is full", value: "in-app" },
  { id: "waitlist-update", label: "Waitlist has been updated", value: "none" },
  { id: "staff-request", label: "Staff requests time off", value: "email" },
  { id: "support-ticket", label: "New support ticket", value: "email" },
];

const teacherNotifications: NotificationSetting[] = [
  { id: "class-assigned", label: "New class assigned to me", value: "email" },
  { id: "class-canceled", label: "My class was canceled", value: "email" },
  { id: "student-booked", label: "Student booked my class", value: "in-app" },
  { id: "student-canceled", label: "Student canceled booking", value: "in-app" },
  { id: "class-reminder", label: "Class starting reminder", value: "in-app" },
];

function NotificationToggle({
  value,
  onChange,
}: {
  value: NotificationChannel;
  onChange: (value: NotificationChannel) => void;
}) {
  const options: { id: NotificationChannel; label: string }[] = [
    { id: "none", label: "None" },
    { id: "in-app", label: "In-app" },
    { id: "email", label: "Email" },
  ];

  return (
    <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            value === option.id
              ? "bg-gray-100 text-gray-900"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function NotificationsSettings() {
  const [activeRole, setActiveRole] = useState<UserRole>("admin");
  const [generalSettings, setGeneralSettings] = useState<NotificationSetting[]>(defaultGeneralNotifications);
  const [summarySettings, setSummarySettings] = useState<NotificationSetting[]>(defaultSummaryNotifications);
  const [adminSettings, setAdminSettings] = useState<NotificationSetting[]>(adminNotifications);
  const [teacherSettings, setTeacherSettings] = useState<NotificationSetting[]>(teacherNotifications);

  const updateSetting = (
    settings: NotificationSetting[],
    setSettings: React.Dispatch<React.SetStateAction<NotificationSetting[]>>,
    id: string,
    value: NotificationChannel
  ) => {
    setSettings(settings.map((s) => (s.id === id ? { ...s, value } : s)));
  };

  const getRoleSettings = (): NotificationSetting[] => {
    switch (activeRole) {
      case "admin":
        return adminSettings;
      case "teacher":
        return teacherSettings;
    }
  };

  const setRoleSettings = (id: string, value: NotificationChannel) => {
    switch (activeRole) {
      case "admin":
        updateSetting(adminSettings, setAdminSettings, id, value);
        break;
      case "teacher":
        updateSetting(teacherSettings, setTeacherSettings, id, value);
        break;
    }
  };

  const roleLabels: Record<UserRole, string> = {
    admin: "Admin",
    teacher: "Teacher",
  };

  const roleDescriptions: Record<UserRole, string> = {
    admin: "Business metrics, financial, and operational notifications.",
    teacher: "Class schedules and student notifications.",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-600 mt-1">Select when and how you'll be notified.</p>
      </div>

      {/* Role Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(["admin", "teacher"] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeRole === role
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {roleLabels[role]}
            </button>
          ))}
        </nav>
      </div>

      {/* Role-specific notifications */}
      <div className="border-b border-gray-200 pb-8">
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-900">{roleLabels[activeRole]} notifications</h3>
            <p className="text-sm text-gray-500 mt-1">{roleDescriptions[activeRole]}</p>
          </div>
          <div className="flex-1 space-y-4">
            {getRoleSettings().map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{setting.label}</span>
                <NotificationToggle
                  value={setting.value}
                  onChange={(value) => setRoleSettings(setting.id, value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* General notifications */}
      <div className="border-b border-gray-200 pb-8">
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-900">General notifications</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select when you'll be notified when the following changes occur.
            </p>
          </div>
          <div className="flex-1 space-y-4">
            {generalSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{setting.label}</span>
                <NotificationToggle
                  value={setting.value}
                  onChange={(value) => updateSetting(generalSettings, setGeneralSettings, setting.id, value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary notifications */}
      <div className="border-b border-gray-200 pb-8">
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-900">Summary notifications</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select when you'll be notified when the following summaries or reports are ready.
            </p>
          </div>
          <div className="flex-1 space-y-4">
            {summarySettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{setting.label}</span>
                <NotificationToggle
                  value={setting.value}
                  onChange={(value) => updateSetting(summarySettings, setSummarySettings, setting.id, value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="secondary">Cancel</Button>
        <Button>Save changes</Button>
      </div>
    </div>
  );
}

function IntegrationsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-600 mt-1">Connect with third-party services.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-gray-500">Integration settings coming soon...</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  const renderTabContent = () => {
    switch (activeTab) {
      case "my-details":
        return <MyDetailsSettings />;
      case "profile":
        return <ProfileSettings />;
      case "password":
        return <PasswordSettings />;
      case "team":
        return <TeamSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "billing":
        return <BillingSettings />;
      case "email":
        return <EmailSettings />;
      case "notifications":
        return <NotificationsSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      case "api":
        return <FormBuilderSettings />;
      default:
        return <AppearanceSettings />;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
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
