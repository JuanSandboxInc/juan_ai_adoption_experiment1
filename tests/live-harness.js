// In-browser mirror of the Playwright suite, for running against the live page from a browser
// when Playwright can't reach it. Paste into the console on the live page; resolves to a results array.
(async () => {
  const W = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => s.replace(/\s+/g, ' ').replace(/[‘’]/g, "'").trim();
  const go = (el, off = 200) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - off, behavior: 'instant' });
  const R = [];
  const t = async (name, fn) => { try { const d = await fn(); R.push({ name, pass: true, d }); } catch (e) { R.push({ name, pass: false, err: String(e.message || e) }); } };
  const ok = (c, m) => { if (!c) throw new Error(m); };
  const mobile = innerWidth < 768;

  await t('embeds initialised (no init errors)', () => {
    ok(document.querySelector('.tl-root[data-tl-ready]'), 'timeline not initialised');
    ok(document.querySelector('.kc-root[data-kc-ready]'), 'quiz not initialised');
    ok(document.querySelector('.pm-root[data-pm-ready]'), 'prediction machine not initialised');
  });
  await t('9 chapter links point to existing sections', () => {
    const l = [...document.querySelectorAll('.chapter-nav-link')];
    ok(l.length === 9, 'found ' + l.length);
    const miss = l.filter((a) => !document.getElementById(a.getAttribute('href').slice(1))).map((a) => a.getAttribute('href'));
    ok(!miss.length, 'missing ' + miss);
  });
  await t('scroll to #risks marks Risks current and fills earlier chapters', async () => {
    go(document.getElementById('risks'), 60); window.dispatchEvent(new Event('scroll')); await W(600);
    const cur = [...document.querySelectorAll('.chapter-nav-link[aria-current]')].map((a) => a.getAttribute('href'));
    ok(cur.length === 1 && cur[0] === '#risks', 'aria-current on ' + cur);
    const f = [...document.querySelectorAll('.chapter-nav-fill')].map((x) => parseFloat(x.style.width) || 0);
    ok(f.slice(0, 6).every((v) => v >= 99), 'fills ' + f.join(','));
  });
  await t('glossary has 20 terms', () => { const n = document.querySelectorAll('.glossary-term').length; ok(n === 20, n); });
  await t('references: 38 items with ref-N ids', () => {
    const n = document.querySelectorAll('.ref-item').length; ok(n === 38, n);
    ok(document.getElementById('ref-1') && document.getElementById('ref-38'), 'anchors');
  });
  await t('approved copy appears as page text', () => {
    const txt = norm(document.body.textContent);
    const want = ['Like other advanced technologies, it can both improve people’s lives and cause harm.', 'Image generators such as DALL·E and Stable Diffusion', 'Drafting, summarizing and reformatting language', 'It’s sensitive to how it’s asked', 'Advancing public-interest AI'];
    const miss = want.filter((w) => !txt.includes(norm(w))); ok(!miss.length, 'missing: ' + miss.join(' | '));
  });
  await t('Lighthill slide credits Science Research Council', () => {
    const s = [...document.querySelectorAll('.tl-slide')].find((x) => /1973/.test(x.querySelector('.tl-year')?.textContent || ''));
    ok(s && /Science Research Council/.test(s.textContent), 'not found');
  });
  await t('timeline: 24 slides, arrows + ArrowRight move counter', async () => {
    ok(document.querySelectorAll('.tl-slide').length === 24, 'slide count');
    const cnt = () => document.querySelector('[data-tl-count]').textContent.replace(/\s/g, '');
    const prev = document.querySelector('.tl-arrow--prev'), next = document.querySelector('.tl-arrow--next');
    go(document.querySelector('.tl-root')); await W(300);
    ok(cnt() === '01/24' && prev.disabled, 'start ' + cnt());
    next.click(); await W(200); ok(cnt() === '02/24', 'after next ' + cnt());
    document.querySelector('.tl-root').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await W(200);
    ok(cnt() === '03/24', 'after ArrowRight ' + cnt());
    prev.click(); prev.click(); await W(200); ok(cnt() === '01/24', 'back ' + cnt());
  });
  await t('quiz: dialog, feedback, 10 questions to result, Escape closes', async () => {
    const d = document.querySelector('dialog.kc-sheet');
    document.querySelector('[data-kc-open]').click(); await W(300); ok(d.open, 'not open');
    for (let i = 0; i < 10; i++) {
      d.querySelector('.kc-ans').click(); await W(80);
      ok(d.querySelector('.kc-res'), 'no feedback q' + (i + 1));
      d.querySelector('[data-next]').click(); await W(80);
    }
    ok(/\d+\/10/.test(d.querySelector('.kc-score')?.textContent || ''), 'no result');
    d.dispatchEvent(new Event('cancel', { cancelable: true })); await W(500); ok(!d.open, 'still open');
  });
  await t('prediction machine: toggle opens, Next steps through 4 steps', async () => {
    const tg = document.querySelector('[data-pm-toggle]'); go(tg); await W(200);
    tg.click(); await W(200); ok(!document.querySelector('[data-pm-machine]').hidden, 'hidden');
    document.querySelector('[data-restart]').click(); await W(100);
    const seen = [];
    for (let i = 0; i < 4; i++) { seen.push(document.querySelector('.pm-steps li[aria-current]')?.dataset.step); document.querySelector('[data-next]').click(); await W(100); }
    ok(seen.join() === '1,2,3,4', 'steps ' + seen);
    ok(/Round 2 of 4/.test(document.querySelector('[data-status]').textContent), 'status');
  });
  await t('risk ripple reveals when scrolled into view', async () => {
    const s = [...document.querySelectorAll('.ripple-svg')].find((x) => x.getBoundingClientRect().height > 0);
    ok(s, 'no visible ripple'); go(s, 100); await W(900); ok(s.classList.contains('is-in'), 'not revealed');
  });
  await t('no horizontal overflow', () => ok(document.documentElement.scrollWidth <= innerWidth, document.documentElement.scrollWidth + '>' + innerWidth));
  if (innerWidth <= 991) await t('menu button toggles .is-menu-open', async () => {
    const h = document.querySelector('.site-header'), b = document.querySelector('.menu-button');
    window.scrollTo(0, 0); b.click(); await W(100); ok(h.classList.contains('is-menu-open'), 'not open');
    ok(getComputedStyle(document.querySelector('.main-nav-links')).display !== 'none', 'links hidden');
    b.click(); await W(100); ok(!h.classList.contains('is-menu-open'), 'not closed');
  });
  return { width: innerWidth, mobile, passed: R.filter((r) => r.pass).length, total: R.length, failed: R.filter((r) => !r.pass) };
})();
