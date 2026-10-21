/* 02-hero: "Why this page" scroll-linked text fill (after Boaz's original).
   The two opening paragraphs start dim and a soft edge sweeps through the words as the reader scrolls,
   one paragraph after the other. "Artificial intelligence" (.why2-pre) is lit from the start.
   The yellow paragraph rises in once the first is fully lit; the grey "At Sandbox Labs" panel
   fades and grows in with the scroll. Without JS, or with reduced motion, everything is simply fully lit. */
(function () {
  var sec = document.getElementById('why-this-page');
  if (!sec) return;
  var p1 = sec.querySelector('.why2-text');
  var p2 = sec.querySelector('.why2-yellow');
  var panel = sec.querySelector('.why2-panel');
  if (!p1 || !p2) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var DIM = 'rgba(255, 255, 255, 0.16)';
  var paras = [{ el: p1, ink: '#ffffff' }, { el: p2, ink: '#f7ff88' }];

  /* wrap every word (outside .why2-pre) in a span; whitespace stays as plain text so lines wrap as before */
  function wrap(p) {
    var words = [];
    var nodes = [].slice.call(p.childNodes);
    nodes.forEach(function (n) {
      if (n.nodeType !== 3) return;
      var parts = n.nodeValue.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (t) {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
        var s = document.createElement('span');
        s.textContent = t;
        s.style.webkitBackgroundClip = 'text';
        s.style.backgroundClip = 'text';
        s.style.backgroundRepeat = 'no-repeat';
        s.style.backgroundColor = DIM;
        s.style.color = 'transparent';
        frag.appendChild(s);
        words.push(s);
      });
      p.replaceChild(frag, n);
    });
    return words;
  }
  paras.forEach(function (o) {
    o.words = wrap(o.el);
    o.chars = o.words.reduce(function (a, w) { return a + w.textContent.length + 1; }, 0);
  });
  var total = paras[0].chars + paras[1].chars;

  /* the yellow paragraph waits below, hidden, until the first one is full */
  p2.style.transition = 'opacity .7s ease, transform .9s cubic-bezier(.2,.7,.2,1)';
  if (panel) panel.style.transformOrigin = '50% 0';

  var geo = null;
  function measure() {
    geo = paras.map(function (o) {
      var fs = parseFloat(getComputedStyle(o.el).fontSize) || 40;
      var space = fs * 0.26, x = 0;
      var pre = o.el.querySelector('.why2-pre');
      if (pre) x = pre.getBoundingClientRect().width + space;
      var start = x;
      var pos = o.words.map(function (w) {
        var wd = w.getBoundingClientRect().width;
        var r = { s: x, w: wd };
        x += wd + space;
        return r;
      });
      return { pos: pos, from: start, len: x, edge: Math.max(40, fs * 1.4) };
    });
  }

  function absTop(el) { return el.getBoundingClientRect().top + window.pageYOffset; }

  var shown = null;
  function update() {
    if (!geo) measure();
    var vh = window.innerHeight, y = window.pageYOffset;
    var start = Math.max(0, absTop(p1) - vh * 0.75);
    var end = absTop(p2) + p2.offsetHeight - vh * 0.45;
    var maxY = Math.max(1, document.documentElement.scrollHeight - vh);
    end = Math.min(Math.max(end, start + 1), maxY);
    var done = Math.max(0, Math.min(1, (y - start) / (end - start))) * total, at = 0;

    paras.forEach(function (o, i) {
      var g = geo[i];
      var t = Math.max(0, Math.min(1, (done - at) / o.chars));
      var x0 = g.from - g.edge;
      var x = x0 + t * (g.len - x0);
      o.words.forEach(function (w, k) {
        var p = g.pos[k], lx = x - p.s;
        w.style.backgroundImage = 'linear-gradient(90deg,' + o.ink + ' ' + lx.toFixed(1) + 'px,transparent ' + (lx + g.edge).toFixed(1) + 'px)';
      });
      if (i === 0) {
        var on = t >= 1;
        if (on !== shown) {
          shown = on;
          p2.style.opacity = on ? '1' : '0';
          p2.style.transform = on ? 'none' : 'translateY(28px)';
        }
      }
      at += o.chars;
    });

    /* panel: fades in and grows from 92% as its top travels from the bottom of the screen to 55% up */
    if (panel) {
      var r = panel.getBoundingClientRect();
      var q = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.45)));
      q = q * q * (3 - 2 * q);
      panel.style.opacity = (0.05 + 0.95 * q).toFixed(3);
      panel.style.transform = 'scale(' + (0.92 + 0.08 * q).toFixed(4) + ')';
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; update(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { geo = null; onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { geo = null; update(); });
  update();
})();
