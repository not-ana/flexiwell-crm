"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCurrentSubscription,
  openBillingPortal,
  changePlan,
  previewPlanChange,
  cancelSubscription,
  reactivateSubscription,
  addAddOnToSubscription,
  removeAddOnFromSubscription,
  getInvoices,
  type SubscriptionResponse,
  type InvoiceResponse,
} from "@/lib/stripe/client";
import { pricingPlans, addOns, type PlanTier, type BillingPeriod } from "@/lib/config/pricing";
import {
  CreditCard,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Download,
} from "lucide-react";

function BillingContent() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ tier: PlanTier; billing: BillingPeriod } | null>(null);
  const [planChangePreview, setPlanChangePreview] = useState<{
    immediateCharge: number;
    nextInvoiceAmount: number;
    nextInvoiceDate: number | null;
    currency: string;
    lines: Array<{
      description: string;
      amount: number;
      proration: boolean;
    }>;
  } | null>(null);

  const success = searchParams.get("success") === "true";
  const addonSuccess = searchParams.get("addon_success") === "true";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subData, invoiceData] = await Promise.all([
        getCurrentSubscription().catch(() => null),
        getInvoices().catch(() => ({ invoices: [], hasMore: false })),
      ]);
      setSubscription(subData);
      setInvoices(invoiceData.invoices || []);
    } catch (err) {
      console.error("Error loading billing data:", err);
      setError("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setActionLoading("portal");
    try {
      await openBillingPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setActionLoading(null);
    }
  };

  const handlePreviewPlanChange = async (tier: PlanTier, billing: BillingPeriod) => {
    setSelectedPlan({ tier, billing });
    setActionLoading("preview");
    try {
      const preview = await previewPlanChange({
        newPlanTier: tier,
        newBillingPeriod: billing,
      });
      setPlanChangePreview(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview plan change");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlan) return;
    setActionLoading("change");
    try {
      await changePlan({
        newPlanTier: selectedPlan.tier,
        newBillingPeriod: selectedPlan.billing,
      });
      setShowChangePlanModal(false);
      setSelectedPlan(null);
      setPlanChangePreview(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (immediately: boolean) => {
    setActionLoading("cancel");
    try {
      await cancelSubscription({ immediately });
      setShowCancelModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    setActionLoading("reactivate");
    try {
      await reactivateSubscription();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAddOn = async (addOnId: string) => {
    setActionLoading(`add-${addOnId}`);
    try {
      await addAddOnToSubscription({ addOnId });
      setShowAddOnModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add add-on");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAddOn = async (addOnId: string) => {
    setActionLoading(`remove-${addOnId}`);
    try {
      await removeAddOnFromSubscription({ addOnId });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove add-on");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case "trialing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Trial
          </span>
        );
      case "past_due":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            Past Due
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            <XCircle className="w-3.5 h-3.5" />
            Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-green-800">
            Your subscription has been activated successfully! Welcome to FlexiWell.
          </p>
        </div>
      )}

      {addonSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-green-800">Add-on purchased successfully!</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* No Subscription */}
      {!subscription && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-600 mb-6">
            Choose a plan to get started with FlexiWell CRM.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700"
          >
            View Plans
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Current Subscription */}
      {subscription && (
        <>
          {/* Subscription Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                <p className="text-sm text-gray-500">Manage your subscription and billing</p>
              </div>
              {getStatusBadge(subscription.status)}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Plan Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="text-xl font-semibold text-gray-900">{subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-lg font-medium text-gray-900">
                    {formatCurrency(subscription.plan.amount, subscription.plan.currency)}
                    <span className="text-sm text-gray-500">
                      /{subscription.plan.interval}
                    </span>
                  </p>
                </div>
              </div>

              {/* Billing Period */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Current Period</p>
                  <p className="text-gray-900">
                    {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                {subscription.trialEnd && subscription.status === "trialing" && (
                  <div>
                    <p className="text-sm text-gray-500">Trial Ends</p>
                    <p className="text-gray-900">{formatDate(subscription.trialEnd)}</p>
                  </div>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Cancels on:</strong> {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                )}
              </div>

              {/* Next Invoice */}
              <div className="space-y-4">
                {subscription.upcomingInvoice && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Next Payment</p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatCurrency(subscription.upcomingInvoice.amount, subscription.upcomingInvoice.currency)}
                      </p>
                    </div>
                    {subscription.upcomingInvoice.date && (
                      <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className="text-gray-900">{formatDate(subscription.upcomingInvoice.date)}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
              <button
                onClick={() => setShowChangePlanModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
              >
                <Settings className="w-4 h-4" />
                Change Plan
              </button>
              <button
                onClick={handleOpenPortal}
                disabled={actionLoading === "portal"}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {actionLoading === "portal" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Manage Payment
              </button>
              <button
                onClick={() => setShowAddOnModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-4 h-4" />
                Add-ons
              </button>
              {subscription.cancelAtPeriodEnd ? (
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading === "reactivate"}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === "reactivate" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Reactivate
                </button>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-red-600 font-medium rounded-lg hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Active Add-ons */}
          {subscription.addOns.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Add-ons</h2>
              <div className="space-y-3">
                {subscription.addOns.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{addon.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(addon.amount)} × {addon.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveAddOn(addon.id)}
                      disabled={actionLoading === `remove-${addon.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      {actionLoading === `remove-${addon.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h2>
            {invoices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No invoices yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">Invoice</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="text-sm">
                        <td className="py-3">
                          <p className="font-medium text-gray-900">{invoice.number || invoice.id}</p>
                        </td>
                        <td className="py-3 text-gray-600">{formatDate(invoice.date)}</td>
                        <td className="py-3 text-gray-900">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="py-3">
                          {invoice.status === "paid" ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Paid
                            </span>
                          ) : invoice.status === "open" ? (
                            <span className="inline-flex items-center gap-1 text-yellow-600">
                              <Clock className="w-4 h-4" />
                              Open
                            </span>
                          ) : (
                            <span className="text-gray-500">{invoice.status}</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {invoice.pdfUrl && (
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
                            >
                              <Download className="w-4 h-4" />
                              PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Change Plan Modal */}
      {showChangePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Change Plan</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select a new plan. Changes take effect immediately for upgrades.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {pricingPlans.map((plan) => {
                const isCurrentPlan = plan.id === subscription?.plan.id;
                const isUpgrade = subscription ?
                  pricingPlans.findIndex(p => p.id === plan.id) > pricingPlans.findIndex(p => p.id === subscription.plan.id) : false;
                const isDowngrade = subscription ?
                  pricingPlans.findIndex(p => p.id === plan.id) < pricingPlans.findIndex(p => p.id === subscription.plan.id) : false;

                return (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                      selectedPlan?.tier === plan.id
                        ? "border-primary-500 bg-primary-50"
                        : isCurrentPlan
                        ? "border-gray-300 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => !isCurrentPlan && handlePreviewPlanChange(plan.id as PlanTier, "monthly")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                          {isCurrentPlan && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                              Current
                            </span>
                          )}
                          {isUpgrade && !isCurrentPlan && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <ArrowUpRight className="w-3 h-3" />
                              Upgrade
                            </span>
                          )}
                          {isDowngrade && !isCurrentPlan && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                              <ArrowDownRight className="w-3 h-3" />
                              Downgrade
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          ${plan.pricing.monthly}
                          <span className="text-sm text-gray-500 font-normal">/mo</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          or ${plan.pricing.annual}/mo annually
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Preview */}
              {planChangePreview && selectedPlan && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
                  {planChangePreview.immediateCharge > 0 && (
                    <p className="text-sm text-blue-800">
                      <strong>Immediate charge:</strong>{" "}
                      {formatCurrency(planChangePreview.immediateCharge, planChangePreview.currency)}
                    </p>
                  )}
                  <p className="text-sm text-blue-800">
                    <strong>Next invoice:</strong>{" "}
                    {formatCurrency(planChangePreview.nextInvoiceAmount, planChangePreview.currency)}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowChangePlanModal(false);
                  setSelectedPlan(null);
                  setPlanChangePreview(null);
                }}
                className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePlan}
                disabled={!selectedPlan || actionLoading === "change"}
                className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {actionLoading === "change" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Confirm Change"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Cancel Subscription</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                We&apos;re sorry to see you go. Choose how you&apos;d like to cancel:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleCancel(false)}
                  disabled={actionLoading === "cancel"}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-gray-300"
                >
                  <p className="font-medium text-gray-900">Cancel at period end</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Keep access until {subscription && formatDate(subscription.currentPeriodEnd)}
                  </p>
                </button>
                <button
                  onClick={() => handleCancel(true)}
                  disabled={actionLoading === "cancel"}
                  className="w-full p-4 text-left border-2 border-red-200 rounded-xl hover:border-red-300"
                >
                  <p className="font-medium text-red-600">Cancel immediately</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Lose access right away (no refund)
                  </p>
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add-on Modal */}
      {showAddOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Available Add-ons</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enhance your plan with additional features
              </p>
            </div>
            <div className="p-6 space-y-3">
              {addOns
                .filter(addon => addon.billingPeriod !== "one-time")
                .map((addon) => {
                  const isActive = subscription?.addOns.some(a => a.id === addon.id);
                  const isAvailable = subscription?.plan.id && addon.availableOn.includes(subscription.plan.id as PlanTier);

                  return (
                    <div
                      key={addon.id}
                      className={`p-4 rounded-xl border-2 ${
                        isActive
                          ? "border-green-200 bg-green-50"
                          : isAvailable
                          ? "border-gray-200"
                          : "border-gray-100 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{addon.name}</h3>
                            {isActive && (
                              <span className="px-2 py-0.5 bg-green-200 text-green-700 text-xs font-medium rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{addon.description}</p>
                          {!isAvailable && (
                            <p className="text-xs text-gray-400 mt-1">
                              Not available on your current plan
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${addon.price}/mo</p>
                          {isAvailable && !isActive && (
                            <button
                              onClick={() => handleAddAddOn(addon.id)}
                              disabled={actionLoading === `add-${addon.id}`}
                              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                              {actionLoading === `add-${addon.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowAddOnModal(false)}
                className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BillingSettings() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}