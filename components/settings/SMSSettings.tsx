"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { showToast, Toggle } from "./shared";

interface SMSSettingsProps {
  onBack?: () => void;
}

interface SMSPackage {
  id: string;
  credits: number;
  price: string;
  priceBrl: string;
  popular?: boolean;
}

const smsPackages: SMSPackage[] = [
  { id: "pack-250", credits: 250, price: "$15", priceBrl: "R$39" },
  { id: "pack-500", credits: 500, price: "$25", priceBrl: "R$69", popular: true },
  { id: "pack-1000", credits: 1000, price: "$45", priceBrl: "R$119" },
  { id: "pack-2500", credits: 2500, price: "$99", priceBrl: "R$259" },
];

interface SMSHistory {
  id: string;
  type: "reminder" | "campaign" | "confirmation";
  recipient: string;
  message: string;
  sentAt: string;
  status: "delivered" | "failed" | "pending";
}

const mockHistory: SMSHistory[] = [
  {
    id: "1",
    type: "reminder",
    recipient: "+55 11 99999-1234",
    message: "Lembrete: Sua aula de Pilates amanha as 10h",
    sentAt: "2026-01-15T09:30:00",
    status: "delivered",
  },
  {
    id: "2",
    type: "confirmation",
    recipient: "+55 11 99999-5678",
    message: "Reserva confirmada: Yoga - 16/01 as 14h",
    sentAt: "2026-01-15T08:15:00",
    status: "delivered",
  },
  {
    id: "3",
    type: "campaign",
    recipient: "+55 11 99999-9012",
    message: "Promocao de Janeiro! 20% off em pacotes",
    sentAt: "2026-01-14T16:00:00",
    status: "delivered",
  },
  {
    id: "4",
    type: "reminder",
    recipient: "+55 11 99999-3456",
    message: "Lembrete: Sua aula de Funcional amanha as 8h",
    sentAt: "2026-01-14T10:00:00",
    status: "failed",
  },
];

