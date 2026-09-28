"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animaciones del sitio:
 * - [data-reveal] (="left" | "right" | "zoom"): el elemento aparece al entrar en pantalla (sube y se enfoca).
 * - [data-reveal-group]: sus hijos aparecen uno tras otro (en cascada).
 * - Encabezado compacto al bajar y parallax suave de la foto de portada con el mouse.
 * Sin JavaScript o con "reducir movimiento" activado, todo se ve normal y sin animación.
 */
export function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    root.classList.add("motion-on");

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    const vistos = new WeakSet<Element>();
    const escanear = () => {
      document.querySelectorAll("[data-reveal-group]").forEach((g) => {
        Array.from(g.children).forEach((c, i) => {
          if (!c.hasAttribute("data-reveal")) c.setAttribute("data-reveal", "");
          (c as HTMLElement).style.setProperty("--d", `${Math.min(i, 8) * 110}ms`);
        });
      });
      document.querySelectorAll("[data-reveal]").forEach((el) => { if (!vistos.has(el)) { vistos.add(el); io.observe(el); } });
    };
    escanear();
    let t = 0;
    const mo = new MutationObserver(() => { window.clearTimeout(t); t = window.setTimeout(escanear, 60); });
    mo.observe(document.body, { childList: true, subtree: true });

    const onScroll = () => root.classList.toggle("scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const hero = document.querySelector<HTMLElement>(".hero");
    const onMove = (ev: PointerEvent) => {
      if (!hero || ev.pointerType !== "mouse") return;
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
      hero.style.setProperty("--my", ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
    };
    hero?.addEventListener("pointermove", onMove);

    return () => { io.disconnect(); mo.disconnect(); window.removeEventListener("scroll", onScroll); hero?.removeEventListener("pointermove", onMove); root.classList.remove("motion-on"); };
  }, []);
  return null;
}

/** Número que cuenta desde 0 cuando aparece en pantalla. */
export function Contador({ hasta, ms = 1400 }: { hasta: number; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(hasta);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setN(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const paso = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        setN(Math.round(hasta * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [hasta, ms]);
  return <span className="counter" ref={ref}>{n}</span>;
}
