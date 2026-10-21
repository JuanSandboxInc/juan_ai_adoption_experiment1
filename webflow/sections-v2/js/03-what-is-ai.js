/* 03-what-is-ai: the "Types of AI" explorer (after Boaz's original, without the animations).
   The nav pills select one type; its card shows and the others hide (they share one grid cell, so the
   panel keeps the height of the tallest card and never jumps). Selected-state colours are set inline, so no
   extra Webflow classes are needed. Without JS every card is simply listed one under another. */
(function () {
  var sec = document.getElementById('what-is-ai');
  if (!sec) return;
  var stage = sec.querySelector('.wai-stage');
  var nav = sec.querySelector('.wai-nav');
  if (!stage || !nav) return;
  var items = [].slice.call(stage.querySelectorAll('[data-item]'));
  var ctls = [].slice.call(nav.querySelectorAll('[data-ctl]'));
  var btns = [].slice.call(nav.querySelectorAll('button[data-t]'));
  if (!items.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NAVY = '#13181d', SOFT = 'rgba(255, 255, 255, 0.45)';
  stage.style.display = 'grid';
  stage.style.gap = '0';
  items.forEach(function (it) {
    it.style.gridArea = '1 / 1';
    if (!reduce) it.style.transition = 'opacity .35s ease, transform .35s ease';
  });

  function paint(el, on) {
    el.style.backgroundColor = on ? NAVY : '';
    el.style.borderColor = on ? NAVY : '';
    el.style.color = on ? '#ffffff' : '';
  }
  function soft(el) { el.style.borderColor = SOFT; el.style.color = '#ffffff'; }

  function select(t) {
    ctls.forEach(function (c) { paint(c, c.getAttribute('data-ctl') === t); });
    var on = nav.querySelector('[data-ctl="' + t + '"]');
    /* children inside a dark (selected) box switch to light outlines */
    if (on) [].forEach.call(on.querySelectorAll('[data-ctl]'), soft);
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-t') === t ? 'true' : 'false'); });
    items.forEach(function (it) {
      var show = it.getAttribute('data-item') === t;
      it.style.visibility = show ? 'visible' : 'hidden';
      it.style.opacity = show ? '1' : '0';
      it.style.transform = show || reduce ? 'none' : 'translateY(8px)';
      if (show) it.removeAttribute('aria-hidden'); else it.setAttribute('aria-hidden', 'true');
    });
  }

  nav.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== nav && !el.getAttribute('data-t')) el = el.parentNode;
    if (!el || el === nav) return;
    select(el.getAttribute('data-t'));
  });
  select('sym');
})();
