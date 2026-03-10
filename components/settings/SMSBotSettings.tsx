"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Toggle } from "@/components/ui/Toggle";
import { useLocale } from "@/hooks/useLocale";
import { showToast } from "./shared";
import { authFetch } from "@/lib/api/auth-fetch";
import type { BotMenuCommand } from "@/lib/db/schemas";

// ============================================================================
// Types
// ============================================================================

interface SMSBotSettingsProps {
  onBack?: () => void;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface SmartBookingConfig {
  instructorMode: "flexible" | "fixed";
  suggestPreferredFirst: boolean;
  showAlternativesWhenUnavailable: boolean;
}

interface ProactiveMessage {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  timing?: string;
  group: "operations" | "retention" | "revenue";
}

interface EscalationConfig {
  maxFailedAttempts: number;
  silenceTimeoutMinutes: number;
  notifyAdmin: boolean;
  fallbackMessage: string;
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_TWILIO_CONFIG: TwilioConfig = {
  accountSid: "",
  authToken: "",
  phoneNumber: "",
};

const INITIAL_SMART_BOOKING: SmartBookingConfig = {
  instructorMode: "flexible",
  suggestPreferredFirst: true,
  showAlternativesWhenUnavailable: true,
};

const INITIAL_ESCALATION: EscalationConfig = {
  maxFailedAttempts: 2,
  silenceTimeoutMinutes: 10,
  notifyAdmin: true,
  fallbackMessage: "I didn't quite get that. Let me connect you with {studio} — they'll help right away.",
};

const DEFAULT_COMMANDS: BotMenuCommand[] = [
  { id: "1", trigger: "BOOK", label: "Book a class", action: "BOOK_CLASS", enabled: true, order: 1 },
  { id: "2", trigger: "NEXT", label: "Next class", action: "MY_BOOKINGS", enabled: true, order: 2 },
  { id: "3", trigger: "CANCEL", label: "Cancel a booking", action: "CANCEL_BOOKING", enabled: true, order: 3 },
  { id: "4", trigger: "PLAN", label: "My plan", action: "REMAINING_CREDITS", enabled: true, order: 4 },
  { id: "5", trigger: "SCHEDULE", label: "See schedule", action: "VIEW_CLASSES", enabled: true, order: 5 },
];

const DEFAULT_PROACTIVE_MESSAGES: ProactiveMessage[] = [
  // Operations
  { id: "class_reminder", label: "Class reminder", description: "1h before class", enabled: true, timing: "1h before", group: "operations" },
  { id: "post_class_rating", label: "Post-class rating", description: "Quick 1–5 rating after each class", enabled: true, timing: "30min after", group: "operations" },
  // Retention
  { id: "weekly_nudge", label: "Booking nudge", description: "Suggest their usual slot if no booking this week", enabled: true, timing: "Wed", group: "retention" },
  { id: "streak_update", label: "Streak alerts", description: "Celebrate milestones, warn before streak breaks", enabled: true, group: "retention" },
  { id: "referral", label: "Referral reward", description: "Friend gets free trial, they get a bonus class", enabled: true, group: "retention" },
  // Revenue
  { id: "low_credits", label: "Low credits", description: "Alert at 2 classes remaining", enabled: true, group: "revenue" },
  { id: "plan_upgrade", label: "Upgrade prompt", description: "Suggest upgrade when maxing out plan", enabled: false, group: "revenue" },
];

const PROACTIVE_GROUPS = [
  { key: "operations" as const, label: "Operations", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "retention" as const, label: "Retention", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { key: "revenue" as const, label: "Revenue", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

// ============================================================================
// Translations
// ============================================================================

const T = {
  title: { "pt-BR": "SMS AI Bot", "en-US": "SMS AI Bot" },
  subtitle: {
    "pt-BR": "Assistente pessoal de wellness por SMS. Proativo, conversacional, sem app.",
    "en-US": "Personal wellness assistant via SMS. Proactive, conversational, no app needed.",
  },
  active: { "pt-BR": "Ativo", "en-US": "Active" },
  twilioConfigured: { "pt-BR": "Twilio conectado", "en-US": "Twilio connected" },
  notConfigured: { "pt-BR": "Não configurado", "en-US": "Not configured" },
  configure: { "pt-BR": "Configurar", "en-US": "Configure" },
  enableSmsBot: { "pt-BR": "Conectar Twilio", "en-US": "Connect Twilio" },
  messagesThisMonth: { "pt-BR": "Mensagens", "en-US": "Messages" },
  responseRate: { "pt-BR": "Resposta", "en-US": "Response" },
  botBookings: { "pt-BR": "Reservas", "en-US": "Bookings" },
  configureTwilio: { "pt-BR": "Conectar Twilio SMS", "en-US": "Connect Twilio SMS" },
  twilioAccountNeeded: {
    "pt-BR": "Para usar o SMS Bot, você precisa de uma conta Twilio.",
    "en-US": "To use SMS Bot, you need a Twilio account.",
  },
  createFreeAccount: { "pt-BR": "Criar conta gratuita", "en-US": "Create free account" },
  foundInTwilio: { "pt-BR": "Encontrado no Console Twilio", "en-US": "Found in Twilio Console" },
  smsPhoneNumber: { "pt-BR": "Número SMS", "en-US": "SMS Phone Number" },
  smsEnabledNumber: { "pt-BR": "Número com SMS habilitado no Twilio", "en-US": "SMS-enabled number from Twilio" },
  webhookUrl: { "pt-BR": "Webhook URL", "en-US": "Webhook URL" },
  webhookInstructions: {
    "pt-BR": "Configure esta URL no Console Twilio → Phone Numbers → Seu Número → Messaging",
    "en-US": "Configure this URL in Twilio Console → Phone Numbers → Your Number → Messaging",
  },
  cancel: { "pt-BR": "Cancelar", "en-US": "Cancel" },
  saveAndEnable: { "pt-BR": "Salvar e Conectar", "en-US": "Save and Connect" },
  saving: { "pt-BR": "Salvando...", "en-US": "Saving..." },
  allFieldsRequired: { "pt-BR": "Todos os campos são obrigatórios", "en-US": "All fields are required" },
  connectedSuccess: { "pt-BR": "SMS Bot conectado com sucesso", "en-US": "SMS Bot connected successfully" },
  failedToSave: { "pt-BR": "Falha ao salvar", "en-US": "Failed to save" },
  savedSuccess: { "pt-BR": "Salvo com sucesso", "en-US": "Saved successfully" },
  saveAll: { "pt-BR": "Salvar configurações", "en-US": "Save settings" },
} as const;

type TKey = keyof typeof T;

function useT() {
  const { isBrazil } = useLocale();
  const lang = isBrazil ? "pt-BR" : "en-US";
  const t = (key: TKey): string => {
    const tr = T[key];
    if (typeof tr === "object" && lang in tr) return tr[lang as keyof typeof tr];
    return key;
  };
  return { t };
}

// ============================================================================
// Chat Bubble
// ============================================================================

function Bubble({ from, children }: { from: "bot" | "client"; children: React.ReactNode }) {
  const isBot = from === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div className={`text-[13px] leading-relaxed px-3 py-2 rounded-2xl max-w-[85%] whitespace-pre-line ${
        isBot ? "bg-gray-200 text-gray-900 rounded-bl-sm" : "bg-purple-600 text-white rounded-br-sm"
      }`}>
        {children}
      </div>
    </div>
  );
}

function TimeLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500 text-center py-1">{children}</p>;
}

// ============================================================================
// Live Preview (right column, sticky)
// ============================================================================

function LivePreview({
  welcomeMessage,
  commands,
  smartBooking,
  escalation,
}: {
  welcomeMessage: string;
  commands: BotMenuCommand[];
  smartBooking: SmartBookingConfig;
  escalation: EscalationConfig;
}) {
  const [tab, setTab] = useState<"booking" | "proactive" | "escalation">("booking");
  const enabled = commands.filter((c) => c.enabled);
  const keywords = enabled.map((c) => c.trigger).join(", ");
  const welcome = welcomeMessage || `Hey {name}! I'm your FlexiWell assistant.\n\nText me: ${keywords}, or MENU.`;

  return (
    <div className="sticky top-6">
      {/* Tab switcher */}
      <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-0.5">
        {(["booking", "proactive", "escalation"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "booking" ? "Booking" : t === "proactive" ? "Proactive" : "Escalation"}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="border-2 border-gray-300 rounded-[24px] overflow-hidden bg-white shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
            <span className="text-[9px] font-bold text-white">FW</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-tight">FlexiWell</p>
            <p className="text-[9px] text-white/60 leading-tight">SMS</p>
          </div>
        </div>

        {/* Messages */}
        <div className="px-3 py-3 space-y-2 h-[440px] overflow-y-auto">
          {tab === "booking" ? (
            <>
              <Bubble from="bot">{welcome.replace("{name}", "Sarah").replace("{remaining}", "6").replace("{streak}", "4")}</Bubble>
              <Bubble from="client">BOOK</Bubble>

              {smartBooking.suggestPreferredFirst && (
                <>
                  <Bubble from="bot">{"Your usual slot is open:\n\nPilates with Ana — Tue 9:00am\n\n1. Book this\n2. See other times"}</Bubble>
                  <Bubble from="client">2</Bubble>
                </>
              )}
              <Bubble from="bot">
                {smartBooking.instructorMode === "flexible"
                  ? "Available this week:\n\n1. Pilates — Tue 9am (Ana)\n2. Yoga Flow — Wed 6pm (Mike)\n3. Pilates — Thu 9am (Sarah)\n4. Stretch — Fri 5:30pm (Ana)\n\nReply with a number."
                  : "With Ana this week:\n\n1. Pilates — Tue 9am\n2. Pilates — Thu 9am\n3. Stretch — Fri 5:30pm\n\nReply with a number."}
              </Bubble>
              <Bubble from="client">1</Bubble>
              <Bubble from="bot">{"Done! Pilates with Ana, Tue 9am.\n\nI'll remind you 1h before."}</Bubble>
              <TimeLabel>Later...</TimeLabel>
              <Bubble from="client">NEXT</Bubble>
              <Bubble from="bot">{"Your next class:\n\nPilates with Ana\nTue, Mar 11 at 9:00am\n\nReply CANCEL to change plans."}</Bubble>
            </>
          ) : tab === "proactive" ? (
            <>
              <TimeLabel>Tuesday 8:00am</TimeLabel>
              <Bubble from="bot">{"Reminder: Pilates with Ana in 1 hour (9am).\n\nCan't make it? Reply CANCEL."}</Bubble>
              <TimeLabel>Tuesday 10:00am</TimeLabel>
              <Bubble from="bot">{"How was Pilates today?\nReply 1–5 (5 = amazing)"}</Bubble>
              <Bubble from="client">5</Bubble>
              <Bubble from="bot">{"Awesome! Feedback shared with Ana."}</Bubble>
              <TimeLabel>Friday</TimeLabel>
              <Bubble from="bot">{"4-week streak! You're on fire.\n\nShare FlexiWell with a friend — they get a free trial, you get a bonus class.\n\nflexiwell.com/r/sarah-m"}</Bubble>
              <TimeLabel>Next Wednesday</TimeLabel>
              <Bubble from="bot">{"Hey Sarah, no booking this week yet. Your streak is on the line!\n\n1. Book my usual (Tue 9am)\n2. See other times\n3. Skip this week"}</Bubble>
              <Bubble from="client">1</Bubble>
              <Bubble from="bot">{"Booked! Tue 9am with Ana. Streak safe."}</Bubble>
              <TimeLabel>2 weeks later</TimeLabel>
              <Bubble from="bot">{"Heads up — 2 classes left on Monthly.\nRenews Mar 15.\n\nUpgrade to Quarterly and save 20%?\nReply YES to learn more."}</Bubble>
            </>
          ) : (
            <>
              <Bubble from="bot">{welcome.replace("{name}", "Sarah").replace("{remaining}", "6").replace("{streak}", "4")}</Bubble>
              <Bubble from="client">heyy whats up lol</Bubble>
              <Bubble from="bot">{"Hey Sarah! I didn't catch that.\n\nTry: BOOK, NEXT, CANCEL, PLAN, or MENU."}</Bubble>
              <Bubble from="client">idk how this works</Bubble>
              <Bubble from="bot">{escalation.fallbackMessage.replace("{studio}", "FlexiWell Studio")}</Bubble>
              <TimeLabel>Admin notified{escalation.notifyAdmin ? "" : " (off)"}</TimeLabel>
              {escalation.silenceTimeoutMinutes > 0 && (
                <>
                  <TimeLabel>{escalation.silenceTimeoutMinutes} min of silence...</TimeLabel>
                  <Bubble from="bot">{"Still there, Sarah? Reply MENU if you need help, or we'll follow up soon."}</Bubble>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Twilio Config Modal
// ============================================================================

function TwilioConfigModal({
  isOpen, onClose, onSave, config, onConfigChange, saving, t,
}: {
  isOpen: boolean; onClose: () => void; onSave: () => void;
  config: TwilioConfig; onConfigChange: (c: TwilioConfig) => void;
  saving: boolean; t: (key: TKey) => string;
}) {
  const isValid = config.accountSid && config.authToken && config.phoneNumber;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <ModalTitle>{t("configureTwilio")}</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {t("twilioAccountNeeded")}
            <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="font-medium underline ml-1">
              {t("createFreeAccount")}
            </a>
          </p>
        </div>
        <FormField label="Account SID" value={config.accountSid}
          onChange={(e) => onConfigChange({ ...config, accountSid: e.target.value })}
          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" hint={t("foundInTwilio")} />
        <FormField label="Auth Token" type="password" value={config.authToken}
          onChange={(e) => onConfigChange({ ...config, authToken: e.target.value })}
          placeholder="••••••••••••••••••••••••••••••••" />
        <FormField label={t("smsPhoneNumber")} value={config.phoneNumber}
          onChange={(e) => onConfigChange({ ...config, phoneNumber: e.target.value })}
          placeholder="+15551234567" hint={t("smsEnabledNumber")} />
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">{t("webhookUrl")}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-600 overflow-x-auto">
              {typeof window !== "undefined" ? `${window.location.origin}/api/webhook/sms` : "https://your-domain.com/api/webhook/sms"}
            </code>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/webhook/sms`); showToast("Copied!"); }}
              className="px-3 py-2 text-xs font-medium text-purple-600 border border-purple-200 rounded hover:bg-purple-50">
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t("webhookInstructions")}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="flex-1">{t("cancel")}</Button>
        <Button onClick={onSave} disabled={!isValid || saving} className="flex-1 bg-purple-600 hover:bg-purple-700">
          {saving ? t("saving") : t("saveAndEnable")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SMSBotSettings({ onBack }: SMSBotSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>(INITIAL_TWILIO_CONFIG);
  const [commands, setCommands] = useState<BotMenuCommand[]>(DEFAULT_COMMANDS);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [smartBooking, setSmartBooking] = useState<SmartBookingConfig>(INITIAL_SMART_BOOKING);
  const [proactiveMessages, setProactiveMessages] = useState<ProactiveMessage[]>(DEFAULT_PROACTIVE_MESSAGES);
  const [escalation, setEscalation] = useState<EscalationConfig>(INITIAL_ESCALATION);

  const { t } = useT();

  const updateCommand = (id: string, updates: Partial<BotMenuCommand>) => {
    setCommands(commands.map((cmd) => (cmd.id === id ? { ...cmd, ...updates } : cmd)));
  };

  const toggleProactive = (id: string) => {
    setProactiveMessages(proactiveMessages.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
  };

  // Load config on mount
  useEffect(() => {
    async function load() {
      try {
        const [statusRes, commandsRes] = await Promise.all([
          authFetch("/api/admin/sms/status"),
          authFetch("/api/admin/sms/commands"),
        ]);
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.connected) setIsEnabled(true);
        }
        if (commandsRes.ok) {
          const data = await commandsRes.json();
          if (data.commands?.length) setCommands(data.commands);
          if (data.welcomeMessage) setWelcomeMessage(data.welcomeMessage);
          if (data.smartBooking) setSmartBooking(data.smartBooking);
          if (data.proactiveMessages) setProactiveMessages(data.proactiveMessages);
          if (data.escalation) setEscalation(data.escalation);
        }
      } catch (error) {
        console.error("Failed to load SMS config:", error);
      }
    }
    load();
  }, []);

  const handleSaveConfig = async () => {
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.phoneNumber) {
      showToast(t("allFieldsRequired"), "error"); return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/sms/configure", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(twilioConfig),
      });
      if (res.ok) { showToast(t("connectedSuccess")); setShowConfigModal(false); setIsEnabled(true); }
      else { const data = await res.json(); showToast(data.error || t("failedToSave"), "error"); }
    } catch { showToast(t("failedToSave"), "error"); }
    finally { setSaving(false); }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      const res = await authFetch("/api/admin/sms/commands", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands, welcomeMessage, smartBooking, proactiveMessages, escalation }),
      });
      if (res.ok) showToast(t("savedSuccess"));
      else showToast(t("failedToSave"), "error");
    } catch { showToast(t("failedToSave"), "error"); }
    finally { setSavingAll(false); }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Connection + Metrics */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 mb-6 text-white shadow-lg shadow-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white/30 ${isEnabled ? "bg-green-400" : "bg-white/40"}`} />
            <span className="text-sm text-white/90">{isEnabled ? t("twilioConfigured") : t("notConfigured")}</span>
          </div>
          {isEnabled ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur">{t("active")}</span>
              <button onClick={() => setShowConfigModal(true)} className="text-xs text-white/70 hover:text-white underline">{t("configure")}</button>
            </div>
          ) : (
            <Button onClick={() => setShowConfigModal(true)} className="text-sm bg-white text-purple-700 hover:bg-purple-50">{t("enableSmsBot")}</Button>
          )}
        </div>
        {isEnabled && (
          <div className="flex items-center gap-8 mt-4 pt-4 border-t border-white/20">
            <div><p className="text-2xl font-bold">324</p><p className="text-xs text-white/70 uppercase tracking-wide">{t("messagesThisMonth")}</p></div>
            <div><p className="text-2xl font-bold">92%</p><p className="text-xs text-white/70 uppercase tracking-wide">{t("responseRate")}</p></div>
            <div><p className="text-2xl font-bold">47</p><p className="text-xs text-white/70 uppercase tracking-wide">{t("botBookings")}</p></div>
          </div>
        )}
      </div>

      {/* Settings (only when connected) */}
      {isEnabled && (
        <div className="space-y-5">

          {/* ─── Conversation + Live Preview side by side ─── */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Conversation</h3>
                  <p className="text-xs text-gray-600">Natural keywords — no robotic menus. Preview updates live.</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
                {/* LEFT: Keywords editor */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Welcome message</label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Hey {name}! I'm your FlexiWell assistant. Text me: BOOK, NEXT, CANCEL, or PLAN."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none mb-1 bg-white"
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mb-5">{"{name} = name, {remaining} = classes left, {streak} = streak"}</p>

                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Keywords</label>
                  <div className="space-y-1.5">
                    {commands.map((cmd) => (
                      <div key={cmd.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg border transition-all ${cmd.enabled ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-50"}`}>
                        <code className={`px-2 py-1 rounded-md text-xs font-mono font-bold min-w-[68px] text-center ${cmd.enabled ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                          {cmd.trigger}
                        </code>
                        <span className={`flex-1 text-sm font-medium ${cmd.enabled ? "text-gray-800" : "text-gray-400"}`}>{cmd.label}</span>
                        <Toggle enabled={cmd.enabled} onChange={() => updateCommand(cmd.id, { enabled: !cmd.enabled })} />
                      </div>
                    ))}
                    <div className="flex items-center gap-3 py-2 px-3 rounded-lg border border-purple-200 bg-purple-50">
                      <code className="px-2 py-1 bg-purple-600 text-white rounded-md text-xs font-mono font-bold min-w-[68px] text-center">
                        MENU
                      </code>
                      <span className="flex-1 text-sm font-medium text-purple-800">Show all commands</span>
                      <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Always on</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Phone preview (inline) */}
                <div className="hidden lg:block">
                  <LivePreview welcomeMessage={welcomeMessage} commands={commands} smartBooking={smartBooking} escalation={escalation} />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Smart Booking + Proactive side by side ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Smart Booking */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Smart Booking</h3>
                  <p className="text-xs text-gray-600">Knows their instructor and suggests their usual slot.</p>
                </div>
              </div>

              <div className="p-5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Instructor mode</label>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {(["flexible", "fixed"] as const).map((mode) => {
                    const selected = smartBooking.instructorMode === mode;
                    return (
                      <button key={mode} onClick={() => setSmartBooking({ ...smartBooking, instructorMode: mode })}
                        className={`py-3 px-3 rounded-lg border-2 text-left transition-all ${selected ? "border-purple-500 bg-purple-50 shadow-sm" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                        <p className={`text-sm font-semibold ${selected ? "text-purple-700" : "text-gray-600"}`}>
                          {mode === "flexible" ? "Flexible" : "Fixed"}
                        </p>
                        <p className={`text-xs mt-0.5 leading-snug ${selected ? "text-purple-600" : "text-gray-500"}`}>
                          {mode === "flexible" ? "Any available instructor" : "Always assigned instructor"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1 border-t border-gray-100 pt-4">
                  <label className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Suggest preferred slot first</p>
                      <p className="text-xs text-gray-500">Learns their usual time</p>
                    </div>
                    <Toggle enabled={smartBooking.suggestPreferredFirst}
                      onChange={() => setSmartBooking({ ...smartBooking, suggestPreferredFirst: !smartBooking.suggestPreferredFirst })} />
                  </label>
                  {smartBooking.instructorMode === "flexible" && (
                    <label className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Show alternatives when full</p>
                        <p className="text-xs text-gray-500">Suggest another instructor</p>
                      </div>
                      <Toggle enabled={smartBooking.showAlternativesWhenUnavailable}
                        onChange={() => setSmartBooking({ ...smartBooking, showAlternativesWhenUnavailable: !smartBooking.showAlternativesWhenUnavailable })} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Proactive Messages */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Proactive Messages</h3>
                  <p className="text-xs text-gray-600">The bot reaches out — no competitor does this.</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {PROACTIVE_GROUPS.map((group) => {
                  const items = proactiveMessages.filter((m) => m.group === group.key);
                  if (items.length === 0) return null;
                  const colorMap = { operations: "blue", retention: "rose", revenue: "emerald" } as const;
                  const color = colorMap[group.key];
                  return (
                    <div key={group.key}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${color === "blue" ? "bg-blue-400" : color === "rose" ? "bg-rose-400" : "bg-emerald-400"}`} />
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{group.label}</span>
                      </div>
                      <div className="space-y-0.5">
                        {items.map((msg) => (
                          <div key={msg.id} className={`flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors ${msg.enabled ? "hover:bg-gray-50" : "opacity-40"}`}>
                            <div className="flex-1 min-w-0 mr-3">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${msg.enabled ? "text-gray-800" : "text-gray-400"}`}>{msg.label}</span>
                                {msg.timing && (
                                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${msg.enabled ? "text-purple-600 bg-purple-50" : "text-gray-400 bg-gray-100"}`}>{msg.timing}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{msg.description}</p>
                            </div>
                            <Toggle enabled={msg.enabled} onChange={() => toggleProactive(msg.id)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Escalation / Fallback ─── */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Escalation</h3>
                <p className="text-xs text-gray-600">When the bot can&apos;t help, hand off to a human — fast.</p>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr] gap-6">
                {/* Left: settings */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Failed attempts before escalation</label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3].map((n) => (
                        <button key={n} onClick={() => setEscalation({ ...escalation, maxFailedAttempts: n })}
                          className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all ${escalation.maxFailedAttempts === n ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Silence timeout</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={escalation.silenceTimeoutMinutes}
                        onChange={(e) => setEscalation({ ...escalation, silenceTimeoutMinutes: Number(e.target.value) })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value={0}>Disabled</option>
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                      </select>
                      <span className="text-xs text-gray-500">Send &quot;still there?&quot; if client goes silent mid-flow</span>
                    </div>
                  </div>

                  <label className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Notify admin</p>
                      <p className="text-xs text-gray-500">Alert studio when escalation triggers</p>
                    </div>
                    <Toggle enabled={escalation.notifyAdmin}
                      onChange={() => setEscalation({ ...escalation, notifyAdmin: !escalation.notifyAdmin })} />
                  </label>
                </div>

                {/* Right: fallback message */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Fallback message</label>
                  <textarea
                    value={escalation.fallbackMessage}
                    onChange={(e) => setEscalation({ ...escalation, fallbackMessage: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">{"{studio} = studio name"}</p>

                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-xs font-semibold text-red-700 mb-1">How it works</p>
                    <ol className="text-xs text-red-600 space-y-0.5 list-decimal list-inside">
                      <li>Client sends {escalation.maxFailedAttempts} unrecognized message{escalation.maxFailedAttempts > 1 ? "s" : ""}</li>
                      <li>Bot sends the fallback message above</li>
                      {escalation.notifyAdmin && <li>Admin gets notified instantly</li>}
                      {escalation.silenceTimeoutMinutes > 0 && <li>If silent for {escalation.silenceTimeoutMinutes}min, bot sends &quot;still there?&quot;</li>}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <Button onClick={handleSaveAll} disabled={savingAll} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-sm font-semibold shadow-lg shadow-purple-200 rounded-xl">
            {savingAll ? t("saving") : t("saveAll")}
          </Button>
        </div>
      )}

      {/* Twilio Config Modal */}
      <TwilioConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)}
        onSave={handleSaveConfig} config={twilioConfig} onConfigChange={setTwilioConfig}
        saving={saving} t={t} />
    </div>
  );
}
