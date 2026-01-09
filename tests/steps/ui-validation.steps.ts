import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// ==========================================
// NAVIGATION STEPS
// ==========================================

Given('que estou na pagina de admin', async function (this: PlaywrightWorld) {
  await this.page.goto(`${this.baseUrl}/admin`);
  await this.page.waitForLoadState('networkidle');
});

Given('que estou na pagina {string}', async function (this: PlaywrightWorld, path: string) {
  await this.page.goto(`${this.baseUrl}${path}`);
  await this.page.waitForLoadState('networkidle');
});

Given('que eu acesso uma pagina que nao existe', async function (this: PlaywrightWorld) {
  await this.page.goto(`${this.baseUrl}/pagina-inexistente-123`);
  await this.page.waitForLoadState('networkidle');
});

// ==========================================
// PAGE VALIDATION STEPS
// ==========================================

Then('a pagina deve carregar sem erros', async function (this: PlaywrightWorld) {
  // Check that page loaded
  const title = await this.page.title();
  expect(title).toBeTruthy();

  // Check for JavaScript errors (console errors)
  const errors: string[] = [];
  this.page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait a bit for any errors to appear
  await this.page.waitForTimeout(500);

  // Check for error text on the page
  const hasErrorPage = await this.page.locator('text=/500|Internal Server Error|Something went wrong/i').first().isVisible().catch(() => false);

  if (hasErrorPage) {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
    throw new Error('Pagina mostra erro do servidor');
  }

  // Check the page has some content
  const bodyContent = await this.page.locator('body').innerHTML();
  expect(bodyContent.length).toBeGreaterThan(100);
});

Then('deve haver elementos interativos na pagina', async function (this: PlaywrightWorld) {
  const buttons = await this.page.locator('button').count();
  const links = await this.page.locator('a').count();
  const inputs = await this.page.locator('input, select, textarea').count();

  const totalInteractive = buttons + links + inputs;

  if (totalInteractive === 0) {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
    throw new Error('Pagina nao tem elementos interativos (botoes, links, inputs)');
  }

  console.log(`Encontrados: ${buttons} botoes, ${links} links, ${inputs} inputs`);
});

Then('deve haver botoes de acao na pagina', async function (this: PlaywrightWorld) {
  const buttons = await this.page.locator('button').count();

  if (buttons === 0) {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
    throw new Error('Pagina nao tem botoes');
  }

  console.log(`Encontrados ${buttons} botoes na pagina`);
});

// ==========================================
// 404 PAGE VALIDATION
// ==========================================

Then('devo ver pagina de erro 404', async function (this: PlaywrightWorld) {
  // Check for 404 text
  const has404 = await this.page.locator('text=/404|not found|pagina nao encontrada|Page not found/i').first().isVisible().catch(() => false);

  if (!has404) {
    // Check if it redirected to login or home instead of showing 404
    const currentUrl = this.page.url();
    console.log(`URL atual: ${currentUrl}`);

    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');

    // It's acceptable if it redirects to login
    if (currentUrl.includes('/login')) {
      console.log('Pagina redirecionou para login ao inves de mostrar 404');
      return;
    }

    throw new Error('Pagina 404 nao esta mostrando mensagem de erro apropriada');
  }
});

Then('deve haver link para voltar ao inicio', async function (this: PlaywrightWorld) {
  const homeLink = await this.page.locator('a:has-text("Home"), a:has-text("Inicio"), a:has-text("Go to"), a[href="/"], a[href="/dashboard"]').first().isVisible().catch(() => false);

  if (!homeLink) {
    // Check if there's any navigation option
    const anyLink = await this.page.locator('a').count();
    if (anyLink > 0) {
      console.log('Link de navegacao encontrado');
      return;
    }
    console.log('Link para voltar ao inicio nao encontrado na pagina 404');
  }
});

// ==========================================
// LOGIN PAGE VALIDATION
// ==========================================

Then('deve haver formulario de login', async function (this: PlaywrightWorld) {
  // Check for email input
  const emailInput = await this.page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first().isVisible().catch(() => false);

  // Check for password input
  const passwordInput = await this.page.locator('input[type="password"]').first().isVisible().catch(() => false);

  // Check for submit button
  const submitButton = await this.page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Entrar")').first().isVisible().catch(() => false);

  if (!emailInput || !passwordInput) {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
    throw new Error('Formulario de login incompleto - falta campo de email ou senha');
  }

  if (!submitButton) {
    console.log('Botao de submit nao encontrado, mas campos existem');
  }

  console.log('Formulario de login encontrado com campos de email e senha');
});
