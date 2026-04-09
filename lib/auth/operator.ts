// Operator detection
// Operators are FlexiWell staff who see the full UI (settings, integrations,
// configuration) regardless of which establishment they're scoped to.
// Customer admins (studio owners) do NOT see operator surfaces.
//
// Source of truth: OPERATOR_EMAILS env var (comma-separated list).
// We also honor a per-user `isOperator` flag in the User schema for future
// DB-driven assignment, but the env var is the canonical mechanism for v1.

function getOperatorEmails(): Set<string> {
  const raw = process.env.OPERATOR_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isOperatorEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return getOperatorEmails().has(email.toLowerCase());
}
