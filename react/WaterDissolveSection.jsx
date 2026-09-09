/* ═══════════════════════════════════════════════════════════════════
   WaterDissolveSection — переход ПРОБЛЕМА → АППАРАТ на React + GSAP
   ───────────────────────────────────────────────────────────────────
   Порт того же таймлайна, что работает на статической странице
   (см. ../water-dissolve.js). Логика движения идентична — отличается
   только способ получить узлы: там data-атрибуты, здесь ref'ы.

   Установка:
     npm i gsap
     import WaterDissolveSection from './WaterDissolveSection';
     import './WaterDissolveSection.css';

   Структура:
     <section ref=root>                     ← закрепляется ScrollTrigger'ом
       .wd__media    вода, слово-подложка, судно, блики
       .wd__scene--problem                  ← сцена 1
       .wd__scene--apparatus                ← сцена 2
       .wd__foot                            ← нижняя строка экрана

   Этапы (прогресс закреплённой прокрутки):
      0–18   сцена стоит, вода медленно дышит
     18–43   растворение: прозрачность ↓, размытие ↑, строки расходятся,
             по тексту идёт блик, слово ПРОБЛЕМА тает
     36–82   судно входит в кадр, вода идёт своим параллаксом
     50–83   слово меняется на АППАРАТ, новый заголовок собирается
     84–100  всё садится на место, кадр становится резким
   ═══════════════════════════════════════════════════════════════════ */

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* Смещение строк при расслоении: у каждой свой знак и амплитуда, чтобы
   блок «разъезжался» как отражение на ряби, а не уезжал целиком. */
const DRIFT = [-26, 14, 34];

const PROBLEM_LINES = [
  'Пробу везут в лабораторию.',
  'К моменту результата',
  <em key="em">источник уже не найти</em>
];

const APPARATUS_LINES = [
  'Безэкипажное судно,',
  <>собранное под <em>наши</em></>,
  <><em>реки</em>.</>
];

