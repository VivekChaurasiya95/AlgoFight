import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faGlobe,
  faArrowRight,
  faRocket,
  faTrophy,
  faGraduationCap,
  faCodeBranch,
} from "@fortawesome/free-solid-svg-icons";
import LaunchCountdownBadge from "./components/LaunchCountdownBadge";
import { formatCardTitle, parseInlineMarkdown } from "./intelUtils";
import "./IntelEventCard.css";

const EVENT_TYPE_LABELS = {
  FEATURE_LAUNCH: { label: "Feature Launch", icon: faRocket, iconClass: "icon-cyan", tagClass: "tag-cyan" },
  TOURNAMENT: { label: "Tournament", icon: faTrophy, iconClass: "icon-trophy", tagClass: "tag-gold" },
  WORKSHOP: { label: "Workshop", icon: faGraduationCap, iconClass: "icon-green", tagClass: "tag-green" },
  SEASON_RESET: { label: "Season Reset", icon: faCodeBranch, iconClass: "icon-purple", tagClass: "tag-purple" },
  COMMUNITY: { label: "Community", icon: faGlobe, iconClass: "icon-blue", tagClass: "tag-cyan" },
};

function formatEventDateTime(dateStr, timezone = "UTC") {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function IntelEventCard({ post }) {
  if (!post || !post.eventDetails) return null;
  const event = post.eventDetails;
  const typeMeta = EVENT_TYPE_LABELS[event.eventType] || EVENT_TYPE_LABELS.FEATURE_LAUNCH;
  const isExternal = event.actionUrl && (event.actionUrl.startsWith("http://") || event.actionUrl.startsWith("https://"));
  const formattedTitle = formatCardTitle(post.title);

  return (
    <article className="dash-card intel-event-card">
      <div>
        <div className="dash-card-header" style={{ marginBottom: 12 }}>
          <div className="dash-card-title-group">
            <div className={`dash-icon-box ${typeMeta.iconClass}`}>
              <FontAwesomeIcon icon={typeMeta.icon} />
            </div>
            <span className="dash-card-title">{typeMeta.label}</span>
          </div>
          {event.versionTag && (
            <span className="intel-pill-badge tag-cyan">
              {event.versionTag}
            </span>
          )}
        </div>

        <div className="intel-event-countdown-box">
          <LaunchCountdownBadge
            targetDate={event.startsAt}
            launchStatus={event.launchStatus}
            versionTag={null}
            compact={true}
          />
        </div>

        <h3 className="intel-event-title">
          <Link to={`/intel/${post.slug}`}>{formattedTitle}</Link>
        </h3>

        <p className="dash-card-subtext intel-event-summary">
          {parseInlineMarkdown(post.summary)}
        </p>
      </div>

      <div className="intel-event-card-bottom">
        <div className="intel-event-meta-list">
          <div className="intel-event-meta-item">
            <FontAwesomeIcon icon={faCalendarAlt} className="meta-icon" />
            <span>{formatEventDateTime(event.startsAt, event.timezone)}</span>
          </div>
          <div className="intel-event-meta-item">
            <FontAwesomeIcon icon={faGlobe} className="meta-icon" />
            <span>{event.location || (event.isOnline ? "Online Platform" : "In-Person")}</span>
          </div>
        </div>

        <div className="intel-event-footer-action">
          {event.actionUrl ? (
            isExternal ? (
              <a
                href={event.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary intel-event-full-btn"
              >
                <span>{event.actionLabel || "Register / Details"}</span>
                <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
              </a>
            ) : (
              <Link to={event.actionUrl} className="btn-primary intel-event-full-btn">
                <span>{event.actionLabel || "Explore Milestone"}</span>
                <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
              </Link>
            )
          ) : (
            <Link to={`/intel/${post.slug}`} className="btn-outline intel-event-full-btn">
              <span>Read Transmission</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
