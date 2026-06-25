/**
 * E2E — fluxos de autenticação TokenManager (login, me, refresh, logout)
 *
 * CI: E2E_LOGIN=true + npm run db:seed (ver .github/workflows/e2e.yml)
 */

import { chromium, Browser, APIRequestContext } from 'playwright';

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@precivox.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'senha123';
const runAuthFlow = process.env.E2E_LOGIN === 'true';

describe('Auth E2E (TokenManager)', () => {
  let browser: Browser | undefined;
  let request: APIRequestContext | undefined;

  beforeAll(async () => {
    try {
      browser = await chromium.launch({ headless: true });
      request = await browser.newContext({ baseURL }).then((ctx) => ctx.request);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.CI === 'true') {
        throw new Error(`Playwright obrigatório no CI: ${msg}`);
      }
      console.warn('[e2e/auth] Playwright indisponível:', msg);
      browser = undefined;
      request = undefined;
    }
  });

  afterAll(async () => {
    await request?.dispose();
    await browser?.close();
  });

  function skipIfNoRequest(): boolean {
    if (!request) {
      console.warn('[e2e/auth] Ignorado: request context indisponível');
      return true;
    }
    return false;
  }

  describe('API TokenManager', () => {
    it('/api/auth/me retorna 401 sem sessão', async () => {
      if (skipIfNoRequest()) return;
      const res = await request!.get('/api/auth/me');
      expect(res.status()).toBe(401);
    });

    it('login → me → refresh (rotação) → logout', async () => {
      if (!runAuthFlow) {
        console.warn('[e2e/auth] Fluxo completo skipped (E2E_LOGIN=true)');
        return;
      }
      if (skipIfNoRequest()) return;

      const loginRes = await request!.post('/api/auth/login', {
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });

      if (!loginRes.ok()) {
        const errBody = await loginRes.text();
        if (process.env.CI !== 'true') {
          console.warn(
            `[e2e/auth] login API ${loginRes.status()} — execute npm run db:seed?`,
            errBody.slice(0, 200),
          );
          return;
        }
      }

      expect(loginRes.ok()).toBe(true);
      const loginJson = await loginRes.json();
      expect(loginJson.success).toBe(true);
      expect(loginJson.accessToken).toBeTruthy();
      expect(loginJson.refreshToken).toBeTruthy();
      expect(loginJson.user?.role).toBe('ADMIN');

      const meRes = await request!.get('/api/auth/me');
      expect(meRes.ok()).toBe(true);
      const meJson = await meRes.json();
      expect(meJson.success).toBe(true);
      expect(meJson.user?.email).toBe(ADMIN_EMAIL);

      const refreshRes = await request!.post('/api/auth/refresh', {
        data: { refreshToken: loginJson.refreshToken },
      });
      expect(refreshRes.ok()).toBe(true);
      const refreshJson = await refreshRes.json();
      expect(refreshJson.success).toBe(true);
      expect(refreshJson.refreshToken).not.toBe(loginJson.refreshToken);

      const reuseRes = await request!.post('/api/auth/refresh', {
        data: { refreshToken: loginJson.refreshToken },
      });
      expect(reuseRes.status()).toBe(401);

      const logoutRes = await request!.post('/api/auth/logout');
      expect(logoutRes.ok()).toBe(true);

      const meAfterLogout = await request!.get('/api/auth/me');
      expect(meAfterLogout.status()).toBe(401);
    });
  });

  describe('UI login', () => {
    it('formulário redireciona admin para dashboard', async () => {
      if (!runAuthFlow) {
        console.warn('[e2e/auth] UI login skipped (E2E_LOGIN=true)');
        return;
      }
      if (!browser) {
        skipIfNoRequest();
        return;
      }

      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();

      try {
        await page.goto('/login');
        await page.waitForSelector('input[type="email"]', { timeout: 15000 });
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.getByRole('button', { name: /^login$/i }).click();

        await page.waitForURL(
          (url) => /\/(admin\/dashboard|gestor\/home|cliente\/busca)/.test(new URL(url).pathname),
          { timeout: 20000 },
        );
        expect(new URL(page.url()).pathname).toMatch(
          /\/(admin\/dashboard|gestor\/home|cliente\/busca)/,
        );
      } finally {
        await context.close();
      }
    });
  });
});
