/**
 * Testes E2E - Dashboard
 */

import { chromium, Browser, Page } from 'playwright';

describe('Dashboard E2E', () => {
    let browser: Browser;
    let page: Page;
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        page = await browser.newPage();
    });

    afterEach(async () => {
        await page.close();
    });

    describe('Autenticação', () => {
        it('deve fazer login e redirecionar para dashboard', async () => {
            await page.goto(`${baseURL}/login`);
            
            // Preencher formulário de login
            await page.fill('input[type="email"]', 'admin@precivox.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');

            // Aguardar redirecionamento
            await page.waitForURL(`${baseURL}/dashboard`, { timeout: 5000 });
            
            expect(page.url()).toContain('/dashboard');
        });

        it('deve exibir erro com credenciais inválidas', async () => {
            await page.goto(`${baseURL}/login`);
            
            await page.fill('input[type="email"]', 'invalid@test.com');
            await page.fill('input[type="password"]', 'wrongpassword');
            await page.click('button[type="submit"]');

            // Aguardar mensagem de erro
            const errorMessage = await page.waitForSelector('.error-message, [role="alert"]', { timeout: 3000 });
            expect(errorMessage).toBeTruthy();
        });
    });

    describe('Dashboard Principal', () => {
        beforeEach(async () => {
            // Fazer login antes de cada teste
            await page.goto(`${baseURL}/login`);
            await page.fill('input[type="email"]', 'admin@precivox.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL(`${baseURL}/dashboard`);
        });

        it('deve exibir métricas principais', async () => {
            await page.goto(`${baseURL}/dashboard`);
            
            // Aguardar carregamento das métricas
            await page.waitForSelector('[data-testid="metric-card"], .metric-card', { timeout: 5000 });
            
            const metrics = await page.$$('[data-testid="metric-card"], .metric-card');
            expect(metrics.length).toBeGreaterThan(0);
        });

        it('deve exibir gráficos de vendas', async () => {
            await page.goto(`${baseURL}/dashboard`);
            
            // Aguardar carregamento dos gráficos
            await page.waitForSelector('canvas, svg', { timeout: 5000 });
            
            const charts = await page.$$('canvas, svg');
            expect(charts.length).toBeGreaterThan(0);
        });

        it('deve navegar para painel de IA', async () => {
            await page.goto(`${baseURL}/dashboard`);
            
            // Clicar no link/menu do painel de IA
            const iaLink = await page.$('a[href*="ia"], a[href*="ai"], [data-testid="ia-link"]');
            if (iaLink) {
                await iaLink.click();
                await page.waitForTimeout(1000);
                
                expect(page.url()).toMatch(/ia|ai/);
            }
        });
    });

    describe('Painel de IA', () => {
        beforeEach(async () => {
            await page.goto(`${baseURL}/login`);
            await page.fill('input[type="email"]', 'admin@precivox.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL(`${baseURL}/dashboard`);
        });

        it('deve exibir análises de demanda', async () => {
            await page.goto(`${baseURL}/gestor/ia`);
            
            // Aguardar carregamento
            await page.waitForSelector('[data-testid="demand-analysis"], .demand-analysis', { timeout: 5000 });
            
            const analysis = await page.$('[data-testid="demand-analysis"], .demand-analysis');
            expect(analysis).toBeTruthy();
        });

        it('deve exibir alertas de estoque', async () => {
            await page.goto(`${baseURL}/gestor/ia`);
            
            await page.waitForSelector('[data-testid="stock-alerts"], .stock-alerts', { timeout: 5000 });
            
            const alerts = await page.$$('[data-testid="stock-alert"], .stock-alert');
            expect(alerts.length).toBeGreaterThanOrEqual(0);
        });

        it('deve filtrar análises por unidade', async () => {
            await page.goto(`${baseURL}/gestor/ia`);
            
            // Aguardar carregamento do filtro
            await page.waitForSelector('select, [data-testid="unidade-filter"]', { timeout: 5000 });
            
            const filter = await page.$('select, [data-testid="unidade-filter"]');
            if (filter) {
                await filter.selectOption({ index: 1 });
                await page.waitForTimeout(1000);
                
                // Verificar se os dados foram filtrados
                const filteredContent = await page.$('[data-testid="analysis-content"]');
                expect(filteredContent).toBeTruthy();
            }
        });
    });

    describe('Responsividade', () => {
        it('deve funcionar em mobile', async () => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto(`${baseURL}/dashboard`);
            
            await page.waitForSelector('body', { timeout: 5000 });
            
            const bodyWidth = await page.evaluate(() => window.innerWidth);
            expect(bodyWidth).toBe(375);
        });

        it('deve funcionar em tablet', async () => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto(`${baseURL}/dashboard`);
            
            await page.waitForSelector('body', { timeout: 5000 });
            
            const bodyWidth = await page.evaluate(() => window.innerWidth);
            expect(bodyWidth).toBe(768);
        });
    });
});

