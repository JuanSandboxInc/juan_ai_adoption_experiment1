/* Glossary: side sheet opened from the floating button, from links to #glossary,
   and from inline term buttons (.gt[data-term] / [data-glossary-term]) which jump to that entry. */
(function () {
  var sheet = document.getElementById('glossary-sheet');
  if (!sheet) return;
  var panel = sheet.querySelector('.gl2-panel'), dim = sheet.querySelector('.gl2-dim');
  var list = sheet.querySelector('.gl2-scroll');
  var FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var isOpen = false, lastTrigger = null;
  sheet.setAttribute('aria-hidden', 'true');
  /* open/closed states are inline styles (Webflow only creates classes that some element carries) */
  function show(on) {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    sheet.style.transition = reduce ? 'none' : (on ? 'visibility 0s linear 0s' : '');
    if (panel) panel.style.transition = reduce ? 'none' : '';
    if (dim) dim.style.transition = reduce ? 'none' : '';
    sheet.style.visibility = on ? 'visible' : '';
    if (dim) dim.style.opacity = on ? '1' : '';
    if (panel) panel.style.transform = on ? 'none' : '';
  }

  function open(trigger, term) {
    lastTrigger = trigger || null;
    if (!isOpen) {
      isOpen = true;
      show(true);
      sheet.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
      if (list) list.scrollTop = 0;
    }
    var row = null;
    if (term) {
      [].slice.call(sheet.querySelectorAll('.gl2-row')).forEach(function (r) {
        if (!row && r.getAttribute('data-term').toLowerCase() === term.toLowerCase()) row = r;
      });
    }
    setTimeout(function () {
      var c = sheet.querySelector('.gl2-close'); if (c) c.focus();
      if (row) {
        row.scrollIntoView({ block: 'start' });
        row.style.backgroundColor = 'rgba(154, 225, 250, 0.16)';
        setTimeout(function () { row.style.backgroundColor = ''; }, 1800);
      }
    }, 30);
  }
  function close(restore) {
    if (!isOpen) return;
    isOpen = false;
    show(false);
    sheet.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (restore !== false && lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var t = e.target.closest('[data-gl2-open], a[href="#glossary"], .gt[data-term], [data-glossary-term]');
    if (t) {
      e.preventDefault();
      open(t, t.getAttribute('data-term') || t.getAttribute('data-glossary-term'));
      return;
    }
    if (isOpen && e.target.closest('[data-gl2-close]')) { e.preventDefault(); close(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = [].slice.call(sheet.querySelectorAll(FOCUSABLE)).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('sbx:close-dialogs', function () { close(false); });
  if (location.hash === '#glossary') open(null);
})();
