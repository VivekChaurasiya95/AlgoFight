import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faArrowRight,
  faStar,
  faClock,
  faCalendarAlt,
  faCode,
  faPalette,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { formatCardTitle, parseInlineMarkdown } from "./intelUtils";
import "./IntelFeaturedCard.css";

const PREVIEW_THEMES = [
  { id: "horizon", label: "Horizon", color: "#2563eb", bg: "#f8fafc", codeKw: "#2563eb", codeStr: "#059669" },
  { id: "midnight", label: "Midnight", color: "#00e5ff", bg: "#090d16", codeKw: "#00e5ff", codeStr: "#38bdf8" },
  { id: "emerald", label: "Emerald", color: "#10b981", bg: "#061510", codeKw: "#10b981", codeStr: "#6ee7b7" },
  { id: "amethyst", label: "Amethyst", color: "#a855f7", bg: "#12081f", codeKw: "#c084fc", codeStr: "#f472b6" },
  { id: "crimson", label: "Crimson", color: "#ef4444", bg: "#18090b", codeKw: "#f87171", codeStr: "#fbbf24" },
];

function formatPublishDate(dateStr) {
  if (!dateStr) return "Recently Published";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function IntelFeaturedCard({ post }) {
  const isLightInitial = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
  const [activeTheme, setActiveTheme] = useState(() => (isLightInitial ? PREVIEW_THEMES[0] : PREVIEW_THEMES[1]));

  useEffect(() => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    setActiveTheme(isLight ? PREVIEW_THEMES[0] : PREVIEW_THEMES[1]);
  }, []);

  if (!post) return null;
  const formattedTitle = formatCardTitle(post.title);

  return (
    <article className="dash-card intel-hero-lead-card">
      <div className="intel-hero-lead-kicker-row">
        <div className="lead-kicker-group">
          <div className="dash-icon-box icon-trophy lead-star-icon">
            <FontAwesomeIcon icon={faStar} />
          </div>
          <span className="lead-kicker-label">FEATURED DISPATCH</span>
        </div>

        <div className="lead-badges-group">
          <span className="intel-pill-badge tag-cyan">
            {post.category?.replace("_", " ") || "SPOTLIGHT"}
          </span>
          {post.readingTimeMin && (
            <span className="lead-reading-time">
              <FontAwesomeIcon icon={faClock} style={{ marginRight: 5 }} />
              {post.readingTimeMin} min read
            </span>
          )}
        </div>
      </div>

      <div className="intel-hero-lead-body-split">
        {/* Left Column: Editorial Headline & Meta */}
        <div className="intel-hero-lead-text-col">
          <h2 className="intel-hero-lead-title">
            <Link to={`/intel/${post.slug}`}>{formattedTitle}</Link>
          </h2>

          <p className="intel-hero-lead-summary">
            {parseInlineMarkdown(post.summary)}
          </p>

          <div className="intel-hero-lead-footer">
            <div className="intel-card-author-row">
              <div className="intel-author-avatar-chip">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <div className="intel-author-details">
                <span className="intel-author-name">{post.authorName || "AlgoFight Core Team"}</span>
                <span className="intel-publish-date">
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: 4, opacity: 0.7 }} />
                  {formatPublishDate(post.publishedAt || post.createdAt)}
                </span>
              </div>
            </div>

            <Link
              to={`/intel/${post.slug}`}
              className="btn-primary intel-hero-read-btn"
            >
              <span>Read Full Transmission</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 8 }} />
            </Link>
          </div>
        </div>

        {/* Right Column: Visual Showcase Widget (Compact & Adaptive) */}
        <div className="intel-hero-lead-visual-col">
          {post.coverImageUrl ? (
            <Link to={`/intel/${post.slug}`} className="hero-visual-image-wrap">
              <img src={post.coverImageUrl} alt={post.title} className="hero-visual-img" />
            </Link>
          ) : (
            <div
              className="cockpit-theme-preview-card"
              style={{
                "--preview-accent": activeTheme.color,
                "--preview-bg": activeTheme.bg,
                "--preview-kw": activeTheme.codeKw,
                "--preview-str": activeTheme.codeStr,
              }}
            >
              <div className="cockpit-preview-head">
                <div className="cockpit-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="cockpit-filename">
                  <FontAwesomeIcon icon={faCode} style={{ marginRight: 5, opacity: 0.6 }} />
                  arena_cockpit.rs
                </div>
                <div className="cockpit-live-tag">
                  <span className="dot-pulse" />
                  THEME ENGINE
                </div>
              </div>

              {/* Code Snippet Preview */}
              <div className="cockpit-code-pane">
                <div className="code-line">
                  <span className="kw">pub struct</span> <span className="type">CombatCockpit</span> &#123;
                </div>
                <div className="code-line indent">
                  <span className="field">theme</span>: <span className="type">ThemeId</span>::<span className="val">{activeTheme.label}</span>,
                </div>
                <div className="code-line indent">
                  <span className="field">refresh_rate</span>: <span className="str">"120fps_telemetry"</span>,
                </div>
                <div className="code-line indent">
                  <span className="field">glow_accent</span>: <span className="str" style={{ color: activeTheme.color }}>"{activeTheme.color}"</span>,
                </div>
                <div className="code-line">&#125;</div>
              </div>

              {/* Interactive Theme Palette Selector */}
              <div className="cockpit-swatch-bar">
                <span className="swatch-title">
                  <FontAwesomeIcon icon={faPalette} style={{ marginRight: 5 }} />
                  PREVIEW PALETTE:
                </span>
                <div className="swatch-pills-list">
                  {PREVIEW_THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      className={`swatch-pill ${activeTheme.id === th.id ? "active" : ""}`}
                      onClick={() => setActiveTheme(th)}
                      title={`Preview ${th.label} theme`}
                    >
                      <span className="swatch-color-dot" style={{ background: th.color }} />
                      <span className="swatch-pill-label">{th.label}</span>
                      {activeTheme.id === th.id && (
                        <FontAwesomeIcon icon={faCheck} className="swatch-check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
