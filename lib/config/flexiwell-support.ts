// FlexiWell CRM Support Bot Configuration
// This bot helps studio admins/owners with questions about using the FlexiWell CRM

export const flexiwellSupportConfig = {
  name: "FlexiWell Support",
  description: "AI support assistant for FlexiWell CRM administrators",

  // System prompt for the support bot
  systemPrompt: `You are the FlexiWell support assistant, a CRM platform for pilates, yoga, and wellness studios.

Your role is to help ADMINISTRATORS and STUDIO OWNERS who use FlexiWell CRM. You are NOT talking to end clients of the studios.

## About FlexiWell CRM

FlexiWell is a complete platform for studio management that includes:

### Main Features:
1. **Dashboard** - Studio overview with important metrics
2. **Clients** - Client registration and management
3. **Calendar/Schedule** - Class and session scheduling
4. **Waitlist** - Queue management for classes
5. **Payments** - Financial control and billing
6. **Staff** - Instructor and employee management
7. **Reports** - Business analytics and metrics

### Available Plans:
- **Starter** (Free): Up to 25 clients, 1 instructor, basic features
- **Growth** ($97/month): Up to 100 clients, 3 instructors, advanced reports
- **Business** ($197/month): Up to 500 clients, 10 instructors, integrations, AI bot
- **Enterprise** ($397/month): Unlimited clients, unlimited instructors, priority support

### Integrations:
- WhatsApp Business (for notifications and bot)
- Crisp (support chat)
- Stripe/Asaas (payments)
- Google Calendar

## How to Respond:

1. **Always be helpful and patient** - Admins may be new to the platform
2. **Give step-by-step instructions** when explaining how to do something
3. **Use practical examples** related to wellness studios
4. **If you don't know something**, say you'll check or suggest contacting human support
5. **Respond in English by default** (unless the user writes in another language, then match their language)

## Common Topics:

- How to register new clients
- How to create/edit classes in the calendar
- How to set up plans and pricing
- How to process payments
- How to add instructors
- How to use the waitlist
- How to view reports
- Login/access issues
- Questions about plans and pricing
- How to configure integrations

## Escalation:

If the admin has serious technical issues, bugs, or billing questions, suggest:
- Email: support@flexiwell.net
- Or request to speak with a human

Remember: You are helping STUDIO OWNERS use the system better, not end clients.`,

  // Quick replies for common questions
  quickReplies: [
    {
      trigger: ["how to register", "add client", "new client", "create client"],
      response: `To register a new client:

1. Go to **Clients** in the sidebar menu
2. Click the **"+ New Client"** button in the top right corner
3. Fill in the details: name, email, phone
4. Select the client's plan (monthly, quarterly, etc.)
5. Click **Save**

The client will receive a welcome email automatically if you have notifications configured.`,
    },
    {
      trigger: ["create class", "schedule class", "new class", "add class"],
      response: `To create a new class:

1. Go to **Dashboard** or **Calendar**
2. Click **"+ New Class"** or click directly on the desired time slot
3. Fill in:
   - Class name (e.g., Pilates Reformer)
   - Instructor
   - Date and time
   - Maximum capacity
   - Recurrence (if it's a recurring class)
4. Click **Save**

The class will appear on the calendar and clients can sign up.`,
    },
    {
      trigger: ["waitlist", "waiting list", "queue"],
      response: `The **Waitlist** works like this:

1. When a class reaches maximum capacity, new interested clients join the queue
2. Go to **Waitlist** in the menu to see all requests
3. You can:
   - **Approve** manually when there's a spot available
   - Configure automatic approval
4. The client is notified when they get a spot

To configure the waitlist for a specific class, edit the class and enable "Allow waitlist".`,
    },
    {
      trigger: ["plan", "price", "pricing", "cost", "upgrade", "change plan"],
      response: `FlexiWell plans are:

**Starter (Free)**
- Up to 25 clients
- 1 instructor
- Basic features

**Growth ($97/month)**
- Up to 100 clients
- 3 instructors
- Advanced reports

**Business ($197/month)**
- Up to 500 clients
- 10 instructors
- AI bot, integrations

**Enterprise ($397/month)**
- Unlimited
- Priority support

To change plans: **Settings > Subscription > Upgrade**`,
    },
    {
      trigger: ["payment", "billing", "charge client", "invoice"],
      response: `To manage payments:

1. Go to **Payments** in the menu
2. You'll see all pending payments and history
3. To charge a client:
   - Go to the client's profile
   - Click **"Generate Invoice"**
   - Select the amount and method

**Payment integrations:**
- Stripe (international cards)
- Asaas (PIX, boleto, cards)

Configure in **Settings > Integrations > Payments**`,
    },
    {
      trigger: ["report", "metrics", "analytics", "statistics"],
      response: `To access reports:

1. Go to **Reports** in the menu
2. Choose the report type:
   - **Revenue**: billing by period
   - **Clients**: new, active, churn
   - **Classes**: occupancy, most popular
   - **Instructors**: performance

3. Use filters to adjust the period
4. Export to PDF or Excel if needed

Tip: The Dashboard also shows summarized metrics in real-time.`,
    },
  ],

  // Topics the bot can help with
  topics: [
    "Client registration",
    "Class scheduling",
    "Waitlist",
    "Payments and billing",
    "Instructor management",
    "Reports and metrics",
    "System settings",
    "Plans and pricing",
    "Integrations (WhatsApp, payments)",
    "Technical issues",
  ],

  // Escalation triggers
  escalationTriggers: [
    "speak to human",
    "human support",
    "agent",
    "bug",
    "serious error",
    "not working",
    "wrong charge",
    "cancel subscription",
    "refund",
  ],
};

// Helper function to check if message matches quick reply
export function findQuickReply(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  for (const reply of flexiwellSupportConfig.quickReplies) {
    if (reply.trigger.some(t => lowerMessage.includes(t))) {
      return reply.response;
    }
  }

  return null;
}

// Check if should escalate to human
export function shouldEscalateToHuman(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return flexiwellSupportConfig.escalationTriggers.some(t =>
    lowerMessage.includes(t)
  );
}
