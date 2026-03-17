"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrustBadges } from "@/components/checkout/TrustBadges";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  User,
  Calendar,
  Sparkles,
  ShieldCheck,
  Gift,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  Building2,
  QrCode as QrCodeIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AvailableClass {
  _id: string;
  title: string;
  type: string;
  instructorName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentEnrollment: number;
  availableSpots: number;
  isFull: boolean;
  location?: string;
}

type BookingType = "trial" | "drop-in";
type PaymentMethod = "card" | "cash" | "pix" | "bank_transfer";

interface TrialConfig {
  trialEnabled: boolean;
  trialPrice: number;
  dropInEnabled: boolean;
  dropInPrice: number;
  acceptedPaymentMethods: PaymentMethod[];
  requirePaymentUpfront: boolean;
  postTrialCouponCode: string;
  postTrialDiscountPercent: number;
  currency: string;
  studioName: string;
}

const PAYMENT_METHOD_INFO: Record<PaymentMethod, { label: string; description: string; icon: typeof CreditCard }> = {
  card: { label: "Card", description: "Pay online now", icon: CreditCard },
  cash: { label: "Cash", description: "Pay at the studio", icon: Banknote },
  pix: { label: "PIX", description: "Instant transfer", icon: QrCodeIcon },
  bank_transfer: { label: "Transfer", description: "Bank transfer", icon: Building2 },
};

const DEFAULT_CONFIG: TrialConfig = {
  trialEnabled: true,
  trialPrice: 0,
  dropInEnabled: true,
  dropInPrice: 35,
  acceptedPaymentMethods: ["card", "cash"],
  requirePaymentUpfront: false,
  postTrialCouponCode: "FIRSTCLASS",
  postTrialDiscountPercent: 20,
  currency: "USD",
  studioName: "FlexiWell Studio",
};

// ── Helpers ────────────────────────────────────────────────────────────

const classTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  pilates: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  yoga: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  stretching: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  meditation: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  other: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay());
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// ── Step Indicator ─────────────────────────────────────────────────────

const trialSteps = [
  { full: "Your Info", short: "Info" },
  { full: "Pick a Class", short: "Class" },
  { full: "Confirm", short: "Done" },
];

function TrialStepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-sm mx-auto">
        {trialSteps.map((step, index) => {
          const stepNumber = (index + 1) as 1 | 2 | 3;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step.full} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isCompleted
                      ? "bg-primary-600 text-white"
                      : isCurrent
                      ? "border-2 border-primary-600 text-primary-600 bg-primary-50"
                      : "border-2 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                </div>
                <span
                  className={`mt-2 text-xs font-medium whitespace-nowrap ${
                    isCompleted || isCurrent ? "text-primary-600" : "text-gray-400"
                  }`}
                >
                  <span className="sm:hidden">{step.short}</span>
                  <span className="hidden sm:inline">{step.full}</span>
                </span>
              </div>
              {index < trialSteps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-3 ${
                    stepNumber < currentStep ? "bg-primary-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 1: Guest Info ─────────────────────────────────────────────────

function GuestInfoStep({
  info,
  onChange,
  bookingType,
  onBookingTypeChange,
  onContinue,
  errors,
  config,
}: {
  info: GuestInfo;
  onChange: (field: keyof GuestInfo, value: string) => void;
  bookingType: BookingType;
  onBookingTypeChange: (type: BookingType) => void;
  onContinue: () => void;
  errors: Record<string, string>;
  config: TrialConfig;
}) {
  const formatPrice = (price: number) =>
    price === 0 ? "FREE" : `$${price}`;
  return (
    <div className="max-w-lg mx-auto">
      {/* Booking type selector */}
      <div className={`grid gap-3 mb-6 ${config.trialEnabled && config.dropInEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
        {config.trialEnabled && (
          <button
            onClick={() => onBookingTypeChange("trial")}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              bookingType === "trial"
                ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {bookingType === "trial" && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
            <Gift className={`w-5 h-5 mb-2 ${bookingType === "trial" ? "text-primary-600" : "text-gray-400"}`} />
            <h3 className={`font-semibold text-sm ${bookingType === "trial" ? "text-primary-900" : "text-gray-900"}`}>
              {config.trialPrice === 0 ? "Free Trial Class" : "Trial Class"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {config.trialPrice === 0 ? "Your first class is on us" : "Try us out"}
            </p>
            <div className="mt-2">
              <span className={`text-lg font-bold ${bookingType === "trial" ? "text-primary-600" : "text-gray-900"}`}>
                {formatPrice(config.trialPrice)}
              </span>
            </div>
          </button>
        )}

        {config.dropInEnabled && (
          <button
            onClick={() => onBookingTypeChange("drop-in")}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              bookingType === "drop-in"
                ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {bookingType === "drop-in" && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
            <Sparkles className={`w-5 h-5 mb-2 ${bookingType === "drop-in" ? "text-primary-600" : "text-gray-400"}`} />
            <h3 className={`font-semibold text-sm ${bookingType === "drop-in" ? "text-primary-900" : "text-gray-900"}`}>
              Drop-in Class
            </h3>
            <p className="text-xs text-gray-500 mt-1">Single class, no commitment</p>
            <div className="mt-2">
              <span className={`text-lg font-bold ${bookingType === "drop-in" ? "text-primary-600" : "text-gray-900"}`}>
                {formatPrice(config.dropInPrice)}
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Guest form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Tell us about yourself</h2>
        <p className="text-sm text-gray-500 mb-6">No account needed — just your details so we can save your spot.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                type="text"
                value={info.firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
                placeholder="Jane"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.firstName ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
              {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                type="text"
                value={info.lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
                placeholder="Smith"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.lastName ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
              {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={info.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="jane@example.com"
                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={info.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.phone ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            <p className="text-xs text-gray-400 mt-1">We'll text you a reminder 24h before class</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onContinue}
        className="w-full mt-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
      >
        Choose a Class
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-xs text-center text-gray-400 mt-4">
        By continuing you agree to our terms of service and cancellation policy.
      </p>
    </div>
  );
}

// ── Step 2: Pick a Class ───────────────────────────────────────────────

function PickClassStep({
  classes,
  loading,
  selectedDate,
  onSelectDate,
  weekStart,
  onPrevWeek,
  onNextWeek,
  selectedClass,
  onSelectClass,
  onContinue,
  onBack,
}: {
  classes: AvailableClass[];
  loading: boolean;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  selectedClass: AvailableClass | null;
  onSelectClass: (c: AvailableClass) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const weekDates = getWeekDates(weekStart);
  const classesForDay = classes.filter((c) =>
    isSameDay(new Date(c.scheduledDate), selectedDate)
  );

  const classCountByDay = weekDates.map((date) => ({
    date,
    count: classes.filter((c) => isSameDay(new Date(c.scheduledDate), date)).length,
    hasAvailable: classes.some(
      (c) => isSameDay(new Date(c.scheduledDate), date) && !c.isFull
    ),
  }));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Week Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onPrevWeek} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-medium text-gray-900 text-sm">
            {formatShortDate(weekDates[0])} - {formatShortDate(weekDates[6])}
          </span>
          <button onClick={onNextWeek} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {classCountByDay.map(({ date, count, hasAvailable }) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const isPast = date < new Date() && !isToday;

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isPast && onSelectDate(date)}
                disabled={isPast}
                className={`p-2 rounded-lg text-center transition-all ${
                  isSelected
                    ? "bg-primary-600 text-white"
                    : isPast
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-primary-50 hover:border-primary-300"
                }`}
              >
                <div className="text-[10px] uppercase">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className={`text-base font-semibold ${isToday && !isSelected ? "text-primary-600" : ""}`}>
                  {date.getDate()}
                </div>
                {count > 0 && (
                  <div
                    className={`text-[10px] ${
                      isSelected
                        ? "text-primary-200"
                        : hasAvailable
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Classes */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600" />
        </div>
      ) : classesForDay.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes on this day</h3>
          <p className="text-gray-500 text-sm">Try selecting a different day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {formatDate(selectedDate)} — {classesForDay.length}{" "}
            {classesForDay.length === 1 ? "class" : "classes"} available
          </p>
          {classesForDay.map((cls) => {
            const colors = classTypeColors[cls.type] || classTypeColors.other;
            const isSelected = selectedClass?._id === cls._id;

            return (
              <button
                key={cls._id}
                onClick={() => !cls.isFull && onSelectClass(cls)}
                disabled={cls.isFull}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                    : cls.isFull
                    ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    : `${colors.border} ${colors.bg} hover:shadow-md cursor-pointer`
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className={`font-semibold ${cls.isFull ? "text-gray-500" : colors.text}`}>
                      {cls.title}
                    </h4>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                      <User className="w-3.5 h-3.5" /> {cls.instructorName}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      cls.isFull
                        ? "bg-red-100 text-red-700"
                        : cls.availableSpots <= 2
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {cls.isFull
                      ? "Full"
                      : cls.availableSpots === 1
                      ? "1 spot left!"
                      : `${cls.availableSpots} spots`}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {cls.startTime} - {cls.endTime}
                  </span>
                  {cls.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {cls.location}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-primary-200 flex items-center gap-2 text-sm text-primary-700">
                    <Check className="w-4 h-4" />
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!selectedClass}
          className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Confirm ────────────────────────────────────────────────────

function ConfirmStep({
  guestInfo,
  selectedClass,
  bookingType,
  onConfirm,
  onBack,
  submitting,
  error,
  config,
  selectedPaymentMethod,
  onPaymentMethodChange,
}: {
  guestInfo: GuestInfo;
  selectedClass: AvailableClass;
  bookingType: BookingType;
  onConfirm: () => void;
  onBack: () => void;
  submitting: boolean;
  error: string | null;
  config: TrialConfig;
  selectedPaymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
}) {
  const isTrial = bookingType === "trial";
  const price = isTrial ? config.trialPrice : config.dropInPrice;
  const needsPayment = price > 0;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white text-center">
          <h2 className="text-xl font-bold mb-1">
            {isTrial ? "Your Free Trial Class" : "Drop-in Class"}
          </h2>
          <p className="text-primary-100 text-sm">Almost there! Review your booking below.</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Class details */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Class</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Class</span>
                <span className="font-medium text-gray-900">{selectedClass.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Instructor</span>
                <span className="font-medium text-gray-900">{selectedClass.instructorName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">{formatDate(selectedClass.scheduledDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">
                  {selectedClass.startTime} - {selectedClass.endTime}
                </span>
              </div>
              {selectedClass.location && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-900">{selectedClass.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Guest details */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">
                  {guestInfo.firstName} {guestInfo.lastName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{guestInfo.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">{guestInfo.phone}</span>
              </div>
            </div>
          </div>

          {/* Payment method — only if there's a charge */}
          {needsPayment && config.acceptedPaymentMethods.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 gap-2">
                {config.acceptedPaymentMethods.map((method) => {
                  const info = PAYMENT_METHOD_INFO[method];
                  const Icon = info.icon;
                  const isSelected = selectedPaymentMethod === method;

                  return (
                    <button
                      key={method}
                      onClick={() => onPaymentMethodChange(method)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-primary-600" : "text-gray-400"}`} />
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? "text-primary-900" : "text-gray-900"}`}>
                          {info.label}
                        </p>
                        <p className="text-xs text-gray-500">{info.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {!config.requirePaymentUpfront && (selectedPaymentMethod === "cash") && (
                <p className="text-xs text-amber-600 mt-2">
                  You can pay when you arrive at the studio.
                </p>
              )}
            </div>
          )}

          {/* Price summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Total</span>
              {price === 0 ? (
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-600">FREE</span>
                  <p className="text-xs text-gray-400">No credit card required</p>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">${price}</span>
                  {selectedPaymentMethod === "cash" && !config.requirePaymentUpfront && (
                    <p className="text-xs text-gray-400">Pay at studio</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Guarantee */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Cancellation policy</p>
              <p className="text-xs text-green-700 mt-0.5">
                Cancel at least 12 hours before class for a full refund. No questions asked.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onBack}
            disabled={submitting}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Booking...
              </>
            ) : !needsPayment ? (
              <>
                Book My Free Class
                <Check className="w-4 h-4" />
              </>
            ) : selectedPaymentMethod === "cash" && !config.requirePaymentUpfront ? (
              <>
                Reserve Spot — Pay ${price} at Studio
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Pay & Book — ${price}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <TrustBadges variant="horizontal" />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function TrialBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [bookingType, setBookingType] = useState<BookingType>("trial");
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Config from studio settings
  const [config, setConfig] = useState<TrialConfig>(DEFAULT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Payment method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("card");

  // Class picking state
  const [classes, setClasses] = useState<AvailableClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<AvailableClass | null>(null);

  // Confirm state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch trial config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/trial/config");
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
          // Default booking type based on what's enabled
          if (!data.trialEnabled && data.dropInEnabled) {
            setBookingType("drop-in");
          }
          // Default payment method to first accepted
          if (data.acceptedPaymentMethods?.length > 0) {
            setSelectedPaymentMethod(data.acceptedPaymentMethods[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load trial config:", err);
      } finally {
        setConfigLoaded(true);
      }
    }
    loadConfig();
  }, []);

  // Fetch classes when entering step 2
  const fetchClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const start = new Date(weekStart);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const params = new URLSearchParams({
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
        hasAvailability: "false",
      });

      const response = await fetch(`/api/bookings/available?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    } finally {
      setClassesLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    if (step === 2) {
      fetchClasses();
    }
  }, [step, fetchClasses]);

  // Validation
  const validateGuestInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!guestInfo.firstName.trim()) newErrors.firstName = "First name is required";
    if (!guestInfo.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!guestInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!guestInfo.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuestInfoChange = (field: keyof GuestInfo, value: string) => {
    setGuestInfo((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleStep1Continue = () => {
    if (validateGuestInfo()) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    if (!selectedClass) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const price = bookingType === "trial" ? config.trialPrice : config.dropInPrice;

      const response = await fetch("/api/trial/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: guestInfo.firstName.trim(),
          lastName: guestInfo.lastName.trim(),
          email: guestInfo.email.trim(),
          phone: guestInfo.phone.trim(),
          classId: selectedClass._id,
          bookingType,
          paymentMethod: price > 0 ? selectedPaymentMethod : undefined,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Redirect to success
      const params = new URLSearchParams({
        type: bookingType,
        className: selectedClass.title,
        classDate: selectedClass.scheduledDate,
        classTime: selectedClass.startTime,
        instructor: selectedClass.instructorName,
        name: `${guestInfo.firstName} ${guestInfo.lastName}`,
        email: guestInfo.email,
        bookingId: data.bookingId || "",
      });
      if (selectedClass.location) {
        params.set("location", selectedClass.location);
      }
      if (config.postTrialCouponCode) {
        params.set("coupon", config.postTrialCouponCode);
        params.set("discount", String(config.postTrialDiscountPercent));
      }

      router.push(`/trial/success?${params.toString()}`);
    } catch {
      setSubmitError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!configLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  const trialIsFree = config.trialPrice === 0;

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {bookingType === "trial" && trialIsFree
              ? "Try Your First Class Free"
              : "Book a Class"}
          </h1>
          <p className="text-gray-600">
            No account needed. No commitment. Just show up and move.
          </p>
        </div>

        {/* Step Indicator */}
        <TrialStepIndicator currentStep={step} />

        {/* Steps */}
        {step === 1 && (
          <GuestInfoStep
            info={guestInfo}
            onChange={handleGuestInfoChange}
            bookingType={bookingType}
            onBookingTypeChange={setBookingType}
            onContinue={handleStep1Continue}
            errors={errors}
            config={config}
          />
        )}

        {step === 2 && (
          <PickClassStep
            classes={classes}
            loading={classesLoading}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            weekStart={weekStart}
            onPrevWeek={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() - 7);
              setWeekStart(d);
              setSelectedDate(d);
            }}
            onNextWeek={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() + 7);
              setWeekStart(d);
              setSelectedDate(d);
            }}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
            onContinue={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && selectedClass && (
          <ConfirmStep
            guestInfo={guestInfo}
            selectedClass={selectedClass}
            bookingType={bookingType}
            onConfirm={handleConfirm}
            onBack={() => setStep(2)}
            submitting={submitting}
            error={submitError}
            config={config}
            selectedPaymentMethod={selectedPaymentMethod}
            onPaymentMethodChange={setSelectedPaymentMethod}
          />
        )}
      </div>
    </div>
  );
}