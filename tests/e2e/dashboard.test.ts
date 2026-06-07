/**
 * Testes E2E — Playwright + Jest
 *
 * Local: npm run playwright:install && npm run dev
 * CI: .github/workflows/e2e.yml (E2E_LOGIN=true)
 */

import { chromium, Browser, Page } from 'playwright';

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@precivox.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'senha123';
const runLoginFlow = process.env.E2E_LOGIN === 'true';

describe('Dashboard E2E', () => {
  let browser: Browser | undefined;
  let page: Page | undefined;

  beforeAll(async () => {
    try {
      browser = await chromium.launch({ headless: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.CI === 'true') {
        throw new Error(`Playwright obrigatório no CI: ${msg}`);
      }
      console.warn('[e2e] Playwright indisponível:', msg);
      console.warn('[e2e] Execute: npm run playwright:install:ci');
      browser = undefined;
    }
  });

  afterAll(async () => {
    await browser?.close();
  });

  beforeEach(async () => {
    if (!browser) return;
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page?.close();
    page = undefined;
  });

  function skipIfNoBrowser(): boolean {
    if (!browser || !page) {
      console.warn('[e2e] Ignorado: browser Playwright indisponível');
      return true;
    }
    return false;
  }

  describe('Smoke público', () => {
    it('página de login carrega com formulário', async () => {
      if (skipIfNoBrowser()) return;
      await page!.goto(`${baseURL}/login`);
      await page!.waitForLoadState('domcontentloaded');
      await page!.waitForSelector('input[type="email"]', { timeout: 15000 });
      const loginBtn = page!.getByRole('button', { name: /^login$/i });
      expect(await loginBtn.count()).toBeGreaterThan(0);
    });

    it('API pública de stats responde', async () => {
      if (skipIfNoBrowser()) return;
      const res = await page!.request.get(`${baseURL}/api/stats/global`);
      expect(res.ok()).toBe(true);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe('Autenticação', () => {
    it('deve fazer login e redirecionar para área autenticada', async () => {
      if (!runLoginFlow) {
        console.warn('[e2e] Login skipped (defina E2E_LOGIN=true)');
        return;
      }
      if (skipIfNoBrowser()) return;

      await page!.goto(`${baseURL}/login`);
      await page!.fill('input[type="email"]', ADMIN_EMAIL);
      await page!.fill('input[type="password"]', ADMIN_PASSWORD);
      await page!.getByRole('button', { name: /^login$/i }).click();

      await page!.waitForURL(/\/(admin\/dashboard|gestor\/home|cliente\/busca)/, {
        timeout: 20000,
      });
      expect(page!.url()).toMatch(/\/(admin\/dashboard|gestor\/home|cliente\/busca)/);
    });
  });
});
