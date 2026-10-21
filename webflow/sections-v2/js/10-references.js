/* References: collapsible list (closed by default once JS runs) + footnote links open it and highlight the entry. */
(function () {
  var btn = document.querySelector('#references .refs2-btn');
  var panel = document.getElementById('refs-panel');
  if (!btn || !panel) return;
  var ic = btn.querySelector('.refs2-btn-ic');
  function set(open) {
    btn.setAttribute('aria-expanded', String(open));
    panel.style.display = open ? '' : 'none';
    if (ic) ic.style.transform = open ? '' : 'rotate(0deg)';
  }
  set(false);
  btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });

  function goTo(hash) {
    try { document.dispatchEvent(new CustomEvent('sbx:close-dialogs')); } catch (e) {}
    set(true);
    var target = document.getElementById(hash.slice(1));
    if (!target) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(function () {
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: hash === '#references' ? 'start' : 'center' });
      if (target.classList.contains('ref-item')) {
        target.style.transition = 'background-color 0.6s ease';
        target.style.backgroundColor = 'rgba(154, 225, 250, 0.18)';
        setTimeout(function () { target.style.backgroundColor = ''; }, 1600);
      }
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#ref-"], a[href="#references"]');
    if (!a) return;
    e.preventDefault(); goTo(a.getAttribute('href'));
    if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
  });
  if (/^#ref-\d+$|^#references$/.test(location.hash)) goTo(location.hash);
})();
