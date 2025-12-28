"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { BusinessType, businessTypes, getBusinessTypeOptions } from "@/lib/config/business-types";

type AdminSettingsTab = "general" | "branding" | "plans" | "waitlist" | "establishments" | "billing" | "notifications" | "team" | "integrations" | "whatsapp";

const tabs: { id: AdminSettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "plans", label: "Plans" },
  { id: "waitlist", label: "Waitlist" },
  { id: "establishments", label: "Establishments" },
  { id: "billing", label: "Billing" },
  { id: "notifications", label: "Notifications" },
  { id: "team", label: "Team" },
  { id: "integrations", label: "Integrations" },
  { id: "whatsapp", label: "WhatsApp" },
];

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

// General Settings Component
function GeneralSettings() {
  const [settings, setSettings] = useState({
    studioName: "FlexiWell Studio",
    email: "contact@flexiwell.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street - New York, NY 10001",
    timezone: "America/New_York",
    currency: "USD",
    language: "en-US",
    businessType: "pilates" as BusinessType,
  });

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const businessTypeOptions = getBusinessTypeOptions();
  const selectedBusinessType = businessTypes[settings.businessType];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">General</h2>
        <p className="text-sm text-gray-600 mt-1">Basic studio information and preferences.</p>
      </div>

      {/* Business Type Selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Business Type</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select your business type to customize terminology throughout the app.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {businessTypeOptions.map((option) => {
            const isSelected = settings.businessType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateSetting("businessType", option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className={`text-sm font-medium text-center ${
                  isSelected ? "text-primary-700" : "text-gray-700"
                }`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Terminology Preview */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Terminology preview for {selectedBusinessType.name}:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Sessions:</span>
              <span className="ml-2 font-medium text-gray-900">{selectedBusinessType.terminology.classes}</span>
            </div>
            <div>
              <span className="text-gray-500">Staff:</span>
              <span className="ml-2 font-medium text-gray-900">{selectedBusinessType.terminology.teachers}</span>
            </div>
            <div>
              <span className="text-gray-500">Clients:</span>
              <span className="ml-2 font-medium text-gray-900">{selectedBusinessType.terminology.clients}</span>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <span className="ml-2 font-medium text-gray-900">{selectedBusinessType.terminology.studio}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Studio Name</label>
          <input
            type="text"
            value={settings.studioName}
            onChange={(e) => updateSetting("studioName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => updateSetting("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => updateSetting("address", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => updateSetting("timezone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
              <option value="America/New_York">New York (GMT-5)</option>
              <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
              <option value="America/Chicago">Chicago (GMT-6)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (GMT+1)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => updateSetting("currency", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="BRL">BRL (R$)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting("language", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

// Establishments Settings Component
interface Teacher {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface Establishment {
  id: string;
  name: string;
  location: string;
  assignedTeachers: string[];
}

function EstablishmentsSettings() {
  const [establishments, setEstablishments] = useState<Establishment[]>([
    { id: "1", name: "FlexiWell Downtown", location: "Downtown, New York", assignedTeachers: ["1", "2"] },
    { id: "2", name: "FlexiWell Midtown", location: "Midtown, New York", assignedTeachers: ["1", "3"] },
    { id: "3", name: "FlexiWell Uptown", location: "Uptown, New York", assignedTeachers: ["2"] },
  ]);

  const allTeachers: Teacher[] = [
    { id: "1", name: "Sarah Johnson", email: "sarah@flexiwell.com", initials: "SJ" },
    { id: "2", name: "Michael Chen", email: "michael@flexiwell.com", initials: "MC" },
    { id: "3", name: "Emily Davis", email: "emily@flexiwell.com", initials: "ED" },
    { id: "4", name: "James Wilson", email: "james@flexiwell.com", initials: "JW" },
  ];

  const [editingEstablishment, setEditingEstablishment] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEstablishment, setNewEstablishment] = useState({ name: "", location: "" });

  const toggleTeacherAssignment = (establishmentId: string, teacherId: string) => {
    setEstablishments(prev => prev.map(est => {
      if (est.id !== establishmentId) return est;
      const isAssigned = est.assignedTeachers.includes(teacherId);
      return {
        ...est,
        assignedTeachers: isAssigned
          ? est.assignedTeachers.filter(id => id !== teacherId)
          : [...est.assignedTeachers, teacherId]
      };
    }));
  };

  const getTeacherById = (id: string) => allTeachers.find(t => t.id === id);

  const handleAddEstablishment = () => {
    if (!newEstablishment.name || !newEstablishment.location) return;
    const newId = String(establishments.length + 1);
    setEstablishments([...establishments, { id: newId, ...newEstablishment, assignedTeachers: [] }]);
    setNewEstablishment({ name: "", location: "" });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Establishments</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your locations and assign teachers to each establishment.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Establishment</Button>
      </div>

      {/* Establishments List */}
      <div className="space-y-4">
        {establishments.map((establishment) => (
          <div key={establishment.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Establishment Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{establishment.name}</h3>
                    <p className="text-sm text-gray-500">{establishment.location}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingEstablishment(editingEstablishment === establishment.id ? null : establishment.id)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {editingEstablishment === establishment.id ? "Done" : "Manage Teachers"}
                </button>
              </div>

              {/* Assigned Teachers Preview */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-gray-500">Teachers:</span>
                <div className="flex -space-x-2">
                  {establishment.assignedTeachers.slice(0, 4).map((teacherId) => {
                    const teacher = getTeacherById(teacherId);
                    if (!teacher) return null;
                    return (
                      <div
                        key={teacherId}
                        className="w-7 h-7 rounded-full bg-green-100 border-2 border-white flex items-center justify-center"
                        title={teacher.name}
                      >
                        <span className="text-xs font-medium text-green-700">{teacher.initials}</span>
                      </div>
                    );
                  })}
                  {establishment.assignedTeachers.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">+{establishment.assignedTeachers.length - 4}</span>
                    </div>
                  )}
                </div>
                {establishment.assignedTeachers.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No teachers assigned</span>
                )}
              </div>
            </div>

            {/* Teacher Assignment Panel */}
            {editingEstablishment === establishment.id && (
              <div className="p-6 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">Select teachers for this establishment:</p>
                <div className="grid grid-cols-2 gap-3">
                  {allTeachers.map((teacher) => {
                    const isAssigned = establishment.assignedTeachers.includes(teacher.id);
                    return (
                      <button
                        key={teacher.id}
                        onClick={() => toggleTeacherAssignment(establishment.id, teacher.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          isAssigned
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isAssigned ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          <span className={`text-sm font-medium ${isAssigned ? "text-green-700" : "text-gray-600"}`}>
                            {teacher.initials}
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${isAssigned ? "text-green-700" : "text-gray-900"}`}>
                            {teacher.name}
                          </p>
                          <p className="text-xs text-gray-500">{teacher.email}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isAssigned ? "border-green-500 bg-green-500" : "border-gray-300"
                        }`}>
                          {isAssigned && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Establishment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add Establishment</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g., FlexiWell Downtown"
                  value={newEstablishment.name}
                  onChange={(e) => setNewEstablishment({ ...newEstablishment, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g., Downtown, São Paulo"
                  value={newEstablishment.location}
                  onChange={(e) => setNewEstablishment({ ...newEstablishment, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEstablishment}
                disabled={!newEstablishment.name || !newEstablishment.location}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Add Establishment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Plans Settings Component - Admin manages plans sold to clients
function PlansSettings() {
  const [plans, setPlans] = useState([
    {
      id: "starter",
      name: "Starter",
      price: 49,
      period: "month",
      classes: 8,
      features: ["8 classes/month", "Online booking", "Email reminders"],
      isActive: true,
    },
    {
      id: "growth",
      name: "Growth",
      price: 79,
      period: "month",
      classes: 16,
      features: ["16 classes/month", "Priority booking", "WhatsApp reminders", "Cancel anytime"],
      isPopular: true,
      isActive: true,
    },
    {
      id: "professional",
      name: "Professional",
      price: 149,
      period: "month",
      classes: -1,
      features: ["Unlimited classes", "VIP booking", "Personal trainer", "24/7 access"],
      isActive: true,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<typeof plans[0] | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    classes: "",
    features: "",
  });

  const handleTogglePlan = (planId: string) => {
    setPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const handleSetPopular = (planId: string) => {
    setPlans(prev => prev.map(p => ({
      ...p,
      isPopular: p.id === planId,
    })));
  };

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.price) return;

    const plan = {
      id: newPlan.name.toLowerCase().replace(/\s+/g, "-"),
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      period: "month" as const,
      classes: parseInt(newPlan.classes) || -1,
      features: newPlan.features.split("\n").filter(f => f.trim()),
      isActive: true,
    };

    setPlans(prev => [...prev, plan]);
    setNewPlan({ name: "", price: "", classes: "", features: "" });
    setShowAddModal(false);
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm("Are you sure you want to delete this plan? Existing subscribers will keep their current plan.")) {
      setPlans(prev => prev.filter(p => p.id !== planId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
          <p className="text-sm text-gray-600 mt-1">Manage plans available for your clients.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Plan
        </Button>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white border rounded-xl p-6 ${
              plan.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  {plan.isPopular && (
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  )}
                  {!plan.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {plan.classes === -1 ? "Unlimited classes" : `${plan.classes} classes/month`}
                </p>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSetPopular(plan.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    plan.isPopular
                      ? "bg-primary-100 text-primary-600"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Set as most popular"
                >
                  <svg className="w-5 h-5" fill={plan.isPopular ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <Toggle enabled={plan.isActive} onChange={() => handleTogglePlan(plan.id)} />
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete plan"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Plan</h2>
              <p className="text-sm text-gray-600 mt-1">Create a subscription plan for clients</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g., Premium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($/month) *</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                    placeholder="99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classes/month</label>
                  <input
                    type="number"
                    value={newPlan.classes}
                    onChange={(e) => setNewPlan({ ...newPlan, classes: e.target.value })}
                    placeholder="-1 for unlimited"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
                <textarea
                  value={newPlan.features}
                  onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                  placeholder="Priority booking&#10;WhatsApp reminders&#10;Cancel anytime"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddPlan}>
                Add Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// FlexiWell SaaS Plans for Studios
const flexiwellPlans = [
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 497,
    yearlyPrice: 397,
    description: "For growing studios",
    limits: {
      clients: 150,
      staff: 5,
      locations: 1,
      storage: "5GB",
    },
    features: [
      "Up to 150 clients",
      "5 team accounts",
      "1 location",
      "Online scheduling",
      "Email reminders",
      "Basic reports",
      "Email support",
    ],
    highlight: false,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 897,
    yearlyPrice: 717,
    description: "For established studios",
    limits: {
      clients: 500,
      staff: 15,
      locations: 2,
      storage: "25GB",
    },
    features: [
      "Up to 500 clients",
      "15 team accounts",
      "2 locations",
      "WhatsApp Bot included",
      "Advanced reports",
      "Smart waitlist",
      "Payment integrations",
      "Priority support",
    ],
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 1897,
    yearlyPrice: 1517,
    description: "For studio networks",
    limits: {
      clients: -1,
      staff: -1,
      locations: 10,
      storage: "100GB",
    },
    features: [
      "Unlimited clients",
      "Unlimited team",
      "Up to 10 locations",
      "WhatsApp + Instagram Bot",
      "White-label (your brand)",
      "Complete API",
      "Dedicated success manager",
      "Custom onboarding",
      "SLA 99.9%",
    ],
    highlight: false,
  },
];

// Change Plan Modal Component
function ChangePlanModal({
  isOpen,
  onClose,
  currentPlanId,
  billingCycle,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId: string;
  billingCycle: "monthly" | "yearly";
}) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId);
  const [selectedCycle, setSelectedCycle] = useState(billingCycle);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirmChange = async () => {
    if (selectedPlan === currentPlanId && selectedCycle === billingCycle) {
      alert("You are already on this plan.");
      return;
    }

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);

    const plan = flexiwellPlans.find((p) => p.id === selectedPlan);
    const price = selectedCycle === "yearly" ? plan?.yearlyPrice : plan?.monthlyPrice;
    alert(`Plan changed to ${plan?.name}!\n\nYour new plan will be activated immediately.\nYou will be charged R$ ${price}/${selectedCycle === "yearly" ? "month (yearly)" : "month"} starting from the next billing cycle.`);
    onClose();
  };

  const currentPlanIndex = flexiwellPlans.findIndex((p) => p.id === currentPlanId);
  const selectedPlanIndex = flexiwellPlans.findIndex((p) => p.id === selectedPlan);
  const isUpgrade = selectedPlanIndex > currentPlanIndex;
  const isDowngrade = selectedPlanIndex < currentPlanIndex;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Change FlexiWell Plan</h2>
              <p className="text-sm text-gray-600 mt-1">Choose the ideal plan for your studio</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 mt-4 p-1 bg-gray-100 rounded-lg w-fit mx-auto">
            <button
              onClick={() => setSelectedCycle("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                selectedCycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedCycle("yearly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                selectedCycle === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {flexiwellPlans.map((plan) => {
              const price = selectedCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const isCurrentPlan = currentPlanId === plan.id;
              const isSelected = selectedPlan === plan.id;

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-primary-600 bg-primary-50 ring-2 ring-primary-200"
                      : plan.highlight
                      ? "border-primary-200 bg-primary-50/30"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                      Current
                    </span>
                  )}

                  <h3 className="font-semibold text-gray-900 text-lg">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>

                  <div className="mt-3">
                    <span className="text-3xl font-bold text-gray-900">R$ {price}</span>
                    <span className="text-sm text-gray-500">/month</span>
                    {selectedCycle === "yearly" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Billed annually (R$ {price * 12}/year)
                      </p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Clients:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {plan.limits.clients === -1 ? "Unlimited" : plan.limits.clients}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Team:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {plan.limits.staff === -1 ? "Unlimited" : plan.limits.staff}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Locations:</span>
                        <span className="ml-1 font-medium text-gray-900">{plan.limits.locations}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Storage:</span>
                        <span className="ml-1 font-medium text-gray-900">{plan.limits.storage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="mt-4 space-y-2">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-xs text-primary-600 font-medium pl-6">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Upgrade/Downgrade Notice */}
          {selectedPlan !== currentPlanId && (
            <div className={`mt-4 p-4 rounded-lg ${
              isUpgrade ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
            }`}>
              <div className="flex items-start gap-3">
                <svg className={`w-5 h-5 flex-shrink-0 ${isUpgrade ? "text-green-600" : "text-amber-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className={`font-medium ${isUpgrade ? "text-green-800" : "text-amber-800"}`}>
                    {isUpgrade ? "Plan upgrade" : "Plan downgrade"}
                  </p>
                  <p className={isUpgrade ? "text-green-700" : "text-amber-700"}>
                    {isUpgrade
                      ? "Your new plan will be activated immediately with access to all features."
                      : "When downgrading, you may lose access to some features. Data above the limit will be preserved but inaccessible."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmChange}
            disabled={isProcessing || (selectedPlan === currentPlanId && selectedCycle === billingCycle)}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Confirm Change"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Update Payment Modal
function UpdatePaymentModalAdmin({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleSubmit = async () => {
    if (!cardNumber || !expiry || !cvc) {
      alert("Please fill in all card details");
      return;
    }

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);

    alert("Payment method updated!\n\nYour new card will be used for future payments.");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Payment</h2>
          <p className="text-sm text-gray-600 mt-1">Enter the new card details</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder="123"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-xs text-gray-500">Your data is protected with SSL encryption</p>
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
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Updating..." : "Update Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Billing Settings Component
function BillingSettings() {
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const currentPlan = {
    id: "business",
    name: "Business",
    monthlyPrice: 897,
    yearlyPrice: 717,
    billingCycle: "monthly" as "monthly" | "yearly",
    nextBilling: "15 Jan 2025",
    usage: {
      clients: 342,
      clientsLimit: 500,
      staff: 8,
      staffLimit: 15,
      locations: 1,
      locationsLimit: 2,
      storage: "12GB",
      storageLimit: "25GB",
    },
  };

  const paymentMethod = {
    type: "Visa",
    last4: "4242",
    expiry: "12/26",
  };

  const billingHistory = [
    { id: "1", date: "Dec 1, 2024", description: "Business Plan", amount: "R$ 897.00", status: "Paid" },
    { id: "2", date: "Nov 1, 2024", description: "Business Plan", amount: "R$ 897.00", status: "Paid" },
    { id: "3", date: "Oct 1, 2024", description: "Business Plan", amount: "R$ 897.00", status: "Paid" },
    { id: "4", date: "Sep 1, 2024", description: "Professional Plan", amount: "R$ 497.00", status: "Paid" },
  ];

  const usagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Billing</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your subscription and payment methods.</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">Current plan</h3>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                Most Popular
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{currentPlan.name}</p>
            <p className="text-sm text-gray-500">
              R$ {currentPlan.monthlyPrice}/month
              {currentPlan.billingCycle === "yearly" && " (yearly)"}
            </p>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full self-start">
            Active
          </span>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Clients</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.clients}/{currentPlan.usage.clientsLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  usagePercentage(currentPlan.usage.clients, currentPlan.usage.clientsLimit) > 80
                    ? "bg-amber-500"
                    : "bg-primary-500"
                }`}
                style={{ width: `${usagePercentage(currentPlan.usage.clients, currentPlan.usage.clientsLimit)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Team</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.staff}/{currentPlan.usage.staffLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${usagePercentage(currentPlan.usage.staff, currentPlan.usage.staffLimit)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Locations</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.locations}/{currentPlan.usage.locationsLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${usagePercentage(currentPlan.usage.locations, currentPlan.usage.locationsLimit)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Storage</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.storage}/{currentPlan.usage.storageLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `48%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Next billing</p>
            <p className="text-sm font-medium text-gray-900">{currentPlan.nextBilling}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChangePlanModal(true)}
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Change plan
            </button>
          </div>
        </div>
      </div>

      {/* Savings Tip */}
      {currentPlan.billingCycle === "monthly" && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Save 20% with yearly plan</p>
              <p className="text-sm text-green-700 mt-0.5">
                Switch to yearly billing and save R$ {Math.round((currentPlan.monthlyPrice - currentPlan.yearlyPrice) * 12)}/year
              </p>
            </div>
            <button
              onClick={() => setShowChangePlanModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors whitespace-nowrap"
            >
              View plans
            </button>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Payment method</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold tracking-wide">VISA</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {paymentMethod.type} •••• {paymentMethod.last4}
              </p>
              <p className="text-xs text-gray-500">Expires {paymentMethod.expiry}</p>
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Update
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Billing history</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Description</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billingHistory.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-gray-600">{item.date}</td>
                  <td className="py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="py-3 text-sm font-medium text-gray-900">{item.amount}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-3">
          {billingHistory.map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{item.description}</span>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                  {item.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{item.date}</span>
                <span className="font-medium text-gray-900">{item.amount}</span>
              </div>
              <button className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                Download invoice
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ChangePlanModal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
        currentPlanId={currentPlan.id}
        billingCycle={currentPlan.billingCycle}
      />
      <UpdatePaymentModalAdmin
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}

// Notifications Settings Component
function NotificationsSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    newClientAlerts: true,
    paymentAlerts: true,
    classReminders: true,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-600 mt-1">Configure how you receive notifications.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Email Notifications</p>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <Toggle enabled={settings.emailNotifications} onChange={(v) => updateSetting("emailNotifications", v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Push Notifications</p>
            <p className="text-sm text-gray-500">Receive push notifications in browser</p>
          </div>
          <Toggle enabled={settings.pushNotifications} onChange={(v) => updateSetting("pushNotifications", v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
            <p className="text-sm text-gray-500">Receive tips and product updates</p>
          </div>
          <Toggle enabled={settings.marketingEmails} onChange={(v) => updateSetting("marketingEmails", v)} />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Alert Types</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Weekly Reports</p>
                <p className="text-sm text-gray-500">Get weekly summary of your studio</p>
              </div>
              <Toggle enabled={settings.weeklyReports} onChange={(v) => updateSetting("weeklyReports", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">New Client Alerts</p>
                <p className="text-sm text-gray-500">When a new client registers</p>
              </div>
              <Toggle enabled={settings.newClientAlerts} onChange={(v) => updateSetting("newClientAlerts", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Alerts</p>
                <p className="text-sm text-gray-500">When payments are received</p>
              </div>
              <Toggle enabled={settings.paymentAlerts} onChange={(v) => updateSetting("paymentAlerts", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Class Reminders</p>
                <p className="text-sm text-gray-500">Reminders before classes start</p>
              </div>
              <Toggle enabled={settings.classReminders} onChange={(v) => updateSetting("classReminders", v)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

// Team Member interface
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Teacher" | "Receptionist";
  status: "Active" | "Pending";
}

// Invite Member Modal
function InviteMemberModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Teacher" as TeamMember["role"],
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in name and email");
      return;
    }
    alert(
      `Invitation sent!\n\nName: ${formData.name}\nEmail: ${formData.email}\nRole: ${formData.role}\n\nAn invitation email has been sent to ${formData.email}.`
    );
    setFormData({ name: "", email: "", role: "Teacher" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamMember["role"] })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Admin">Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Receptionist">Receptionist</option>
            </select>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Invitation Email</p>
                <p className="text-sm text-blue-700 mt-1">
                  The team member will receive an email to set up their account and password.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
}

// Member Action Menu
function MemberActionMenu({
  member,
  onEdit,
  onResendInvite,
  onRemove,
}: {
  member: TeamMember;
  onEdit: () => void;
  onResendInvite: () => void;
  onRemove: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Member
            </button>
            {member.status === "Pending" && (
              <button
                onClick={() => {
                  onResendInvite();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Resend Invite
              </button>
            )}
            <button
              onClick={() => {
                onRemove();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Remove Member
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Team Settings Component
function TeamSettings() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [teamMembers] = useState<TeamMember[]>([
    { id: "1", name: "Alex Thompson", email: "alex@flexiwell.com", role: "Admin", status: "Active" },
    { id: "2", name: "Sarah Johnson", email: "sarah@flexiwell.com", role: "Teacher", status: "Active" },
    { id: "3", name: "Michael Chen", email: "michael@flexiwell.com", role: "Teacher", status: "Active" },
    { id: "4", name: "James Wilson", email: "james@flexiwell.com", role: "Receptionist", status: "Pending" },
  ]);

  const handleEditMember = (member: TeamMember) => {
    alert(`Edit Member\n\nName: ${member.name}\nEmail: ${member.email}\nRole: ${member.role}\n\nThis would open an edit dialog.`);
  };

  const handleResendInvite = (member: TeamMember) => {
    alert(`Invitation resent to ${member.email}!`);
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
      alert(`${member.name} has been removed from the team.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          <p className="text-sm text-gray-600 mt-1">Manage team access and permissions.</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                member.role === "Admin" ? "bg-primary-100 text-primary-700" :
                member.role === "Teacher" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {member.role}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                member.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {member.status}
              </span>
              <MemberActionMenu
                member={member}
                onEdit={() => handleEditMember(member)}
                onResendInvite={() => handleResendInvite(member)}
                onRemove={() => handleRemoveMember(member)}
              />
            </div>
          ))}
        </div>
      </div>

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}

// WhatsApp Settings Component
type WhatsAppPlan = "starter" | "pro" | "enterprise";

interface WhatsAppPlanDetails {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

const whatsappPlans: Record<WhatsAppPlan, WhatsAppPlanDetails> = {
  starter: {
    name: "Starter",
    price: "$49/month",
    features: [
      "View scheduled classes",
      "Confirm attendance",
      "500 conversations/month",
      "Basic automated messages",
    ],
  },
  pro: {
    name: "Pro",
    price: "$99/month",
    features: [
      "Everything in Starter",
      "Cancel classes",
      "Book new classes",
      "2,000 conversations/month",
      "Proactive notifications",
      "Automatic reminders",
    ],
    highlighted: true,
  },
  enterprise: {
    name: "Enterprise",
    price: "$199/month",
    features: [
      "Everything in Pro",
      "Unlimited conversations",
      "Multiple phone numbers",
      "Advanced reports",
      "Priority support",
      "Custom integrations",
    ],
  },
};

function WhatsAppSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WhatsAppPlan>("pro");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: "",
    authToken: "",
    whatsappNumber: "",
  });

  const handleSaveConfig = () => {
    // In production, save to database
    console.log("Saving Twilio config:", twilioConfig);
    setShowConfigModal(false);
    setIsEnabled(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">WhatsApp Business</h2>
        <p className="text-sm text-gray-600 mt-1">
          Let your clients check classes, confirm attendance, and cancel via WhatsApp.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">WhatsApp Bot</p>
              <p className="text-sm text-gray-500">
                {isEnabled ? "Active • " + whatsappPlans[selectedPlan].name + " Plan" : "Not configured"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Ativo
                </span>
                <Button variant="secondary" onClick={() => setShowConfigModal(true)}>
                  Configurar
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowConfigModal(true)}>
                Ativar WhatsApp
              </Button>
            )}
          </div>
        </div>

        {isEnabled && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-xs text-gray-500">Mensagens este mes</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">89%</p>
                <p className="text-xs text-gray-500">Taxa de resposta</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-xs text-gray-500">Confirmacoes pelo bot</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Planos WhatsApp</h3>
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(whatsappPlans) as WhatsAppPlan[]).map((planKey) => {
            const plan = whatsappPlans[planKey];
            const isSelected = selectedPlan === planKey;
            return (
              <div
                key={planKey}
                className={`relative bg-white border-2 rounded-xl p-5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary-500 ring-2 ring-primary-100"
                    : "border-gray-200 hover:border-gray-300"
                } ${plan.highlighted ? "shadow-lg" : ""}`}
                onClick={() => setSelectedPlan(planKey)}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                      Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-4">
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{plan.price}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {isSelected ? "Current Plan" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bot Features */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Bot Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">View Classes</p>
              <p className="text-xs text-gray-500">Client views their upcoming scheduled classes</p>
            </div>
            <Toggle enabled={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Confirm Attendance</p>
              <p className="text-xs text-gray-500">Client confirms attendance for classes</p>
            </div>
            <Toggle enabled={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Cancel Class</p>
              <p className="text-xs text-gray-500">Client cancels class directly</p>
            </div>
            <Toggle enabled={selectedPlan !== "starter"} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Book New Class</p>
              <p className="text-xs text-gray-500">Client books new classes via WhatsApp</p>
            </div>
            <Toggle enabled={selectedPlan !== "starter"} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Automatic Reminders</p>
              <p className="text-xs text-gray-500">Send reminder 24h before class</p>
            </div>
            <Toggle enabled={selectedPlan !== "starter"} onChange={() => {}} />
          </div>
        </div>
      </div>

      {/* Twilio Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Configure Twilio</h3>
                </div>
                <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  To use WhatsApp Business, you need a Twilio account.
                  <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="font-medium underline ml-1">
                    Create free account
                  </a>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioConfig.accountSid}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Found in Twilio Console</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioConfig.authToken}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="+15551234567"
                  value={twilioConfig.whatsappNumber}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">WhatsApp approved number in Twilio</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Webhook URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-600 overflow-x-auto">
                    https://your-domain.com/api/webhook/whatsapp/twilio
                  </code>
                  <button className="px-3 py-2 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50">
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Configure this URL in Twilio Console → Messaging → WhatsApp Sandbox</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.whatsappNumber}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Save and Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Branding Settings Component (White Label)
function BrandingSettings() {
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

  // Mock: Check if white label is available in current plan
  const isWhiteLabelAvailable = false; // Would come from plan context

  const updateBranding = (key: string, value: string | boolean) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
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
            <div className={`border-2 border-dashed rounded-xl p-6 text-center ${!isWhiteLabelAvailable ? "opacity-50 pointer-events-none" : "border-gray-300 hover:border-primary-400 cursor-pointer"}`}>
              {branding.customLogo ? (
                <div className="flex flex-col items-center">
                  <img src={branding.customLogo} alt="Logo" className="h-12 mb-2" />
                  <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
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
            <div className={`border-2 border-dashed rounded-xl p-6 text-center ${!isWhiteLabelAvailable ? "opacity-50 pointer-events-none" : "border-gray-300 hover:border-primary-400 cursor-pointer"}`}>
              {branding.customFavicon ? (
                <div className="flex flex-col items-center">
                  <img src={branding.customFavicon} alt="Favicon" className="h-8 mb-2" />
                  <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
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
          <Button>Save Branding</Button>
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
                  // TODO: Redirect to upgrade flow
                  setShowUpgradeModal(false);
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

// Waitlist Settings Component
function WaitlistSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    maxWaitlistSize: 10,
    autoNotifyOnCancel: true,
    showPositionToClient: true,
    allowAutoConfirm: true,
    notificationChannels: ["whatsapp", "email"] as string[],
    confirmationMethod: "link" as "link" | "reply" | "app",
    noShowPenalty: {
      enabled: true,
      maxNoShows: 2,
      penaltyDays: 7,
    },
    priorityBoost: {
      enabled: true,
      attendanceThreshold: 8,
      boostPercentage: 20,
    },
  });

  // Priority Score Configuration (matches WaitlistPriorityConfig schema)
  const [priorityConfig, setPriorityConfig] = useState({
    planTypePoints: {
      annual: 50,
      quarterly: 30,
      monthly: 15,
      "drop-in": 5,
    },
    waitingTimePointsPerDay: 2,
    attendanceRateMultiplier: 0.5,
    vipBonus: 100,
    cancelledByStudioBonus: 75,
    urgentReasonBonus: 25,
    notificationWindowMinutes: 30,
    autoDeclineAfterMinutes: 120,
    maxNotificationsPerSlot: 3,
  });

  const [priorityTiers, setPriorityTiers] = useState([
    {
      id: "vip",
      label: "VIP Members",
      responseTimeMinutes: 240,
      cancellationGraceHours: 2,
      sources: ["Native VIP"],
      color: "#6938EF",
      enabled: true,
    },
    {
      id: "high",
      label: "Direct Clients",
      responseTimeMinutes: 120,
      cancellationGraceHours: 4,
      sources: ["Native", "Packages"],
      color: "#8870E9",
      enabled: true,
    },
    {
      id: "medium",
      label: "ClassPass",
      responseTimeMinutes: 60,
      cancellationGraceHours: 12,
      sources: ["ClassPass"],
      color: "#DD2590",
      enabled: true,
    },
    {
      id: "low",
      label: "Aggregators",
      responseTimeMinutes: 30,
      cancellationGraceHours: 24,
      sources: ["Gympass", "TotalPass", "Urban"],
      color: "#98A2B3",
      enabled: true,
    },
  ]);

  const updateTier = (tierId: string, field: string, value: number | boolean) => {
    setPriorityTiers(prev =>
      prev.map(tier =>
        tier.id === tierId ? { ...tier, [field]: value } : tier
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Waitlist Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure smart waitlist with priority-based notifications and automatic spot filling.
        </p>
      </div>

      {/* Waitlist Toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Enable Waitlist</h3>
              <p className="text-sm text-gray-600">Allow clients to join waitlist when classes are full</p>
            </div>
          </div>
          <Toggle enabled={settings.enabled} onChange={(v) => setSettings({ ...settings, enabled: v })} />
        </div>
      </div>

      {/* Priority Tiers */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900">Priority Tiers</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure priority levels for different client sources. Higher priority clients get notified first and have more time to respond.
          </p>
        </div>

        <div className="space-y-4">
          {priorityTiers.map((tier, index) => (
            <div
              key={tier.id}
              className={`border rounded-xl p-4 transition-all ${
                tier.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: tier.color }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{tier.label}</h4>
                    <p className="text-xs text-gray-500">{tier.sources.join(", ")}</p>
                  </div>
                </div>
                <Toggle enabled={tier.enabled} onChange={(v) => updateTier(tier.id, "enabled", v)} />
              </div>

              {tier.enabled && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Response Time
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tier.responseTimeMinutes}
                        onChange={(e) => updateTier(tier.id, "responseTimeMinutes", parseInt(e.target.value))}
                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-xs text-gray-500">minutes to confirm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cancellation Grace
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tier.cancellationGraceHours}
                        onChange={(e) => updateTier(tier.id, "cancellationGraceHours", parseInt(e.target.value))}
                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-xs text-gray-500">hours before class</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-primary-50 rounded-lg">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-primary-800">
              <p className="font-medium mb-1">Como a Prioridade Funciona</p>
              <p>Quando uma vaga abre, o cliente com maior prioridade na lista de espera é notificado primeiro. Se não confirmar dentro do tempo de resposta, o próximo é notificado automaticamente.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Score Configuration */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900">Configuração de Pontos de Prioridade</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure quantos pontos cada critério adiciona à pontuação de prioridade do cliente.
          </p>
        </div>

        {/* Plan Type Points */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Pontos por Tipo de Plano</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: "annual" as const, label: "Anual", color: "bg-purple-100 text-purple-700" },
              { key: "quarterly" as const, label: "Trimestral", color: "bg-blue-100 text-blue-700" },
              { key: "monthly" as const, label: "Mensal", color: "bg-green-100 text-green-700" },
              { key: "drop-in" as const, label: "Avulso", color: "bg-gray-100 text-gray-700" },
            ].map((plan) => (
              <div key={plan.key} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${plan.color}`}>
                    {plan.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priorityConfig.planTypePoints[plan.key]}
                    onChange={(e) => setPriorityConfig({
                      ...priorityConfig,
                      planTypePoints: {
                        ...priorityConfig.planTypePoints,
                        [plan.key]: parseInt(e.target.value) || 0,
                      },
                    })}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus Points */}
        <div className="mb-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Pontos de Bônus</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⭐</span>
                <span className="text-sm font-medium text-gray-900">VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priorityConfig.vipBonus}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, vipBonus: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">pts bônus</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Clientes marcados como VIP</p>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏢</span>
                <span className="text-sm font-medium text-gray-900">Cancelado pelo Estúdio</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priorityConfig.cancelledByStudioBonus}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, cancelledByStudioBonus: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">pts bônus</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Quando o estúdio cancela a aula</p>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🚨</span>
                <span className="text-sm font-medium text-gray-900">Motivo Urgente</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priorityConfig.urgentReasonBonus}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, urgentReasonBonus: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">pts bônus</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Solicitações marcadas como urgentes</p>
            </div>
          </div>
        </div>

        {/* Dynamic Points */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Pontos Dinâmicos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⏳</span>
                <span className="text-sm font-medium text-gray-900">Tempo de Espera</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={priorityConfig.waitingTimePointsPerDay}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, waitingTimePointsPerDay: parseFloat(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">pts / dia esperando</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Pontos adicionados por cada dia na fila</p>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <span className="text-sm font-medium text-gray-900">Taxa de Frequência</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={priorityConfig.attendanceRateMultiplier}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, attendanceRateMultiplier: parseFloat(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">pts / 1% frequência</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Ex: 80% frequência = +40 pts (0.5 × 80)</p>
            </div>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Exemplo de Cálculo</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Cliente com plano <span className="font-medium">Anual</span> ({priorityConfig.planTypePoints.annual} pts)</p>
            <p>+ Marcado como <span className="font-medium">VIP</span> (+{priorityConfig.vipBonus} pts)</p>
            <p>+ Esperando há <span className="font-medium">3 dias</span> (+{priorityConfig.waitingTimePointsPerDay * 3} pts)</p>
            <p>+ Frequência de <span className="font-medium">90%</span> (+{Math.round(priorityConfig.attendanceRateMultiplier * 90)} pts)</p>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <p className="font-semibold text-gray-900">
                Total: {priorityConfig.planTypePoints.annual + priorityConfig.vipBonus + (priorityConfig.waitingTimePointsPerDay * 3) + Math.round(priorityConfig.attendanceRateMultiplier * 90)} pontos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Timing */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Tempo de Notificação</h3>
          <p className="text-sm text-gray-600 mt-1">Configure quanto tempo o cliente tem para responder às notificações.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Janela de Notificação</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priorityConfig.notificationWindowMinutes}
                onChange={(e) => setPriorityConfig({ ...priorityConfig, notificationWindowMinutes: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500">minutos</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Tempo para cliente responder</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-declínio após</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priorityConfig.autoDeclineAfterMinutes}
                onChange={(e) => setPriorityConfig({ ...priorityConfig, autoDeclineAfterMinutes: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500">minutos</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Sem resposta = próximo na fila</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máx. notificações/vaga</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priorityConfig.maxNotificationsPerSlot}
                onChange={(e) => setPriorityConfig({ ...priorityConfig, maxNotificationsPerSlot: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500">pessoas</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Tentativas antes de desistir</p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Notification Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Channels</label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: "whatsapp", label: "WhatsApp", icon: "💬" },
                { id: "sms", label: "SMS", icon: "📱" },
                { id: "email", label: "Email", icon: "📧" },
                { id: "push", label: "Push", icon: "🔔" },
              ].map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    const channels = settings.notificationChannels.includes(channel.id)
                      ? settings.notificationChannels.filter(c => c !== channel.id)
                      : [...settings.notificationChannels, channel.id];
                    setSettings({ ...settings, notificationChannels: channels });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    settings.notificationChannels.includes(channel.id)
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span>{channel.icon}</span>
                  <span className="text-sm font-medium">{channel.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-notify on cancellation</p>
              <p className="text-xs text-gray-500">Immediately notify next in line when someone cancels</p>
            </div>
            <Toggle enabled={settings.autoNotifyOnCancel} onChange={(v) => setSettings({ ...settings, autoNotifyOnCancel: v })} />
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Show queue position</p>
              <p className="text-xs text-gray-500">Let clients see their position in the waitlist</p>
            </div>
            <Toggle enabled={settings.showPositionToClient} onChange={(v) => setSettings({ ...settings, showPositionToClient: v })} />
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Allow auto-confirm</p>
              <p className="text-xs text-gray-500">Let clients opt-in to automatic booking when spot opens</p>
            </div>
            <Toggle enabled={settings.allowAutoConfirm} onChange={(v) => setSettings({ ...settings, allowAutoConfirm: v })} />
          </div>
        </div>
      </div>

      {/* No-Show Penalty */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">No-Show Penalty</h3>
            <p className="text-sm text-gray-600">Penalize clients who don't show up after getting a waitlist spot</p>
          </div>
          <Toggle enabled={settings.noShowPenalty.enabled} onChange={(v) => setSettings({ ...settings, noShowPenalty: { ...settings.noShowPenalty, enabled: v } })} />
        </div>

        {settings.noShowPenalty.enabled && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max No-Shows</label>
              <select
                value={settings.noShowPenalty.maxNoShows}
                onChange={(e) => setSettings({ ...settings, noShowPenalty: { ...settings.noShowPenalty, maxNoShows: parseInt(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={1}>1 no-show</option>
                <option value={2}>2 no-shows</option>
                <option value={3}>3 no-shows</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Duration</label>
              <select
                value={settings.noShowPenalty.penaltyDays}
                onChange={(e) => setSettings({ ...settings, noShowPenalty: { ...settings.noShowPenalty, penaltyDays: parseInt(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Priority Boost */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Loyalty Priority Boost</h3>
            <p className="text-sm text-gray-600">Give priority boost to frequent attendees</p>
          </div>
          <Toggle enabled={settings.priorityBoost.enabled} onChange={(v) => setSettings({ ...settings, priorityBoost: { ...settings.priorityBoost, enabled: v } })} />
        </div>

        {settings.priorityBoost.enabled && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Threshold</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.priorityBoost.attendanceThreshold}
                  onChange={(e) => setSettings({ ...settings, priorityBoost: { ...settings.priorityBoost, attendanceThreshold: parseInt(e.target.value) } })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">classes/month</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority Boost</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.priorityBoost.boostPercentage}
                  onChange={(e) => setSettings({ ...settings, priorityBoost: { ...settings.priorityBoost, boostPercentage: parseInt(e.target.value) } })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">% priority increase</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* General Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">General Settings</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Waitlist Size</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={settings.maxWaitlistSize}
              onChange={(e) => setSettings({ ...settings, maxWaitlistSize: parseInt(e.target.value) })}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-500">people per class</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Maximum number of people that can join the waitlist for a single class</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary">Cancel</Button>
        <Button>Save Waitlist Settings</Button>
      </div>
    </div>
  );
}

// Integrations Settings Component
function IntegrationsSettings() {
  const integrations = [
    { name: "Wellhub", icon: "WH", color: "green", status: "Active", description: "Connected • Last sync: 2 hours ago" },
    { name: "Stripe", icon: "ST", color: "purple", status: null, description: "Payment processing" },
    { name: "Google Calendar", icon: "GC", color: "blue", status: null, description: "Calendar sync & notifications" },
  ];

  const colorClasses: Record<string, string> = {
    green: "bg-green-100 text-green-600",
    purple: "bg-primary-100 text-primary-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-600 mt-1">Connected apps and services.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          {integrations.map((integration, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[integration.color]}`}>
                <span className="font-bold text-sm">{integration.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                <p className="text-sm text-gray-500">{integration.description}</p>
              </div>
              {integration.status ? (
                <>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {integration.status}
                  </span>
                  <button className="text-sm text-gray-600 font-medium hover:text-gray-900">
                    Settings
                  </button>
                </>
              ) : (
                <button className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("general");

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "branding":
        return <BrandingSettings />;
      case "plans":
        return <PlansSettings />;
      case "waitlist":
        return <WaitlistSettings />;
      case "establishments":
        return <EstablishmentsSettings />;
      case "billing":
        return <BillingSettings />;
      case "notifications":
        return <NotificationsSettings />;
      case "team":
        return <TeamSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      case "whatsapp":
        return <WhatsAppSettings />;
      default:
        return <GeneralSettings />;
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
