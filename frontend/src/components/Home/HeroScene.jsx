import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './HeroScene.css';
import { useTheme } from '../../contexts/ThemeContext';
import heroCharacterVideoWebm from '../../assets/watermark-removed-gemini_generated_video_a46fd70e-nobg.webm';
import heroCharacterVideoMp4 from '../../assets/watermark-removed-gemini_generated_video_a46fd70e.mp4';
import heroStudioStage from '../../assets/hero_studio_stage.png';

/**
 * HeroScene: Layered Theme-Aware Visual Scene Renderer
 * 
 * Stacking Model:
 * 1. Base Stage Backdrop (neutral stage)
 * 2. Theme-Specific Atmosphere (smooth crossfading bloom/fog)
 * 3. CSS Lighting Effects (radial pools, dynamic spotlights)
 * 4. Continuous Animated Character Video (alpha-transparent WebM, never remounted)
 * 5. Decorative Overlays & Cyber Ambient Particles
 * 6. Theme Vignette & Edge Finishing Treatment
 */
export default function HeroScene() {
  const { theme, activeThemeConfig } = useTheme();

  // Optimized Hero Video loading: deferred until after initial paint & viewport intersection
  const [videoSrc, setVideoSrc] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Video lazy-loading with IntersectionObserver
  useEffect(() => {
    let observer;
    let idleId;
    let timeoutId;

    const startVideoLoad = () => {
      setVideoSrc(heroCharacterVideoWebm);
    };

    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            startVideoLoad();
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
            }
          } else if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
        },
        { rootMargin: '200px 0px', threshold: 0.1 }
      );
      observer.observe(containerRef.current);
    } else {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(startVideoLoad, { timeout: 1200 });
      } else {
        timeoutId = setTimeout(startVideoLoad, 250);
      }
    }

    return () => {
      if (observer) observer.disconnect();
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Safe scene configuration with defaults
  const scene = activeThemeConfig?.scene || {};
  const stageBackground = scene.baseStage || heroStudioStage;
  const particleCount = scene.particleCount || 16;
  const particleColor = scene.particleColor || 'rgba(227, 229, 237, 0.25)';

  // Deterministic floating particles for layer 5
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: `${(i * 19) % 94 + 3}%`,
      y: `${(i * 29) % 80 + 10}%`,
      size: (i % 3) + 2,
      duration: 3.5 + (i % 4) * 0.8,
      delay: (i % 5) * 0.4,
    }));
  }, [particleCount]);

  return (
    <motion.div
      ref={containerRef}
      className="hero-scene-root"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      data-scene-theme={theme}
    >
      {/* Outer Scene Edge Glow Framing */}
      <div className="hero-scene-edge-glow" />

      <div className="hero-scene-viewport">
        {/* ================= LAYER 1: BASE STAGE BACKDROP ================= */}
        <div
          className="hero-scene-layer hero-scene-layer-base"
          style={{
            backgroundImage: `url(${stageBackground})`,
            filter: scene.stageFilter || 'none',
          }}
        />

        {/* ================= LAYER 2: THEME-SPECIFIC ATMOSPHERE (CROSSFADED) ================= */}
        <div className="hero-scene-layer hero-scene-layer-atmosphere">
          <AnimatePresence mode="sync">
            <motion.div
              key={`atmosphere-${theme}`}
              className="hero-atmosphere-fill"
              style={{ background: scene.atmosphereColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
            />
          </AnimatePresence>
        </div>

        {/* ================= LAYER 3: CSS DYNAMIC LIGHTING ================= */}
        <div className="hero-scene-layer hero-scene-layer-lighting">
          <div
            className="hero-light-spotlight"
            style={{
              background: `radial-gradient(circle at 50% 70%, ${scene.lightPrimary} 0%, transparent 65%)`,
            }}
          />
          <div
            className="hero-light-rim"
            style={{
              background: `radial-gradient(ellipse 70% 35% at 50% 100%, ${scene.lightSecondary} 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* ================= LAYER 4: CONTINUOUS ANIMATED CHARACTER VIDEO ================= */}
        {/* Kept permanently mounted; never unmounted or reloaded during theme changes */}
        <div className="hero-scene-layer hero-scene-layer-character">
          {videoSrc && (
            <video
              ref={videoRef}
              className={`hero-character-video ${isVideoReady ? 'is-ready' : ''}`}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              preload="auto"
              onCanPlay={() => setIsVideoReady(true)}
            >
              <source src={heroCharacterVideoWebm} type="video/webm" />
              <source src={heroCharacterVideoMp4} type="video/mp4" />
            </video>
          )}
        </div>
      </div>
    </motion.div>
  );
}
