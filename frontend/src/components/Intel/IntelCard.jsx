import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faArrowRight,
  faCompass,
  faCode,
  faBullhorn,
  faTrophy,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import LaunchCountdownBadge from "./components/LaunchCountdownBadge";
import { formatCardTitle, parseInlineMarkdown } from "./intelUtils";
import "./IntelCard.css";

const CATEGORY_META = {
  ANNOUNCEMENT: { label: "Announcement", icon: faBullhorn, iconClass: "icon-cyan", tagClass: "tag-cyan", categoryClass: "cat-announcement" },
  PRODUCT_UPDATE: { label: "Product & Releases", icon: faCompass, iconClass: "icon-blue", tagClass: "tag-cyan", categoryClass: "cat-product" },
  EVENT: { label: "Contest & Events", icon: faTrophy, iconClass: "icon-trophy", tagClass: "tag-gold", categoryClass: "cat-event" },
  COMMUNITY: { label: "Community", icon: faUsers, iconClass: "icon-green", tagClass: "tag-green", categoryClass: "cat-community" },
  ENGINEERING: { label: "Engineering", icon: faCode, iconClass: "icon-purple", tagClass: "tag-purple", categoryClass: "cat-engineering" },
};

function formatDate(dateStr) {
  if (!dateStr) return "Recent";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function IntelCard({ post }) {
  if (!post) return null;
  const meta = CATEGORY_META[post.category] || CATEGORY_META.ANNOUNCEMENT;
  const formattedTitle = formatCardTitle(post.title);

  return (
    <article className={`dash-card intel-feed-card ${meta.categoryClass}`}>
      <div className="intel-card-top-bar">
        <div className="intel-card-meta-left">
          <div className={`dash-icon-box ${meta.iconClass}`}>
            <FontAwesomeIcon icon={meta.icon} />
          </div>
          <span className="intel-card-cat-label">{meta.label}</span>
        </div>
        <span className={`intel-pill-badge ${meta.tagClass}`}>
          {post.readingTimeMin ? `${post.readingTimeMin} min read` : "Intel"}
        </span>
      </div>

      {/* Optional Media Preview */}
      {post.coverImageUrl && (
        <Link to={`/intel/${post.slug}`} className="intel-card-thumb-link">
          <img src={post.coverImageUrl} alt={post.title} className="intel-card-thumb-img" loading="lazy" />
        </Link>
      )}

      {/* Countdown Badge if Milestone attached */}
      {post.eventDetails && (
        <div className="intel-card-countdown-wrap">
          <LaunchCountdownBadge
            targetDate={post.eventDetails.startsAt}
            launchStatus={post.eventDetails.launchStatus}
            versionTag={post.eventDetails.versionTag}
          />
        </div>
      )}

      {/* Title */}
      <h3 className="intel-card-title">
        <Link to={`/intel/${post.slug}`}>{formattedTitle}</Link>
      </h3>

      {/* Summary */}
      <p className="intel-card-summary">{parseInlineMarkdown(post.summary)}</p>

      {/* Footer */}
      <div className="intel-card-footer">
        <div className="intel-card-author-row">
          <div className="intel-author-avatar-chip">
            <FontAwesomeIcon icon={faUser} />
          </div>
          <div className="intel-author-details">
            <span className="intel-author-name">{post.authorName || "AlgoFight Core"}</span>
            <span className="intel-publish-date">{formatDate(post.publishedAt || post.createdAt)}</span>
          </div>
        </div>

        <Link to={`/intel/${post.slug}`} className="intel-card-read-link" aria-label={`Read ${post.title}`}>
          <span>Read</span>
          <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </div>
    </article>
  );
}
