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
  { id: "class_reminder", label: "Class reminder", description: "1h before class", enabled: true, timing: "1h before", group: "operations" },
  { id: "post_class_rating", label: "Post-class rating", description: "Quick 1–5 rating after each class", enabled: true, timing: "30min after", group: "operations" },
  { id: "weekly_nudge", label: "Booking nudge", description: "Suggest their usual slot if no booking this week", enabled: true, timing: "Wed", group: "retention" },
  { id: "streak_update", label: "Streak alerts", description: "Celebrate milestones, warn before streak breaks", enabled: true, group: "retention" },
  { id: "referral", label: "Referral reward", description: "Friend gets free trial, they get a bonus class", enabled: true, group: "retention" },
  { id: "low_credits", label: "Low credits", description: "Alert at 2 classes remaining", enabled: true, group: "revenue" },
  { id: "plan_upgrade", label: "Upgrade prompt", description: "Suggest upgrade when maxing out plan", enabled: false, group: "revenue" },
];

const PROACTIVE_GROUPS = [
  { key: "operations" as const, label: "Operations" },
  { key: "retention" as const, label: "Retention" },
  { key: "revenue" as const, label: "Revenue" },
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
              className="px-3 py-2 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50">
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t("webhookInstructions")}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="flex-1">{t("cancel")}</Button>
        <Button onClick={onSave} disabled={!isValid || saving} className="flex-1">
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-600 mt-1">{t("subtitle")}</p>
        </div>
        {isEnabled && (
          <Button onClick={handleSaveAll} disabled={savingAll}>
            {savingAll ? t("saving") : t("saveAll")}
          </Button>
        )}
      </div>

      {/* Connection status */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Connection</h3>
        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isEnabled ? "bg-emerald-500" : "bg-gray-300"}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">Twilio SMS</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {isEnabled ? t("twilioConfigured") : t("notConfigured")}
                </p>
              </div>
            </div>
            <Button
              variant={isEnabled ? "secondary" : "primary"}
              onClick={() => setShowConfigModal(true)}
            >
              {isEnabled ? t("configure") : t("enableSmsBot")}
            </Button>
          </div>

          {isEnabled && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">324</p>
                  <p className="text-sm text-gray-500 mt-1">{t("messagesThisMonth")}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">92%</p>
                  <p className="text-sm text-gray-500 mt-1">{t("responseRate")}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">47</p>
                  <p className="text-sm text-gray-500 mt-1">{t("botBookings")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings (only when connected) */}
      {isEnabled && (
        <>
          {/* Welcome message */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Welcome message</h3>
            <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs p-6">
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Hey {name}! I'm your FlexiWell assistant. Text me: BOOK, NEXT, CANCEL, or PLAN."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white"
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-2">{"{name} = name, {remaining} = classes left, {streak} = streak"}</p>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Keywords</h3>
            <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
              {commands.map((cmd) => (
                <div key={cmd.id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <code className={`px-2 py-1 rounded text-xs font-mono font-semibold min-w-[60px] text-center ${
                      cmd.enabled ? "bg-gray-100 text-gray-800" : "bg-gray-50 text-gray-400"
                    }`}>
                      {cmd.trigger}
                    </code>
                    <span className={`text-sm font-medium ${cmd.enabled ? "text-gray-900" : "text-gray-400"}`}>{cmd.label}</span>
                  </div>
                  <Toggle enabled={cmd.enabled} onChange={() => updateCommand(cmd.id, { enabled: !cmd.enabled })} />
                </div>
              ))}
              <div className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono font-semibold min-w-[60px] text-center">
                    MENU
                  </code>
                  <span className="text-sm font-medium text-gray-900">Show all commands</span>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Always on</span>
              </div>
            </div>
          </div>

          {/* Smart Booking */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Smart Booking</h3>
            <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
              {/* Instructor mode */}
              <div className="px-6 py-4">
                <p className="text-sm font-medium text-gray-900 mb-3">Instructor mode</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["flexible", "fixed"] as const).map((mode) => {
                    const selected = smartBooking.instructorMode === mode;
                    return (
                      <button key={mode} onClick={() => setSmartBooking({ ...smartBooking, instructorMode: mode })}
                        className={`py-3 px-3 rounded-lg border text-left transition-all ${
                          selected ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500" : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}>
                        <p className={`text-sm font-medium ${selected ? "text-primary-700" : "text-gray-700"}`}>
                          {mode === "flexible" ? "Flexible" : "Fixed"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {mode === "flexible" ? "Any available instructor" : "Always assigned instructor"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Suggest preferred slot first</p>
                  <p className="text-sm text-gray-600 mt-0.5">Learns their usual time</p>
                </div>
                <Toggle enabled={smartBooking.suggestPreferredFirst}
                  onChange={() => setSmartBooking({ ...smartBooking, suggestPreferredFirst: !smartBooking.suggestPreferredFirst })} />
              </div>

              {smartBooking.instructorMode === "flexible" && (
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Show alternatives when full</p>
                    <p className="text-sm text-gray-600 mt-0.5">Suggest another instructor</p>
                  </div>
                  <Toggle enabled={smartBooking.showAlternativesWhenUnavailable}
                    onChange={() => setSmartBooking({ ...smartBooking, showAlternativesWhenUnavailable: !smartBooking.showAlternativesWhenUnavailable })} />
                </div>
              )}
            </div>
          </div>

          {/* Proactive Messages */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Proactive messages</h3>
            <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
              {PROACTIVE_GROUPS.map((group) => {
                const items = proactiveMessages.filter((m) => m.group === group.key);
                if (items.length === 0) return null;
                return (
                  <div key={group.key}>
                    <div className="px-6 pt-4 pb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.label}</span>
                    </div>
                    {items.map((msg, i) => (
                      <div key={msg.id} className={`flex items-center justify-between px-6 py-3.5 ${i === items.length - 1 ? "" : ""}`}>
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${msg.enabled ? "text-gray-900" : "text-gray-400"}`}>{msg.label}</span>
                            {msg.timing && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${msg.enabled ? "text-gray-600 bg-gray-100" : "text-gray-400 bg-gray-50"}`}>{msg.timing}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{msg.description}</p>
                        </div>
                        <Toggle enabled={msg.enabled} onChange={() => toggleProactive(msg.id)} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Escalation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Escalation</h3>
            <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
              {/* Failed attempts */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Failed attempts before escalation</p>
                  <p className="text-sm text-gray-600 mt-0.5">How many unrecognized messages trigger handoff</p>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((n) => (
                    <button key={n} onClick={() => setEscalation({ ...escalation, maxFailedAttempts: n })}
                      className={`w-9 h-9 rounded-lg border text-sm font-semibold transition-all ${
                        escalation.maxFailedAttempts === n
                          ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Silence timeout */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Silence timeout</p>
                  <p className="text-sm text-gray-600 mt-0.5">Send &quot;still there?&quot; if client goes silent mid-flow</p>
                </div>
                <select
                  value={escalation.silenceTimeoutMinutes}
                  onChange={(e) => setEscalation({ ...escalation, silenceTimeoutMinutes: Number(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={0}>Disabled</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>

              {/* Notify admin */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Notify admin</p>
                  <p className="text-sm text-gray-600 mt-0.5">Alert studio when escalation triggers</p>
                </div>
                <Toggle enabled={escalation.notifyAdmin}
                  onChange={() => setEscalation({ ...escalation, notifyAdmin: !escalation.notifyAdmin })} />
              </div>

              {/* Fallback message */}
              <div className="px-6 py-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Fallback message</p>
                <textarea
                  value={escalation.fallbackMessage}
                  onChange={(e) => setEscalation({ ...escalation, fallbackMessage: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">{"{studio} = studio name"}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Twilio Config Modal */}
      <TwilioConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)}
        onSave={handleSaveConfig} config={twilioConfig} onConfigChange={setTwilioConfig}
        saving={saving} t={t} />
    </div>
  );
}