export function SMSSettings({ onBack }: SMSSettingsProps) {
  const [credits, setCredits] = useState(347);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [settings, setSettings] = useState({
    classReminders: true,
    reminderHours: 24,
    confirmationSms: true,
    cancellationSms: true,
    marketingEnabled: false,
  });

  const isBrazil = typeof navigator !== 'undefined' && navigator.language?.startsWith('pt');

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setPurchasing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const pkg = smsPackages.find(p => p.id === selectedPackage);
    if (pkg) {
      setCredits(prev => prev + pkg.credits);
      showToast(isBrazil
        ? `${pkg.credits} creditos adicionados com sucesso!`
        : `${pkg.credits} credits added successfully!`
      );
    }

    setPurchasing(false);
    setShowPurchaseModal(false);
    setSelectedPackage(null);
  };

  const getTypeLabel = (type: SMSHistory["type"]) => {
    const labels = {
      reminder: isBrazil ? "Lembrete" : "Reminder",
      campaign: isBrazil ? "Campanha" : "Campaign",
      confirmation: isBrazil ? "Confirmacao" : "Confirmation",
    };
    return labels[type];
  };

  const getTypeBadgeClass = (type: SMSHistory["type"]) => {
    const classes = {
      reminder: "bg-blue-100 text-blue-700",
      campaign: "bg-purple-100 text-purple-700",
      confirmation: "bg-green-100 text-green-700",
    };
    return classes[type];
  };

  const getStatusBadge = (status: SMSHistory["status"]) => {
    const badges = {
      delivered: { class: "bg-green-100 text-green-700", label: isBrazil ? "Entregue" : "Delivered" },
      failed: { class: "bg-red-100 text-red-700", label: isBrazil ? "Falhou" : "Failed" },
      pending: { class: "bg-yellow-100 text-yellow-700", label: isBrazil ? "Pendente" : "Pending" },
    };
    return badges[status];
  };

  return (
    <div className="space-y-6">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isBrazil ? "Voltar para Add-ons" : "Back to Add-ons"}
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-900">
          {isBrazil ? "Creditos SMS" : "SMS Credits"}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isBrazil
            ? "Gerencie seus creditos SMS para notificacoes e campanhas."
            : "Manage your SMS credits for notifications and campaigns."}
        </p>
      </div>

      {/* Credits Balance Card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">
              {isBrazil ? "Saldo Atual" : "Current Balance"}
            </p>
            <p className="text-4xl font-bold mt-1">{credits.toLocaleString()}</p>
            <p className="text-purple-200 text-sm mt-1">
              {isBrazil ? "creditos disponiveis" : "credits available"}
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
            </svg>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <Button
            variant="secondary"
            onClick={() => setShowPurchaseModal(true)}
            className="bg-white text-purple-700 hover:bg-purple-50"
          >
            {isBrazil ? "Comprar Creditos" : "Buy Credits"}
          </Button>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">156</p>
          <p className="text-xs text-gray-500 mt-1">
            {isBrazil ? "Enviados este mes" : "Sent this month"}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">98%</p>
          <p className="text-xs text-gray-500 mt-1">
            {isBrazil ? "Taxa de entrega" : "Delivery rate"}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">42</p>
          <p className="text-xs text-gray-500 mt-1">
            {isBrazil ? "Lembretes hoje" : "Reminders today"}
          </p>
        </div>
      </div>

      {/* SMS Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {isBrazil ? "Configuracoes de SMS" : "SMS Settings"}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isBrazil ? "Lembretes de Aula" : "Class Reminders"}
              </p>
              <p className="text-xs text-gray-500">
                {isBrazil
                  ? "Enviar lembrete automatico antes das aulas"
                  : "Send automatic reminder before classes"}
              </p>
            </div>
            <Toggle
              enabled={settings.classReminders}
              onChange={() => setSettings(s => ({ ...s, classReminders: !s.classReminders }))}
            />
          </div>

          {settings.classReminders && (
            <div className="flex items-center justify-between py-3 border-b border-gray-100 pl-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isBrazil ? "Horas de antecedencia" : "Hours before"}
                </p>
              </div>
              <select
                value={settings.reminderHours}
                onChange={(e) => setSettings(s => ({ ...s, reminderHours: Number(e.target.value) }))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value={2}>2 {isBrazil ? "horas" : "hours"}</option>
                <option value={6}>6 {isBrazil ? "horas" : "hours"}</option>
                <option value={12}>12 {isBrazil ? "horas" : "hours"}</option>
                <option value={24}>24 {isBrazil ? "horas" : "hours"}</option>
                <option value={48}>48 {isBrazil ? "horas" : "hours"}</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isBrazil ? "Confirmacao de Reserva" : "Booking Confirmation"}
              </p>
              <p className="text-xs text-gray-500">
                {isBrazil
                  ? "SMS quando cliente reserva uma aula"
                  : "SMS when client books a class"}
              </p>
            </div>
            <Toggle
              enabled={settings.confirmationSms}
              onChange={() => setSettings(s => ({ ...s, confirmationSms: !s.confirmationSms }))}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isBrazil ? "Aviso de Cancelamento" : "Cancellation Notice"}
              </p>
              <p className="text-xs text-gray-500">
                {isBrazil
                  ? "SMS quando uma aula e cancelada"
                  : "SMS when a class is cancelled"}
              </p>
            </div>
            <Toggle
              enabled={settings.cancellationSms}
              onChange={() => setSettings(s => ({ ...s, cancellationSms: !s.cancellationSms }))}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isBrazil ? "Campanhas de Marketing" : "Marketing Campaigns"}
              </p>
              <p className="text-xs text-gray-500">
                {isBrazil
                  ? "Permitir envio de SMS promocionais"
                  : "Allow sending promotional SMS"}
              </p>
            </div>
            <Toggle
              enabled={settings.marketingEnabled}
              onChange={() => setSettings(s => ({ ...s, marketingEnabled: !s.marketingEnabled }))}
            />
          </div>
        </div>
      </div>

      {/* Recent SMS History */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            {isBrazil ? "Historico Recente" : "Recent History"}
          </h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            {isBrazil ? "Ver tudo" : "View all"}
          </button>
        </div>
        <div className="space-y-3">
          {mockHistory.map((sms) => {
            const statusBadge = getStatusBadge(sms.status);
            return (
              <div key={sms.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadgeClass(sms.type)}`}>
                      {getTypeLabel(sms.type)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.class}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 truncate">{sms.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{sms.recipient}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {new Date(sms.sentAt).toLocaleString(isBrazil ? 'pt-BR' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isBrazil ? "Comprar Creditos SMS" : "Buy SMS Credits"}
                  </h3>
                </div>
                <button onClick={() => setShowPurchaseModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                {isBrazil
                  ? "Selecione um pacote de creditos. Os creditos nao expiram."
                  : "Select a credit package. Credits never expire."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {smsPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded-full">
                        Popular
                      </span>
                    )}
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{pkg.credits.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {isBrazil ? "creditos" : "credits"}
                      </p>
                      <p className="text-lg font-semibold text-purple-600 mt-2">
                        {isBrazil ? pkg.priceBrl : pkg.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {isBrazil ? "Cancelar" : "Cancel"}
              </button>
              <button
                onClick={handlePurchase}
                disabled={!selectedPackage || purchasing}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {purchasing
                  ? (isBrazil ? "Processando..." : "Processing...")
                  : (isBrazil ? "Comprar" : "Purchase")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}