export default function WaterDissolveSection({
  vessel = '/assets/vessel-hero.png',
  waterImage = '/assets/vessel-hero.png'
}) {
  const root = useRef(null);

  /* Ссылки на анимируемые слои. Массивы строк заполняем через колбэк-ref. */
  const water = useRef(null);
  const ghost1 = useRef(null);
  const ghost2 = useRef(null);
  const pass1 = useRef(null);
  const pass2 = useRef(null);
  const usv = useRef(null);
  const wake = useRef(null);
  const disp1 = useRef(null);
  const disp2 = useRef(null);

  const s1Eye = useRef(null);
  const s1Lines = useRef([]);
  const s1Body = useRef(null);
  const s1Foot = useRef(null);

  const scene2 = useRef(null);
  const s2Eye = useRef(null);
  const s2Lines = useRef([]);
  const s2P = useRef(null);
  const s2Foot = useRef(null);

  const setLine = (store, i) => (el) => { store.current[i] = el; };

  useLayoutEffect(() => {
    /* Эффект уместен только на широких экранах и когда движение не отключено.
       Иначе сцены остаются двумя обычными экранами подряд — контент тот же. */
    const mm = gsap.matchMedia();

    mm.add(
      { desktop: '(min-width: 1025px) and (prefers-reduced-motion: no-preference)' },
      () => {
        const ctx = gsap.context(() => {
          /* ── Стартовое состояние второй сцены ─────────────────────── */
          gsap.set(scene2.current, { opacity: 0 });
          gsap.set(usv.current, { opacity: 0, yPercent: 11, scale: 1.16, rotation: 1.6 });
          gsap.set(wake.current, { opacity: 0, yPercent: 7, scale: 1.12 });
          gsap.set(ghost2.current, { opacity: 0, filter: 'blur(14px)', scale: 1.05 });
          gsap.set(s2Lines.current, {
            opacity: 0,
            filter: 'blur(18px)',
            y: (i) => -DRIFT[i % 3] * 0.8
          });
          gsap.set([s2Eye.current, s2P.current], { opacity: 0, filter: 'blur(10px)', y: 16 });
          gsap.set(s2Foot.current, { opacity: 0 });
          gsap.set([pass1.current, pass2.current], { opacity: 0, xPercent: -160 });

          /* ── Единый таймлайн: 100 «единиц» = 100 % закреплённой прокрутки ── */
          const tl = gsap.timeline({ defaults: { ease: 'none' } });

          /* 0–62 — вода медленно уходит в параллакс */
          tl.to(water.current, { yPercent: -4, scale: 1.06, duration: 62 }, 0);

          /* 18–43 — РАСТВОРЕНИЕ: строки расходятся, размываются и гаснут,
             feDisplacementMap одновременно «уводит» буквы по шуму воды */
          s1Lines.current.forEach((line, i) => {
            tl.to(line, {
              opacity: 0,
              y: DRIFT[i % 3],
              filter: 'blur(16px)',
              duration: 20
            }, 18 + i * 2.5);
          });
          tl.to(disp1.current, { attr: { scale: 28 }, duration: 24 }, 18);

          /* Эйбрау, абзац и наборные блоки — тот же приём, но сдержаннее */
          tl.to(s1Eye.current, { opacity: 0, y: 14, filter: 'blur(8px)', duration: 15 }, 18)
            .to(s1Body.current, { opacity: 0, y: 26, filter: 'blur(9px)', duration: 19 }, 20)
            .to(s1Foot.current, { opacity: 0, duration: 14 }, 26);

          /* Блик преломлённого света идёт слева направо по тексту */
          tl.to(pass1.current, { opacity: 0.55, duration: 6 }, 19)
            .to(pass1.current, { xPercent: 420, duration: 24 }, 19)
            .to(pass1.current, { opacity: 0, duration: 7 }, 38);

          /* Слово-подложка тает медленнее всего остального */
          tl.to(ghost1.current, {
            opacity: 0, filter: 'blur(12px)', scale: 1.05, y: -26, duration: 30
          }, 20);

          /* 36–82 — СУДНО ВХОДИТ В КАДР: поднимается снизу, разворот 1.6° → 0,
             вода и брызги идут отдельным, более медленным слоем */
          tl.to(scene2.current, { opacity: 1, duration: 9 }, 36)
            .to(usv.current, { opacity: 1, duration: 13 }, 38)
            .to(usv.current, { yPercent: 0, scale: 1.03, rotation: 0, duration: 44 }, 38)
            .to(wake.current, { opacity: 1, duration: 15 }, 40)
            .to(wake.current, { yPercent: 0, scale: 1.06, duration: 46 }, 40)
            .to(water.current, { opacity: 0, duration: 18 }, 44);

          /* 50–82 — слово-подложка меняется на АППАРАТ */
          tl.to(ghost2.current, {
            opacity: 1, filter: 'blur(0px)', scale: 1, duration: 32
          }, 50);

          /* 56–83 — СБОРКА ЗАГОЛОВКА: обратный ход растворения */
          tl.set(disp2.current, { attr: { scale: 26 } }, 50)
            .to(disp2.current, { attr: { scale: 0 }, duration: 25 }, 56);
          s2Lines.current.forEach((line, i) => {
            tl.to(line, {
              opacity: 1, y: 0, filter: 'blur(0px)', duration: 20
            }, 56 + i * 2.5);
          });
          tl.to(s2Eye.current, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 15 }, 56)
            .to(s2P.current, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 20 }, 62)
            .to(s2Foot.current, { opacity: 1, duration: 18 }, 60);

          /* Ответный блик — теперь он проявляет текст, а не смывает его */
          tl.to(pass2.current, { opacity: 0.5, duration: 6 }, 56)
            .to(pass2.current, { xPercent: 420, duration: 26 }, 56)
            .to(pass2.current, { opacity: 0, duration: 8 }, 80);

          /* 84–100 — всё садится, судно едва заметно всплывает */
          tl.to(usv.current, { yPercent: -0.6, duration: 16 }, 84)
            .to(wake.current, { yPercent: -1.1, duration: 16 }, 84);

          /* ── Закрепление и привязка к прокрутке ────────────────────
             scrub 0.6 с оставляет движение «тяжёлым», без рывков. */
          ScrollTrigger.create({
            trigger: root.current,
            start: 'top top',
            end: '+=190%',
            pin: true,
            pinSpacing: true,
            scrub: 0.6,
            animation: tl,
            invalidateOnRefresh: true,
            /* Дорогой SVG-фильтр держим включённым только на время растворения */
            onUpdate: (self) => {
              const p = self.progress;
              root.current.classList.toggle('is-wd1', p > 0.16 && p < 0.48);
              root.current.classList.toggle('is-wd2', p > 0.5 && p < 0.88);
              root.current.classList.toggle('is-past', p > 0.5);
            }
          });
        }, root);

        /* Шрифты меняют высоту строк — пересчитываем после загрузки */
        document.fonts?.ready.then(() => ScrollTrigger.refresh());

        return () => ctx.revert();   // matchMedia сам вызовет при уходе с брейкпоинта
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <>
      {/* Фильтры водного растворения: feTurbulence рисует шум,
          feDisplacementMap смещает по нему пиксели текста.
          Анимируется только атрибут scale: 0 — текст цел, 28 — «плывёт». */}
      <svg className="wd-defs" aria-hidden focusable="false">
        <defs>
          <filter id="wdDissolve" x="-25%" y="-35%" width="150%" height="170%"
                  colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.007 0.021"
                          numOctaves="2" seed="4" result="wdNoiseA" />
            <feDisplacementMap ref={disp1} in="SourceGraphic" in2="wdNoiseA" scale="0"
                               xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="wdReform" x="-25%" y="-35%" width="150%" height="170%"
                  colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.009 0.017"
                          numOctaves="2" seed="11" result="wdNoiseB" />
            <feDisplacementMap ref={disp2} in="SourceGraphic" in2="wdNoiseB" scale="0"
                               xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <section className="wd" ref={root}>
        {/* ── Фоновые слои ──────────────────────────────────────────── */}
        <div className="wd__media" aria-hidden>
          <div className="wd__water" ref={water}
               style={{ backgroundImage: `url(${waterImage})` }} />
          <img className="wd__usv" ref={usv} src={vessel} alt="" />
          <div className="wd__wake" ref={wake}
               style={{ backgroundImage: `url(${vessel})` }} />
          <div className="wd__veil" />
          <div className="wd__ghost" ref={ghost1}>ПРОБЛЕМА</div>
          <div className="wd__ghost wd__ghost--2" ref={ghost2}>АППАРАТ</div>
          <div className="wd__pass" ref={pass1} />
          <div className="wd__pass" ref={pass2} />
        </div>

        {/* ── Сцена 1: ПРОБЛЕМА ─────────────────────────────────────── */}
        <div className="wd__scene wd__scene--problem">
          <p className="wd__eyebrow" ref={s1Eye}><span className="wd__rule" />01 — ПРОБЛЕМА</p>
          <h2 className="wd__h wd__h--dissolve">
            {PROBLEM_LINES.map((text, i) => (
              <span className="wd__ln" key={i}>
                <i ref={setLine(s1Lines, i)}>{text}{i === 2 ? '.' : null}</i>
              </span>
            ))}
          </h2>
          <div ref={s1Body}>
            <p className="wd__p">
              Государственный мониторинг в Казахстане построен на дискретном отборе
              проб. Залповый сброс между отборами не фиксируется вообще — а когда
              анализ готов, вода в реке давно сменилась, и доказать, кто сбросил,
              уже невозможно.
            </p>
          </div>
        </div>

        {/* ── Сцена 2: АППАРАТ ──────────────────────────────────────── */}
        <div className="wd__scene wd__scene--apparatus" ref={scene2}>
          <div className="wd__cols">
            <div>
              <p className="wd__eyebrow" ref={s2Eye}><span className="wd__rule" />02 — АППАРАТ</p>
              <h2 className="wd__h wd__h--reform">
                {APPARATUS_LINES.map((text, i) => (
                  <span className="wd__ln" key={i}>
                    <i ref={setLine(s2Lines, i)}>{text}</i>
                  </span>
                ))}
              </h2>
            </div>
            <p className="wd__p" ref={s2P}>
              Корпус, узел забора пробы и энергетика рассчитаны на мелководье, взвесь
              и резкие перепады температуры — условия равнинных рек и водохранилищ
              Казахстана, а не лабораторного бассейна.
            </p>
          </div>
        </div>

        {/* ── Нижние строки экрана ──────────────────────────────────── */}
        <div className="wd__foot" ref={s1Foot}>
          <p><span className="wd__vrule" />ДАННЫЕ ДЛЯ ЧИСТЫХ<br />РЕК КАЗАХСТАНА</p>
          <div className="wd__pager"><b>01</b><span>02</span><span>03</span></div>
          <p className="wd__foot-r">РАННЕЕ ОБНАРУЖЕНИЕ<br />ДОКАЗУЕМЫЙ ИСТОЧНИК<span className="wd__hrule" /></p>
        </div>
        <div className="wd__foot wd__foot--2" ref={s2Foot}>
          <p><span className="wd__vrule" />ДАННЫЕ ДЛЯ ЧИСТЫХ<br />РЕК КАЗАХСТАНА</p>
          <div className="wd__pager"><span>01</span><b>02</b><span>03</span></div>
          <p className="wd__foot-r">КОРПУС · ЗОНД<br />СВЯЗЬ · ЭНЕРГИЯ<span className="wd__hrule" /></p>
        </div>
      </section>
    </>
  );
}
