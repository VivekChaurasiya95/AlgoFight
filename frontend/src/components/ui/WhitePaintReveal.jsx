import React, { useEffect, useRef, useState } from 'react';
import './WhitePaintReveal.css';

export default function WhitePaintReveal() {
  const canvasRef = useRef(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Fill with solid white paint initially
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const eraseAt = (x, y, radius = 90) => {
      if (!ctx) return;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';

      // Create a smooth radial gradient for soft liquid edges
      const radGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      radGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      radGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.95)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Connect with previous position for continuous brush stroke
      if (lastPosRef.current.x && lastPosRef.current.y) {
        ctx.lineWidth = radius * 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = radGrad;
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      ctx.restore();
      lastPosRef.current = { x, y };
    };

    const handlePointerMove = (e) => {
      if (!hasInteracted) setHasInteracted(true);
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      eraseAt(clientX, clientY, 95);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [hasInteracted]);

  return (
    <>
      <canvas ref={canvasRef} className="white-paint-scratch-canvas" />
      {!hasInteracted && (
        <div className="paint-reveal-hint">
          <span className="paint-hint-pulse" />
          <span>Move cursor to reveal AlgoFight</span>
        </div>
      )}
    </>
  );
}
