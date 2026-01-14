// Notification Service - Email (Resend) and WhatsApp (Twilio/Cloud API) notifications
import { Resend } from "resend";
import { getDatabase } from "@/lib/db/mongodb";
import { getWhatsAppCredentials } from "@/lib/integrations/credentials";
import type { TwilioCredentials, CloudApiCredentials } from "@/lib/whatsapp/types";
import { formatPhoneForWhatsApp } from "@/lib/utils/phone";
import { formatDateBR } from "@/lib/utils/date";
import type { Client, Booking, Class } from "@/lib/db/schemas";

// ============================================
// Types
// ============================================

export type NotificationChannel = "email" | "whatsapp" | "both";
export type NotificationType =
  | "booking_confirmation"
  | "booking_cancellation"
  | "booking_reminder"
  | "waitlist_spot_available"
  | "plan_expiring"
  | "plan_expired"
  | "payment_confirmation"
  | "payment_failed"
  | "welcome"
  | "class_cancelled"
  | "class_rescheduled"
  | "custom";

interface NotificationResult {
  success: boolean;
  emailSent?: boolean;
  whatsappSent?: boolean;
  error?: string;
}

interface NotificationPayload {
  type: NotificationType;
  clientId: string;
  data: Record<string, unknown>;
  channels?: NotificationChannel;
}

