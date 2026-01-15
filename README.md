# FlexiWell CRM

A modern, full-featured CRM designed specifically for **Pilates studios, yoga centers, and wellness businesses**. Built with Next.js 16, React 19, and Tailwind CSS 4.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)

## Overview

FlexiWell CRM is a comprehensive studio management platform that helps wellness businesses manage clients, instructors, classes, payments, and communications - all in one place.

### Key Features

- **Multi-role Dashboards** - Separate interfaces for Admins, Teachers, and Clients
- **Client Management** - Complete client profiles, plans, and activity tracking
- **Class Scheduling** - Calendar views (day, week, month) with drag-and-drop
- **Payment Tracking** - Monitor subscriptions, pending payments, and billing history
- **Staff Management** - Multi-location staff organization with role-based access
- **Waitlist System** - Smart waitlist with priority tiers and auto-enrollment
- **Integrations** - Connect with Wellhub, ClassPass, Stripe, Google Calendar, and more
- **WhatsApp Bot** - Automated messaging and client communication
- **Reports & Analytics** - Revenue, attendance, and performance insights

## Screenshots

### Admin Dashboard
Multi-unit overview with revenue metrics, class schedules, and staff activity.

### Client Portal
Personal dashboard with upcoming classes, billing, and support chat.

### Teacher View
Daily schedule, attendance tracking, and makeup class management.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.10 | React framework with App Router |
| React | 19.2.1 | UI components |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 4.0 | Styling |
| Recharts | 3.6.0 | Charts and analytics |
| date-fns | 4.1.0 | Date manipulation |
| react-big-calendar | 1.19.4 | Calendar component |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/not-ana/flexiwell-crm.git
cd flexiwell-crm

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
flexiwell-crm/
├── app/
│   ├── admin/           # Admin dashboard & management
│   │   ├── clients/     # Client management
│   │   ├── staff/       # Staff management
│   │   ├── payments/    # Payment tracking
│   │   ├── reports/     # Analytics & reports
│   │   ├── integrations/# Third-party connections
│   │   ├── notifications/# Notification preferences
│   │   ├── conversations/# WhatsApp conversations
│   │   └── settings/    # Studio settings
│   ├── dashboard/       # Client portal
│   │   ├── classes/     # Class calendar
│   │   ├── clients/     # Client directory (for teachers)
│   │   ├── settings/    # Profile & billing
│   │   └── support/     # Support chat
│   ├── teacher/         # Teacher dashboard
│   ├── login/           # Authentication
│   └── signup/          # Registration
├── components/
│   ├── dashboard/       # Dashboard widgets
│   ├── icons/           # SVG icon components
│   ├── layout/          # Sidebar, navigation
│   └── ui/              # Reusable UI components
├── lib/
│   └── config/          # App configuration
│       ├── pricing.ts   # Pricing plans
│       ├── studio-plans.ts # Client subscription config
│       ├── waitlist.ts  # Waitlist configuration
│       └── ai-support.ts # AI assistant config
└── public/              # Static assets
```

## Features in Detail

### Multi-Location Support
Manage multiple studio locations with:
- Unified admin dashboard
- Per-location staff assignment
- Location-specific class schedules
- Consolidated reporting

### Pricing Plans

**USD Pricing:**

| Plan | Monthly | Annual | Clients | Locations |
|------|---------|--------|---------|-----------|
| Starter | $99 | $79/mo | 150 | 1 |
| Growth | $179 | $143/mo | 500 | 2 |
| Business | $299 | $239/mo | 2,000 | 5 |
| Enterprise | $499 | $399/mo | Unlimited | Unlimited |

**BRL Pricing (Brazil):**

| Plano | Mensal | Anual | Clientes | Unidades |
|-------|--------|-------|----------|----------|
| Starter | R$349 | R$279/mês | 150 | 1 |
| Growth | R$629 | R$499/mês | 500 | 2 |
| Business | R$1.049 | R$839/mês | 2.000 | 5 |
| Enterprise | R$1.749 | R$1.399/mês | Ilimitado | Ilimitado |

> **Note:** All plans include unlimited team members. Annual billing saves 20%.

**Plan Features:**

| Feature | Starter | Growth | Business | Enterprise |
|---------|:-------:|:------:|:--------:|:----------:|
| Client Management | 150 | 500 | 2,000 | Unlimited |
| Locations | 1 | 2 | 5 | Unlimited |
| Team Members | Unlimited | Unlimited | Unlimited | Unlimited |
| Class Scheduling | Basic | Advanced | Advanced | Advanced |
| Smart Waitlist | - | Basic | Priority | Priority |
| WhatsApp Bot (BR) / SMS (US) | - | 500 msg/mo | 2,000 msg/mo | Unlimited |
| Reports & Analytics | Basic | Advanced | Advanced | Custom |
| Integrations (Wellhub, ClassPass) | - | Basic | Full | Full |
| API Access | - | - | Read-only | Full |
| Priority Support | Email | Email + Chat | Priority | Dedicated |
| Custom Branding | - | - | - | White Label |

**Add-ons:**

| Add-on | USD | BRL | Description |
|--------|-----|-----|-------------|
| Extra Storage | $15/mo per 50GB | R$49/mês por 50GB | Cloud storage for photos & documents |
| SMS Pack | $25/mo for 1,000 SMS | R$79/mês por 1.000 SMS | Additional SMS credits |
| Advanced Reports | Coming Soon | Em Breve | Custom report builder |
| White Label | Coming Soon | Em Breve | Remove FlexiWell branding |

### Integrations

- **Marketplace**: Wellhub (Gympass), ClassPass
- **Payments**: Stripe, PayPal (coming soon)
- **Scheduling**: Google Calendar, Zoom
- **Marketing**: Mailchimp
- **Analytics**: Google Analytics

### WhatsApp Bot Features
- Automated class reminders
- Booking confirmations
- Payment notifications
- AI-powered support assistant

## Roadmap

- [ ] Backend API implementation
- [ ] Authentication (NextAuth.js)
- [ ] Database integration (Prisma + PostgreSQL)
- [ ] Stripe payment processing
- [ ] WhatsApp Business API
- [ ] Mobile app (React Native)
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

**Ana** - [@not-ana](https://github.com/not-ana)

Project Link: [https://github.com/not-ana/flexiwell-crm](https://github.com/not-ana/flexiwell-crm)

---

Built with Next.js and Tailwind CSS
