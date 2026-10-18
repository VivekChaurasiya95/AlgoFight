import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faRocket,
  faRotate,
  faInbox,
} from "@fortawesome/free-solid-svg-icons";
import { fetchIntelEvents } from "../../services/api";
import IntelEventCard from "./IntelEventCard";
import BackgroundPaths from "../BackgroundPaths/BackgroundPaths";
import Footer from "../Common/Footer/Footer";
import "./IntelHub.css";
import "./IntelEventsDirectory.css";

const EVENT_FILTERS = [
  { id: "ALL", label: "All Milestones" },
  { id: "FEATURE_LAUNCH", label: "Feature Drops" },
  { id: "TOURNAMENT", label: "Tournaments" },
  { id: "SEASON_RESET", label: "Season Resets" },
  { id: "RUNTIME_RELEASE", label: "Runtime Sandboxes" },
];

export default function IntelEventsDirectory() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntelEvents({ type: activeFilter });
      if (res && res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load events roadmap.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeFilter]);

  return (
    <BackgroundPaths>
      <div className="intel-dashboard-wrapper">
        <div className="intel-inner-container">
          {/* Navigation Breadcrumb */}
          <nav className="intel-breadcrumb-bar">
            <Link to="/intel" className="breadcrumb-back-btn">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back to Intel Hub</span>
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Launches & Events Roadmap</span>
          </nav>

          {/* Hero Header */}
          <motion.header
            className="intel-hero-header"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="intel-kicker-tag">
              <span className="kicker-slash">//</span>
              <span>SCHEDULED ROADMAP</span>
              <span className="kicker-cross">✦</span>
              <span className="word-glow-cyan">REAL-TIME T-MINUS ENGINE</span>
            </div>

            <h1 className="intel-hero-title">
              Platform <span className="word-glow-cyan">Roadmap & Milestones</span>
            </h1>

            <p className="intel-hero-desc">
              Track scheduled feature drops, runtime upgrades, competitive tournaments, and platform milestones in real-time.
            </p>
          </motion.header>

          {/* Filter Pills */}
          <div className="intel-categories-pills">
            {EVENT_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`intel-filter-pill ${activeFilter === f.id ? "active" : ""}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="intel-status-box glass-panel">
              <FontAwesomeIcon icon={faRotate} spin className="intel-spinner" />
              <span>Scanning Platform Schedule...</span>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="intel-status-box error glass-panel">
              <h3>Roadmap Unavailable</h3>
              <p>{error}</p>
              <button type="button" onClick={loadEvents} className="btn-outline">
                <FontAwesomeIcon icon={faRotate} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && events.length === 0 && (
            <div className="intel-status-box empty glass-panel">
              <FontAwesomeIcon icon={faInbox} className="empty-icon" />
              <h3>No Scheduled Milestones</h3>
              <p>There are no scheduled releases or events under this category currently.</p>
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && events.length > 0 && (
            <div className="events-directory-grid">
              {events.map((ev) => (
                <IntelEventCard key={ev.id} post={ev} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </BackgroundPaths>
  );
}
