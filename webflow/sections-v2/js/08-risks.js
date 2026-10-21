/* Risks: "Read more" sheet (native dialog pattern) + drag-to-scroll card rows. */
(function () {
  var sec = document.getElementById('risks');
  if (!sec) return;
  var FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var current = null, lastTrigger = null;

  /* open/closed states are inline styles (Webflow only creates classes that some element carries) */
  function show(sheet, on) {
    var box = sheet.querySelector('.rsk2-sheet-box');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    sheet.style.transition = reduce ? 'none' : (on ? 'opacity 0.3s ease, visibility 0s linear 0s' : '');
    if (box) box.style.transition = reduce ? 'none' : '';
    sheet.style.visibility = on ? 'visible' : '';
    sheet.style.opacity = on ? '1' : '';
    if (box) box.style.transform = on ? 'none' : '';
  }
  function open(sheet, trigger) {
    if (!sheet || current === sheet) return;
    lastTrigger = trigger || null; current = sheet;
    show(sheet, true);
    sheet.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    var box = sheet.querySelector('.rsk2-sheet-box'); if (box) box.scrollTop = 0;
    var c = sheet.querySelector('.rsk2-sheet-close'); if (c) setTimeout(function () { c.focus(); }, 30);
  }
  function close(restore) {
    if (!current) return;
    var sheet = current; current = null;
    show(sheet, false);
    sheet.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (restore !== false && lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }
  [].slice.call(sec.querySelectorAll('.rsk2-sheet')).forEach(function (s) { s.setAttribute('aria-hidden', 'true'); });

  sec.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-rsk2-open],[data-rsk2-close]') : null;
    if (!t) return;
    if (t.hasAttribute('data-rsk2-open')) { e.preventDefault(); open(document.getElementById(t.getAttribute('data-rsk2-open')), t); }
    else { e.preventDefault(); close(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!current) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = [].slice.call(current.querySelectorAll(FOCUSABLE)).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  /* footnote links inside the sheet: close it first (references script does the scrolling) */
  document.addEventListener('sbx:close-dialogs', function () { close(false); });

  /* card rows: drag with a mouse, arrow keys when the row has focus */
  [].slice.call(sec.querySelectorAll('.rsk2-row')).forEach(function (sc) {
    var down = false, startX = 0, startLeft = 0, moved = false;
    sc.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || sc.scrollWidth <= sc.clientWidth) return;
      if (e.target.closest && e.target.closest('button,a')) return;
      down = true; moved = false; startX = e.clientX; startLeft = sc.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; sc.style.cursor = 'grabbing'; sc.style.scrollSnapType = 'none'; }
      if (moved) { sc.scrollLeft = startLeft - dx; e.preventDefault(); }
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      setTimeout(function () { sc.style.cursor = ''; sc.style.scrollSnapType = ''; }, 0);
    });
    sc.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    sc.addEventListener('keydown', function (e) {
      if (e.target !== sc) return;
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      var step = (sc.firstElementChild ? sc.firstElementChild.offsetWidth : 300) + 10;
      if (e.key === 'ArrowRight') { sc.scrollBy({ left: step, behavior: reduce ? 'auto' : 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { sc.scrollBy({ left: -step, behavior: reduce ? 'auto' : 'smooth' }); e.preventDefault(); }
    });
  });
})();
