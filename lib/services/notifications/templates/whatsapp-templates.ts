// WhatsApp Templates - SRP: Only template definitions
import type { NotificationData } from "../../interfaces";

type WhatsAppTemplate = (data: NotificationData) => string;

export const WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  booking_confirmation: (data) =>
    `✅ *Aula Confirmada!*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `📚 Aula: ${data.className}\n` +
    `📅 Data: ${data.date}\n` +
    `⏰ Horário: ${data.startTime} - ${data.endTime}\n` +
    `👩‍🏫 Instrutor(a): ${data.instructorName}\n\n` +
    `_Cancelamentos: até 12h antes para reembolso._`,

  booking_cancellation: (data) =>
    `❌ *Agendamento Cancelado*\n\n` +
    `Olá ${data.clientName},\n\n` +
    `📚 Aula: ${data.className}\n` +
    `📅 Data: ${data.date}\n` +
    `⏰ Horário: ${data.startTime}\n` +
    (data.reason ? `📝 Motivo: ${data.reason}\n\n` : "\n") +
    (data.creditRefunded
      ? "✅ Crédito devolvido."
      : "⚠️ Crédito não reembolsado (prazo expirado)."),

  booking_reminder: (data) =>
    `⏰ *Lembrete de Aula*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `Sua aula é *${data.timeUntil}*!\n\n` +
    `📚 ${data.className}\n` +
    `⏰ ${data.startTime} - ${data.endTime}\n` +
    `👩‍🏫 ${data.instructorName}\n\n` +
    `💧 Não esqueça sua garrafa de água!`,

  waitlist_spot_available: (data) =>
    `🎉 *Vaga Liberada!*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `Uma vaga foi liberada:\n` +
    `📚 ${data.className}\n` +
    `📅 ${data.date}\n` +
    `⏰ ${data.startTime}\n\n` +
    `⚠️ *Você tem 2 horas para confirmar!*\n\n` +
    `Confirme sua presença: ${data.confirmUrl}`,

  plan_expiring: (data) =>
    `⚠️ *Plano Expirando*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `Seu plano *${data.planName}* expira em *${data.daysUntilExpiry} dias*.\n\n` +
    `🎯 Aulas restantes: ${data.remainingClasses}\n\n` +
    `Renove agora: ${data.renewUrl}`,

  welcome: (data) =>
    `🎉 *Bem-vindo(a) ao ${data.studioName}!*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `É um prazer ter você conosco! 💜\n\n` +
    (data.planName
      ? `✅ Plano ativado: *${data.planName}* - ${data.totalClasses} aulas\n\n`
      : "") +
    `Acesse o portal para agendar: ${data.dashboardUrl}`,

  class_cancelled: (data) =>
    `⚠️ *Aula Cancelada*\n\n` +
    `Olá ${data.clientName},\n\n` +
    `A seguinte aula foi cancelada:\n` +
    `📚 ${data.className}\n` +
    `📅 ${data.date}\n` +
    `⏰ ${data.startTime}\n` +
    (data.reason ? `📝 ${data.reason}\n\n` : "\n") +
    `✅ Crédito devolvido automaticamente.\n\n` +
    `Agende outra aula: ${data.bookingUrl}`,

  payment_confirmation: (data) =>
    `✅ *Pagamento Confirmado!*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `📋 Plano: ${data.planName}\n` +
    `💰 Valor: ${data.amount}\n` +
    `🎯 Aulas: ${data.classesAdded}\n\n` +
    `Bora agendar! ${data.dashboardUrl}`,

  custom: (data) => data.message as string,
};
