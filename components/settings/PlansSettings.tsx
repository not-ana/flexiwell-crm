"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Toggle } from "@/components/ui/Toggle";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";

// ============================================================================
// Types
// ============================================================================

interface Plan {
  id: string;
  name: string;
  price: number;
  period: "month" | "year";
  classes: number;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
}

interface NewPlanForm {
  name: string;
  price: string;
  classes: string;
  features: string;
}

// ============================================================================
// Icons
// ============================================================================

const PlusIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ============================================================================
// Constants
// ============================================================================

const INITIAL_PLANS: Plan[] = [
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
];

const EMPTY_PLAN_FORM: NewPlanForm = {
  name: "",
  price: "",
  classes: "",
  features: "",
};

// ============================================================================
// Sub-components
// ============================================================================

interface PlanCardProps {
  plan: Plan;
  onToggle: (id: string) => void;
  onSetPopular: (id: string) => void;
  onDelete: (plan: Plan) => void;
}

function PlanCard({ plan, onToggle, onSetPopular, onDelete }: PlanCardProps) {
  return (
    <div
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
                <CheckIcon />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetPopular(plan.id)}
            className={`p-2 rounded-lg transition-colors ${
              plan.isPopular
                ? "bg-primary-100 text-primary-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Set as most popular"
          >
            <StarIcon filled={plan.isPopular || false} />
          </button>
          <Toggle enabled={plan.isActive} onChange={() => onToggle(plan.id)} />
          <button
            onClick={() => onDelete(plan)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete plan"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Add Plan Modal
// ============================================================================

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (plan: NewPlanForm) => void;
}

function AddPlanModal({ isOpen, onClose, onAdd }: AddPlanModalProps) {
  const [form, setForm] = useState<NewPlanForm>(EMPTY_PLAN_FORM);

  const handleSubmit = () => {
    if (!form.name || !form.price) return;
    onAdd(form);
    setForm(EMPTY_PLAN_FORM);
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_PLAN_FORM);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader onClose={handleClose}>
        <ModalTitle>Add New Plan</ModalTitle>
        <ModalDescription>Create a subscription plan for clients</ModalDescription>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <FormField
          label="Plan Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Premium"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Price ($/month)"
            required
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="99"
          />
          <FormField
            label="Classes/month"
            type="number"
            value={form.classes}
            onChange={(e) => setForm({ ...form, classes: e.target.value })}
            placeholder="-1 for unlimited"
          />
        </div>
        <FormField
          as="textarea"
          label="Features (one per line)"
          value={form.features}
          onChange={(e) => setForm({ ...form, features: e.target.value })}
          placeholder={"Priority booking\nWhatsApp reminders\nCancel anytime"}
          rows={4}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Add Plan</Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Delete Confirmation Modal
// ============================================================================

interface DeletePlanModalProps {
  plan: Plan | null;
  onClose: () => void;
  onConfirm: () => void;
}

function DeletePlanModal({ plan, onClose, onConfirm }: DeletePlanModalProps) {
  if (!plan) return null;

  return (
    <Modal isOpen={!!plan} onClose={onClose} size="sm">
      <ModalBody className="text-center pt-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrashIcon />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Plan</h3>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium text-gray-900">{plan.name}</span>? Existing subscribers will keep their current plan.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PlansSettings() {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  const handleTogglePlan = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const handleSetPopular = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => ({
        ...p,
        isPopular: p.id === planId,
      }))
    );
  };

  const handleAddPlan = (form: NewPlanForm) => {
    const newPlan: Plan = {
      id: form.name.toLowerCase().replace(/\s+/g, "-"),
      name: form.name,
      price: parseFloat(form.price),
      period: "month",
      classes: parseInt(form.classes) || -1,
      features: form.features.split("\n").filter((f) => f.trim()),
      isActive: true,
    };
    setPlans((prev) => [...prev, newPlan]);
  };

  const handleDeletePlan = () => {
    if (planToDelete) {
      setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id));
      setPlanToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
          <p className="text-sm text-gray-600 mt-1">Manage plans available for your clients.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon />
          Add Plan
        </Button>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onToggle={handleTogglePlan}
            onSetPopular={handleSetPopular}
            onDelete={setPlanToDelete}
          />
        ))}
      </div>

      {/* Modals */}
      <AddPlanModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddPlan}
      />
      <DeletePlanModal
        plan={planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeletePlan}
      />
    </div>
  );
}
