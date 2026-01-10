import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { User } from "@/lib/db/schemas";

// This endpoint should be called by a cron job daily
// POST /api/trial/check-expiring - Check for expiring trials and send notifications
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    // Find users with active trials
    const usersWithTrials = await db.collection<User>("users").find({
      role: "admin",
      trialStatus: "active",
      trialEndDate: { $exists: true },
    }).toArray();

    const notifications = {
      sevenDays: 0,
      threeDays: 0,
      oneDay: 0,
      expired: 0,
    };

    for (const user of usersWithTrials) {
      if (!user.trialEndDate) continue;

      const trialEnd = new Date(user.trialEndDate);
      const daysRemaining = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const notifs = user.trialNotifications || {};

      // 7 days remaining
      if (daysRemaining === 7 && !notifs.sevenDaysSent) {
        await sendTrialNotification(user, 7);
        await db.collection<User>("users").updateOne(
          { _id: user._id },
          { $set: { "trialNotifications.sevenDaysSent": true, updatedAt: new Date() } }
        );
        notifications.sevenDays++;
      }

      // 3 days remaining
      if (daysRemaining === 3 && !notifs.threeDaysSent) {
        await sendTrialNotification(user, 3);
        await db.collection<User>("users").updateOne(
          { _id: user._id },
          { $set: { "trialNotifications.threeDaysSent": true, updatedAt: new Date() } }
        );
        notifications.threeDays++;
      }

      // 1 day remaining
      if (daysRemaining === 1 && !notifs.oneDaySent) {
        await sendTrialNotification(user, 1);
        await db.collection<User>("users").updateOne(
          { _id: user._id },
          { $set: { "trialNotifications.oneDaySent": true, updatedAt: new Date() } }
        );
        notifications.oneDay++;
      }

      // Expired
      if (daysRemaining <= 0 && !notifs.expiredSent) {
        await sendTrialExpiredNotification(user);
        await db.collection<User>("users").updateOne(
          { _id: user._id },
          {
            $set: {
              "trialNotifications.expiredSent": true,
              trialStatus: "expired",
              updatedAt: new Date()
            }
          }
        );
        notifications.expired++;
      }
    }

    return NextResponse.json({
      success: true,
      usersChecked: usersWithTrials.length,
      notifications,
    });
  } catch (error) {
    console.error("Error checking expiring trials:", error);
    return NextResponse.json(
      { error: "Failed to check expiring trials" },
      { status: 500 }
    );
  }
}

async function sendTrialNotification(user: User, daysRemaining: number) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.flexiwell.net";

  // Use Resend to send email
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return;
  }

  const subject = daysRemaining === 1
    ? "Your FlexiWell trial ends tomorrow!"
    : `Your FlexiWell trial ends in ${daysRemaining} days`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .days-badge { display: inline-block; background: #fef3c7; color: #d97706; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
        .cta-button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature-item { padding: 8px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FlexiWell</h1>
          <p>Your trial is ending soon</p>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>

          <div class="days-badge">
            ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining
          </div>

          <p>Your free trial of FlexiWell is ending ${daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`}. Don't lose access to all the features you've been using:</p>

          <div class="features">
            <div class="feature-item">✓ Unlimited client management</div>
            <div class="feature-item">✓ Class scheduling & booking</div>
            <div class="feature-item">✓ WhatsApp integration</div>
            <div class="feature-item">✓ Payment tracking</div>
            <div class="feature-item">✓ Reports & analytics</div>
          </div>

          <p>Choose a plan that works best for your studio and keep everything running smoothly.</p>

          <center>
            <a href="${appUrl}/admin/billing" class="cta-button">Choose Your Plan →</a>
          </center>

          <p style="color: #666; font-size: 14px;">
            Questions? Reply to this email and we'll help you out.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} FlexiWell. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FlexiWell <noreply@flexiwell.net>",
        to: user.email,
        subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send trial notification email:", await response.text());
    }
  } catch (error) {
    console.error("Error sending trial notification:", error);
  }
}

async function sendTrialExpiredNotification(user: User) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.flexiwell.net";

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .expired-badge { display: inline-block; background: #fee2e2; color: #dc2626; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
        .cta-button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .offer-box { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FlexiWell</h1>
          <p>Your trial has ended</p>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>

          <div class="expired-badge">
            Trial Expired
          </div>

          <p>Your free trial has ended, but your data is safe! We'll keep it for 30 days so you can pick up right where you left off.</p>

          <div class="offer-box">
            <h3 style="color: #10b981; margin: 0;">🎉 Special Offer</h3>
            <p style="margin: 10px 0;">Subscribe today and get <strong>20% off</strong> your first 3 months!</p>
            <small>Use code: <strong>COMEBACK20</strong></small>
          </div>

          <p>Don't lose all the progress you've made:</p>
          <ul>
            <li>Your client database</li>
            <li>Your class schedules</li>
            <li>Your payment history</li>
            <li>Your settings & integrations</li>
          </ul>

          <center>
            <a href="${appUrl}/admin/billing" class="cta-button">Reactivate Now →</a>
          </center>

          <p style="color: #666; font-size: 14px;">
            Need help deciding? Reply to this email and we'll help you choose the best plan.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} FlexiWell. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FlexiWell <noreply@flexiwell.net>",
        to: user.email,
        subject: "Your FlexiWell trial has ended - Don't lose your data!",
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send trial expired email:", await response.text());
    }
  } catch (error) {
    console.error("Error sending trial expired notification:", error);
  }
}
