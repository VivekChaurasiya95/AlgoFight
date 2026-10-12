import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faRocket,
  faChevronRight,
  faRotate,
  faInbox,
} from "@fortawesome/free-solid-svg-icons";
import { fetchIntelFeed, fetchIntelFeatured, fetchIntelEvents } from "../../services/api";
import IntelFeaturedCard from "./IntelFeaturedCard";
import IntelCard from "./IntelCard";
import IntelEventCard from "./IntelEventCard";
import BackgroundPaths from "../BackgroundPaths/BackgroundPaths";
import Footer from "../Common/Footer/Footer";
import "./IntelHub.css";

const CATEGORIES = [
  { id: "ALL", label: "All Intelligence" },
  { id: "ANNOUNCEMENT", label: "Announcements" },
  { id: "PRODUCT_UPDATE", label: "Product & Releases" },
  { id: "EVENT", label: "Tournaments & Events" },
  { id: "ENGINEERING", label: "Engineering" },
  { id: "COMMUNITY", label: "Community" },
];

export default function IntelHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get("category") || "ALL";

  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Deduplicate general feed against featured hero post when on main overview
  const displayedPosts = useMemo(() => {
    if (currentCategory === "ALL" && !searchInput && page === 1 && featuredPost) {
      const remaining = posts.filter((p) => p.id !== featuredPost.id);
      return remaining.length > 0 ? remaining : posts;
    }
    return posts;
  }, [posts, currentCategory, searchInput, page, featuredPost]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [feedRes, featRes, eventsRes] = await Promise.all([
        fetchIntelFeed({ category: currentCategory, search: searchInput, page, limit: 9 }),
        fetchIntelFeatured().catch(() => ({ post: null })),
        fetchIntelEvents({ type: "ALL" }).catch(() => ({ events: [] })),
      ]);

      if (feedRes && feedRes.success) {
        setPosts(feedRes.posts || []);
        setPagination(feedRes.pagination || { totalPages: 1, total: 0 });
      }

      if (featRes && featRes.post) {
        setFeaturedPost(featRes.post);
      }

      if (eventsRes && eventsRes.events) {
        setEvents(eventsRes.events.slice(0, 3));
      }
    } catch (err) {
      setError(err.message || "Failed to load AlgoFight Intel dispatch.");
    } finally {
      setLoading(false);
    }
  }, [currentCategory, searchInput, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryChange = (catId) => {
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (catId === "ALL") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", catId);
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  return (
    <BackgroundPaths>
      <div className="intel-dashboard-wrapper">
        <div className="intel-inner-container">
          {/* ================= COMPACT HERO HEADER ================= */}
          <motion.header
            className="intel-hero-header"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="intel-header-top-row">
              <div className="intel-kicker-tag">
                <span className="kicker-slash">//</span>
                <span>PLATFORM INTEL</span>
                <span className="kicker-cross">✦</span>
                <span className="word-glow-cyan">OFFICIAL DISPATCH & ROADMAP</span>
              </div>

              <div className="telemetry-bar intel-telemetry-bar">
                <span className="live-status-pill">
                  <span className="live-pulse-node" />
                  <span>DISPATCH LIVE</span>
                </span>
                <span className="telemetry-divider">•</span>
                <span>
                  <FontAwesomeIcon icon={faRocket} className="text-cyan" /> {events.length} Upcoming Drops
                </span>
                <span className="telemetry-divider">•</span>
                <Link to="/intel/events" className="telemetry-link">
                  <span>View Full Roadmap</span>
                  <FontAwesomeIcon icon={faChevronRight} />
                </Link>
              </div>
            </div>

            <h1 className="intel-hero-title">
              BEYOND THE <span className="word-glow-cyan">BATTLE ARENA</span>
            </h1>

            <p className="intel-hero-desc">
              The central transmission for platform releases, runtime engineering breakthroughs, competitive tournaments, and the evolving AlgoFight universe.
            </p>
          </motion.header>

          {/* ================= FEATURED SHOWCASE ================= */}
          {!searchInput && currentCategory === "ALL" && page === 1 && featuredPost && (
            <section className="intel-featured-section">
              <IntelFeaturedCard post={featuredPost} events={events} />
            </section>
          )}

          {/* ================= UPCOMING DROPS & TOURNAMENTS STRIP ================= */}
          {events && events.length > 0 && currentCategory === "ALL" && !searchInput && page === 1 && (
            <section className="intel-events-strip-section">
              <div className="intel-section-header">
                <div className="section-title-wrap">
                  <FontAwesomeIcon icon={faRocket} className="section-title-icon" />
                  <h2>Upcoming Drops & Tournament Milestones</h2>
                </div>
                <Link to="/intel/events" className="telemetry-link">
                  <span>View Full Roadmap</span>
                  <FontAwesomeIcon icon={faChevronRight} />
                </Link>
              </div>

              <div className="intel-events-grid">
                {events.map((ev) => (
                  <IntelEventCard key={ev.id} post={ev} />
                ))}
              </div>
            </section>
          )}

          {/* ================= INTELLIGENCE FEED SECTION ================= */}
          <section id="intel-feed" className="intel-feed-section">
            <div className="intel-filter-bar">
              {/* Category Filter Pills */}
              <div className="intel-categories-pills">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`intel-filter-pill ${currentCategory === cat.id ? "active" : ""}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="search-input-wrap intel-search-form">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search intelligence transmissions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="intel-search-input"
                />
              </form>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="intel-status-box glass-panel">
                <FontAwesomeIcon icon={faRotate} spin className="intel-spinner" />
                <span>Scanning Intelligence Transmissions...</span>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="intel-status-box error glass-panel">
                <h3>Transmission Disrupted</h3>
                <p>{error}</p>
                <button type="button" onClick={loadData} className="btn-outline">
                  <FontAwesomeIcon icon={faRotate} />
                  <span>Retry Transmission</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && displayedPosts.length === 0 && (
              <div className="intel-status-box empty glass-panel">
                <FontAwesomeIcon icon={faInbox} className="empty-icon" />
                <h3>No Transmissions Found</h3>
                <p>There are no published transmissions matching your current query.</p>
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      loadData();
                    }}
                    className="btn-outline"
                  >
                    Clear Search Filter
                  </button>
                )}
              </div>
            )}

            {/* Posts Grid */}
            {!loading && !error && displayedPosts.length > 0 && (
              <>
                <div className="intel-posts-grid">
                  {displayedPosts.map((post) => (
                    <IntelCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination Bar */}
                {pagination.totalPages > 1 && (
                  <div className="intel-pagination-bar">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="btn-outline"
                    >
                      Previous
                    </button>
                    <span className="intel-page-indicator">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      className="btn-outline"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </BackgroundPaths>
  );
}
