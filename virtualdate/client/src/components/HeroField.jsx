import React, { useEffect, useRef } from 'react';

export default function HeroField({ densityMultiplier = 1, interactive = true }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const D = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, P = [], rip = [], t = 0, meet = 0, raf = null;
    let mx = null, my = null, px = null, py = null, tx = null, ty = null;
    let isVisible = true;

    const size = () => {
      const r = cv.parentElement || cv;
      W = r.offsetWidth || window.innerWidth;
      H = r.offsetHeight || window.innerHeight;
      cv.width = W * D;
      cv.height = H * D;
      cx.setTransform(D, 0, 0, D, 0, 0);
      cx.fillStyle = '#000';
      cx.fillRect(0, 0, W, H);

      if (mx == null) {
        mx = tx = W * 0.3;
        my = ty = H * 0.65;
        px = W * 0.72;
        py = H * 0.35;
      }

      const baseCount = W < 600 ? 650 : 1700;
      const count = Math.round(baseCount * densityMultiplier);
      P = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        l: Math.random() * 220,
      }));
    };

    const move = (e) => {
      if (!interactive) return;
      const r = cv.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    };

    const down = (e) => {
      if (!interactive) return;
      const r = cv.getBoundingClientRect();
      rip.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: 0 });
    };

    const step = () => {
      t += 0.012;
      mx += (tx - mx) * 0.09;
      my += (ty - my) * 0.09;
      const d = Math.hypot(mx - px, my - py);
      const near = d < 320;
      const gx = W / 2 + Math.cos(t * 0.6) * W * 0.32;
      const gy = H / 2 + Math.sin(t * 0.8) * H * 0.28;
      const k = near ? 0.03 : 0.006;
      px += ((near ? mx + Math.cos(t * 3) * 100 : gx) - px) * k;
      py += ((near ? my + Math.sin(t * 3) * 100 : gy) - py) * k;
      meet += ((d < 190 ? 1 : 0) - meet) * 0.05;

      cx.fillStyle = 'rgba(0,0,0,0.11)';
      cx.fillRect(0, 0, W, H);

      const L = [[mx, my, 1], [px, py, -1]];
      for (const p of P) {
        const ox = p.x;
        const oy = p.y;
        const a = Math.sin(p.x * 0.003 + t) + Math.cos(p.y * 0.0035 - t * 0.8);
        let vx = Math.cos(a * 2) * 0.45;
        let vy = Math.sin(a * 2) * 0.45;
        let g = 0;

        for (const [lx, ly, s] of L) {
          const dx = lx - p.x;
          const dy = ly - p.y;
          const dd = Math.hypot(dx, dy) + 1;
          const q = Math.min(3.4, 300 / dd) * (1 + meet * 0.5);
          vx += (-dy / dd * s * q) + dx / dd * q * 0.3;
          vy += (dx / dd * s * q) + dy / dd * q * 0.3;
          g += Math.min(1, 90 / dd);
        }

        p.x += vx * 1.25;
        p.y += vy * 1.25;

        if (--p.l < 0 || p.x < 0 || p.y < 0 || p.x > W || p.y > H) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.l = 120 + Math.random() * 160;
          continue;
        }

        cx.strokeStyle = `rgba(255,255,255,${Math.min(0.9, 0.1 + g * 0.55 + Math.hypot(vx, vy) * 0.05)})`;
        cx.lineWidth = 0.5 + g * 0.9;
        cx.beginPath();
        cx.moveTo(ox, oy);
        cx.lineTo(p.x, p.y);
        cx.stroke();
      }

      cx.globalCompositeOperation = 'lighter';
      for (const [lx, ly] of L) {
        const R = 60 + meet * 50;
        const gr = cx.createRadialGradient(lx, ly, 0, lx, ly, R);
        gr.addColorStop(0, 'rgba(255,255,255,0.35)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        cx.fillStyle = gr;
        cx.fillRect(lx - R, ly - R, R * 2, R * 2);
      }
      cx.globalCompositeOperation = 'source-over';

      rip = rip.filter((r) => (r.t += 0.016) < 1);
      for (const r of rip) {
        cx.strokeStyle = `rgba(255,255,255,${(1 - r.t) * 0.5})`;
        cx.lineWidth = 1.2;
        cx.beginPath();
        cx.arc(r.x, r.y, r.t * Math.max(W, H) * 0.45, 0, 6.283);
        cx.stroke();
      }
    };

    const loop = () => {
      if (isVisible) {
        step();
      }
      raf = requestAnimationFrame(loop);
    };

    size();
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', move, { passive: true });
    cv.addEventListener('pointerdown', down);

    // Pause when tab is hidden or off-screen (Section 12)
    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let observer = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting && document.visibilityState === 'visible';
      });
      observer.observe(cv);
    }

    if (RM) {
      for (let i = 0; i < 150; i++) step();
    } else {
      loop();
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      window.removeEventListener('pointermove', move);
      cv.removeEventListener('pointerdown', down);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (observer) observer.disconnect();
    };
  }, [densityMultiplier, interactive]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    />
  );
}
