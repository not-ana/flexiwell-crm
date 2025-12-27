"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export type UserRole = "admin" | "teacher" | "client";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector for the element to highlight
  position?: "top" | "bottom" | "left" | "right";
  spotlightPadding?: number;
}

interface OnboardingConfig {
  welcomeTitle: string;
  welcomeSubtitle: string;
  steps: OnboardingStep[];
}

const adminSteps: OnboardingStep[] = [
  {
    id: "sidebar-dashboard",
    title: "Dashboard",
    description: "Your business overview. See real-time metrics for revenue, active clients, classes, and attendance.",
    targetSelector: '[data-onboarding="sidebar-dashboard"]',
    position: "right",
  },
  {
    id: "sidebar-clients",
    title: "Client Management",
    description: "Add clients individually or bulk import via CSV. View plans, attendance history, and payments.",
    targetSelector: '[data-onboarding="sidebar-clients"]',
    position: "right",
  },
  {
    id: "sidebar-staff",
    title: "Staff & Team",
    description: "Manage instructors and admins. Assign to locations, set roles, and send email invitations.",
    targetSelector: '[data-onboarding="sidebar-staff"]',
    position: "right",
  },
  {
    id: "sidebar-payments",
    title: "Payments",
    description: "Track all financial transactions. Filter by period, client, or status. Export reports.",
    targetSelector: '[data-onboarding="sidebar-payments"]',
    position: "right",
  },
  {
    id: "sidebar-settings",
    title: "Settings",
    description: "Configure Waitlist, WhatsApp, notifications, integrations, and studio preferences.",
    targetSelector: '[data-onboarding="sidebar-settings"]',
    position: "right",
  },
];

const teacherSteps: OnboardingStep[] = [
  {
    id: "sidebar-dashboard",
    title: "Dashboard",
    description: "Your daily overview. See today's classes, your stats, student attendance, and add walk-in students.",
    targetSelector: '[data-onboarding="sidebar-dashboard"]',
    position: "right",
  },
  {
    id: "sidebar-classes",
    title: "My Classes",
    description: "View all your scheduled classes. Take attendance, see enrolled students, and manage class details.",
    targetSelector: '[data-onboarding="sidebar-classes"]',
    position: "right",
  },
  {
    id: "sidebar-settings",
    title: "Settings",
    description: "Update your profile, availability, and notification preferences.",
    targetSelector: '[data-onboarding="sidebar-settings"]',
    position: "right",
  },
];

const clientSteps: OnboardingStep[] = [
  {
    id: "sidebar-dashboard",
    title: "Dashboard",
    description: "Your wellness hub. See your plan status, upcoming classes, progress charts, and streak.",
    targetSelector: '[data-onboarding="sidebar-dashboard"]',
    position: "right",
  },
  {
    id: "sidebar-classes",
    title: "Classes",
    description: "Browse and book available classes. View your schedule, confirm attendance, or cancel if needed.",
    targetSelector: '[data-onboarding="sidebar-classes"]',
    position: "right",
  },
];

const onboardingConfigs: Record<UserRole, OnboardingConfig> = {
  admin: {
    welcomeTitle: "Welcome to FlexiWell Admin",
    welcomeSubtitle: "Let's take a quick tour of the platform",
    steps: adminSteps,
  },
  teacher: {
    welcomeTitle: "Welcome to the Instructor Portal",
    welcomeSubtitle: "See what you can do as an instructor",
    steps: teacherSteps,
  },
  client: {
    welcomeTitle: "Welcome to FlexiWell",
    welcomeSubtitle: "Your wellness journey starts here",
    steps: clientSteps,
  },
};

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: "top" | "bottom" | "left" | "right";
}

function calculateTooltipPosition(
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  position: "top" | "bottom" | "left" | "right"
): TooltipPosition {
  const padding = 12;
  const arrowSize = 8;

  switch (position) {
    case "top":
      return {
        top: targetRect.top - tooltipHeight - arrowSize - padding,
        left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        arrowPosition: "bottom",
      };
    case "bottom":
      return {
        top: targetRect.bottom + arrowSize + padding,
        left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        arrowPosition: "top",
      };
    case "left":
      return {
        top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        left: targetRect.left - tooltipWidth - arrowSize - padding,
        arrowPosition: "right",
      };
    case "right":
    default:
      return {
        top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        left: targetRect.right + arrowSize + padding,
        arrowPosition: "left",
      };
  }
}

