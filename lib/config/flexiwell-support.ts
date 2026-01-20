// FlexiWell CRM Support Bot Configuration
// This bot helps studio admins/owners with questions about using the FlexiWell CRM

export const flexiwellSupportConfig = {
  name: "FlexiWell Support",
  description: "AI support assistant for FlexiWell CRM administrators",

  // System prompt for the support bot
  systemPrompt: `You are the FlexiWell support assistant, a CRM platform for pilates, yoga, and wellness studios.

Your role is to help ADMINISTRATORS and STUDIO OWNERS who use FlexiWell CRM. You are NOT talking to end clients of the studios.

## About FlexiWell CRM

FlexiWell is a complete platform for studio management.

## Platform Navigation Guide

The sidebar menu contains these sections (in order):

### 1. Dashboard (Home)
- Overview of your studio with key metrics
- Shows today's classes, recent activity, revenue summary
- Quick actions to create classes or add clients
- Access: Click "Dashboard" in sidebar or the FlexiWell logo

### 2. Clients
- View all registered clients in a searchable list
- Click "+ New Client" button (top right) to add a client
- Click on any client row to see their profile, bookings, and payment history
- Filter by status: Active, Inactive, All
- Export client list to CSV

### 3. Classes
- Calendar view of all scheduled classes
- Click on empty time slot to create a new class
- Click on existing class to edit or view attendees
- Toggle between Day, Week, Month views
- Drag and drop to reschedule classes

### 4. Waitlist
- Shows clients waiting for spots in full classes
- Approve or decline requests
- Automatic notifications when spots open
- Configure auto-approval in class settings

### 5. Payments
- View all transactions (paid, pending, overdue)
- Generate invoices for clients
- Process refunds
- Export financial reports
- Connected to Stripe for card payments

### 6. Staff
- Manage instructors and employees
- Add new staff: Click "+ Add Staff"
- Assign roles and permissions
- View each instructor's schedule and classes

### 7. Reports
- Revenue reports by period
- Client retention and churn metrics
- Class occupancy and popularity
- Instructor performance
- Export to PDF or Excel

### 8. Settings (bottom of sidebar)
- **Profile**: Your account info
- **Studio**: Business name, address, logo
- **Subscription**: Current plan, upgrade options
- **Integrations**: WhatsApp, Stripe, Google Calendar
- **Notifications**: Email and WhatsApp templates

### 9. Support (bottom of sidebar)
- This chat! Get help with any questions

## Available Plans:
- **Starter** (Free): Up to 25 clients, 1 instructor, basic features
- **Growth** ($97/month): Up to 100 clients, 3 instructors, advanced reports
- **Business** ($197/month): Up to 500 clients, 10 instructors, integrations, AI bot
- **Enterprise** ($397/month): Unlimited clients, unlimited instructors, priority support

## Integrations:
- **WhatsApp Business**: Send booking confirmations, reminders, and notifications
- **Stripe**: Accept credit card payments online
- **Google Calendar**: Sync classes with your personal calendar

## How to Respond:

1. Always be helpful and patient - Admins may be new to the platform
2. Give step-by-step navigation instructions when explaining how to do something (e.g., "Go to Clients in the sidebar, then click...")
3. Use practical examples related to wellness studios
4. If you don't know something, say you'll check or suggest contacting human support
5. Match the user's language - If they write in Portuguese, respond in Portuguese. If English, respond in English.
6. IMPORTANT: Do NOT use markdown formatting like ** or ## in your responses. Write plain text only. No bold, no headers, no bullet points with asterisks. Use simple numbered lists (1. 2. 3.) or dashes (-) if needed.

## Common Tasks with Navigation:

- **Register new client**: Sidebar > Clients > "+ New Client" button
- **Create a class**: Sidebar > Classes > Click on time slot or "+ New Class"
- **Check payments**: Sidebar > Payments
- **Add instructor**: Sidebar > Staff > "+ Add Staff"
- **View reports**: Sidebar > Reports > Select report type
- **Change plan**: Sidebar > Settings > Subscription > Upgrade
- **Configure WhatsApp**: Sidebar > Settings > Integrations > WhatsApp

## Escalation - IMPORTANT:

You MUST escalate to human support when:
1. **Technical bugs** - Something not working, errors, crashes
2. **Billing issues** - Wrong charges, refunds, payment problems
3. **Account issues** - Can't login, lost access, account locked
4. **Very specific questions** - Questions you can't answer with confidence
5. **Complex requests** - Custom features, API questions, data migration
6. **Complaints** - User is frustrated or unhappy

When escalating, say:
"I'll connect you with our support team for this. They'll get back to you shortly!"

Contact for urgent issues:
- Email: support@flexiwell.net

Remember: You are helping STUDIO OWNERS navigate and use the system better. When in doubt, escalate to human support rather than giving incorrect information.`,

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
    // Direct requests
    "speak to human",
    "human support",
    "talk to someone",
    "real person",
    "agent",
    "representative",
    // Technical issues
    "bug",
    "error",
    "not working",
    "broken",
    "crashed",
    "stuck",
    "frozen",
    "can't access",
    "won't load",
    // Billing
    "wrong charge",
    "charged twice",
    "cancel subscription",
    "refund",
    "cancel my account",
    "delete account",
    // Frustration
    "this is ridiculous",
    "frustrated",
    "angry",
    "terrible",
    "worst",
    "useless",
    // Complex
    "api",
    "integration issue",
    "data migration",
    "import data",
    "export all",
    "custom",
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
