// SMS Templates - SRP: Only template definitions
// SMS templates are concise due to character limits and cost per message
import type { NotificationData } from "../../interfaces";

type SMSTemplate = (data: NotificationData) => string;

export const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  booking_confirmation: (data) =>
    `Aula Confirmada!\n` +
    `${data.className}\n` +
    `${data.date} as ${data.startTime}\n` +
    `Instrutor: ${data.instructorName}\n` +
    `Cancelamentos ate 12h antes.`,

  booking_cancellation: (data) =>
    `Agendamento Cancelado\n` +
    `${data.className}\n` +
    `${data.date} - ${data.startTime}\n` +
    (data.reason ? `Motivo: ${data.reason}\n` : "") +
    (data.creditRefunded ? "Credito devolvido." : "Credito nao reembolsado."),

  booking_reminder: (data) =>
    `Lembrete: Sua aula e ${data.timeUntil}!\n` +
    `${data.className}\n` +
    `${data.startTime} - ${data.endTime}\n` +
    `Instrutor: ${data.instructorName}`,

  waitlist_spot_available: (data) =>
    `Vaga liberada!\n` +
    `${data.className}\n` +
    `${data.date} - ${data.startTime}\n` +
    `Voce tem 2h para confirmar!\n` +
    `${data.confirmUrl}`,

  plan_expiring: (data) =>
    `Seu plano ${data.planName} expira em ${data.daysUntilExpiry} dias.\n` +
    `Aulas restantes: ${data.remainingClasses}\n` +
    `Renove: ${data.renewUrl}`,

  welcome: (data) =>
    `Bem-vindo(a) ao ${data.studioName}!\n` +
    `Ola ${data.clientName}!\n` +
    (data.planName
      ? `Plano ativado: ${data.planName} - ${data.totalClasses} aulas\n`
      : "") +
    `Agende: ${data.dashboardUrl}`,

  class_cancelled: (data) =>
    `Aula Cancelada\n` +
    `${data.className}\n` +
    `${data.date} - ${data.startTime}\n` +
    (data.reason ? `${data.reason}\n` : "") +
    `Credito devolvido. Agende outra: ${data.bookingUrl}`,

  payment_confirmation: (data) =>
    `Pagamento Confirmado!\n` +
    `Plano: ${data.planName}\n` +
    `Valor: ${data.amount}\n` +
    `Aulas: ${data.classesAdded}\n` +
    `Agende: ${data.dashboardUrl}`,

  custom: (data) => data.message as string,
};
