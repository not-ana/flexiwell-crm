# FlexiWell CRM - Incomplete Features Audit

This document tracks all incomplete features that need backend implementation or frontend fixes.

## Priority Levels
- **P0** - Critical: Blocks core user workflows
- **P1** - High: Important for user experience
- **P2** - Medium: Nice to have
- **P3** - Low: Future enhancement

---

## Dashboard (Client Side)

### /app/dashboard/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 16 | TODO: Get user data from auth context | P0 | Pending | Yes - Auth API |

### /app/dashboard/settings/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 40 | "Change photo" button - no handler | P1 | Pending | Yes - File upload API |
| 122-123 | Cancel/Save buttons - no handlers | P0 | Pending | Yes - User update API |
| 197-199 | "Change plan" button - no handler | P1 | Pending | Yes - Subscription API |
| 218-219 | "Update" payment method - no handler | P1 | Pending | Yes - Stripe integration |
| 250-251 | "Download" invoice - no handler | P1 | Pending | Yes - Invoice API |

### /app/dashboard/clients/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 263-265 | Filter button - no implementation | P1 | Pending | No |
| 345 | "View" button - no handler | P1 | Pending | No - Navigation only |
| 362-366 | Pagination - disabled | P1 | Pending | Yes - Paginated API |

### /app/dashboard/clients/add/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 248 | "View examples" - no handler | P3 | Pending | No |

### /app/dashboard/classes/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 585 | RequestModal onSubmit empty | P0 | Pending | Yes - Class request API |

### /app/dashboard/support/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 266 | Attach file button - no handler | P2 | Pending | Yes - File upload API |
| 278 | Emoji button - no handler | P3 | Pending | No |

---

## Admin Side

### /app/admin/staff/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 386 | Resend invite - console.log only | P1 | Pending | Yes - Email API |
| 387 | Edit staff - console.log only | P1 | Pending | Yes - Staff API |
| 388 | Deactivate staff - console.log only | P1 | Pending | Yes - Staff API |
| 450 | "Add Staff Member" - no onClick | P0 | Pending | No - Modal trigger |

### /app/admin/integrations/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 110-122 | Coming Soon integrations (Mindbody, Square) | P2 | Planned | Yes - Integration APIs |
| 285-305 | Toggle switches - visual only | P1 | Pending | Yes - Integration settings API |
| 326 | "Save Changes" - no handler | P0 | Pending | Yes - Settings API |

### /app/admin/notifications/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 197 | "Save changes" - no handler | P0 | Pending | Yes - Notification prefs API |

### /app/admin/reports/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 142 | "Export Report" - no handler | P1 | Pending | Yes - Report generation API |

### /app/admin/conversations/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 323 | "View Profile" - no handler | P2 | Pending | No - Navigation only |

### /app/admin/support/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 230 | Download file - no handler | P2 | Pending | Yes - File download API |

---

## Teacher Side

### /app/teacher/page.tsx
| Line | Issue | Priority | Status | Backend Needed |
|------|-------|----------|--------|----------------|
| 639-642 | Walk-in submission - console.log only | P0 | Pending | Yes - Walk-in API |

---

## Summary by Priority

### P0 - Critical (7 items)
1. Dashboard user auth context
2. Dashboard settings save buttons
3. Class request modal submission
4. Admin staff "Add Staff Member" button
5. Admin integrations save changes
6. Admin notifications save changes
7. Teacher walk-in submission

### P1 - High (12 items)
1. Dashboard change photo
2. Dashboard change plan
3. Dashboard update payment
4. Dashboard download invoice
5. Clients filter implementation
6. Clients view button
7. Clients pagination
8. Staff resend invite
9. Staff edit
10. Staff deactivate
11. Integration toggles
12. Export report

### P2 - Medium (4 items)
1. Support file attachment
2. Coming Soon integrations
3. Conversations view profile
4. Support file download

### P3 - Low (2 items)
1. Add client "View examples"
2. Support emoji button

---

## Backend API Requirements

### Authentication & User
- `GET /api/auth/user` - Current user info
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/avatar` - Upload avatar

### Subscription & Billing
- `GET /api/subscriptions/current` - Current plan
- `PUT /api/subscriptions/change` - Change plan
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id/download` - Download invoice
- `PUT /api/payment-methods` - Update payment method

### Staff Management
- `GET /api/staff` - List staff
- `POST /api/staff` - Create staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Deactivate staff
- `POST /api/staff/:id/resend-invite` - Resend invite

### Classes & Bookings
- `POST /api/classes/:id/request` - Submit request (cancel/reschedule)
- `POST /api/classes/:id/walk-in` - Add walk-in student
- `GET /api/classes` - List classes (with pagination)

### Integrations
- `GET /api/integrations` - List integrations
- `PUT /api/integrations/:id` - Update integration settings
- `POST /api/integrations/:id/connect` - Connect integration
- `DELETE /api/integrations/:id/disconnect` - Disconnect

### Reports
- `POST /api/reports/export` - Generate and download report

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id/download` - Download file

### Notifications
- `GET /api/notification-preferences` - Get preferences
- `PUT /api/notification-preferences` - Update preferences

---

## Next Steps

1. Prioritize P0 items for immediate fix (UI only - add toast/alert placeholders)
2. Define API contracts for backend team
3. Implement placeholder handlers that show "Coming soon" toast
4. Create proper types/interfaces for API responses
