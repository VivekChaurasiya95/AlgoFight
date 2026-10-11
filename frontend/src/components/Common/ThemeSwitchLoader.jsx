import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ThemeSwitchLoader.css';
import { getThemeConfig } from '../../config/themes';

const ThemeSwitchLoader = ({ isSwitching, targetTheme }) => {
  const config = getThemeConfig(targetTheme);

  return (
    <AnimatePresence>
      {isSwitching && (
        <motion.div
          className="theme-switch-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
        >
          <div className="theme-switch-modal">
            {/* Pulsing Cyber Emblem */}
            <div className="theme-switch-emblem-wrap">
              <div
                className="theme-switch-orb-ring"
                style={{
                  boxShadow: `0 0 28px ${config.accentColor}`,
                  borderColor: config.accentColor,
                }}
              />
              <div
                className="theme-switch-code-badge"
                style={{ color: config.accentColor }}
              >
                &lt;/&gt;
              </div>
            </div>

            {/* Monospace Telemetry Details */}
            <div className="theme-switch-content">
              <span className="theme-switch-kicker">// COCKPIT RECONFIGURATION //</span>
              <h3 className="theme-switch-title">
                {`CALIBRATING ${config.name.toUpperCase()} HUD`}
              </h3>
              <p className="theme-switch-subtext">
                {config.tagline || 'Calibrating chromatic shaders & telemetry pipelines...'}
              </p>
            </div>

            {/* High-Tech Animated Loading Bar */}
            <div className="theme-switch-track">
              <motion.div
                className="theme-switch-fill"
                style={{
                  background: `linear-gradient(90deg, ${config.secondaryAccent || config.accentColor}, ${config.accentColor})`,
                  boxShadow: `0 0 16px ${config.accentColor}`,
                }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.65, ease: "easeInOut" }}
              />
            </div>

            <div className="theme-switch-footer">
              <span className="theme-switch-status">STATUS: COMPOSING ATMOSPHERE</span>
              <span className="theme-switch-pct" style={{ color: config.accentColor }}>100%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemeSwitchLoader;