// Spotlight overlay component
function SpotlightOverlay({
  targetRect,
  padding = 8,
}: {
  targetRect: DOMRect | null;
  padding?: number;
}) {
  if (!targetRect) return null;

  const spotlightStyle = {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Dark overlay with hole */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={spotlightStyle.left}
              y={spotlightStyle.top}
              width={spotlightStyle.width}
              height={spotlightStyle.height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>
      {/* Highlight border */}
      <div
        className="absolute border-2 border-primary-500 rounded-lg shadow-[0_0_0_4px_rgba(105,56,239,0.3)]"
        style={spotlightStyle}
      />
    </div>
  );
}

// Tooltip component
function Tooltip({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  targetRect,
}: {
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  targetRect: DOMRect | null;
}) {
  const [tooltipRef, setTooltipRef] = useState<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  useEffect(() => {
    if (tooltipRef && targetRect) {
      const rect = tooltipRef.getBoundingClientRect();
      const pos = calculateTooltipPosition(
        targetRect,
        rect.width,
        rect.height,
        step.position || "right"
      );

      // Ensure tooltip stays within viewport
      const maxLeft = window.innerWidth - rect.width - 20;
      const maxTop = window.innerHeight - rect.height - 20;
      pos.left = Math.max(20, Math.min(pos.left, maxLeft));
      pos.top = Math.max(20, Math.min(pos.top, maxTop));

      setPosition(pos);
    }
  }, [tooltipRef, targetRect, step.position]);

  const arrowClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white",
    bottom: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white",
    left: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white",
    right: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white",
  };

  return (
    <div
      ref={setTooltipRef}
      className="fixed z-[9999] w-80 bg-white rounded-xl shadow-2xl border border-gray-200"
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        opacity: position ? 1 : 0,
        transition: "opacity 0.2s",
      }}
    >
      {/* Arrow */}
      {position && (
        <div
          className={`absolute w-0 h-0 border-8 ${arrowClasses[position.arrowPosition]}`}
        />
      )}

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
            {currentStep + 1} of {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Skip tour
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {step.description}
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={currentStep === 0}
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {currentStep === totalSteps - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

// Welcome Modal
function WelcomeModal({
  config,
  onStart,
  onSkip,
}: {
  config: OnboardingConfig;
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Image
              src="/flexiwell-logo.svg"
              alt="FlexiWell"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {config.welcomeTitle}
          </h2>
          <p className="text-gray-600 mb-8">{config.welcomeSubtitle}</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onStart}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              Start Tour
            </button>
            <button
              onClick={onSkip}
              className="w-full py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Onboarding Component
export function InteractiveOnboarding({
  role,
  isOpen,
  onComplete,
}: {
  role: UserRole;
  isOpen: boolean;
  onComplete: () => void;
}) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const config = onboardingConfigs[role];
  const currentStepData = config.steps[currentStep];

  // Find and scroll to target element
  const findTarget = useCallback(() => {
    if (!currentStepData) return;

    const target = document.querySelector(currentStepData.targetSelector);
    if (target) {
      // Scroll element into view
      target.scrollIntoView({ behavior: "smooth", block: "center" });

      // Wait for scroll to complete, then get rect
      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
      }, 300);
    } else {
      setTargetRect(null);
    }
  }, [currentStepData]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showWelcome && isOpen) {
      findTarget();
    }
  }, [showWelcome, currentStep, isOpen, findTarget]);

  // Handle window resize
  useEffect(() => {
    if (!showWelcome && isOpen) {
      const handleResize = () => findTarget();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [showWelcome, isOpen, findTarget]);

  const handleStart = () => {
    setShowWelcome(false);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen || !mounted) return null;

  // Use portal to render at document root
  return createPortal(
    <>
      {showWelcome ? (
        <WelcomeModal config={config} onStart={handleStart} onSkip={handleSkip} />
      ) : (
        <>
          <SpotlightOverlay
            targetRect={targetRect}
            padding={currentStepData?.spotlightPadding}
          />
          {currentStepData && (
            <Tooltip
              step={currentStepData}
              currentStep={currentStep}
              totalSteps={config.steps.length}
              onNext={handleNext}
              onPrev={handlePrev}
              onSkip={handleSkip}
              targetRect={targetRect}
            />
          )}
          {/* Click blocker except for highlighted area */}
          <div
            className="fixed inset-0 z-[9997]"
            onClick={(e) => e.stopPropagation()}
          />
        </>
      )}
    </>,
    document.body
  );
}

// Hook for managing onboarding state
export function useInteractiveOnboarding(role: UserRole) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if onboarding was completed
    const completed = localStorage.getItem(`onboarding_completed_${role}`);
    if (!completed) {
      setShouldShow(true);
    }
  }, [role]);

  const resetOnboarding = () => {
    localStorage.removeItem(`onboarding_completed_${role}`);
    setShouldShow(true);
  };

  const markComplete = () => {
    localStorage.setItem(`onboarding_completed_${role}`, "true");
    setShouldShow(false);
  };

  return { shouldShow, resetOnboarding, markComplete, setShouldShow };
}
