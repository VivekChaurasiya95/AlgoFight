import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faEye,
  faUser,
  faShareNodes,
  faCheck,
  faRotate,
  faRocket,
  faCalendarAlt,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { fetchIntelPostBySlug } from "../../services/api";
import { useNotification } from "../../contexts/NotificationContext";
import LaunchCountdownBadge from "./components/LaunchCountdownBadge";
import IntelCard from "./IntelCard";
import BackgroundPaths from "../BackgroundPaths/BackgroundPaths";
import Footer from "../Common/Footer/Footer";
import { formatCardTitle, parseInlineMarkdown } from "./intelUtils";
import "./IntelArticleView.css";

const CATEGORY_TAG_CLASSES = {
  ANNOUNCEMENT: "tag-cyan",
  PRODUCT_UPDATE: "tag-cyan",
  EVENT: "tag-gold",
  COMMUNITY: "tag-green",
  ENGINEERING: "tag-purple",
};

function renderArticleContent(content) {
  if (!content) return null;
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const blocks = normalized.split(/\n\s*\n/);

  return blocks.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Code Block: ```lang\ncode\n```
    if (trimmed.startsWith("```")) {
      const lines = trimmed.split("\n");
      const lang = lines[0].replace("```", "").trim();
      const code = lines.slice(1, lines[lines.length - 1].startsWith("```") ? -1 : undefined).join("\n");
      return (
        <div key={idx} className="article-code-block glass-panel">
          <div className="code-header">
            <span className="code-lang-tag">{lang || "CODE"}</span>
            <span className="code-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </span>
          </div>
          <pre className="code-pre">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    // Blockquote: > quote
    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={idx} className="article-blockquote">
          {parseInlineMarkdown(trimmed.slice(2))}
        </blockquote>
      );
    }

    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);

    // Case 1: Heading followed by list items (e.g. "### Highlights\n- Item 1\n- Item 2")
    if (
      (lines[0].startsWith("### ") || lines[0].startsWith("## ")) &&
      lines.length > 1 &&
      lines.slice(1).every((l) => l.startsWith("- ") || l.startsWith("* "))
    ) {
      const headingRaw = lines[0].replace(/^#{2,3}\s+/, "");
      const items = lines.slice(1).map((l) => l.replace(/^[-*]\s+/, ""));
      return (
        <div key={idx} className="article-feature-breakdown-card">
          <h3 className="article-feature-breakdown-title">{formatCardTitle(headingRaw)}</h3>
          <div className="article-feature-items-list">
            {items.map((it, i) => (
              <div key={i} className="article-feature-row">
                <span className="feature-row-bullet" />
                <div className="feature-row-text">{parseInlineMarkdown(it)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Case 2: Unordered List alone (all lines start with "- " or "* ")
    if (lines.length > 0 && lines.every((l) => l.startsWith("- ") || l.startsWith("* "))) {
      const items = lines.map((l) => l.replace(/^[-*]\s+/, ""));
      return (
        <div key={idx} className="article-feature-breakdown-card standalone-list">
          <div className="article-feature-items-list">
            {items.map((it, i) => (
              <div key={i} className="article-feature-row">
                <span className="feature-row-bullet" />
                <div className="feature-row-text">{parseInlineMarkdown(it)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Case 3: Heading 3 alone
    if (lines.length === 1 && trimmed.startsWith("### ")) {
      return <h3 key={idx} className="article-h3">{formatCardTitle(trimmed.slice(4))}</h3>;
    }

    // Case 4: Heading 2 alone
    if (lines.length === 1 && trimmed.startsWith("## ")) {
      return <h2 key={idx} className="article-h2">{formatCardTitle(trimmed.slice(3))}</h2>;
    }

    // Case 5: Single line with bullet hyphens (e.g. "Intro - **Term 1**: Desc - **Term 2**: Desc")
    if (trimmed.includes(" - ") && (trimmed.includes("**") || trimmed.includes(": "))) {
      const parts = trimmed.split(" - ");
      const intro = parts[0].trim();
      const items = parts.slice(1);
      return (
        <div key={idx} className="article-feature-breakdown-card">
          {intro && <h3 className="article-feature-breakdown-title">{formatCardTitle(intro)}</h3>}
          <div className="article-feature-items-list">
            {items.map((it, i) => (
              <div key={i} className="article-feature-row">
                <span className="feature-row-bullet" />
                <div className="feature-row-text">{parseInlineMarkdown(it.trim())}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Case 6: Standard Paragraph
    return (
      <p key={idx} className="article-p">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });
}

function renderArticleSummary(summary) {
  if (!summary) return null;

  // If summary contains hyphen-delimited bullet points like "Intro - **Feature 1**: ... - **Feature 2**: ..."
  if (summary.includes(" - ")) {
    const parts = summary.split(" - ");
    const intro = parts[0].trim();
    const items = parts.slice(1);

    return (
      <div className="article-reader-feature-overview">
        {intro && <p className="article-reader-lead">{parseInlineMarkdown(intro)}</p>}
        <div className="article-features-grid">
          {items.map((it, idx) => (
            <div key={idx} className="article-feature-pill-card">
              <span className="feature-pill-bullet" />
              <div className="feature-pill-content">
                {parseInlineMarkdown(it.trim())}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <p className="article-reader-lead">
      {parseInlineMarkdown(summary)}
    </p>
  );
}

export default function IntelArticleView() {
  const { slug } = useParams();
  const { notify } = useNotification();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchIntelPostBySlug(slug);
        if (res && res.success) {
          setPost(res.post);
          setRelatedPosts(res.relatedPosts || []);
        } else {
          setError("Failed to load transmission.");
        }
      } catch (err) {
        setError(err.message || "Failed to load transmission.");
      } finally {
        setLoading(false);
      }
    }

    loadPost();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    notify({
      type: "success",
      title: "LINK COPIED",
      message: "Article transmission link copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const tagClass = CATEGORY_TAG_CLASSES[post?.category] || "tag-cyan";
  const formattedTitle = formatCardTitle(post?.title);

  return (
    <BackgroundPaths>
      <div className="intel-dashboard-wrapper intel-article-wrapper">
        <div className="intel-inner-container">
          {/* Navigation Breadcrumb Bar */}
          <nav className="intel-breadcrumb-bar">
            <Link to="/intel" className="breadcrumb-back-btn">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back to Intel Hub</span>
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">
              {post?.category?.replace("_", " ") || "Dispatch"}
            </span>
          </nav>

          {loading && (
            <div className="intel-status-box glass-panel">
              <FontAwesomeIcon icon={faRotate} spin className="intel-spinner" />
              <span>Scanning Intelligence Transmission...</span>
            </div>
          )}

          {!loading && error && (
            <div className="intel-status-box error glass-panel">
              <h3>Transmission Unavailable</h3>
              <p>{error}</p>
              <Link to="/intel" className="btn-outline">
                Return to Intel Hub
              </Link>
            </div>
          )}

          {!loading && !error && post && (
            <article className="dash-card intel-article-reader-card">
              {/* Header Area */}
              <header className="article-reader-header">
                <div className="article-header-top-row">
                  <span className={`intel-pill-badge ${tagClass}`}>
                    {post.category?.replace("_", " ")}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="article-share-btn"
                  >
                    <FontAwesomeIcon icon={copied ? faCheck : faShareNodes} style={{ marginRight: 6 }} />
                    <span>{copied ? "Link Copied" : "Share"}</span>
                  </button>
                </div>

                <h1 className="article-reader-title">{formattedTitle}</h1>

                {renderArticleSummary(post.summary)}

                <div className="article-reader-meta-row">
                  <div className="intel-card-author-row">
                    <div className="intel-author-avatar-chip">
                      <FontAwesomeIcon icon={faUser} />
                    </div>
                    <div className="intel-author-details">
                      <span className="intel-author-name">{post.authorName || "AlgoFight Core Team"}</span>
                      <span className="intel-publish-date">
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="article-reader-pills">
                    {post.readingTimeMin && (
                      <span className="reader-pill">
                        <FontAwesomeIcon icon={faClock} style={{ marginRight: 5 }} />
                        {post.readingTimeMin} min read
                      </span>
                    )}
                    <span className="reader-pill">
                      <FontAwesomeIcon icon={faEye} style={{ marginRight: 5 }} />
                      {post.views || 1} views
                    </span>
                  </div>
                </div>
              </header>

              {/* Optional Cover Media */}
              {post.coverImageUrl && (
                <div className="article-cover-media">
                  <img src={post.coverImageUrl} alt={post.title} className="cover-img" />
                </div>
              )}

              {/* Attached Milestone Widget */}
              {post.eventDetails && (
                <div className="article-event-widget glass-panel">
                  <div className="widget-header">
                    <div className="dash-card-title-group">
                      <div className="dash-icon-box icon-trophy">
                        <FontAwesomeIcon icon={faRocket} />
                      </div>
                      <span className="dash-card-title">{post.eventDetails.eventType?.replace("_", " ")}</span>
                    </div>
                    <LaunchCountdownBadge
                      targetDate={post.eventDetails.startsAt}
                      launchStatus={post.eventDetails.launchStatus}
                      versionTag={post.eventDetails.versionTag}
                      compact={true}
                    />
                  </div>

                  <div className="widget-info-row">
                    <div className="widget-info-item">
                      <FontAwesomeIcon icon={faCalendarAlt} className="widget-icon" />
                      <span>{new Date(post.eventDetails.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <div className="widget-info-item">
                      <FontAwesomeIcon icon={faGlobe} className="widget-icon" />
                      <span>{post.eventDetails.location || "Online Platform"}</span>
                    </div>
                  </div>

                  {post.eventDetails.actionUrl && (
                    <div style={{ marginTop: 14 }}>
                      <Link to={post.eventDetails.actionUrl} className="btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
                        <span>{post.eventDetails.actionLabel || "Explore Milestone"}</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Formatted Content */}
              <div className="article-markdown-body">
                {renderArticleContent(post.content)}
              </div>
            </article>
          )}

          {/* Related Transmissions Section */}
          {!loading && relatedPosts && relatedPosts.length > 0 && (
            <section className="intel-related-section">
              <div className="intel-section-header">
                <div className="section-title-wrap">
                  <h2 className="related-transmissions-title">Related Transmissions</h2>
                </div>
              </div>
              <div className="intel-posts-grid">
                {relatedPosts.map((r) => (
                  <IntelCard key={r.id} post={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </BackgroundPaths>
  );
}
