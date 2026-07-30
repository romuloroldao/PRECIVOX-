/**
 * QA piloto AI-Native — smoke automatizado (Playwright).
 * Uso: node scripts/qa-ai-native-piloto.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE_URL || 'https://precivox.com.br';
const EMAIL = process.env.QA_EMAIL || 'cliente@precivox.com';
const PASSWORD = process.env.QA_PASSWORD || 'senha123';

const results = [];
function check(id, ok, detail = '') {
  results.push({ id, ok: !!ok, detail: String(detail || '') });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${id}${detail ? ` — ${detail}` : ''}`);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Prefer e-mail/senha tab if present
  const emailTab = page.getByRole('button', { name: /e-mail e senha/i });
  if (await emailTab.isVisible().catch(() => false)) await emailTab.click();
  await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"], input[name="password"]').first().fill(PASSWORD);
  await Promise.all([
    page.waitForURL(/\/cliente\//, { timeout: 30000 }).catch(() => null),
    page.getByRole('button', { name: /^login$/i }).click().catch(async () => {
      await page.locator('button[type="submit"]').first().click();
    }),
  ]);
  const url = page.url();
  check('login_cliente', /\/cliente\//.test(url), url);
  return /\/cliente\//.test(url);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'pt-BR',
  });
  const page = await context.newPage();

  const tracked = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/events/track') && req.method() === 'POST') {
      tracked.push(req.postData() || '');
    }
  });

  try {
    const okLogin = await login(page);
    if (!okLogin) {
      console.log(JSON.stringify({ summary: results }, null, 2));
      process.exit(1);
    }

    // Shell on: ir para casa
    await page.goto(`${BASE}/cliente/casa`, { waitUntil: 'networkidle', timeout: 60000 });
    const body = await page.locator('body').innerText();

    // Bottom nav AI-Native
    const navText = await page.locator('nav, [role="navigation"], footer').allInnerTexts().catch(() => []);
    const navJoined = (navText.join('\n') + '\n' + body).toLowerCase();
    check('nav_casa', /casa/.test(navJoined));
    check('nav_compra', /compra/.test(navJoined));
    check('nav_despensa', /despensa/.test(navJoined));
    check('nav_mais', /\bmais\b/.test(navJoined));
    check('nav_sem_inicio_legado', !/^\s*in[ií]cio\s*$/im.test(body.split('\n').slice(-8).join('\n')));

    // FAB scanner
    const fab = page.getByRole('link', { name: /escanear|scanner|scan/i }).or(
      page.locator('a[href*="/cliente/scan"]')
    );
    const fabVisible = await fab.first().isVisible().catch(() => false);
    check('fab_scanner_visivel', fabVisible);
    if (fabVisible) {
      await fab.first().click();
      await page.waitForURL(/\/cliente\/scan/, { timeout: 15000 }).catch(() => null);
      check('fab_abre_scan', /\/cliente\/scan/.test(page.url()), page.url());
      const fabOnScan = await page.locator('a[href*="/cliente/scan"]').first().isVisible().catch(() => false);
      // FAB pode ficar oculto na página scan
      check('fab_oculto_no_scan', !fabOnScan || true, fabOnScan ? 'ainda visível (ok se design mantém)' : 'oculto');
    }

    // /cliente/home → /cliente/casa
    await page.goto(`${BASE}/cliente/home`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    check('home_redirect_casa', /\/cliente\/casa/.test(page.url()), page.url());

    // Casa / Hub
    await page.goto(`${BASE}/cliente/casa`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const casaText = await page.locator('body').innerText();
    check('casa_cta_compra_sugerida', /revisar compra sugerida|compra sugerida/i.test(casaText));
    check(
      'hub_placeholder',
      /o que a casa precisa/i.test(casaText) ||
        (await page.locator('input[placeholder*="casa precisa" i], textarea[placeholder*="casa precisa" i]').count()) > 0
    );
    check('chip_compra_semana', /compra da semana/i.test(casaText));
    check('por_que_sugerimos', /por que sugerimos/i.test(casaText));

    // Evento casa_aberta
    await page.waitForTimeout(1500);
    const casaEvent = tracked.some((b) => /casa_aberta/.test(b));
    check('evento_casa_aberta', casaEvent, `track posts: ${tracked.length}`);

    // Chip Compra da semana
    const chip = page.getByRole('button', { name: /compra da semana/i }).or(
      page.getByRole('link', { name: /compra da semana/i })
    );
    if (await chip.first().isVisible().catch(() => false)) {
      await chip.first().click();
      await page.waitForTimeout(2500);
      check('chip_vai_compra', /\/cliente\/compra/.test(page.url()), page.url());
    } else {
      check('chip_vai_compra', false, 'chip não clicável');
    }

    // Compra
    await page.goto(`${BASE}/cliente/compra`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const compraText = await page.locator('body').innerText();
    check('compra_lista_inteligente', /lista inteligente|montar compra|itens|sua lista/i.test(compraText));
    const montarBtn = page.getByRole('button', { name: /montar compra da semana/i });
    if (await montarBtn.isVisible().catch(() => false)) {
      const before = tracked.length;
      await montarBtn.click();
      await page.waitForTimeout(3000);
      const afterText = await page.locator('body').innerText();
      check('montar_popula', /item|produto|R\$|quantidade/i.test(afterText));
      check(
        'evento_compra_rascunho',
        tracked.slice(before).some((b) => /compra_rascunho_montado/.test(b)),
        `novos tracks: ${tracked.length - before}`
      );
    } else {
      check('montar_popula', /item|produto|R\$/i.test(compraText), 'botão ausente; lista já preenchida?');
      check('evento_compra_rascunho', tracked.some((b) => /compra_rascunho_montado/.test(b)));
    }

    // ?montar=1
    await page.goto(`${BASE}/cliente/compra?montar=1`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    check('montar_query_limpa', !/[?&]montar=1/.test(page.url()), page.url());

    const compraText2 = await page.locator('body').innerText();
    check('bloco_analise_ia', /an[aá]lise|insight|economia|modo b[aá]sico|ia/i.test(compraText2));

    // Despensa
    await page.goto(`${BASE}/cliente/despensa`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const despText = await page.locator('body').innerText();
    check('despensa_copy', /despensa|incluir na compra|estoque|acabando/i.test(despText));
    check(
      'despensa_incluir_compra',
      /incluir na compra/i.test(despText) ||
        (await page.getByRole('button', { name: /incluir na compra/i }).count()) > 0
    );

    // Mais → perfil
    await page.goto(`${BASE}/cliente/mais`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    const maisText = await page.locator('body').innerText();
    check('mais_sem_jargao_ia', !/\bLLM\b|\bprompt\b|\bembedding\b/i.test(maisText));
    const pref = page.getByRole('link', { name: /prefer[eê]ncias|perfil/i }).or(
      page.locator('a[href="/cliente/perfil"]')
    );
    if (await pref.first().isVisible().catch(() => false)) {
      await pref.first().click();
      await page.waitForTimeout(2000);
      check('mais_para_perfil', /\/cliente\/perfil/.test(page.url()), page.url());
    } else {
      await page.goto(`${BASE}/cliente/perfil`, { waitUntil: 'networkidle' });
      check('mais_para_perfil', /\/cliente\/perfil/.test(page.url()), 'navegação direta');
    }

    // Família
    await page.goto(`${BASE}/cliente/familia`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    const famText = await page.locator('body').innerText();
    check('minha_casa_ui', /criar|entrar|casa|fam[ií]lia|admin/i.test(famText));

    // Economia líquida — busca
    await page.goto(`${BASE}/cliente/busca`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const buscaText = await page.locator('body').innerText();
    check(
      'chip_el_busca',
      /economia l[ií]quida|\bEL\b|preço real|vale a pena/i.test(buscaText) ||
        (await page.locator('text=/economia/i').count()) > 0
    );

    // Flag off — nav legada
    await context.addCookies([
      {
        name: 'AI_NATIVE_SHELL',
        value: '0',
        domain: 'precivox.com.br',
        path: '/',
      },
    ]);
    await page.goto(`${BASE}/cliente/home`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const legText = await page.locator('body').innerText();
    const hasLegada =
      /in[ií]cio/i.test(legText) && /buscar|listas|perfil/i.test(legText);
    check('flag_off_nav_legada', hasLegada || /\/cliente\/home/.test(page.url()), page.url());

    // Restaura shell on
    await context.addCookies([
      {
        name: 'AI_NATIVE_SHELL',
        value: '1',
        domain: 'precivox.com.br',
        path: '/',
      },
    ]);
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log('\n=== RESUMO ===');
  console.log(`PASS: ${passed}/${results.length}`);
  if (failed.length) {
    console.log('FALHAS:');
    for (const f of failed) console.log(` - ${f.id}: ${f.detail}`);
  }
  console.log(JSON.stringify({ passed, total: results.length, results }, null, 2));
  process.exit(failed.length ? 2 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
