import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faArrowRight,
  faStar,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import LaunchCountdownBadge from "./components/LaunchCountdownBadge";
import "./IntelFeaturedCard.css";

export default function IntelFeaturedCard({ post, events = [] }) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Combine available spotlight slides (events taking priority as drops, or falling back to post)
  const slides = useMemo(() => {
    if (events && events.length > 0) {
      return events;
    }
    if (post) {
      return [post];
    }
    return [];
  }, [events, post]);

  // Keep activeSlide in bounds
  const totalSlides = slides.length;
  const safeSlideIndex = totalSlides > 0 ? activeSlide % totalSlides : 0;
  const currentSlide = slides[safeSlideIndex] || post;

  // Auto-advance upcoming drop slide every 6 seconds if multiple slides exist
  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  if (!currentSlide) return null;

  const eventDetails = currentSlide.eventDetails;

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % totalSlides);
  };

  return (
    <article className="dash-card intel-featured-hero-card">
      <div className="intel-featured-inner-grid">
        {/* Left Column: Synchronized Featured Story Dispatch */}
        <div className="intel-featured-left-col">
          <div className="dash-card-header" style={{ marginBottom: 12 }}>
            <div className="dash-card-title-group">
              <div className="dash-icon-box icon-trophy">
                <FontAwesomeIcon icon={faStar} />
              </div>
              <span className="dash-card-title">FEATURED STORY</span>
            </div>
            <span className="intel-pill-badge tag-cyan">
              {currentSlide.category?.replace("_", " ") || "SPOTLIGHT"}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`hero-left-${currentSlide.id || safeSlideIndex}`}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 14 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="intel-featured-left-content"
            >
              <h2 className="intel-featured-hero-title">
                <Link to={`/intel/${currentSlide.slug}`}>{currentSlide.title}</Link>
              </h2>

              <p className="intel-featured-hero-summary dash-card-subtext">
                {currentSlide.summary}
              </p>

              <div className="intel-featured-footer">
                <div className="intel-card-author-row">
                  <div className="intel-author-avatar-chip">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <div className="intel-author-details">
                    <span className="intel-author-name">
                      {currentSlide.authorName || "AlgoFight Core Team"}
                    </span>
                    <span className="intel-publish-date">
                      {new Date(currentSlide.publishedAt || currentSlide.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                      {currentSlide.readingTimeMin
                        ? ` • ${currentSlide.readingTimeMin} min read`
                        : ""}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/intel/${currentSlide.slug}`}
                  className="btn-primary intel-featured-read-btn"
                >
                  <span>Read Transmission</span>
                  <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Synchronized Upcoming Drops Spotlight */}
        <div className="intel-featured-right-col">
          <div className="intel-featured-slide-card glass-panel">
            <div className="intel-slide-header">
              <div className="intel-slide-badge-wrap">
                <span className="live-status-pill">
                  <span className="live-pulse-node" />
                  <span>{eventDetails ? "UPCOMING DROP" : "PLATFORM DISPATCH"}</span>
                </span>
                {eventDetails?.versionTag && (
                  <span className="intel-pill-badge tag-cyan">
                    {eventDetails.versionTag}
                  </span>
                )}
              </div>

              {totalSlides > 1 && (
                <div className="intel-slide-nav">
                  <button
                    type="button"
                    className="slide-nav-btn"
                    onClick={handlePrev}
                    title="Previous transmission"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <span className="slide-nav-count">
                    {safeSlideIndex + 1} / {totalSlides}
                  </span>
                  <button
                    type="button"
                    className="slide-nav-btn"
                    onClick={handleNext}
                    title="Next transmission"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`hero-right-${currentSlide.id || safeSlideIndex}`}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="intel-slide-body"
              >
                {eventDetails && (
                  <div className="intel-slide-countdown-row">
                    <LaunchCountdownBadge
                      targetDate={eventDetails.startsAt}
                      launchStatus={eventDetails.launchStatus}
                      versionTag={null}
                    />
                  </div>
                )}

                <h3 className="intel-slide-title">
                  <Link to={`/intel/${currentSlide.slug}`}>{currentSlide.title}</Link>
                </h3>

                <p className="intel-slide-summary dash-card-subtext">
                  {currentSlide.summary}
                </p>

                {eventDetails && (
                  <div className="intel-slide-meta-row">
                    <div className="slide-meta-item">
                      <FontAwesomeIcon icon={faCalendarAlt} className="slide-meta-icon" />
                      <span>{new Date(eventDetails.startsAt).toLocaleDateString()}</span>
                    </div>
                    <div className="slide-meta-item">
                      <FontAwesomeIcon icon={faGlobe} className="slide-meta-icon" />
                      <span>{eventDetails.location || "Online Platform"}</span>
                    </div>
                  </div>
                )}

                <div className="intel-slide-footer">
                  <Link
                    to={eventDetails?.actionUrl || `/intel/${currentSlide.slug}`}
                    className="btn-outline intel-slide-cta"
                  >
                    <span>{eventDetails?.actionLabel || "Explore Transmission"}</span>
                    <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </article>
  );
}
