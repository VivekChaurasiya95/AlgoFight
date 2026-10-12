import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ThemeSelector.css';
import { useTheme } from '../../contexts/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPalette,
  faCheck,
  faChevronDown,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

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
      {/* Trigger Button in Nav - Paint icon & glowing accent dot with zero color name text */}
      <button
        type="button"
        className={`theme-selector-trigger-btn ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select Arena Theme"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Arena Themes — Click to customize"
      >
        <div className="theme-trigger-icon-wrap">
          <FontAwesomeIcon icon={faPalette} className="theme-trigger-paint-icon" />
          <span
            className="theme-trigger-dot"
            style={{
              backgroundColor: activeThemeConfig.accentColor,
              boxShadow: `0 0 10px ${activeThemeConfig.accentColor}`,
            }}
          />
        </div>
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
            aria-label="Arena Theme Selection"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="theme-selector-header">
              <div className="theme-selector-title-wrap">
                <FontAwesomeIcon icon={faPalette} className="theme-palette-icon" />
                <span className="theme-selector-title">ARENA THEMES</span>
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
              {themes.map((t, idx) => {
                const isCurrent = t.id === theme;
                const isSpanFull = idx === themes.length - 1 && themes.length % 2 !== 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-card-option ${isCurrent ? 'is-active' : ''} ${isSpanFull ? 'is-span-full' : ''}`}
                    onClick={() => handleSelectTheme(t.id)}
                    style={{
                      '--theme-accent': t.accentColor,
                    }}
                    title={`${t.name} — ${t.tagline}`}
                  >
                    <div className="theme-card-top-row">
                      <div className="theme-card-swatches">
                        <span
                          className="theme-swatch-dot"
                          style={{ backgroundColor: t.swatches?.[0] || '#050608' }}
                        />
                        <span
                          className="theme-swatch-dot"
                          style={{
                            backgroundColor: t.swatches?.[1] || t.accentColor,
                            boxShadow: isCurrent ? `0 0 8px ${t.accentColor}` : 'none',
                          }}
                        />
                        <span
                          className="theme-swatch-dot"
                          style={{ backgroundColor: t.swatches?.[2] || t.secondaryAccent || t.accentColor }}
                        />
                      </div>
                      {!isSpanFull && (
                        isCurrent ? (
                          <div className="theme-active-badge-mini">
                            <FontAwesomeIcon icon={faCheck} />
                          </div>
                        ) : (
                          <span className="theme-radio-dot" />
                        )
                      )}
                    </div>
                    <div className="theme-card-bottom-row">
                      <span className="theme-card-name">{t.name}</span>
                    </div>
                    {isSpanFull && (
                      <div className="theme-card-span-action">
                        {isCurrent ? (
                          <div className="theme-active-badge-mini">
                            <FontAwesomeIcon icon={faCheck} />
                          </div>
                        ) : (
                          <span className="theme-radio-dot" />
                        )}
                      </div>
                    )}
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
