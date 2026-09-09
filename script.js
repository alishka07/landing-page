/* ═══════════════════════════════════════════════
   SuBulaq — интерактив лендинга
   ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── Шапка: фон при скролле ───────────────── */
  var nav = $('#nav');
  var onScroll = function () {
    nav.classList.toggle('is-stuck', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Мобильное меню ───────────────────────── */
  var burger = $('#burger');
  var navMobile = $('#navMobile');
  var closeMenu = function () {
    navMobile.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  };
  burger.addEventListener('click', function () {
    var open = navMobile.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#navMobile a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeFind(); } });

  /* ── Поиск по разделам ────────────────────── */
  var findBtn = $('#findBtn');
  var findPanel = $('#findPanel');
  var findInput = $('#findInput');
  var findEmpty = $('#findEmpty');
  var findRows = $$('#findList li');

  var closeFind = function () {
    findPanel.hidden = true;
    findBtn.setAttribute('aria-expanded', 'false');
  };
  var filterFind = function () {
    var q = findInput.value.trim().toLowerCase();
    var hits = 0;
    findRows.forEach(function (li) {
      var on = !q || li.textContent.toLowerCase().indexOf(q) > -1;
      li.hidden = !on;
      if (on) hits++;
    });
    findEmpty.hidden = hits > 0;
  };
  findBtn.addEventListener('click', function () {
    var open = findPanel.hidden;
    findPanel.hidden = !open;
    findBtn.setAttribute('aria-expanded', String(open));
    if (open) { findInput.value = ''; filterFind(); findInput.focus(); }
  });
  findInput.addEventListener('input', filterFind);
  findInput.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    var first = $$('#findList li:not([hidden]) a')[0];
    if (first) { first.click(); closeFind(); }
  });
  $$('#findList a').forEach(function (a) { a.addEventListener('click', closeFind); });
  document.addEventListener('click', function (e) {
    if (findPanel.hidden) return;
    if (!findPanel.contains(e.target) && !findBtn.contains(e.target)) closeFind();
  });

  /* ── Выноски на рендере аппарата ──────────── */
  var tip = $('#pintip');
  var showTip = function (btn) {
    var r = btn.getBoundingClientRect();
    $('b', tip).textContent = btn.dataset.pin;
    $('span', tip).textContent = btn.dataset.desc;
    tip.hidden = false;
    // позиционируем после снятия hidden, чтобы получить реальную ширину
    tip.style.left = Math.min(Math.max(r.left + r.width / 2, 150), window.innerWidth - 150) + 'px';
    tip.style.top = r.top - 8 + 'px';
    tip.classList.add('is-on');
  };
  var hideTip = function () {
    tip.classList.remove('is-on');
    tip.hidden = true;
  };
  $$('.pin').forEach(function (btn) {
    btn.addEventListener('mouseenter', function () { showTip(btn); });
    btn.addEventListener('focus', function () { showTip(btn); });
    btn.addEventListener('mouseleave', hideTip);
    btn.addEventListener('blur', hideTip);
    btn.addEventListener('click', function (e) { e.preventDefault(); showTip(btn); });
  });
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ── Вкладки платформы ────────────────────── */
  var tabs = $$('.ptab');
  var panes = $$('.pane');
  var setTab = function (name) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', String(on));
    });
    panes.forEach(function (p) { p.classList.toggle('is-on', p.dataset.pane === name); });
  };
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      setTab(t.dataset.tab);
      autoplay.stop();
    });
  });

  /* Автопролистывание экранов, пока пользователь не вмешался */
  var autoplay = (function () {
    var order = ['dash', 'fleet', 'craft', 'report'];
    var i = 0, timer = null, started = false;
    return {
      start: function () {
        if (started || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        started = true;
        timer = setInterval(function () {
          i = (i + 1) % order.length;
          setTab(order[i]);
        }, 4200);
      },
      stop: function () { if (timer) { clearInterval(timer); timer = null; } started = true; }
    };
  })();

  /* ── FAQ: одновременно открыт один пункт ──── */
  var qas = $$('.qa');
  qas.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      qas.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ── Появление блоков при скролле ─────────── */
  var revealTargets = [
    '.shead', '.pcard', '.fact', '.chain__i', '.apparat__vis', '.apparat__spec',
    '.step', '.src', '.platform__tabs', '.platform__body', '.who',
    '.tablewrap', '.ctable__note', '.plan', '.pstep', '.pilot__note',
    '.mate', '.awards', '.faq', '.cta__copy', '.form'
  ].join(',');

  var items = $$(revealTargets);
  items.forEach(function (el, n) {
    el.setAttribute('data-rv', '');
    // задержка внутри одной группы соседей
    var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.transitionDelay = Math.min(sibs, 5) * 70 + 'ms';
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
        if (en.target.classList.contains('platform__body')) autoplay.start();
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
    autoplay.start();
  }

  /* ── Счётчики в карточках героя ───────────── */
  $$('.gcard__val[data-count]').forEach(function (el) {
    var to = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.dec || '0', 10);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var t0 = null, dur = 1100;
    var tick = function (ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  /* ── Форма заявки ─────────────────────────── */
  var form = $('#pilotForm');
  var ok = $('#formOk');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      var bad = $(':invalid', form);
      if (bad) bad.focus();
      form.reportValidity();
      return;
    }
    // TODO: подключить отправку — Formspree, Google Forms, Telegram-бот
    // или собственный эндпоинт. Сейчас данные только выводятся в консоль.
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    console.log('Заявка на пилот:', data);

    ok.hidden = false;
    form.reset();
    setTimeout(function () { ok.hidden = true; }, 6000);
  });

  /* ── Год в футере ─────────────────────────── */
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
