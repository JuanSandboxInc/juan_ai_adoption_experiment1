/* Chapter nav: quick scroll to the section (Webflow's built-in anchor scroll is slow). ~350ms ease, instant with reduced motion. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.chapter-nav-link, .brand-link, .main-nav-link-current');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) !== '#' || href.length < 2) return;
    var target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var header = document.querySelector('.site-header');
    var to = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - (header ? header.offsetHeight : 0) + 1);
    if (history.replaceState) history.replaceState(null, '', href);
    if (reduce) { window.scrollTo({ top: to, behavior: 'instant' }); return; }
    var from = window.pageYOffset, d = to - from, t0 = null, dur = Math.min(450, 250 + Math.abs(d) / 40);
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), q = 1 - Math.pow(1 - p, 3);
      window.scrollTo({ top: from + d * q, behavior: 'instant' });
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, true);
})();
