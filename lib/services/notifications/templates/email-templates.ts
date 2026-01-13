// Email Templates - SRP: Only template definitions
import type { NotificationData } from "../../interfaces";

type EmailTemplate = (data: NotificationData) => { subject: string; html: string };

// Base email wrapper for consistent styling
const emailWrapper = (title: string, bgColor: string, content: string, studioName: string) => `
  <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${bgColor}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
    </div>
    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
      ${content}
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center;">
        ${studioName} • Até logo! 💜
      </p>
    </div>
  </div>
`;

const infoBox = (items: string[], borderColor: string) => `
  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
    ${items.map((item) => `<p style="margin: 5px 0; color: #64748b;">${item}</p>`).join("")}
  </div>
`;

const button = (text: string, url: string, color: string) => `
  <div style="text-align: center; margin-top: 30px;">
    <a href="${url}" style="background: ${color}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      ${text}
    </a>
  </div>
`;

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  booking_confirmation: (data) => ({
    subject: `✅ Aula Confirmada - ${data.className}`,
    html: emailWrapper(
      "Aula Confirmada! 🎉",
      "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Sua aula foi agendada com sucesso!</p>
        ${infoBox(
          [
            `📚 <strong>Aula:</strong> ${data.className}`,
            `📅 <strong>Data:</strong> ${data.date}`,
            `⏰ <strong>Horário:</strong> ${data.startTime} - ${data.endTime}`,
            `👩‍🏫 <strong>Instrutor(a):</strong> ${data.instructorName}`,
            ...(data.roomName ? [`🏠 <strong>Sala:</strong> ${data.roomName}`] : []),
          ],
          "#7c3aed"
        )}
        <p style="font-size: 14px; color: #64748b;">
          Lembre-se: cancelamentos devem ser feitos com pelo menos 12 horas de antecedência para reembolso do crédito.
        </p>
        ${button("Ver Meus Agendamentos", data.dashboardUrl as string, "#7c3aed")}
      `,
      data.studioName as string
    ),
  }),

  booking_cancellation: (data) => ({
    subject: `❌ Aula Cancelada - ${data.className}`,
    html: emailWrapper(
      "Aula Cancelada",
      "#ef4444",
      `
        <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Seu agendamento foi cancelado.</p>
        ${infoBox(
          [
            `📚 <strong>Aula:</strong> ${data.className}`,
            `📅 <strong>Data:</strong> ${data.date}`,
            `⏰ <strong>Horário:</strong> ${data.startTime}`,
            ...(data.reason ? [`📝 <strong>Motivo:</strong> ${data.reason}`] : []),
          ],
          "#ef4444"
        )}
        ${
          data.creditRefunded
            ? `<p style="font-size: 14px; color: #22c55e; background: #f0fdf4; padding: 10px; border-radius: 8px;">
                ✅ O crédito foi devolvido ao seu plano.
              </p>`
            : `<p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 10px; border-radius: 8px;">
                ⚠️ Cancelamento fora do prazo - crédito não reembolsado.
              </p>`
        }
        ${button("Agendar Nova Aula", data.bookingUrl as string, "#7c3aed")}
      `,
      data.studioName as string
    ),
  }),

  booking_reminder: (data) => ({
    subject: `⏰ Lembrete: Sua aula é ${data.timeUntil}`,
    html: emailWrapper(
      "Lembrete de Aula ⏰",
      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Sua aula é <strong>${data.timeUntil}</strong>!</p>
        ${infoBox(
          [
            `📚 <strong>Aula:</strong> ${data.className}`,
            `📅 <strong>Data:</strong> ${data.date}`,
            `⏰ <strong>Horário:</strong> ${data.startTime} - ${data.endTime}`,
            `👩‍🏫 <strong>Instrutor(a):</strong> ${data.instructorName}`,
          ],
          "#3b82f6"
        )}
        <p style="font-size: 14px; color: #64748b; text-align: center;">
          Não se esqueça de trazer sua garrafa de água! 💧
        </p>
      `,
      data.studioName as string
    ),
  }),

  waitlist_spot_available: (data) => ({
    subject: `🎉 Vaga Liberada! - ${data.className}`,
    html: emailWrapper(
      "Vaga Disponível! 🎉",
      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Uma vaga foi liberada na aula que você estava na lista de espera!</p>
        ${infoBox(
          [
            `📚 <strong>Aula:</strong> ${data.className}`,
            `📅 <strong>Data:</strong> ${data.date}`,
            `⏰ <strong>Horário:</strong> ${data.startTime}`,
          ],
          "#10b981"
        )}
        <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 8px; text-align: center;">
          ⏳ Você tem <strong>2 horas</strong> para confirmar sua presença!
        </p>
        ${button("Confirmar Presença", data.confirmUrl as string, "#10b981")}
      `,
      data.studioName as string
    ),
  }),

  plan_expiring: (data) => ({
    subject: `⚠️ Seu plano expira em ${data.daysUntilExpiry} dias`,
    html: emailWrapper(
      "Plano Expirando ⚠️",
      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Seu plano <strong>${data.planName}</strong> expira em <strong>${data.daysUntilExpiry} dias</strong>.</p>
        ${infoBox(
          [
            `📋 <strong>Plano:</strong> ${data.planName}`,
            `📅 <strong>Expira em:</strong> ${data.expiryDate}`,
            `🎯 <strong>Aulas restantes:</strong> ${data.remainingClasses}`,
          ],
          "#f59e0b"
        )}
        <p style="font-size: 14px; color: #64748b;">
          Renove agora e não perca suas aulas favoritas!
        </p>
        ${button("Renovar Plano", data.renewUrl as string, "#f59e0b")}
      `,
      data.studioName as string
    ),
  }),

  welcome: (data) => ({
    subject: `🎉 Bem-vindo(a) ao ${data.studioName}!`,
    html: emailWrapper(
      "Bem-vindo(a)! 🎉",
      "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">É com muita alegria que damos as boas-vindas a você!</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #7c3aed; margin-top: 0;">Próximos passos:</h3>
          <p style="margin: 10px 0; color: #64748b;">1️⃣ Acesse o portal do cliente para ver as aulas disponíveis</p>
          <p style="margin: 10px 0; color: #64748b;">2️⃣ Agende sua primeira aula</p>
          <p style="margin: 10px 0; color: #64748b;">3️⃣ Não se esqueça de trazer roupa confortável!</p>
        </div>
        ${
          data.planName
            ? `<div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #22c55e;">
                  ✅ Plano ativado: <strong>${data.planName}</strong> - ${data.totalClasses} aulas
                </p>
              </div>`
            : ""
        }
        ${button("Acessar Portal", data.dashboardUrl as string, "#7c3aed")}
        <p style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
          Qualquer dúvida, estamos à disposição! 💜
        </p>
      `,
      data.studioName as string
    ),
  }),

  class_cancelled: (data) => ({
    subject: `⚠️ Aula Cancelada - ${data.className}`,
    html: emailWrapper(
      "Aula Cancelada ⚠️",
      "#ef4444",
      `
        <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Infelizmente a aula abaixo foi cancelada:</p>
        ${infoBox(
          [
            `📚 <strong>Aula:</strong> ${data.className}`,
            `📅 <strong>Data:</strong> ${data.date}`,
            `⏰ <strong>Horário:</strong> ${data.startTime}`,
            ...(data.reason ? [`📝 <strong>Motivo:</strong> ${data.reason}`] : []),
          ],
          "#ef4444"
        )}
        <p style="font-size: 14px; color: #22c55e; background: #f0fdf4; padding: 12px; border-radius: 8px;">
          ✅ O crédito foi devolvido ao seu plano automaticamente.
        </p>
        ${button("Agendar Outra Aula", data.bookingUrl as string, "#7c3aed")}
        <p style="font-size: 14px; color: #64748b; margin-top: 20px; text-align: center;">
          Pedimos desculpas pelo inconveniente.
        </p>
      `,
      data.studioName as string
    ),
  }),

  payment_confirmation: (data) => ({
    subject: `✅ Pagamento Confirmado - ${data.planName}`,
    html: emailWrapper(
      "Pagamento Confirmado! ✅",
      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Seu pagamento foi processado com sucesso!</p>
        ${infoBox(
          [
            `📋 <strong>Plano:</strong> ${data.planName}`,
            `💰 <strong>Valor:</strong> ${data.amount}`,
            `💳 <strong>Método:</strong> ${data.paymentMethod}`,
            `🎯 <strong>Aulas creditadas:</strong> ${data.classesAdded}`,
          ],
          "#10b981"
        )}
        ${button("Agendar Aulas", data.dashboardUrl as string, "#10b981")}
      `,
      data.studioName as string
    ),
  }),

  custom: (data) => ({
    subject: (data.subject as string) || "Mensagem do Studio",
    html: emailWrapper(
      data.studioName as string,
      "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Olá <strong>${data.clientName}</strong>,</p>
        <div style="font-size: 16px; color: #334155; white-space: pre-wrap;">${data.message}</div>
      `,
      data.studioName as string
    ),
  }),
};
