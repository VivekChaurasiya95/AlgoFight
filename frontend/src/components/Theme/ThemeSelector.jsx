import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ThemeSelector.css';
import { useTheme } from '../../contexts/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPalette, faCheck, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function ThemeSelector() {
  const { theme, setTheme, themes, activeThemeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation: Escape closes popover
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectTheme = (themeId) => {
    setTheme(themeId, false);
    setIsOpen(false);
  };

  return (
    <div className="theme-selector-wrapper" ref={containerRef}>
      {/* Trigger Button in Nav */}
      <button
        type="button"
        className="theme-selector-trigger-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select Visual Theme"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={`Visual Theme: ${activeThemeConfig.name} — Click to customize`}
      >
        <span
          className="theme-trigger-swatch"
          style={{ backgroundColor: activeThemeConfig.accentColor }}
        />
        <span className="theme-trigger-name">{activeThemeConfig.shortName || 'Theme'}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`theme-trigger-chevron ${isOpen ? 'is-open' : ''}`}
        />
      </button>

      {/* Popover Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="theme-selector-popover"
            role="dialog"
            aria-label="Visual Theme Selection"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="theme-selector-header">
              <div className="theme-selector-title-wrap">
                <FontAwesomeIcon icon={faPalette} className="theme-palette-icon" />
                <span className="theme-selector-title">VISUAL IDENTITIES</span>
              </div>
              <button
                type="button"
                className="theme-selector-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close theme selector"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="theme-selector-grid">
              {themes.map((t) => {
                const isCurrent = t.id === theme;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-card-option ${isCurrent ? 'is-active' : ''}`}
                    onClick={() => handleSelectTheme(t.id)}
                    style={{
                      '--theme-accent': t.accentColor,
                    }}
                    title={`${t.name} — ${t.tagline}`}
                  >
                    <div className="theme-card-header-mini">
                      <div className="theme-card-swatches">
                        {t.swatches?.map((color, i) => (
                          <span
                            key={i}
                            className="theme-card-dot"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      {isCurrent ? (
                        <div className="theme-active-badge-mini">
                          <FontAwesomeIcon icon={faCheck} />
                        </div>
                      ) : (
                        <span className="theme-radio-dot" />
                      )}
                    </div>
                    <span className="theme-card-name">{t.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="theme-selector-footer">
              <span className="theme-footer-note">// PERSISTED ACROSS SESSIONS //</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
