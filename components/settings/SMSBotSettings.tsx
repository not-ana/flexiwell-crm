"use client";

// Retention Copilot — Message Templates panel
// ----------------------------------------------------------------------------
// FlexiWell does NOT run an automated SMS bot. The Retention Copilot detects
// at-risk clients via the Hormozi health score, drafts a personalized SMS, and
// the studio owner sends it from her own phone via an `sms:` deep link in the
// Client Check-up screen. No Twilio. No A2P. No automation.
//
// This settings panel is a read-only preview of the seven message templates
// the Copilot uses, so the owner can see exactly what the Copilot will draft
// on her behalf. Editing is intentionally not in v1.
// ----------------------------------------------------------------------------

interface SMSBotSettingsProps {
  onBack?: () => void;
}

interface CopilotTemplate {
  signal: string;
  label: string;
  trigger: string;
  preview: string;
}

const COPILOT_TEMPLATES: CopilotTemplate[] = [
  {
    signal: "new_not_activated",
    label: "New client hasn't started",
    trigger: "Signed up but fewer than 2 classes in their first 3 weeks",
    preview:
      "Hi {clientName}! This is {instructorName} from {studioName}. I'd love to see you in {nextClassName} on {nextClassDay} — it's a great fit for what you're looking for. Want me to save you a spot?",
  },
  {
    signal: "attendance_dropping",
    label: "Attendance dropping",
    trigger: "Last 2 weeks of classes are less than half the previous 2 weeks",
    preview:
      "Hi {clientName}! We noticed we haven't seen you as much lately. Did your schedule change? We have new class times that might work better — want me to help find one?",
  },
  {
    signal: "gone_cold",
    label: "Gone cold",
    trigger: "10+ days since their last class",
    preview:
      "Hi {clientName}! It's been a while and we miss you at {studioName}. {instructorName} has a {nextClassName} on {nextClassDay} that would be perfect. Ready to get back into it?",
  },
  {
    signal: "plan_underutilized",
    label: "Not using their plan",
    trigger: "Past the midpoint of their plan with under 40% of classes used",
    preview:
      "Hi {clientName}! You still have {remainingClasses} classes on your plan — that's a lot of great sessions waiting for you! Want me to help you book a few this week so you get the most out of it?",
  },
  {
    signal: "no_shows_spiking",
    label: "Missing booked classes",
    trigger: "2+ no-shows in the last 2 weeks, more than the prior period",
    preview:
      "Hi {clientName}! Life gets busy — we get it. If you need a breather, we can pause your plan for a week or two so you don't lose classes. Just let us know what works!",
  },
  {
    signal: "payment_failed",
    label: "Payment issue",
    trigger: "First payment failure from a previously clean client",
    preview:
      "Hi {clientName}! We noticed a small hiccup with your last payment. No worries — these things happen! Want to update your payment info or need any help?",
  },
  {
    signal: "streak_broken",
    label: "Lost their streak",
    trigger: "Had a 4+ week streak, then missed a week",
    preview:
      "Hi {clientName}! You had an amazing {longestStreak}-week streak going — don't let it slip away! One class this week puts you back on track. What day works?",
  },
];

export function SMSBotSettings({ onBack }: SMSBotSettingsProps) {
  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Retention Copilot</h1>
            <p className="text-sm text-gray-500 mt-1">
              The seven texts the Copilot drafts for you
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">How it works</h2>
          <ol className="space-y-2.5 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center">1</span>
              <span>The Copilot watches every client&apos;s health score and flags who&apos;s at risk — and why.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center">2</span>
              <span>It drafts a personalized SMS for each one, using the templates below.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center">3</span>
              <span>You tap once — your phone&apos;s SMS app opens with the message ready. You send it from your own number, so the relationship stays personal.</span>
            </li>
          </ol>
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
            No automated bot. No extra phone number. No third-party sending. Your clients hear from you, not from a robot.
          </p>
        </div>

        {/* Templates */}
        <div className="space-y-3">
          {COPILOT_TEMPLATES.map((tpl) => (
            <div key={tpl.signal} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-gray-900">{tpl.label}</h3>
                <span className="shrink-0 text-xs text-gray-400 font-mono">{tpl.signal}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                <span className="font-medium text-gray-600">Triggers when: </span>
                {tpl.trigger}
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{tpl.preview}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Custom templates are coming soon. For now, the Copilot uses these seven proven messages.
        </p>
      </div>
    </div>
  );
}