interface NotificationRecord {
  _id?: string;
  type: NotificationType;
  channel: "email" | "whatsapp";
  clientId: string;
  clientName: string;
  recipient: string; // email or phone
  subject?: string;
  content: string;
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

// ============================================
// Email Templates
// ============================================

const EMAIL_TEMPLATES = {
  booking_confirmation: (data: Record<string, unknown>) => ({
    subject: `✅ Aula Confirmada - ${data.className}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Aula Confirmada! 🎉</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Sua aula foi agendada com sucesso!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Aula:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Data:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Horário:</strong> ${data.startTime} - ${data.endTime}</p>
            <p style="margin: 5px 0; color: #64748b;">👩‍🏫 <strong>Instrutor(a):</strong> ${data.instructorName}</p>
            ${data.roomName ? `<p style="margin: 5px 0; color: #64748b;">🏠 <strong>Sala:</strong> ${data.roomName}</p>` : ""}
          </div>

          <p style="font-size: 14px; color: #64748b;">
            Lembre-se: cancelamentos devem ser feitos com pelo menos 12 horas de antecedência para reembolso do crédito.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.dashboardUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Ver Meus Agendamentos
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center;">
            ${data.studioName} • Até logo! 💜
          </p>
        </div>
      </div>
    `,
  }),

  booking_cancellation: (data: Record<string, unknown>) => ({
    subject: `❌ Aula Cancelada - ${data.className}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ef4444; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Aula Cancelada</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Seu agendamento foi cancelado.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Aula:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Data:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Horário:</strong> ${data.startTime}</p>
            ${data.reason ? `<p style="margin: 5px 0; color: #64748b;">📝 <strong>Motivo:</strong> ${data.reason}</p>` : ""}
          </div>

          ${data.creditRefunded ? `
            <p style="font-size: 14px; color: #22c55e; background: #f0fdf4; padding: 10px; border-radius: 8px;">
              ✅ O crédito foi devolvido ao seu plano.
            </p>
          ` : `
            <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 10px; border-radius: 8px;">
              ⚠️ Cancelamento fora do prazo - crédito não reembolsado.
            </p>
          `}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.bookingUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Agendar Nova Aula
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  booking_reminder: (data: Record<string, unknown>) => ({
    subject: `⏰ Lembrete: Sua aula é ${data.timeUntil}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Lembrete de Aula ⏰</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Sua aula é <strong>${data.timeUntil}</strong>!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Aula:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Data:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Horário:</strong> ${data.startTime} - ${data.endTime}</p>
            <p style="margin: 5px 0; color: #64748b;">👩‍🏫 <strong>Instrutor(a):</strong> ${data.instructorName}</p>
          </div>

          <p style="font-size: 14px; color: #64748b; text-align: center;">
            Não se esqueça de trazer sua garrafa de água! 💧
          </p>
        </div>
      </div>
    `,
  }),

  waitlist_spot_available: (data: Record<string, unknown>) => ({
    subject: `🎉 Vaga Liberada! - ${data.className}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Vaga Disponível! 🎉</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Uma vaga foi liberada na aula que você estava na lista de espera!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Aula:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Data:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Horário:</strong> ${data.startTime}</p>
          </div>

          <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 8px; text-align: center;">
            ⏳ Você tem <strong>2 horas</strong> para confirmar sua presença!
          </p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.confirmUrl}" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Confirmar Presença
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  plan_expiring: (data: Record<string, unknown>) => ({
    subject: `⚠️ Seu plano expira em ${data.daysUntilExpiry} dias`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Plano Expirando ⚠️</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Seu plano <strong>${data.planName}</strong> expira em <strong>${data.daysUntilExpiry} dias</strong>.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0; color: #64748b;">📋 <strong>Plano:</strong> ${data.planName}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Expira em:</strong> ${data.expiryDate}</p>
            <p style="margin: 5px 0; color: #64748b;">🎯 <strong>Aulas restantes:</strong> ${data.remainingClasses}</p>
          </div>

          <p style="font-size: 14px; color: #64748b;">
            Renove agora e não perca suas aulas favoritas!
          </p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.renewUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Renovar Plano
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  welcome: (data: Record<string, unknown>) => ({
    subject: `🎉 Bem-vindo(a) ao ${data.studioName}!`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo(a)! 🎉</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${data.studioName}</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">É com muita alegria que damos as boas-vindas a você!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #7c3aed; margin-top: 0;">Próximos passos:</h3>
            <p style="margin: 10px 0; color: #64748b;">1️⃣ Acesse o portal do cliente para ver as aulas disponíveis</p>
            <p style="margin: 10px 0; color: #64748b;">2️⃣ Agende sua primeira aula</p>
            <p style="margin: 10px 0; color: #64748b;">3️⃣ Não se esqueça de trazer roupa confortável!</p>
          </div>

          ${data.planName ? `
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #22c55e;">
                ✅ Plano ativado: <strong>${data.planName}</strong> - ${data.totalClasses} aulas
              </p>
            </div>
          ` : ""}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.dashboardUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Acessar Portal
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
            Qualquer dúvida, estamos à disposição! 💜
          </p>
        </div>
      </div>
    `,
  }),

  class_cancelled: (data: Record<string, unknown>) => ({
    subject: `⚠️ Aula Cancelada - ${data.className}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ef4444; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Aula Cancelada ⚠️</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Infelizmente a aula abaixo foi cancelada:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Aula:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Data:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Horário:</strong> ${data.startTime}</p>
            ${data.reason ? `<p style="margin: 5px 0; color: #64748b;">📝 <strong>Motivo:</strong> ${data.reason}</p>` : ""}
          </div>

          <p style="font-size: 14px; color: #22c55e; background: #f0fdf4; padding: 12px; border-radius: 8px;">
            ✅ O crédito foi devolvido ao seu plano automaticamente.
          </p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.bookingUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Agendar Outra Aula
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b; margin-top: 20px; text-align: center;">
            Pedimos desculpas pelo inconveniente.
          </p>
        </div>
      </div>
    `,
  }),

  payment_confirmation: (data: Record<string, unknown>) => ({
    subject: `✅ Pagamento Confirmado - ${data.planName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Pagamento Confirmado! ✅</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Seu pagamento foi processado com sucesso!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; color: #64748b;">📋 <strong>Plano:</strong> ${data.planName}</p>
            <p style="margin: 5px 0; color: #64748b;">💰 <strong>Valor:</strong> ${data.amount}</p>
            <p style="margin: 5px 0; color: #64748b;">💳 <strong>Método:</strong> ${data.paymentMethod}</p>
            <p style="margin: 5px 0; color: #64748b;">🎯 <strong>Aulas creditadas:</strong> ${data.classesAdded}</p>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.dashboardUrl}" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Agendar Aulas
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  custom: (data: Record<string, unknown>) => ({
    subject: data.subject as string || "Mensagem do Studio",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${data.studioName}</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
          <div style="font-size: 16px; color: #334155; white-space: pre-wrap;">${data.message}</div>
        </div>
      </div>
    `,
  }),
};

// ============================================
// WhatsApp Templates (Twilio format)
// ============================================

const WHATSAPP_TEMPLATES = {
  booking_confirmation: (data: Record<string, unknown>) =>
    `✅ *Aula Confirmada!*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `📚 Aula: ${data.className}\n` +
    `📅 Data: ${data.date}\n` +
    `⏰ Horário: ${data.startTime} - ${data.endTime}\n` +
    `👩‍🏫 Instrutor(a): ${data.instructorName}\n\n` +
    `_Cancelamentos: até 12h antes para reembolso._`,

  booking_cancellation: (data: Record<string, unknown>) =>
    `❌ *Agendamento Cancelado*\n\n` +
    `Olá ${data.clientName},\n\n` +
    `📚 Aula: ${data.className}\n` +
    `📅 Data: ${data.date}\n` +
    `⏰ Horário: ${data.startTime}\n` +
    (data.reason ? `📝 Motivo: ${data.reason}\n\n` : "\n") +
    (data.creditRefunded ? "✅ Crédito devolvido." : "⚠️ Crédito não reembolsado (prazo expirado)."),

  booking_reminder: (data: Record<string, unknown>) =>
    `⏰ *Lembrete de Aula*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `Sua aula é *${data.timeUntil}*!\n\n` +
    `📚 ${data.className}\n` +
    `⏰ ${data.startTime} - ${data.endTime}\n` +
    `👩‍🏫 ${data.instructorName}\n\n` +
    `💧 Não esqueça sua garrafa de água!`,

  waitlist_spot_available: (data: Record<string, unknown>) =>
    `🎉 *Vaga Liberada!*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `Uma vaga foi liberada:\n` +
    `📚 ${data.className}\n` +
    `📅 ${data.date}\n` +
    `⏰ ${data.startTime}\n\n` +
    `⚠️ *Você tem 2 horas para confirmar!*\n\n` +
    `Confirme sua presença: ${data.confirmUrl}`,

  plan_expiring: (data: Record<string, unknown>) =>
    `⚠️ *Plano Expirando*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `Seu plano *${data.planName}* expira em *${data.daysUntilExpiry} dias*.\n\n` +
    `🎯 Aulas restantes: ${data.remainingClasses}\n\n` +
    `Renove agora: ${data.renewUrl}`,

  welcome: (data: Record<string, unknown>) =>
    `🎉 *Bem-vindo(a) ao ${data.studioName}!*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `É um prazer ter você conosco! 💜\n\n` +
    (data.planName ? `✅ Plano ativado: *${data.planName}* - ${data.totalClasses} aulas\n\n` : "") +
    `Acesse o portal para agendar: ${data.dashboardUrl}`,

  class_cancelled: (data: Record<string, unknown>) =>
    `⚠️ *Aula Cancelada*\n\n` +
    `Olá ${data.clientName},\n\n` +
    `A seguinte aula foi cancelada:\n` +
    `📚 ${data.className}\n` +
    `📅 ${data.date}\n` +
    `⏰ ${data.startTime}\n` +
    (data.reason ? `📝 ${data.reason}\n\n` : "\n") +
    `✅ Crédito devolvido automaticamente.\n\n` +
    `Agende outra aula: ${data.bookingUrl}`,

  payment_confirmation: (data: Record<string, unknown>) =>
    `✅ *Pagamento Confirmado!*\n\n` +
    `Olá ${data.clientName}!\n\n` +
    `📋 Plano: ${data.planName}\n` +
    `💰 Valor: ${data.amount}\n` +
    `🎯 Aulas: ${data.classesAdded}\n\n` +
    `Bora agendar! ${data.dashboardUrl}`,

  custom: (data: Record<string, unknown>) =>
    data.message as string,
};

// ============================================
// Notification Service Class
// ============================================

export class NotificationService {
  private resend: Resend | null = null;
  private studioName = "FlexiWell Studio";
  private baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  // Main send method
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const { type, clientId, data, channels = "both" } = payload;
    const db = await getDatabase();

    // Get client details
    const client = await db.collection<Client>("clients").findOne({
      _id: { $toString: clientId } as unknown as Client["_id"],
    });

    if (!client) {
      // Try with ObjectId
      const { ObjectId } = await import("mongodb");
      const clientById = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(clientId),
      });

      if (!clientById) {
        return { success: false, error: "Cliente não encontrado" };
      }

      return this.sendToClient(type, clientById, data, channels);
    }

    return this.sendToClient(type, client, data, channels);
  }

  private async sendToClient(
    type: NotificationType,
    client: Client,
    data: Record<string, unknown>,
    channels: NotificationChannel
  ): Promise<NotificationResult> {
    const enrichedData = {
      ...data,
      clientName: client.name,
      studioName: this.studioName,
      dashboardUrl: `${this.baseUrl}/dashboard`,
      bookingUrl: `${this.baseUrl}/dashboard/classes/book`,
      renewUrl: `${this.baseUrl}/dashboard/plans`,
    };

    const results: NotificationResult = { success: true };

    // Send email
    if (channels === "email" || channels === "both") {
      if (client.email) {
        const emailResult = await this.sendEmail(type, client.email, enrichedData);
        results.emailSent = emailResult.success;
        if (!emailResult.success) {
          results.error = emailResult.error;
        }
      }
    }

    // Send WhatsApp
    if (channels === "whatsapp" || channels === "both") {
      if (client.phone) {
        const whatsappResult = await this.sendWhatsApp(type, client.phone, client._id?.toString() || "", enrichedData);
        results.whatsappSent = whatsappResult.success;
        if (!whatsappResult.success && !results.error) {
          results.error = whatsappResult.error;
        }
      }
    }

    // Update success status
    results.success = results.emailSent === true || results.whatsappSent === true;

    return results;
  }

  // Send email via Resend
  private async sendEmail(
    type: NotificationType,
    email: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.resend) {
      console.log("[Email] Resend not configured, skipping email");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const templates = EMAIL_TEMPLATES as Record<string, ((data: Record<string, unknown>) => { subject: string; html: string }) | undefined>;
      const template = templates[type];
      if (!template) {
        return { success: false, error: `Template not found: ${type}` };
      }

      const { subject, html } = template(data);

      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

      const result = await this.resend.emails.send({
        from: `${this.studioName} <${fromEmail}>`,
        to: email,
        subject,
        html,
      });

      if (result.error) {
        console.error("[Email] Error sending:", result.error);
        await this.logNotification({
          type,
          channel: "email",
          clientId: data.clientId as string || "",
          clientName: data.clientName as string || "",
          recipient: email,
          subject,
          content: html,
          status: "failed",
          error: result.error.message,
          createdAt: new Date(),
        });
        return { success: false, error: result.error.message };
      }

      await this.logNotification({
        type,
        channel: "email",
        clientId: data.clientId as string || "",
        clientName: data.clientName as string || "",
        recipient: email,
        subject,
        content: html,
        status: "sent",
        sentAt: new Date(),
        createdAt: new Date(),
      });

      console.log(`[Email] Sent ${type} to ${email}`);
      return { success: true };

    } catch (error) {
      console.error("[Email] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Send WhatsApp via Twilio or Cloud API
  private async sendWhatsApp(
    type: NotificationType,
    phone: string,
    clientId: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    const credentials = await getWhatsAppCredentials();

    if (!credentials) {
      console.log("[WhatsApp] Credentials not configured, skipping");
      return { success: false, error: "WhatsApp service not configured" };
    }

    try {
      const templates = WHATSAPP_TEMPLATES as Record<string, ((data: Record<string, unknown>) => string) | undefined>;
      const template = templates[type];
      if (!template) {
        return { success: false, error: `Template not found: ${type}` };
      }

      const message = template(data);

      // Format phone number for WhatsApp
      const formattedPhone = formatPhoneForWhatsApp(phone);

      let response: Response;
      let result: Record<string, unknown>;

      if (credentials.provider === "cloud-api") {
        // Send via Cloud API
        const creds = credentials as CloudApiCredentials;
        const normalizedPhone = formattedPhone.replace(/\D/g, "");

        response = await fetch(
          `https://graph.facebook.com/v18.0/${creds.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${creds.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: normalizedPhone,
              type: "text",
              text: { body: message },
            }),
          }
        );

        result = await response.json() as Record<string, unknown>;
      } else {
        // Send via Twilio
        const creds = credentials as TwilioCredentials;
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`;

        const body = new URLSearchParams({
          From: `whatsapp:${creds.phoneNumber}`,
          To: `whatsapp:${formattedPhone}`,
          Body: message,
        });

        response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        result = await response.json() as Record<string, unknown>;
      }

      if (!response.ok) {
        const errorMsg = (result.error as Record<string, unknown>)?.message || result.message || "Failed to send";
        console.error("[WhatsApp] Error sending:", result);
        await this.logNotification({
          type,
          channel: "whatsapp",
          clientId,
          clientName: data.clientName as string || "",
          recipient: formattedPhone,
          content: message,
          status: "failed",
          error: errorMsg as string,
          createdAt: new Date(),
        });
        return { success: false, error: errorMsg as string };
      }

      await this.logNotification({
        type,
        channel: "whatsapp",
        clientId,
        clientName: data.clientName as string || "",
        recipient: formattedPhone,
        content: message,
        status: "sent",
        sentAt: new Date(),
        createdAt: new Date(),
      });

      console.log(`[WhatsApp] Sent ${type} to ${formattedPhone}`);
      return { success: true };

    } catch (error) {
      console.error("[WhatsApp] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  }


  // Log notification to database
  private async logNotification(notification: NotificationRecord): Promise<void> {
    try {
      const db = await getDatabase();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...notificationData } = notification;
      await db.collection("notification_logs").insertOne(notificationData);
    } catch (error) {
      console.error("[Notification] Error logging:", error);
    }
  }

  // ============================================
  // Convenience Methods
  // ============================================

  async sendBookingConfirmation(booking: Booking, classDoc: Class): Promise<NotificationResult> {
    return this.send({
      type: "booking_confirmation",
      clientId: booking.clientId,
      data: {
        clientId: booking.clientId,
        className: classDoc.title,
        date: formatDateBR(classDoc.scheduledDate),
        startTime: classDoc.startTime,
        endTime: classDoc.endTime,
        instructorName: classDoc.instructorName,
        roomName: classDoc.location || "",
      },
    });
  }

  async sendBookingCancellation(
    booking: Booking,
    creditRefunded: boolean,
    reason?: string
  ): Promise<NotificationResult> {
    return this.send({
      type: "booking_cancellation",
      clientId: booking.clientId,
      data: {
        clientId: booking.clientId,
        className: booking.className,
        date: formatDateBR(booking.scheduledDate),
        startTime: booking.startTime,
        reason,
        creditRefunded,
      },
    });
  }

  async sendBookingReminder(
    booking: Booking,
    timeUntil: string
  ): Promise<NotificationResult> {
    return this.send({
      type: "booking_reminder",
      clientId: booking.clientId,
      data: {
        clientId: booking.clientId,
        className: booking.className,
        date: formatDateBR(booking.scheduledDate),
        startTime: booking.startTime,
        endTime: booking.endTime,
        instructorName: booking.instructorName,
        timeUntil,
      },
    });
  }

  async sendWaitlistSpotAvailable(
    clientId: string,
    classDoc: Class,
    confirmUrl: string
  ): Promise<NotificationResult> {
    return this.send({
      type: "waitlist_spot_available",
      clientId,
      data: {
        clientId,
        className: classDoc.title,
        date: formatDateBR(classDoc.scheduledDate),
        startTime: classDoc.startTime,
        confirmUrl,
      },
    });
  }

  async sendWelcome(client: Client, planName?: string, totalClasses?: number): Promise<NotificationResult> {
    return this.send({
      type: "welcome",
      clientId: client._id?.toString() || "",
      data: {
        clientId: client._id?.toString(),
        planName,
        totalClasses,
      },
    });
  }

  async sendClassCancelled(
    classDoc: Class,
    enrolledClientIds: string[],
    reason?: string
  ): Promise<{ total: number; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const clientId of enrolledClientIds) {
      const result = await this.send({
        type: "class_cancelled",
        clientId,
        data: {
          clientId,
          className: classDoc.title,
          date: formatDateBR(classDoc.scheduledDate),
          startTime: classDoc.startTime,
          reason,
        },
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { total: enrolledClientIds.length, sent, failed };
  }

  async sendPaymentConfirmation(
    clientId: string,
    planName: string,
    amount: string,
    paymentMethod: string,
    classesAdded: number
  ): Promise<NotificationResult> {
    return this.send({
      type: "payment_confirmation",
      clientId,
      data: {
        clientId,
        planName,
        amount,
        paymentMethod,
        classesAdded,
      },
    });
  }

  async sendPlanExpiring(
    client: Client,
    daysUntilExpiry: number
  ): Promise<NotificationResult> {
    return this.send({
      type: "plan_expiring",
      clientId: client._id?.toString() || "",
      data: {
        clientId: client._id?.toString(),
        planName: client.plan.type,
        daysUntilExpiry,
        expiryDate: formatDateBR(client.plan.endDate),
        remainingClasses: client.plan.remainingClasses,
      },
    });
  }

  async sendCustomMessage(
    clientId: string,
    subject: string,
    message: string,
    channels: NotificationChannel = "both"
  ): Promise<NotificationResult> {
    return this.send({
      type: "custom",
      clientId,
      data: {
        clientId,
        subject,
        message,
      },
      channels,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
