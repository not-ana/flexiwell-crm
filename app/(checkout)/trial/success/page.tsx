"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui";
import {
  Check,
  Calendar,
  Clock,
  MapPin,
  User,
  MessageCircle,
  ArrowRight,
  Share2,
  Gift,
  Smartphone,
} from "lucide-react";

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

function TrialSuccessContent() {
  const searchParams = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);

  const bookingType = searchParams.get("type") || "trial";
  const className = searchParams.get("className") || "Class";
  const classDate = searchParams.get("classDate") || "";
  const classTime = searchParams.get("classTime") || "";
  const instructor = searchParams.get("instructor") || "";
  const location = searchParams.get("location") || "";
  const guestName = searchParams.get("name") || "";
  const guestEmail = searchParams.get("email") || "";
  const couponCode = searchParams.get("coupon") || "FIRSTCLASS";
  const discountPercent = searchParams.get("discount") || "20";
  const isTrial = bookingType === "trial";

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const formattedDate = classDate
    ? new Date(classDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="py-8 px-4 relative overflow-hidden">
      {showConfetti && <Confetti />}

      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Animated check */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
            <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isTrial ? "You're In!" : "Booking Confirmed!"}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {isTrial
              ? "Your free trial class has been booked. We can't wait to see you!"
              : "Your drop-in class is confirmed. See you there!"}
          </p>

          {/* Booking details card */}
          <div className="bg-gray-50 rounded-xl p-5 text-left mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Booking Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Date:</span>{" "}
                  <span className="font-medium text-gray-900">{formattedDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Time:</span>{" "}
                  <span className="font-medium text-gray-900">{classTime}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Class:</span>{" "}
                  <span className="font-medium text-gray-900">{className}</span>
                  {instructor && (
                    <span className="text-gray-500"> with {instructor}</span>
                  )}
                </div>
              </div>
              {location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500">Location:</span>{" "}
                    <span className="font-medium text-gray-900">{location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* What to expect */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Before Your Class</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-lg p-3">
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <span className="text-sm font-medium text-primary-900">
                  Arrive 10 minutes early for a quick orientation
                </span>
              </div>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-xs font-bold">2</span>
                </div>
                <span className="text-sm text-gray-700">
                  Wear comfortable clothes — we provide everything else
                </span>
              </div>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-xs font-bold">3</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    You'll get an SMS reminder 24h before class
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SMS confirmation banner */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Confirmation sent!</p>
                <p className="text-xs text-green-700 mt-0.5">
                  We sent a confirmation to {guestEmail}. Check your inbox for details.
                </p>
              </div>
            </div>
          </div>

          {/* Referral / Upsell */}
          {isTrial && (
            <div className="bg-gradient-to-r from-amber-50 to-primary-50 border border-amber-100 rounded-xl p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Gift className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Loved your trial? Save 20% on your first plan
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Use code <span className="font-mono font-bold text-primary-600">{couponCode}</span> at
                    checkout for {discountPercent}% off any plan. Valid for 48 hours.
                  </p>
                  <Link
                    href="/plans"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    View Plans
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Bring a friend */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Share2 className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Bring a friend!</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Know someone who'd love Pilates? Share this page and they can book their free trial too.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/plans"
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Plans & Packages
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/trial"
              className="block w-full py-2 text-center text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Book Another Class
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrialSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <TrialSuccessContent />
    </Suspense>
  );
}
