import React, { useEffect, useRef, useState } from 'react';
import './LiquidWhitePaintMask.css';

export default function LiquidWhitePaintMask() {
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const [isFadedOut, setIsFadedOut] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const mouseRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    smoothX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    smoothY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    lastX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    lastY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    velocity: 0,
    strokeCount: 0
  });

  const animationIdRef = useRef();
  const fadeTimeoutRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    const paintWhiteCover = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';

      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    };

    paintWhiteCover();
    window.addEventListener('resize', paintWhiteCover);

    const mouse = mouseRef.current;

    const onPointerMove = (e) => {
      mouse.x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      mouse.y = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      mouse.strokeCount += 1;

      // After user moves the cursor across the screen, trigger the automatic gradual disappearance
      if (mouse.strokeCount > 15 && !fadeTimeoutRef.current) {
        fadeTimeoutRef.current = setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setIsFadedOut(true);
          }, 1800);
        }, 1200);
      }
    };

    const drawSmoothWipeStamp = (x, y, radius) => {
      if (!ctx) return;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';

      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.98)');
      grad.addColorStop(0.92, 'rgba(0, 0, 0, 0.5)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawSplineWipe = (p1, p2, radius) => {
      if (!ctx || !p1 || !p2) return;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const steps = Math.max(Math.floor(dist / 4), 1);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const interpX = p1.x + (p2.x - p1.x) * t;
        const interpY = p1.y + (p2.y - p1.y) * t;
        drawSmoothWipeStamp(interpX, interpY, radius);
      }
    };

    const render = () => {
      const lerp = 0.28;
      mouse.lastX = mouse.smoothX;
      mouse.lastY = mouse.smoothY;

      mouse.smoothX += (mouse.x - mouse.smoothX) * lerp;
      mouse.smoothY += (mouse.y - mouse.smoothY) * lerp;

      const distMoved = Math.hypot(mouse.smoothX - mouse.lastX, mouse.smoothY - mouse.lastY);
      mouse.velocity = mouse.velocity * 0.75 + distMoved * 0.25;

      const baseRadius = 92;
      const dynamicRadius = Math.min(baseRadius + mouse.velocity * 2.2, 155);

      if (distMoved > 0.05) {
        drawSplineWipe(
          { x: mouse.lastX, y: mouse.lastY },
          { x: mouse.smoothX, y: mouse.smoothY },
          dynamicRadius
        );
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouse.smoothX - 11}px, ${mouse.smoothY - 11}px, 0)`;
      }

      animationIdRef.current = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    render();

    return () => {
      window.removeEventListener('resize', paintWhiteCover);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  if (isFadedOut) return null;

  return (
    <>
      {/* Gliding Neon Lime Follower Cursor */}
      <div className={`neon-cursor-dot ${isFading ? 'cursor-fade-out' : ''}`} ref={cursorRef}></div>

      {/* Solid White Paint Canvas Layer with Gradual Automatic Dissolve */}
      <canvas 
        ref={canvasRef} 
        className={`liquid-white-paint-canvas ${isFading ? 'paint-canvas-fade-out' : ''}`} 
      />
    </>
  );
}
