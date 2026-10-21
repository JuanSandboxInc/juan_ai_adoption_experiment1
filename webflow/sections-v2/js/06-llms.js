/* 06-llms: Strengths / Weaknesses tabs + one accordion per item (after Boaz's original).
   Without JS both lists show fully open and the tab bar stays hidden. With JS: the tab bar appears,
   only the selected list shows, and each item's explanation opens on click / Enter / Space.
   State is set with inline styles + ARIA, so no extra Webflow classes are needed. */
(function () {
  var sec = document.getElementById('llms');
  if (!sec) return;
  var box = sec.querySelector('.llm2-box');
  var bar = sec.querySelector('.llm2-tabs');
  if (!box || !bar) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tabs = [].slice.call(bar.querySelectorAll('.llm2-tab-s, .llm2-tab-w'));
  var INK = '#1e1d1b', ON = { 'llm2-tab-s': '#1bc594', 'llm2-tab-w': '#ff885d' };

  bar.setAttribute('role', 'tablist');
  bar.style.display = 'inline-flex';

  function panelOf(t) { return document.getElementById(t.getAttribute('data-panel')); }
  function select(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t, p = panelOf(x);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      x.style.backgroundColor = on ? ON[x.className.split(' ')[0]] : '';
      x.style.color = on ? INK : '';
      if (p) p.style.display = on ? '' : 'none';
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, i) {
    var p = panelOf(t);
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', t.getAttribute('data-panel'));
    if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', t.id); p.removeAttribute('aria-label'); }
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === 'Home') n = tabs[0];
      else if (k === 'End') n = tabs[tabs.length - 1];
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); select(t); return; }
      if (n) { e.preventDefault(); select(n, true); }
    });
  });
  select(tabs[0]);

  /* accordions */
  [].forEach.call(box.querySelectorAll('.llm2-item'), function (li, i) {
    var row = li.querySelector('.llm2-row'), panel = li.querySelector('.llm2-panel');
    var more = li.querySelector('.llm2-more'), chev = li.querySelector('.llm2-chev');
    if (!row || !panel) return;
    var links = [].slice.call(panel.querySelectorAll('a, button'));
    panel.id = panel.id || 'llm2-panel-' + i;
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.style.cursor = 'pointer';
    row.setAttribute('aria-controls', panel.id);
    if (chev) chev.style.display = 'block';
    if (reduce) { panel.style.transition = 'none'; if (more) more.style.transition = 'none'; if (chev) chev.style.transition = 'none'; }
    function set(open) {
      row.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.gridTemplateRows = open ? '1fr' : '0fr';
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (more) { more.style.opacity = open ? '1' : '0'; }
      if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
      links.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    }
    set(false);
    function toggle() { set(row.getAttribute('aria-expanded') !== 'true'); }
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
})();
