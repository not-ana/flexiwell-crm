# FlexiWell CRM — Client Validation Process

How to validate that FlexiWell reduces churn and improves revenue for new studio clients.

---

## 1. Studio Onboarding (Day 0)

### What the studio provides

1. **Mindbody client export** (CSV) — full client list with emails, phone numbers, plan types
2. **Mindbody class history export** (CSV) — visit history for the last 3-6 months minimum
3. **OR connect Mindbody API** — Site ID, API key, staff credentials for automatic sync (preferred)
4. **Current monthly revenue** — if not available from payment data, the studio provides this number
5. **Twilio account** — or you create one on their behalf and configure SMS bot

### What you do during setup

1. Import clients and visit history into FlexiWell
2. Configure SMS bot with Twilio credentials and sensible defaults
3. Pre-configure the intake form (don't expose the builder to the studio)
4. Set up staff accounts (teacher role for instructors)
5. Enable waitlist with default settings
6. Enable all proactive SMS messages (reminders, nudges, streak alerts, low credits)
7. Walk the studio owner through the dashboard and client checkup screen

---

## 2. Baseline Snapshot (Day 0)

After import, the system automatically calculates everything below. Document these numbers — they are your "before" picture.

| Metric | Where to find it | How to record |
|--------|-------------------|---------------|
| Total clients | Dashboard → Clients | Count |
| Active clients | Dashboard → Clients | Count |
| Health score distribution | Client Check-up | Count per tier: healthy / watch / at-risk / critical |
| At-risk + critical clients | Client Check-up | Count and percentage of total |
| Attendance rate | Dashboard → Attendance | Percentage |
| No-show rate | Dashboard → Attendance | Percentage |
| Monthly revenue | Dashboard → Revenue (or studio-provided) | Dollar amount |
| Average visits per client | Calculated from visit history | Number |
| Clients gone cold (10+ days) | Client Check-up → "Gone Cold" signal | Count |
| Broken streaks | Client Check-up → "Streak Broken" signal | Count |

Screenshot the dashboard and client checkup page. Save them with the date.

---

## 3. Weekly Routine

Every week (pick a fixed day, Monday or Tuesday works best):

### Review the Client Check-up

1. Open **Client Check-up** in the admin sidebar
2. Review clients sorted by health score (worst first)
3. For each critical and high-priority client:
   - Read the detected signal (gone cold, attendance dropping, no-shows spiking, etc.)
   - Review the suggested intervention and message template
   - Edit the message if needed
   - Send the SMS intervention
4. Log how many interventions you sent and to which severity tier

### Track intervention outcomes

After 1-2 weeks, check if clients who received interventions:
- Booked a class (moved from critical/at-risk toward watch/healthy)
- Responded to SMS
- Remained inactive (intervention failed — may need phone call or different approach)

### Weekly numbers to record

| Metric | Source |
|--------|--------|
| Total at-risk clients | Client Check-up summary |
| Critical / High / Medium / Low breakdown | Client Check-up summary |
| Newly at-risk (this week) | Client Check-up summary |
| Improved (moved up a tier) | Client Check-up summary |
| Interventions sent | Your log |
| Intervention success rate | Manual check — did the client return? |

---

## 4. Monthly Review

At the end of each month, compare all KPIs against the baseline and the previous month.

### Monthly comparison table

| Metric | Baseline (Month 0) | Month 1 | Month 2 | Month 3 |
|--------|--------------------:|--------:|--------:|--------:|
| Active clients | | | | |
| New clients joined | | | | |
| Clients churned | | | | |
| Net client change | | | | |
| Monthly revenue | | | | |
| Revenue change vs baseline | | | | |
| Attendance rate | | | | |
| No-show rate | | | | |
| At-risk client count | | | | |
| At-risk % of total | | | | |
| Health score avg | | | | |
| Interventions sent (total) | | | | |
| Intervention success rate | | | | |
| Waitlist fills | | | | |
| Revenue recovered from waitlist | | | | |
| Onboarding completion rate (new clients reaching phase 5+ in 14 days) | | | | |

### What to look for

- **Churn decreasing:** at-risk count and percentage should trend down month over month
- **Revenue stable or growing:** even if client count is flat, reduced churn = retained revenue
- **Attendance improving:** more visits per client = healthier base
- **No-shows decreasing:** SMS reminders and nudges should reduce this
- **New client activation:** onboarding flow should get new clients to their 3rd class faster

---

## 5. What Drives the Results

These are the FlexiWell features doing the actual work. Make sure they stay active.

| Feature | What it does | Why it matters |
|---------|-------------|----------------|
| **Client Check-up** | Weekly early-warning system with 7 churn signals | Catches at-risk clients before they disappear |
| **SMS Interventions** | Templated messages sent to at-risk clients | Personal outreach at scale |
| **SMS Bot — Proactive messages** | Automated reminders, nudges, streak alerts, low credits | Keeps engaged clients engaged |
| **SMS Bot — Booking keywords** | Clients book/cancel/check plan via text | Removes friction = more bookings |
| **Onboarding flow** | 8-phase behavioral journey for new clients | Catches disengaged new clients in the first 14 days |
| **Staff alerts** | Auto-generated when onboarding stalls or feedback is negative | Human follow-up when automation isn't enough |
| **Waitlist auto-fill** | Fills cancelled spots from waitlist automatically | Recovers revenue from cancellations |
| **Health scoring** | 0-100 score based on attendance, utilization, recency, payments | Single number to track each client's trajectory |

---

## 6. What to Hide During Validation

These features are either not built yet or not necessary for proving the core value. Keep them out of the studio owner's view.

| Feature | Reason to hide |
|---------|---------------|
| Subscription / billing page | FlexiWell's own SaaS billing — not built yet, not relevant to validation |
| Intake form builder | Pre-configure it yourself. The studio doesn't need to see the builder |
| Staff management settings | You handle setup. Studio owner doesn't need to manage this yet |
| Waitlist settings | Enable with defaults. No need to expose configuration surface |
| Advanced reporting / exports | Dashboard metrics are sufficient for validation |
| Multi-studio support | Not built, not needed |
| Custom branding | Not built, not needed |
| Public-facing class schedule | Not built, not needed |

---

## 7. What You Don't Build During Validation

Focus only on what proves the value proposition. Everything else waits.

- FlexiWell subscription billing (SaaS billing for studios)
- Marketing site improvements
- Multi-studio / franchise support
- Advanced reporting and data exports
- Studio branding / white-label
- Public class schedule or booking page
- E-commerce / product shop

---

## 8. Decision Point (Month 3)

After 3 months, you should have enough data to answer:

1. **Did at-risk client count decrease?** Compare month 3 vs baseline percentage
2. **Did revenue hold or grow?** Compare month 3 vs baseline
3. **Did attendance improve?** Compare month 3 rate vs baseline
4. **Did no-shows decrease?** Compare month 3 rate vs baseline
5. **Are new clients activating faster?** Onboarding completion rate trend
6. **Is the studio owner using the system?** Weekly check-up engagement

If the answers are yes — you have a validated product with proof of ROI. Use these numbers in sales conversations with the next studios.

If the answers are mixed — identify which features drove results and which didn't, adjust the approach, and extend validation by one more month.
