"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type UserRole = "admin" | "teacher" | "client";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

interface OnboardingConfig {
  welcomeTitle: string;
  welcomeSubtitle: string;
  steps: OnboardingStep[];
}

const onboardingConfigs: Record<UserRole, OnboardingConfig> = {
  admin: {
    welcomeTitle: "Welcome to FlexiWell Admin",
    welcomeSubtitle: "Let's take a quick tour of your dashboard and learn about the main features",
    steps: [
      {
        title: "Dashboard Overview",
        description: "Your dashboard shows key metrics at a glance: total revenue, active clients, classes this month, and attendance rates. Use the period selector (Week/Month/Year) in the top right to change the timeframe. The revenue chart shows your growth compared to last year.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
        highlight: "/admin",
      },
      {
        title: "Client Management",
        description: "Go to Clients in the sidebar to manage your client base. You can add clients individually with the 'Add Client' button, or import multiple clients at once using CSV with the 'Import' button. View client details, their current plan, attendance history, and payment status.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
        highlight: "/admin/clients",
      },
      {
        title: "Staff & Team Management",
        description: "In the Staff section, manage your instructors and admins. Add team members individually or import in bulk. Assign staff to specific locations (establishments), define their roles, and send invitation emails. Track their performance metrics directly from the dashboard.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4.354a4 4 0 1 1 0 7.292" />
            <path d="M15 21H3v-1a6 6 0 0 1 12 0v1zm0 0h6v-1a6 6 0 0 0-9-5.197" />
          </svg>
        ),
        highlight: "/admin/staff",
      },
      {
        title: "Waitlist Feature",
        description: "When classes are full, clients can join the waitlist. Configure waitlist settings in Settings > Waitlist. Set automatic notifications when spots open up, define waitlist limits per class, and manage priority rules. Clients will be notified via WhatsApp or email when a spot becomes available.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        ),
        highlight: "/admin/settings",
      },
      {
        title: "Payments & Billing",
        description: "The Payments section shows all financial transactions. View paid, pending, and overdue payments. Filter by date range, client, or status. Export financial reports to CSV or PDF for accounting. Track revenue trends and identify clients with payment issues.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        ),
        highlight: "/admin/payments",
      },
      {
        title: "WhatsApp Integration",
        description: "Connect WhatsApp to automate client communications. Go to Settings > WhatsApp to configure Twilio integration. Once set up, clients can view their schedule, confirm attendance, cancel classes, and receive automatic reminders - all through WhatsApp!",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        ),
        highlight: "/admin/settings",
      },
    ],
  },
  teacher: {
    welcomeTitle: "Welcome to FlexiWell Teacher Portal",
    welcomeSubtitle: "Here's what you can do as an instructor",
    steps: [
      {
        title: "Today's Schedule",
        description: "Your dashboard shows today's classes with their status: completed, in progress, or upcoming. You can see which room each class is in, how many students are registered, and quickly access the 'Take Attendance' button when a class is in progress.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
        highlight: "/teacher",
      },
      {
        title: "Add Walk-in Students",
        description: "Need to add a drop-in student? Click 'Add Walk-in' in the top right corner. Enter their basic info and select the class - they'll be added immediately. You can complete their full profile later or collect payment on site.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        ),
        highlight: "/teacher",
      },
      {
        title: "Makeup Classes",
        description: "Switch to the 'Makeup Classes' tab to see students who missed sessions and need to reschedule. You can schedule makeup classes directly from this list, and the system tracks pending vs scheduled makeups for easy management.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
        highlight: "/teacher",
      },
      {
        title: "Student Attendance Tracking",
        description: "The 'Student Attendance' section on the right shows your regular students' attendance rates. Students who need makeup classes are flagged so you can follow up. Click on any student to see their full attendance history.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        ),
        highlight: "/teacher",
      },
      {
        title: "Your Weekly Stats",
        description: "Track your performance with weekly stats at the top: classes completed, students served, average attendance, and your rating. The chart shows your teaching distribution by day and class type, helping you understand your workload.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
        highlight: "/teacher",
      },
    ],
  },
  client: {
    welcomeTitle: "Welcome to FlexiWell",
    welcomeSubtitle: "Your wellness journey starts here",
    steps: [
      {
        title: "Your Dashboard",
        description: "Your dashboard shows everything at a glance: your current plan with remaining classes, your weekly streak, next billing date, and your favorite instructor. The stats cards at the top give you quick access to what matters most.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
        highlight: "/dashboard",
      },
      {
        title: "Upcoming Classes",
        description: "The 'My Schedule' card shows your upcoming booked classes. You can see the class name, instructor, time, and room. Each class has action buttons to confirm attendance, cancel if needed, or view more details.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M9 16l2 2 4-4" />
          </svg>
        ),
        highlight: "/dashboard",
      },
      {
        title: "Book New Classes",
        description: "Click 'Book a Class' to browse available sessions. Filter by class type, instructor, or day. If a class is full, you can join the waitlist and get notified when a spot opens up!",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        ),
        highlight: "/dashboard/classes",
      },
      {
        title: "Your Progress",
        description: "The donut chart shows your monthly progress: classes completed vs scheduled. Below, the yearly chart tracks your attendance patterns over time. Keep your streak going to see your consistency improve!",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
        highlight: "/dashboard",
      },
      {
        title: "Manage Your Plan",
        description: "Go to Settings > Billing to view your current plan, remaining classes, and billing history. You can upgrade or change your plan anytime, update your payment method, and download invoices for your records.",
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        ),
        highlight: "/dashboard/settings",
      },
    ],
  },
};

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  onComplete?: () => void;
}

export function OnboardingModal({ isOpen, onClose, role, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 is welcome screen
  const config = onboardingConfigs[role];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(-1);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > -1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save to localStorage that onboarding has been completed
    localStorage.setItem(`onboarding_completed_${role}`, "true");
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(`onboarding_completed_${role}`, "true");
    onClose();
  };

  if (!isOpen) return null;

  const isWelcome = currentStep === -1;
  const step = !isWelcome ? config.steps[currentStep] : null;
  const progress = ((currentStep + 2) / (config.steps.length + 1)) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {isWelcome ? (
            <div className="text-center">
              <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Image
                  src="/flexiwell-logo.svg"
                  alt="FlexiWell"
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{config.welcomeTitle}</h2>
              <p className="text-gray-600 mb-8">{config.welcomeSubtitle}</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleNext}
                  className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Start Tour
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {config.steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? "bg-primary-600 w-6"
                        : index < currentStep
                        ? "bg-primary-300"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Step content */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-5 text-primary-600">
                  {step?.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step?.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step?.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isWelcome && (
          <div className="px-8 pb-8 pt-4 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              className="px-5 py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              {currentStep === config.steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to check if onboarding should be shown
export function useOnboarding(role: UserRole) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
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
