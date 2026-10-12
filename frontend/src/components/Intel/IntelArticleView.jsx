import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faEye,
  faUser,
  faShareNodes,
  faCopy,
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
import "./IntelArticleView.css";

function renderArticleContent(content) {
  if (!content) return null;
  const blocks = content.split("\n\n");

  return blocks.map((block, idx) => {
    const trimmed = block.trim();

    // Code Block
    if (trimmed.startsWith("```")) {
      const lines = trimmed.split("\n");
      const lang = lines[0].replace("```", "").trim();
      const code = lines.slice(1, -1).join("\n");
      return (
        <div key={idx} className="article-code-block glass-panel">
          <div className="code-header">
            <span className="code-lang-tag">{lang || "CODE"}</span>
            <span className="code-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </span>
          </div>
          <pre className="code-pre">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      return <h3 key={idx} className="article-h3">{trimmed.slice(4)}</h3>;
    }

    // Heading 2
    if (trimmed.startsWith("## ")) {
      return <h2 key={idx} className="article-h2">{trimmed.slice(3)}</h2>;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={idx} className="article-blockquote">
          {trimmed.slice(2)}
        </blockquote>
      );
    }

    // Unordered List
    if (trimmed.split("\n").every((line) => line.trim().startsWith("- ") || line.trim().startsWith("* "))) {
      const items = trimmed.split("\n").map((line) => line.replace(/^[-*]\s+/, ""));
      return (
        <ul key={idx} className="article-ul">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    // Paragraph
    return (
      <p key={idx} className="article-p">
        {trimmed}
      </p>
    );
  });
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
          setError("Failed to load article.");
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
      message: "Article link copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <BackgroundPaths>
      <div className="intel-dashboard-wrapper intel-article-wrapper">
        <div className="intel-inner-container">
          {/* Navigation Breadcrumb */}
          <nav className="intel-breadcrumb-bar">
            <Link to="/intel" className="breadcrumb-back-btn">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back to Intel Hub</span>
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{post?.category?.replace("_", " ") || "Transmission"}</span>
          </nav>

          {loading && (
            <div className="intel-status-box glass-panel">
              <FontAwesomeIcon icon={faRotate} spin className="intel-spinner" />
              <span>Decrypting Intelligence Transmission...</span>
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
                <div className="dash-card-header" style={{ marginBottom: 14 }}>
                  <div className="dash-card-title-group">
                    <span className="dash-pill-tag tag-cyan">
                      {post.category?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="article-action-buttons">
                    <button type="button" onClick={handleCopyLink} className="btn-outline" style={{ fontSize: "0.78rem", padding: "5px 12px" }}>
                      <FontAwesomeIcon icon={copied ? faCheck : faCopy} style={{ marginRight: 6 }} />
                      <span>{copied ? "Copied" : "Share"}</span>
                    </button>
                  </div>
                </div>

                <h1 className="article-reader-title">{post.title}</h1>

                <p className="article-reader-lead dash-card-subtext">{post.summary}</p>

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
                        <FontAwesomeIcon icon={faClock} /> {post.readingTimeMin} min read
                      </span>
                    )}
                    <span className="reader-pill">
                      <FontAwesomeIcon icon={faEye} /> {post.views || 1} views
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

              {/* Attached Feature Launch or Event Widget */}
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
                    />
                  </div>

                  <div className="widget-info-row">
                    <div className="widget-info-item">
                      <FontAwesomeIcon icon={faCalendarAlt} className="widget-icon" />
                      <span>{new Date(post.eventDetails.startsAt).toUTCString()}</span>
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
                  <h2>Related Transmissions</h2>
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
