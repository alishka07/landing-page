/* ═══════════════════════════════════════════════════════════════════
   SuBulaq — «Водное растворение»: переход ПРОБЛЕМА → АППАРАТ
   ───────────────────────────────────────────────────────────────────
   Обёртка #morph закрепляется на время прокрутки. Внутри две сцены:

     сцена 1  #problem        — заголовок, карточки, цифры, цепочка
     сцена 2  #apparat-intro  — судно, новый заголовок, характеристики

   Текст первой сцены не просто гаснет: строки расходятся по вертикали,
   уходят в размытие и искажаются SVG-фильтром (feTurbulence +
   feDisplacementMap) — как надпись, увиденная сквозь движущуюся воду.
   Вторая сцена собирается обратным ходом того же приёма.

   Прогресс таймлайна размечен в процентах прокрутки (0–100):
      0–18   первая сцена стоит на месте, вода едва заметно дышит
     18–43   растворение: прозрачность ↓, размытие ↑, строки расходятся,
             по тексту проходит блик, слово ПРОБЛЕМА тает
     38–82   судно въезжает в кадр, вода уходит в параллакс
     50–84   слово меняется на АППАРАТ, новый заголовок собирается
     84–100  всё останавливается, кадр становится резким

   Без GSAP, при prefers-reduced-motion и на узких экранах ничего не
   инициализируется — сцены остаются двумя обычными экранами подряд.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var morph = document.getElementById('morph');
  if (!morph || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wide = window.matchMedia('(min-width: 1025px)');

  var $ = function (sel, root) { return (root || morph).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || morph).querySelectorAll(sel));
  };
  var wd = function (name) { return $('[data-wd="' + name + '"]'); };

  /* ── Ссылки на слои ────────────────────────────────────────────── */
  var refs = {
    water:   wd('water'),          // фото воды первой сцены
    ghost1:  wd('ghost1'),         // слово-подложка ПРОБЛЕМА
    ghost2:  wd('ghost2'),         // слово-подложка АППАРАТ
    pass1:   wd('pass1'),          // блик по первой сцене
    pass2:   wd('pass2'),          // блик по второй сцене
    usv:     wd('usv'),            // судно
    wake:    wd('wake'),           // вода и брызги отдельным слоем
    s1Lines: $$('[data-wd="s1-h"] .ln > i'),
    s1Eye:   wd('s1-eyebrow'),
    s1P:     wd('s1-p'),
    s1Cards: wd('s1-cards'),
    s1Facts: wd('s1-facts'),
    s1Chain: wd('s1-chain'),
    s1Foot:  wd('s1-foot'),
    s2:      document.getElementById('apparat-intro'),
    s2Lines: $$('[data-wd="s2-h"] .ln > i'),
    s2Eye:   wd('s2-eyebrow'),
    s2P:     wd('s2-p'),
    s2Foot:  wd('s2-foot'),
    disp1:   document.querySelector('[data-wd="disp1"]'),
    disp2:   document.querySelector('[data-wd="disp2"]')
  };

  /* Смещение строк при расслоении: у каждой свой знак и амплитуда,
     чтобы блок «разъезжался» как отражение на ряби, а не уезжал целиком. */
  var DRIFT = [-26, 14, 34];

  var tl = null;
  var st = null;

  function build() {
    morph.classList.add('is-morph');

    /* Стартовое состояние второй сцены: собрана, но невидима и размыта */
    gsap.set(refs.s2, { opacity: 0 });
    gsap.set(refs.usv, { opacity: 0, yPercent: 11, scale: 1.16, rotation: 1.6 });
    gsap.set(refs.wake, { opacity: 0, yPercent: 7, scale: 1.12 });
    gsap.set(refs.ghost2, { opacity: 0, filter: 'blur(14px)', scale: 1.05 });
    gsap.set(refs.s2Lines, { opacity: 0, filter: 'blur(18px)', y: function (i) { return -DRIFT[i % 3] * 0.8; } });
    gsap.set([refs.s2Eye, refs.s2P], { opacity: 0, filter: 'blur(10px)', y: 16 });
    gsap.set(refs.s2Foot, { opacity: 0 });
    gsap.set([refs.pass1, refs.pass2], { opacity: 0, xPercent: -160 });

    /* Единый таймлайн длиной 100 «единиц» = 100 % прокрутки закреплённого экрана */
    tl = gsap.timeline({ defaults: { ease: 'none' } });

    /* ── 0–18 % — сцена стоит. Только вода очень медленно дышит ─────── */
    tl.to(refs.water, { yPercent: -4, scale: 1.06, duration: 62 }, 0);

    /* ── 18–43 % — РАСТВОРЕНИЕ ─────────────────────────────────────
       Строки расходятся по вертикали, уходят в размытие и прозрачность.
       Одновременно растёт scale у feDisplacementMap: буквы «плывут». */
    refs.s1Lines.forEach(function (line, i) {
      tl.to(line, {
        opacity: 0,
        y: DRIFT[i % 3],
        filter: 'blur(16px)',
        duration: 20
      }, 18 + i * 2.5);        // строки уходят с небольшим сдвигом друг за другом
    });

    if (refs.disp1) {
      tl.to(refs.disp1, { attr: { scale: 28 }, duration: 24 }, 18);
    }

    /* Эйбрау, абзац и наборные блоки — тот же приём, но сдержаннее */
    tl.to(refs.s1Eye, { opacity: 0, y: 14, filter: 'blur(8px)', duration: 15 }, 18)
      .to(refs.s1P, { opacity: 0, y: 22, filter: 'blur(10px)', duration: 19 }, 20)
      .to(refs.s1Cards, { opacity: 0, y: 26, filter: 'blur(9px)', duration: 19 }, 18)
      .to(refs.s1Facts, { opacity: 0, y: 30, filter: 'blur(9px)', duration: 19 }, 21)
      .to(refs.s1Chain, { opacity: 0, y: 34, filter: 'blur(9px)', duration: 19 }, 23)
      .to(refs.s1Foot, { opacity: 0, duration: 14 }, 26);

    /* Блик: узкая полоса преломлённого света идёт слева направо по тексту */
    tl.to(refs.pass1, { opacity: .55, duration: 6 }, 19)
      .to(refs.pass1, { xPercent: 420, duration: 24 }, 19)
      .to(refs.pass1, { opacity: 0, duration: 7 }, 38);

    /* Слово-подложка ПРОБЛЕМА тает медленнее всего остального */
    tl.to(refs.ghost1, { opacity: 0, filter: 'blur(12px)', scale: 1.05, y: -26, duration: 30 }, 20);

    /* ── 38–82 % — СУДНО ВХОДИТ В КАДР ────────────────────────────
       Вторая сцена проявляется, судно поднимается снизу, разворот
       гасится с 1.6° до 0, вода идёт своим, более медленным параллаксом. */
    tl.to(refs.s2, { opacity: 1, duration: 9 }, 36)
      .to(refs.usv, { opacity: 1, duration: 13 }, 38)
      .to(refs.usv, { yPercent: 0, scale: 1.03, rotation: 0, duration: 44 }, 38)
      .to(refs.wake, { opacity: 1, duration: 15 }, 40)
      .to(refs.wake, { yPercent: 0, scale: 1.06, duration: 46 }, 40)
      .to(refs.water, { opacity: 0, duration: 18 }, 44);

    /* ── 50–82 % — слово-подложка меняется на АППАРАТ ─────────────── */
    tl.to(refs.ghost2, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 32 }, 50);

    /* ── 56–83 % — СБОРКА ЗАГОЛОВКА (обратный ход растворения) ────── */
    if (refs.disp2) {
      tl.set(refs.disp2, { attr: { scale: 26 } }, 50)
        .to(refs.disp2, { attr: { scale: 0 }, duration: 25 }, 56);
    }
    refs.s2Lines.forEach(function (line, i) {
      tl.to(line, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 20
      }, 56 + i * 2.5);
    });
    tl.to(refs.s2Eye, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 15 }, 56)
      .to(refs.s2P, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 20 }, 62)
      .to(refs.s2Foot, { opacity: 1, duration: 18 }, 60);

    /* Ответный блик — теперь он проявляет текст, а не смывает его */
    tl.to(refs.pass2, { opacity: .5, duration: 6 }, 56)
      .to(refs.pass2, { xPercent: 420, duration: 26 }, 56)
      .to(refs.pass2, { opacity: 0, duration: 8 }, 80);

    /* ── 84–100 % — всё садится на место, судно едва заметно всплывает ── */
    tl.to(refs.usv, { yPercent: -0.6, duration: 16 }, 84)
      .to(refs.wake, { yPercent: -1.1, duration: 16 }, 84);

    /* ── Привязка к прокрутке ──────────────────────────────────────
       scrub со сглаживанием 0.6 с — движение остаётся «тяжёлым»,
       без рывков за колесом мыши. */
    st = ScrollTrigger.create({
      trigger: morph,
      start: 'top top',
      end: '+=190%',
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      animation: tl,
      invalidateOnRefresh: true,
      /* Дорогой SVG-фильтр включаем только на время самого растворения */
      onUpdate: function (self) {
        var p = self.progress;
        morph.classList.toggle('is-wd1', p > 0.16 && p < 0.48);
        morph.classList.toggle('is-wd2', p > 0.5 && p < 0.88);
        morph.classList.toggle('is-past', p > 0.5);
      }
    });
  }

  function teardown() {
    if (st) { st.kill(true); st = null; }
    if (tl) { tl.kill(); tl = null; }
    morph.classList.remove('is-morph', 'is-wd1', 'is-wd2', 'is-past');
    /* Снимаем все инлайновые стили — сцены возвращаются в обычный поток */
    gsap.set([refs.s2, refs.usv, refs.wake, refs.ghost1, refs.ghost2,
      refs.pass1, refs.pass2, refs.water, refs.s1P, refs.s1Cards,
      refs.s1Facts, refs.s1Chain, refs.s1Foot, refs.s1Eye, refs.s2Eye, refs.s2P,
      refs.s2Foot].concat(refs.s1Lines, refs.s2Lines), { clearProps: 'all' });
    if (refs.disp1) refs.disp1.setAttribute('scale', '0');
    if (refs.disp2) refs.disp2.setAttribute('scale', '0');
  }

  /* ── Включаем только там, где эффект уместен ──────────────────────
     Узкие экраны и отключённая анимация получают два обычных экрана:
     содержание то же, просто без закрепления и растворения. */
  function sync() {
    var on = wide.matches && !reduce.matches;
    if (on && !st) build();
    else if (!on && st) teardown();
  }

  sync();
  ['change', 'resize'].forEach(function (ev) {
    (ev === 'change' ? wide : window).addEventListener(ev, sync);
  });
  reduce.addEventListener('change', sync);

  /* Шрифты меняют высоту строк — пересчитываем позиции после загрузки */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
