// In-browser mirror of the Playwright suite (v2 page), for checking the live page from a browser
// when Playwright can't reach it. Paste into the DevTools console on
// https://sb-ai-adoption-page.webflow.io/intro-to-ai ; it resolves to { passed, total, failed }.
// Native sections are selected by class / data attribute only: Webflow publishes <button> as <a class="w-button">.
(async () => {
  const W = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, ms = 2000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn()) return true; await W(50); } return !!fn(); };
  const norm = (s) => s.replace(/[\s ]+/g, ' ').trim();
  const go = (el, off = 200) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - off, behavior: 'instant' });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vis = (el) => getComputedStyle(el).visibility;
  const key = (k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  const R = [];
  const t = async (name, fn) => { try { const d = await fn(); R.push({ name, pass: true, d }); } catch (e) { R.push({ name, pass: false, err: String(e.message || e) }); } };
  const ok = (c, m) => { if (!c) throw new Error(m); };
  const CH = ['why-this-page', 'what-is-ai', 'history', 'how-it-works', 'llms', 'reasoning', 'risks', 'public-interest', 'references'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  await t('embeds initialised', () => {
    ok($('.tl-root[data-tl-ready]'), 'timeline not initialised');
    ok($('.kc-root[data-kc-ready]'), 'quiz not initialised');
    ok($('.hw-root[data-hw-ready]'), 'how it works not initialised');
  });
  await t('10 section ids present, no duplicate ids', () => {
    const miss = [...CH, 'glossary'].filter((id) => document.querySelectorAll('[id="' + id + '"]').length !== 1);
    ok(!miss.length, 'missing/duplicated ' + miss);
    const c = {}; $$('[id]').forEach((e) => { c[e.id] = (c[e.id] || 0) + 1; });
    const d = Object.keys(c).filter((k) => c[k] > 1); ok(!d.length, 'duplicate ids ' + d);
  });
  await t('9 chapter links point to existing sections', () => {
    const h = $$('.chapter-nav-link').map((a) => a.getAttribute('href'));
    ok(h.join() === CH.map((x) => '#' + x).join(), 'hrefs ' + h);
  });
  await t('Risks chapter link: fast scroll, aria-current, earlier fills 100%', async () => {
    window.scrollTo({ top: 0, behavior: 'instant' }); await W(800); /* let the LLM accordions finish closing */
    $('.chapter-nav-link[href="#risks"]').click();
    const under = () => Math.abs($('#risks').getBoundingClientRect().top - $('.site-header').getBoundingClientRect().bottom) <= 8;
    ok(await until(under, 1500), 'not under header after 1.5s: off by ' + Math.round($('#risks').getBoundingClientRect().top - $('.site-header').getBoundingClientRect().bottom));
    ok(await until(() => $('.chapter-nav-link[href="#risks"]').getAttribute('aria-current') === 'location'), 'aria-current');
    await W(300);
    const f = $$('.chapter-nav-fill').map((x) => parseFloat(x.style.width) || 0);
    ok(f.slice(0, 6).every((v) => v >= 99.9) && f[7] === 0, 'fills ' + f.join(','));
  });
  if (!reduce) await t('hero words light up on scroll', async () => {
    const w = $$('#why-this-page .why3-text > span:not(.why2-pre)')[3]; ok(w, 'words not wrapped');
    window.scrollTo({ top: 0, behavior: 'instant' }); await W(150);
    const a = w.style.backgroundImage;
    go($('#why-this-page .why3-yellow'), 0); await W(250);
    ok(w.style.backgroundImage !== a, 'gradient did not move');
  });
  await t('what is AI explorer: controls show their card, page does not move', async () => {
    go($('#what-is-ai .wai-nav'), 120); await W(100);
    for (const k of ['ml', 'gen', 'llm', 'sym']) {
      const c = $('#what-is-ai .wai-nav [data-t="' + k + '"][aria-controls]'), y = scrollY;
      c.click(); await W(450);
      ok(c.getAttribute('aria-pressed') === 'true', k + ' aria-pressed');
      ok(vis($('#what-is-ai [data-item="' + k + '"]')) === 'visible', k + ' card hidden');
      ok(Math.abs(scrollY - y) <= 1, k + ' moved page ' + (scrollY - y));
    }
  });
  await t('timeline: 24 slides, arrows + ArrowRight, Lighthill credit', async () => {
    ok($$('.tl-slide').length === 24, 'slide count');
    const cnt = () => $('[data-tl-count]').textContent.replace(/\s/g, '');
    const prev = $('.tl-arrow--prev'), next = $('.tl-arrow--next');
    go($('.tl-root')); await W(300);
    while (!prev.disabled) { prev.click(); await W(60); }
    ok(cnt() === '01/24', 'start ' + cnt());
    next.click(); await W(200); ok(cnt() === '02/24', 'after next ' + cnt());
    $('.tl-root').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await W(200);
    ok(cnt() === '03/24', 'after ArrowRight ' + cnt());
    prev.click(); prev.click(); await W(200); ok(cnt() === '01/24' && prev.disabled, 'back ' + cnt());
    const s = $$('.tl-slide').find((x) => /^1973$/.test(norm(x.querySelector('.tl-year')?.textContent || '')));
    ok(s && /Science Research Council/.test(s.textContent), 'Lighthill credit');
  });
  await t('quiz: 10 questions to result, Escape closes', async () => {
    const d = $('dialog.kc-sheet');
    $('[data-kc-open]').click(); await W(300); ok(d.open, 'not open');
    for (let i = 0; i < 10; i++) {
      d.querySelector('.kc-ans').click(); await W(80);
      ok(d.querySelector('.kc-res'), 'no feedback q' + (i + 1));
      d.querySelector('[data-next]').click(); await W(80);
    }
    ok(/\d+\/10/.test(d.querySelector('.kc-score')?.textContent || ''), 'no result');
    d.dispatchEvent(new Event('cancel', { cancelable: true })); await W(500); ok(!d.open, 'still open');
  });
  await t('how it works: 6 steps, Next, Start over, Restart', async () => {
    const r = $('#how-it-works .hw-root[data-hw-ready]'); ok(r, 'not ready');
    ok($$('.hw-rail .hw-seg', r).length === 6, 'segments');
    const st = () => $('.hw-status', r).textContent, lab = () => $('[data-next-label]', r).textContent;
    $('.hw-rst', r).click(); await W(100); ok(st() === 'Step 1 of 6', 'restart ' + st());
    $('.hw-next', r).click(); await W(100); ok(st() === 'Step 2 of 6', 'next ' + st());
    for (let i = 0; i < 40 && lab() !== 'Start over'; i++) { $('.hw-next', r).click(); await W(20); }
    ok(lab() === 'Start over' && /^Step 6 of 6/.test(st()), 'end ' + lab() + ' / ' + st());
    $('.hw-rst', r).click(); await W(100); ok(st() === 'Step 1 of 6' && lab() === 'Next step', 'back to 1');
  });
  await t('LLMs: tabs switch lists, row expands', async () => {
    $('#llms .llm2-tab-w').click(); await W(100);
    ok($('#llm2-weaknesses').offsetParent && !$('#llm2-strengths').offsetParent, 'weaknesses not shown');
    const row = $('#llm2-weaknesses .llm2-row'); row.click(); await W(100);
    ok(row.getAttribute('aria-expanded') === 'true', 'row not expanded');
    $('#llms .llm2-tab-s').click(); await W(100);
    ok($('#llm2-strengths').offsetParent, 'strengths not shown');
  });
  await t('reasoning: 2 animation images load', async () => {
    const im = $$('#reasoning .rsn2-frame img'); ok(im.length === 2, 'found ' + im.length);
    go(im[0]); ok(await until(() => im.every((i) => i.complete && i.naturalWidth > 0), 8000), 'not loaded');
  });
  await t('risks: 7 cards with shapes, no ripple, Bias sheet + Escape', async () => {
    ok($$('#risks .rsk2-card').length === 7, 'cards');
    ok($$('#risks .rsk2-card .risk-shape img').length === 7, 'shapes');
    ok(!$('[class*="ripple"]'), 'ripple element still on page');
    const s = $('#risk-sheet-bias');
    $('#risks [data-rsk2-open="risk-sheet-bias"]').click();
    ok(await until(() => s.getAttribute('aria-hidden') === 'false' && vis(s) === 'visible'), 'sheet not open');
    key('Escape'); ok(await until(() => s.getAttribute('aria-hidden') === 'true' && vis(s) === 'hidden'), 'sheet not closed');
  });
  await t('references: 38 entries, footnote 21 opens the list', async () => {
    ok($$('#references .ref-item').length === 38, 'count');
    const b = $('#references .refs2-btn');
    if (b.getAttribute('aria-expanded') === 'true') { b.click(); await W(100); }
    const a = $$('a[href="#ref-21"]').find((x) => x.offsetParent); ok(a, 'no visible footnote 21');
    a.click(); await W(900);
    ok(b.getAttribute('aria-expanded') === 'true', 'list not opened');
    const r = $('#ref-21').getBoundingClientRect(); ok(r.height > 0 && r.top < innerHeight && r.bottom > 0, 'ref-21 not in view');
  });
  await t('glossary: FAB opens sheet, 20 terms, Escape closes', async () => {
    ok($$('#glossary .glossary-term').length === 20, 'terms');
    const s = $('#glossary-sheet'); $('.gl2-fab').click();
    ok(await until(() => s.getAttribute('aria-hidden') === 'false'), 'not open');
    key('Escape'); ok(await until(() => s.getAttribute('aria-hidden') === 'true'), 'not closed');
  });
  await t('approved copy appears as page text', () => {
    const txt = norm(document.body.textContent);
    const want = ['Like other advanced technologies, it can both improve people’s lives and cause harm.', 'Image generators such as DALL·E and Stable Diffusion', 'Reasoning models', 'Advancing public-interest AI'];
    const miss = want.filter((w) => !txt.includes(norm(w))); ok(!miss.length, 'missing: ' + miss.join(' | '));
  });
  await t('all images load', async () => {
    $$('img').forEach((i) => { i.loading = 'eager'; if (i.hasAttribute('data-src') && !i.getAttribute('src')) { i.src = i.getAttribute('data-src'); i.removeAttribute('data-src'); } });
    const im = $$('img').filter((i) => i.getAttribute('src'));
    const bad = [];
    await Promise.all(im.map((i) => Promise.race([i.decode(), W(15000).then(() => { throw new Error('timeout'); })])
      .then(() => { if (!i.naturalWidth && !/\.svg/i.test(i.currentSrc)) bad.push(i.currentSrc); }, (e) => bad.push(i.currentSrc + ' ' + e.message))));
    ok(!bad.length, [...new Set(bad)].join(' | '));
  });
  await t('no horizontal overflow', () => ok(document.documentElement.scrollWidth <= innerWidth, document.documentElement.scrollWidth + '>' + innerWidth));
  if (innerWidth <= 991) await t('menu button toggles .is-menu-open', async () => {
    const h = $('.site-header'), b = $('.menu-button');
    window.scrollTo(0, 0); b.click(); await W(100); ok(h.classList.contains('is-menu-open'), 'not open');
    ok(getComputedStyle($('.main-nav-links')).display !== 'none', 'links hidden');
    b.click(); await W(100); ok(!h.classList.contains('is-menu-open'), 'not closed');
  });
  return { width: innerWidth, passed: R.filter((r) => r.pass).length, total: R.length, failed: R.filter((r) => !r.pass) };
})();
