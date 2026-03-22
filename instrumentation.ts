export async function register() {
  const { validateEnvironment } = await import("./lib/config/env-guard");
  validateEnvironment();
}
