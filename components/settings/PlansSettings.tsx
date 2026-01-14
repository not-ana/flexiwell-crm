"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { showToast, Toggle } from "./shared";

export function PlansSettings() {
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
  const [planToDelete, setPlanToDelete] = useState<typeof plans[0] | null>(null);
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

  const handleDeletePlan = (plan: typeof plans[0]) => {
    setPlanToDelete(plan);
  };

  const confirmDeletePlan = () => {
    if (planToDelete) {
      setPlans(prev => prev.filter(p => p.id !== planToDelete.id));
      setPlanToDelete(null);
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
                  onClick={() => handleDeletePlan(plan)}
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

      {/* Delete Plan Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Plan
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Are you sure you want to delete <span className="font-medium text-gray-900">{planToDelete.name}</span>? Existing subscribers will keep their current plan.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setPlanToDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePlan}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
