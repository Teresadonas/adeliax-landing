(() => {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ── Títulos que aparecen palabra a palabra ── */
  if (!reduceMotion) {
    document.querySelectorAll(".section__head h2, .calc h2, .about h2, .final h2").forEach(h => {
      const words = h.textContent.trim().split(/\s+/);
      h.setAttribute("aria-label", h.textContent.trim());
      h.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(" ");
      h.classList.add("split");
    });
  }

  /* ── Aparición suave de los bloques al hacer scroll ── */
  const items = document.querySelectorAll(".reveal, .draw-on, .split");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(el => io.observe(el));
  } else {
    items.forEach(el => el.classList.add("is-visible"));
  }

  /* ── Barra de progreso, cabecera que se esconde y parallax ── */
  const nav = document.querySelector(".nav");
  const progress = document.querySelector(".progress");
  const parallax = [...document.querySelectorAll("[data-parallax]")];
  let lastY = window.scrollY, scrollTick = false;
  const onScroll = () => {
    scrollTick = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) {
      nav.classList.toggle("is-scrolled", y > 30);
      nav.classList.toggle("is-hidden", !reduceMotion && y > lastY && y > 500 && !nav.contains(document.activeElement));
    }
    lastY = y;
    if (!reduceMotion) parallax.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.parallax);
      el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0) scale(1.08)`;
    });
  };
  window.addEventListener("scroll", () => {
    if (!scrollTick) { scrollTick = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ── Contador animado (+15) ── */
  if ("IntersectionObserver" in window && !reduceMotion) {
    const co = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, t0 = performance.now();
      const tick = t => {
        const k = Math.min((t - t0) / 1400, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    document.querySelectorAll("[data-count]").forEach(el => co.observe(el));
  }

  /* ── Cursor, botones magnéticos e inclinación de tarjetas (solo con ratón) ── */
  if (finePointer && !reduceMotion) {
    const cursor = document.querySelector(".cursor");
    if (cursor) {
      const dot = cursor.querySelector(".cursor__dot"), ring = cursor.querySelector(".cursor__ring");
      let mx = -100, my = -100, rx = mx, ry = my, raf = 0;
      const loop = () => {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        raf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.3 ? requestAnimationFrame(loop) : 0;
      };
      window.addEventListener("mousemove", e => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
        cursor.classList.add("is-active");
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
      document.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
      document.addEventListener("mouseover", e => cursor.classList.toggle("is-hover", !!e.target.closest("a, button, summary, input, .tilt")));
    }

    document.querySelectorAll(".magnetic").forEach(el => {
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });

    document.querySelectorAll(".tilt").forEach(el => {
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 6}deg) rotateX(${(0.5 - y) * 6}deg) translateY(-4px)`;
        el.style.setProperty("--mx", `${x * 100}%`);
        el.style.setProperty("--my", `${y * 100}%`);
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ── Calculadora de tiempo perdido ──
     Todo se calcula aquí, en el navegador: no se envía ni se guarda nada. */
  const calc = document.querySelector("[data-calc]");
  if (calc) {
    const WEEKS = 46;
    const tasks = calc.querySelector("#calc-tasks");
    const minutes = calc.querySelector("#calc-minutes");
    const tasksOut = calc.querySelector("#calc-tasks-out");
    const minutesOut = calc.querySelector("#calc-minutes-out");
    const out = {
      week: calc.querySelector('[data-out="week"]'),
      year: calc.querySelector('[data-out="year"]'),
      days: calc.querySelector('[data-out="days"]'),
      summary: calc.querySelector('[data-out="summary"]'),
    };
    const cta = calc.querySelector("[data-calc-cta]");
    const waLink = document.querySelector('a[href*="wa.me/"]');
    const waNumber = waLink ? (waLink.href.match(/wa\.me\/(\d+)/) || [])[1] : "";

    const fmt1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
    const fmt0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
    const shown = { week: 0, year: 0, days: 0 };
    let anim = 0, summaryTimer = 0;

    const paint = v => {
      out.week.textContent = fmt1.format(v.week);
      out.year.textContent = fmt0.format(v.year);
      out.days.textContent = fmt1.format(v.days);
    };

    const setFill = input => {
      const p = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty("--fill", p + "%");
    };

    const update = animate => {
      const n = +tasks.value, m = +minutes.value;
      const week = n * m / 60;
      const target = { week, year: Math.round(week * WEEKS), days: week * WEEKS / 8 };

      tasksOut.textContent = n;
      minutesOut.textContent = m;
      tasks.setAttribute("aria-valuetext", n === 1 ? "1 tarea" : `${n} tareas`);
      minutes.setAttribute("aria-valuetext", `${m} minutos`);
      setFill(tasks);
      setFill(minutes);

      // Conteo animado de 600 ms desde el valor que se ve ahora
      cancelAnimationFrame(anim);
      if (!animate || reduceMotion) {
        Object.assign(shown, target);
        paint(shown);
      } else {
        const from = { ...shown }, t0 = performance.now();
        const tick = t => {
          const k = Math.min((t - t0) / 600, 1), e = 1 - Math.pow(1 - k, 3);
          for (const key in target) shown[key] = from[key] + (target[key] - from[key]) * e;
          paint(shown);
          if (k < 1) anim = requestAnimationFrame(tick);
        };
        anim = requestAnimationFrame(tick);
      }

      // Texto para lectores de pantalla (aria-live), solo cuando se deja de mover el control
      clearTimeout(summaryTimer);
      summaryTimer = setTimeout(() => {
        out.summary.textContent = `Unas ${fmt1.format(target.week)} horas por semana, ${fmt0.format(target.year)} horas al año, el equivalente a ${fmt1.format(target.days)} jornadas de 8 horas.`;
      }, animate ? 500 : 0);

      if (cta && waNumber) {
        const msg = `Hola Teresa, he calculado que dedico unas ${fmt0.format(target.year)} horas al año a tareas repetitivas (${n === 1 ? "1 tarea" : n + " tareas"} por semana, ${m} minutos cada una). Me gustaría contarte mi caso.`;
        cta.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
      }
    };

    tasks.addEventListener("input", () => update(true));
    minutes.addEventListener("input", () => update(true));
    update(false);
  }

  /* ── Teclado de piano (Web Audio, sin archivos de sonido) ── */
  const piano = document.querySelector("[data-piano]");
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (piano && AudioCtx) {
    const keys = [...piano.querySelectorAll(".key")];
    const byLetter = Object.fromEntries(keys.map(k => [k.dataset.key, k]));
    const voices = new Map();
    let ctx = null, master = null;

    // El AudioContext se crea (o se reanuda) solo tras la primera interacción
    const ensureAudio = () => {
      if (!ctx) {
        ctx = new AudioCtx();
        const comp = ctx.createDynamicsCompressor();
        master = ctx.createGain();
        master.gain.value = 0.55;
        master.connect(comp);
        comp.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
    };

    const noteOn = (key, id) => {
      ensureAudio();
      if (voices.has(id)) noteOff(id);
      const f = +key.dataset.freq, t = ctx.currentTime;

      // Envolvente: ataque rápido y caída exponencial (sin clics)
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.32, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.1, t + 0.35);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2600;
      env.connect(lp).connect(master);

      // Fundamental en triángulo + dos armónicos en seno: suena más a piano
      const oscs = [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12]].map(([mult, type, level]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type;
        o.frequency.value = f * mult;
        g.gain.value = level;
        o.connect(g).connect(env);
        o.start(t);
        o.stop(t + 2.5);
        return o;
      });

      key.classList.add("is-down");
      voices.set(id, { key, env, oscs });
      floatNote(key);
    };

    // Una nota musical sale volando de la tecla
    const floatNote = key => {
      if (reduceMotion) return;
      const r = key.getBoundingClientRect(), n = document.createElement("span");
      n.className = "note-float";
      n.setAttribute("aria-hidden", "true");
      n.textContent = ["♪", "♫", "♩", "♬"][Math.floor(Math.random() * 4)];
      n.style.left = `${r.left + r.width / 2}px`;
      n.style.top = `${r.top - 6}px`;
      n.style.setProperty("--dx", `${Math.random() * 70 - 35}px`);
      n.style.setProperty("--r", `${Math.random() * 50 - 25}deg`);
      document.body.appendChild(n);
      setTimeout(() => n.remove(), 1450);
    };

    const noteOff = id => {
      const v = voices.get(id);
      if (!v) return;
      voices.delete(id);
      const t = ctx.currentTime;
      if (v.env.gain.cancelAndHoldAtTime) {
        v.env.gain.cancelAndHoldAtTime(t);
      } else {
        v.env.gain.cancelScheduledValues(t);
        v.env.gain.setValueAtTime(Math.max(v.env.gain.value, 0.0001), t);
      }
      v.env.gain.setTargetAtTime(0.0001, t, 0.09);
      v.oscs.forEach(o => { try { o.stop(t + 0.8); } catch (_) {} });
      if (![...voices.values()].some(other => other.key === v.key)) v.key.classList.remove("is-down");
    };

    const releaseAll = () => [...voices.keys()].forEach(noteOff);

    // Ratón y pantalla táctil (pointer events); deslizar el dedo cambia de nota
    const keyAt = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return el && piano.contains(el) ? el.closest(".key") : null;
    };
    piano.addEventListener("pointerdown", e => {
      const key = e.target.closest(".key");
      if (!key || e.button > 0) return;
      e.preventDefault();
      noteOn(key, "p" + e.pointerId);
    });
    piano.addEventListener("pointermove", e => {
      const v = voices.get("p" + e.pointerId);
      if (!v) return;
      const key = keyAt(e.clientX, e.clientY);
      if (!key) noteOff("p" + e.pointerId);
      else if (key !== v.key) noteOn(key, "p" + e.pointerId);
    });
    ["pointerup", "pointercancel"].forEach(type =>
      window.addEventListener(type, e => noteOff("p" + e.pointerId)));
    piano.addEventListener("contextmenu", e => e.preventDefault());

    // Botones accesibles: Intro/Espacio tocan la tecla enfocada; flechas para moverse (un solo tabulador)
    keys.forEach((k, i) => k.tabIndex = i === 0 ? 0 : -1);
    piano.addEventListener("keydown", e => {
      const key = e.target.closest(".key");
      if (!key) return;
      const visible = keys.filter(k => k.offsetParent !== null); // en móvil se ocultan las teclas extra
      const i = visible.indexOf(key);
      let next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") next = visible[Math.min(i + 1, visible.length - 1)];
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = visible[Math.max(i - 1, 0)];
      else if (e.key === "Home") next = visible[0];
      else if (e.key === "End") next = visible[visible.length - 1];
      if (next) {
        e.preventDefault();
        key.tabIndex = -1;
        next.tabIndex = 0;
        next.focus();
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) noteOn(key, "focus");
      }
    });
    piano.addEventListener("keyup", e => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); noteOff("focus"); }
    });
    // Activación desde lectores de pantalla (clic sin ratón)
    piano.addEventListener("click", e => {
      const key = e.target.closest(".key");
      if (!key || e.detail !== 0) return;
      const id = "click" + performance.now();
      noteOn(key, id);
      setTimeout(() => noteOff(id), 350);
    });

    // Teclado del ordenador (A S D F G H J K / W E T Y U) mientras el piano está a la vista
    let inView = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0.5 }).observe(piano);
    }
    const typing = el => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    document.addEventListener("keydown", e => {
      const key = byLetter[e.key.toLowerCase()];
      if (!key || key.offsetParent === null || e.ctrlKey || e.metaKey || e.altKey || typing(document.activeElement)) return;
      if (!inView && !piano.contains(document.activeElement)) return;
      e.preventDefault();
      if (!e.repeat) noteOn(key, "k" + e.key.toLowerCase());
    });
    document.addEventListener("keyup", e => noteOff("k" + e.key.toLowerCase()));
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", () => { if (document.hidden) releaseAll(); });
  }

  /* ── Hilo que se dibuja al hacer scroll ──
     Escritorio: un ovillo en el margen izquierdo de la portada que se convierte en una curva
     que baja por los márgenes y cruza de lado en los huecos vacíos entre secciones.
     Pantallas estrechas: una línea recta pegada al borde izquierdo. */
  const main = document.querySelector("main");
  const svg = main && main.querySelector(".thread");
  if (svg) {
    const path = svg.querySelector("path");
    const sections = [...main.querySelectorAll(":scope > section")];
    const final = sections[sections.length - 1];
    let length = 0, table = [], mainTop = 0, frame = 0, introStart = 0;

    const r1 = n => Math.round(n * 10) / 10;

    // Curva suave (Catmull-Rom) que pasa por una lista de puntos
    const smooth = pts => {
      let d = "";
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += ` C${r1(p1[0] + (p2[0] - p0[0]) / 6)},${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)},${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])},${r1(p2[1])}`;
      }
      return d;
    };

    // Ovillo: unos bucles enredados alrededor de (cx, cy) que terminan saliendo hacia abajo
    const tangle = (cx, cy, R) => {
      const pts = [], N = 64, turns = 2.5;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const a = -Math.PI / 2 + t * turns * 2 * Math.PI + 0.5 * Math.sin(t * 6 * Math.PI);
        const r = R * (1 - 0.55 * Math.sin(Math.PI * t) * (0.65 + 0.35 * Math.sin(t * 13)));
        const ox = R * 0.32 * Math.sin(Math.PI * t * 3), oy = R * 0.22 * Math.sin(Math.PI * t * 2);
        pts.push([cx + ox + r * Math.cos(a), cy + oy + r * Math.sin(a)]);
      }
      return pts;
    };

    const build = () => {
      const scrollY = window.scrollY;
      mainTop = main.getBoundingClientRect().top + scrollY;
      const top = el => el.getBoundingClientRect().top + scrollY - mainTop;
      const W = main.clientWidth;
      const container = sections[0].querySelector(".container");
      const gutter = container.getBoundingClientRect().left - main.getBoundingClientRect().left
        + parseFloat(getComputedStyle(container).paddingLeft);
      const finalTop = top(final);
      const H = finalTop + 2;

      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      let d;
      if (gutter < 88) {
        const x = gutter < 20 ? 5 : r1(gutter / 2);
        d = `M${x},${r1(top(sections[0]) + 24)} V${r1(finalTop)}`;
      } else {
        const xL = r1(gutter / 2), xR = r1(W - gutter / 2), xC = r1(W / 2);
        const R = Math.min(30, gutter / 2 - 14);
        const cy = top(sections[0]) + 40 + R;
        const pts = tangle(xL, cy, R);
        d = `M${r1(pts[0][0])},${r1(pts[0][1])}` + smooth(pts);
        let x = xL, y = pts[pts.length - 1][1];
        // Cada tramo baja por un margen y cruza al otro en el hueco entre secciones (±60 px)
        for (let i = 1; i < sections.length; i++) {
          const b = top(sections[i]);
          const isLast = sections[i] === final;
          const nx = isLast ? xC : (i % 2 ? xR : xL);
          const yA = b - 60;
          d += ` C${x},${r1(y + (yA - y) / 3)} ${x},${r1(yA - (yA - y) / 3)} ${x},${r1(yA)}`;
          const yB = isLast ? b : b + 60;
          d += ` C${x},${r1(b)} ${nx},${r1(isLast ? b - 50 : b)} ${nx},${r1(yB)}`;
          x = nx; y = yB;
        }
      }
      path.setAttribute("d", d);

      length = path.getTotalLength();
      if (reduceMotion) {
        path.style.strokeDasharray = "none";
        path.style.strokeDashoffset = "0";
        return;
      }
      path.style.strokeDasharray = `${length} ${length}`;

      // Tabla longitud → altura máxima alcanzada, para saber cuánto dibujar según el scroll
      table = [];
      let maxY = -Infinity;
      const steps = Math.min(600, Math.ceil(length / 12));
      for (let k = 0; k <= steps; k++) {
        const l = length * k / steps;
        maxY = Math.max(maxY, path.getPointAtLength(l).y);
        table.push([l, maxY]);
      }
      path.style.strokeDashoffset = length;
      schedule();
    };

    const lengthAt = y => {
      let lo = 0, hi = table.length - 1;
      if (y >= table[hi][1]) return length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (table[mid][1] < y) lo = mid + 1; else hi = mid;
      }
      return table[lo][0];
    };

    const draw = () => {
      frame = 0;
      if (!table.length) return;
      // La punta del hilo va algo por debajo de la mitad de la pantalla
      let drawn = lengthAt(window.scrollY - mainTop + window.innerHeight * 0.6);
      // Al cargar, el primer tramo (el ovillo) se dibuja en poco más de un segundo
      const k = Math.min((performance.now() - introStart) / 1400, 1);
      if (k < 1) {
        drawn *= 1 - Math.pow(1 - k, 3);
        frame = requestAnimationFrame(draw);
      }
      path.style.strokeDashoffset = r1(length - drawn);
    };

    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    let buildFrame = 0;
    const scheduleBuild = () => {
      cancelAnimationFrame(buildFrame);
      buildFrame = requestAnimationFrame(build);
    };

    introStart = performance.now();
    build();
    if (!reduceMotion) window.addEventListener("scroll", schedule, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(scheduleBuild).observe(document.body);
    else window.addEventListener("resize", scheduleBuild);
    if (document.fonts) document.fonts.ready.then(scheduleBuild);
  }
})();
