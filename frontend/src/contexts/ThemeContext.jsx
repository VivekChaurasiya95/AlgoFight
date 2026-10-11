import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import ThemeSwitchLoader from '../components/Common/ThemeSwitchLoader';
import { THEMES, THEME_ORDER, THEME_LIST, DEFAULT_THEME_ID, getThemeConfig } from '../config/themes';

const ThemeContext = createContext({
  theme: DEFAULT_THEME_ID,
  targetTheme: DEFAULT_THEME_ID,
  isSwitching: false,
  activeThemeConfig: THEMES[DEFAULT_THEME_ID],
  themes: THEME_LIST,
  setTheme: () => {},
  toggleTheme: () => {},
  cycleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('algofight_theme');
      return THEMES[saved] ? saved : DEFAULT_THEME_ID;
    } catch {
      return DEFAULT_THEME_ID;
    }
  });

  const [isSwitching, setIsSwitching] = useState(false);
  const [targetTheme, setTargetTheme] = useState(theme);
  const switchTimerRef = useRef(null);
  const finishTimerRef = useRef(null);

  // Apply theme attributes and CSS variables whenever active theme changes
  useEffect(() => {
    try {
      const config = getThemeConfig(theme);
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('algofight_theme', theme);

      // Inject theme-specific CSS variables dynamically for instant reciprocation
      if (config && config.tokens) {
        Object.entries(config.tokens).forEach(([token, val]) => {
          document.documentElement.style.setProperty(token, val);
        });
      }

      // Inject scene properties as CSS variables for Hero Scene & components
      if (config && config.scene) {
        document.documentElement.style.setProperty('--scene-light-primary', config.scene.lightPrimary);
        document.documentElement.style.setProperty('--scene-light-secondary', config.scene.lightSecondary);
        document.documentElement.style.setProperty('--scene-glow-intensity', config.scene.glowIntensity);
        document.documentElement.style.setProperty('--scene-stage-glow', config.scene.stageGlow);
        document.documentElement.style.setProperty('--scene-vignette-edge', config.scene.vignetteEdge);
        document.documentElement.style.setProperty('--scene-vignette-mid', config.scene.vignetteMid);
        document.documentElement.style.setProperty('--scene-particle-color', config.scene.particleColor);
      }
    } catch {
      // Ignore storage/DOM errors in restricted contexts
    }
  }, [theme]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  const initiateThemeSwitch = (nextTheme, withLoader = false) => {
    const validated = THEMES[nextTheme] ? nextTheme : DEFAULT_THEME_ID;
    if (validated === theme && !isSwitching) return;

    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);

    if (withLoader) {
      setTargetTheme(validated);
      setIsSwitching(true);

      switchTimerRef.current = setTimeout(() => {
        setThemeState(validated);
      }, 300);

      finishTimerRef.current = setTimeout(() => {
        setIsSwitching(false);
      }, 720);
    } else {
      // Seamless in-place switch: update immediately so hero scene & layers crossfade in view
      setTargetTheme(validated);
      setThemeState(validated);
    }
  };

  const setTheme = (newTheme, options = {}) => {
    const withLoader = typeof options === 'boolean' ? options : !!options?.withLoader;
    initiateThemeSwitch(newTheme, withLoader);
  };

  const cycleTheme = (withLoader = false) => {
    const currentIndex = THEME_ORDER.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    initiateThemeSwitch(THEME_ORDER[nextIndex], withLoader);
  };

  const toggleTheme = () => {
    // For backward-compatibility with binary toggle buttons:
    cycleTheme(false);
  };

  const activeThemeConfig = useMemo(() => getThemeConfig(theme), [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        targetTheme,
        isSwitching,
        activeThemeConfig,
        themes: THEME_LIST,
        setTheme,
        toggleTheme,
        cycleTheme,
      }}
    >
      {children}
      <ThemeSwitchLoader isSwitching={isSwitching} targetTheme={targetTheme} />
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
