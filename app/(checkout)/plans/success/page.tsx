"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui";
import { CheckoutStepIndicator } from "@/components/checkout/CheckoutStepIndicator";
import {
  Check,
  Download,
  Share2,
  Gift,
  Calendar,
  BookOpen,
  Smartphone,
  MessageCircle,
  UserPlus,
  Mail,
  Lock,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface PurchaseDetails {
  planName: string;
  classes: number;
  duration: string;
  amount: number;
  paymentMethod: string;
  orderNumber: string;
}

function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2.5 + Math.random() * 2}s`,
    color: [
      "bg-primary-400",
      "bg-primary-600",
      "bg-pink-400",
      "bg-green-400",
      "bg-amber-400",
    ][i % 5],
    size: i % 2 === 0 ? "w-2 h-3" : "w-3 h-2",
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((piece, i) => (
        <div
          key={i}
          className={`absolute ${piece.color} ${piece.size} rounded-sm`}
          style={{
            left: piece.left,
            top: "-20px",
            animation: `confetti-fall ${piece.duration} ${piece.delay} ease-in forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { formatCurrency } = useCurrency();

  // Stripe flow
  const sessionId = searchParams.get("session_id");

  // Demo flow query params
  const paramOrderNumber =
    searchParams.get("orderNumber") ||
    `#FW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const paramPlanName = searchParams.get("planName") || "";
  const paramClasses = searchParams.get("classes") || "";
  const paramAmount = searchParams.get("amount") || "";
  const paramDuration = searchParams.get("duration") || "";

  const [loading, setLoading] = useState(!!sessionId);
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(
    !sessionId && paramPlanName
      ? {
          planName: paramPlanName,
          classes: parseInt(paramClasses) || 0,
          duration: paramDuration,
          amount: parseFloat(paramAmount) || 0,
          paymentMethod: "Credit Card",
          orderNumber: paramOrderNumber,
        }
      : null
  );
  const [showConfetti, setShowConfetti] = useState(true);
  const [referralCopied, setReferralCopied] = useState(false);

  // Stripe verification flow
  useEffect(() => {
    if (sessionId) {
      verifyPurchase();
    }
  }, [sessionId]);

  // Confetti cleanup
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const verifyPurchase = async () => {
    try {
      const response = await fetch(
        `/api/client/checkout/verify?session_id=${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setPurchaseDetails({
          planName: data.planName || "Plan",
          classes: data.classes || 0,
          duration: data.duration || "30 days",
          amount: data.amount || 0,
          paymentMethod: data.paymentMethod || "Credit Card",
          orderNumber:
            data.orderNumber ||
            `#FW-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        });
      }
    } catch (error) {
      console.error("Error verifying purchase:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = () => {
    const referralLink = `${window.location.origin}/ref/${Math.random().toString(36).substring(2, 8)}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2500);
    }).catch(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2500);
    });
  };

  const handleDownloadReceipt = () => {
    // Simulated download for portfolio demo
    const receiptContent = [
      "FlexiWell - Purchase Receipt",
      "================================",
      `Order: ${purchaseDetails?.orderNumber || paramOrderNumber}`,
      `Plan: ${purchaseDetails?.planName || "N/A"}`,
      `Classes: ${purchaseDetails?.classes || "N/A"}`,
      `Duration: ${purchaseDetails?.duration || "N/A"}`,
      `Amount: ${purchaseDetails?.amount ? formatCurrency(purchaseDetails.amount) : "N/A"}`,
      `Payment: ${purchaseDetails?.paymentMethod || "Credit Card"}`,
      `Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      "",
      "Thank you for your purchase!",
    ].join("\n");

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flexiwell-receipt-${(purchaseDetails?.orderNumber || paramOrderNumber).replace("#", "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate dates
  const today = new Date();
  const endDate = new Date(today);
  const durationStr = purchaseDetails?.duration || paramDuration;
  if (durationStr === "365 days") {
    endDate.setDate(endDate.getDate() + 365);
  } else if (durationStr === "90 days") {
    endDate.setDate(endDate.getDate() + 90);
  } else {
    endDate.setDate(endDate.getDate() + 30);
  }

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const displayOrderNumber = purchaseDetails?.orderNumber || paramOrderNumber;
  const displayPlanName = purchaseDetails?.planName || paramPlanName || "Plan";
  const displayClasses = purchaseDetails?.classes || parseInt(paramClasses) || 0;
  const displayDuration = purchaseDetails?.duration || paramDuration || "30 days";
  const displayAmount = purchaseDetails?.amount || parseFloat(paramAmount) || 0;
  const displayPaymentMethod = purchaseDetails?.paymentMethod || "Credit Card";

  return (
    <div className="py-8 px-4 relative overflow-hidden">
      {/* Confetti animation */}
      {showConfetti && <Confetti />}

      <div className="max-w-3xl mx-auto">
        {/* Step Indicator */}
        <CheckoutStepIndicator currentStep={4} />

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Animated green check circle */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
            <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Purchase Confirmed!
          </h1>
          <p className="text-gray-500 text-sm mb-1">Your plan is now active</p>
          <p className="font-mono text-sm text-gray-400 mb-6">
            {displayOrderNumber}
          </p>

          {/* Receipt Card */}
          <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Order Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plan</span>
                <span className="font-medium text-gray-900">{displayPlanName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Classes</span>
                <span className="font-medium text-gray-900">
                  {displayClasses} {displayClasses === 1 ? "class" : "classes"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-900">{displayDuration}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-bold text-gray-900 text-base">
                  {displayAmount > 0 ? formatCurrency(displayAmount) : "--"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium text-gray-900">{displayPaymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">{formatDate(today)}</span>
              </div>
            </div>
          </div>

          {/* Plan Start Banner */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-primary-900">
                Your plan starts now!
              </h3>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-primary-600 text-xs uppercase font-medium">Start</p>
                <p className="text-primary-900 font-medium">{formatDate(today)}</p>
              </div>
              <div className="text-right">
                <p className="text-primary-600 text-xs uppercase font-medium">End</p>
                <p className="text-primary-900 font-medium">{formatDate(endDate)}</p>
              </div>
            </div>
          </div>

          {/* What's Next Checklist */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What&apos;s Next</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-lg p-3">
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-primary-900">
                    Book your first class
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-xs font-bold">2</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Complete your health assessment
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-xs font-bold">3</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Download the mobile app
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-xs font-bold">4</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Join our WhatsApp community
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-primary-50 border border-amber-100 rounded-xl p-5 mb-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Refer a Friend, Get 1 Free Class!
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Share your referral link and both you and your friend get a
                  free class when they sign up.
                </p>
                <button
                  onClick={handleCopyReferral}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {referralCopied ? "Link Copied!" : "Copy Referral Link"}
                </button>
              </div>
            </div>
          </div>

          {/* Create Account CTA - Post-purchase upsell */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Save your info for next time
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create a free account to track your classes, rebook faster, and manage your plan.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <Lock className="w-3 h-3" />
                  <span>Takes 30 seconds. No extra charges.</span>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                  <Mail className="w-4 h-4" />
                  Create Free Account
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/plans"
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Book My First Class
            </Link>
            <button
              onClick={handleDownloadReceipt}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </button>
            <Link
              href="/plans"
              className="block w-full py-2 text-center text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Browse More Plans
            </Link>
          </div>

          {/* Receipt Notice */}
          <p className="text-xs text-gray-400 mt-6">
            A receipt has been sent to your email. If you have any questions,
            contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
