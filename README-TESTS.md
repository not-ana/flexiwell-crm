# 🧪 Testing Guide - FlexiWell CRM

Complete documentation on how to write and run tests in FlexiWell.

## 📦 Installed Tools

- **Vitest** - Unit and integration tests (fast, Vite-compatible)
- **Playwright** - E2E tests (simulates real user)
- **Testing Library** - React component testing
- **jsdom** - Browser environment simulation for tests

## 🚀 Available Commands

```bash
# Run all tests (watch mode)
npm test

# Run tests once
npm run test:run

# Run with code coverage
npm run test:coverage

# Visual Vitest interface
npm run test:ui

# E2E tests with Playwright
npm run test:e2e

# E2E tests in UI mode (with visual interface)
npx playwright test --ui

# View Playwright report
npx playwright show-report
```

## 📁 Directory Structure

```
flexiwell-crm/
├── tests/
│   ├── setup.ts              # Global test configuration
│   ├── unit/                 # Unit tests
│   │   ├── formatters.test.ts
│   │   ├── phone.test.ts
│   │   └── simple.test.ts
│   ├── integration/          # Integration tests
│   │   └── booking.service.test.ts
│   └── components/           # Component tests
│       └── OnboardingModal.test.tsx
├── e2e/                      # E2E tests
│   ├── auth.spec.ts
│   └── booking.spec.ts
├── vitest.config.ts          # Vitest config
└── playwright.config.ts      # Playwright config
```

## 📝 Test Types

### 1️⃣ Unit Tests

**When to use:** Pure functions, utils, helpers

**Example:**
```typescript
// tests/unit/formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/utils/formatters'

describe('formatCurrency', () => {
  it('should format BRL correctly', () => {
    expect(formatCurrency(100, 'BRL', 'pt-BR')).toContain('100')
  })
})
```

### 2️⃣ Integration Tests

**When to use:** Interaction between multiple modules (services, API, database)

**Example:**
```typescript
// tests/integration/booking.service.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('Booking Service', () => {
  it('should create booking and send notification', async () => {
    // Test interaction between booking and notification service
  })
})
```

### 3️⃣ Component Tests

**When to use:** React components with interactions

**Example:**
```typescript
// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

### 4️⃣ E2E Tests

**When to use:** Complete application flows

**Example:**
```typescript
// e2e/booking.spec.ts
import { test, expect } from '@playwright/test'

test('should complete booking flow', async ({ page }) => {
  await page.goto('/')
  // Simulate entire user flow
})
```

## 🎯 Best Practices

### ✅ DO

- Write tests for functions with business logic
- Test edge cases
- Use descriptive test names
- Mock only what's necessary
- Test behavior, not implementation

### ❌ DON'T

- Don't test external libraries
- Don't duplicate tests
- Don't test implementation details
- Avoid overly complex tests

## 📊 Code Coverage

After running `npm run test:coverage`, you'll see:

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
lib/utils/formatters|   95.00 |    90.00 |   100.0 |   95.00
```

**Suggested target:**
- **80%+** for critical code (services, utils)
- **60%+** for general code
- **40%+** for UI components

## 🔧 Debugging

### Vitest
```bash
# Run specific test
npm test -- formatters.test.ts

# Debug mode
npm test -- --inspect-brk
```

### Playwright
```bash
# Interactive debug mode
npx playwright test --debug

# Run specific test
npx playwright test auth.spec.ts

# View trace of failed test
npx playwright show-trace trace.zip
```

## 🌐 Environment Variables for Tests

Create `.env.test`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/test

# Auth
JWT_SECRET=test-secret
NEXTAUTH_SECRET=test-nextauth-secret

# Test user credentials
TEST_USER_EMAIL=test@flexiwell.com
TEST_USER_PASSWORD=Test123!
```

## 📚 Resources

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🎓 Next Steps

1. Write tests for your existing utils functions
2. Add tests for critical services (booking, notifications)
3. Create E2E tests for main flows (login, booking, payment)
4. Configure CI/CD to run tests automatically
5. Monitor code coverage and gradually increase

---

**Questions?** Check documentation or ask the team! 🚀
