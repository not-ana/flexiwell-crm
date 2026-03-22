/**
 * Environment Guard
 *
 * Validates that environment variables are consistent with NODE_ENV.
 * Prevents mixing test/dev credentials in production and vice-versa.
 *
 * Called at app startup via Next.js instrumentation hook.
 */

type EnvIssue = { level: "error" | "warn"; message: string };

export function validateEnvironment(): void {
  const issues = getEnvironmentIssues();

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warn");

  for (const w of warnings) {
    console.warn(`⚠️  ENV WARNING: ${w.message}`);
  }

  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`❌ ENV ERROR: ${e.message}`);
    }
    throw new Error(
      `Environment validation failed with ${errors.length} error(s). Fix your environment variables before deploying.`
    );
  }

  if (warnings.length === 0 && errors.length === 0) {
    console.log(
      `✅ Environment validated (${process.env.NODE_ENV || "development"})`
    );
  }
}

function getEnvironmentIssues(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const isProd = process.env.NODE_ENV === "production";

  // --- Database ---
  const dbName =
    process.env.MONGODB_DB_NAME ||
    (isProd ? "flexiwell" : "flexiwell-dev");

  if (isProd && dbName.includes("-dev")) {
    issues.push({
      level: "error",
      message: `Production is using dev database "${dbName}". Set MONGODB_DB_NAME=flexiwell for production.`,
    });
  }

  if (!isProd && dbName === "flexiwell") {
    issues.push({
      level: "error",
      message: `Development is pointing to production database "flexiwell". Set MONGODB_DB_NAME=flexiwell-dev (or remove it).`,
    });
  }

  // --- Stripe ---
  const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
  const stripePub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  if (isProd && stripeSecret.startsWith("sk_test_")) {
    issues.push({
      level: "error",
      message:
        "Production is using Stripe TEST secret key (sk_test_*). Use sk_live_* in production.",
    });
  }

  if (isProd && stripePub.startsWith("pk_test_")) {
    issues.push({
      level: "error",
      message:
        "Production is using Stripe TEST publishable key (pk_test_*). Use pk_live_* in production.",
    });
  }

  if (!isProd && stripeSecret.startsWith("sk_live_")) {
    issues.push({
      level: "error",
      message:
        "Development is using Stripe LIVE secret key (sk_live_*). Use sk_test_* in development.",
    });
  }

  if (!isProd && stripePub.startsWith("pk_live_")) {
    issues.push({
      level: "error",
      message:
        "Development is using Stripe LIVE publishable key (pk_live_*). Use pk_test_* in development.",
    });
  }

  // --- Required vars in production ---
  if (isProd) {
    const required = [
      "MONGODB_URI",
      "JWT_SECRET",
      "JWT_REFRESH_SECRET",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
    ];

    for (const key of required) {
      if (!process.env[key]) {
        issues.push({
          level: "error",
          message: `Required variable ${key} is missing in production.`,
        });
      }
    }

    // Weak secrets
    const jwtSecret = process.env.JWT_SECRET || "";
    if (
      jwtSecret &&
      (jwtSecret.length < 32 || jwtSecret.includes("change-me"))
    ) {
      issues.push({
        level: "error",
        message:
          "JWT_SECRET is too weak or still the placeholder. Generate one with: openssl rand -base64 32",
      });
    }
  }

  // --- Warnings (non-blocking) ---
  if (!isProd && !process.env.MONGODB_URI) {
    issues.push({
      level: "warn",
      message:
        "MONGODB_URI is not set. The app will run but database features won't work.",
    });
  }

  return issues;
}
