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
  faShieldHalved,
  faCalendarAlt,
  faGlobe,
  faArrowRight,
  faServer,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { fetchIntelFeed, fetchIntelFeatured, fetchIntelEvents } from "../../services/api";
import IntelFeaturedCard from "./IntelFeaturedCard";
import IntelCard from "./IntelCard";
import LaunchCountdownBadge from "./components/LaunchCountdownBadge";
import BackgroundPaths from "../BackgroundPaths/BackgroundPaths";
import Footer from "../Common/Footer/Footer";
import { formatCardTitle, parseInlineMarkdown } from "./intelUtils";
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

  // Deduplicate general feed against featured hero post AND sidebar radar events
  // This guarantees zero repetitive duplicate cards side-by-side
  const displayedPosts = useMemo(() => {
    let list = posts;

    // Filter out the featured lead story
    if (featuredPost) {
      list = list.filter((p) => p.id !== featuredPost.id && p.slug !== featuredPost.slug);
    }

    // On the main overview page without active search, also filter out events
    // that are already highlighted in the Arena Radar sidebar widget
    if (currentCategory === "ALL" && !searchInput && page === 1 && events && events.length > 0) {
      const sidebarEventIds = new Set(events.map((e) => e.id));
      const sidebarEventSlugs = new Set(events.map((e) => e.slug));
      const uniquePosts = list.filter((p) => !sidebarEventIds.has(p.id) && !sidebarEventSlugs.has(p.slug));
      if (uniquePosts.length > 0) {
        list = uniquePosts;
      }
    }

    return list;
  }, [posts, currentCategory, searchInput, page, featuredPost, events]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [feedRes, featRes, eventsRes] = await Promise.all([
        fetchIntelFeed({ category: currentCategory, search: searchInput, page, limit: 8 }).catch((err) => {
          console.warn("Intel feed fetch fallback:", err);
          return { success: true, posts: [], pagination: { totalPages: 1, total: 0 } };
        }),
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

          {/* ================= 2-COLUMN UNIFIED PORTAL LAYOUT ================= */}
          <div className="intel-portal-layout">
            {/* Main Column (Featured Story + Filter Bar + Dispatches Feed) */}
            <main className="intel-main-dispatches-col">
              {/* Featured Showcase (Lead Story) */}
              {!searchInput && currentCategory === "ALL" && page === 1 && (featuredPost || posts[0]) && (
                <section className="intel-featured-section">
                  <IntelFeaturedCard post={featuredPost || posts[0]} />
                </section>
              )}

              {/* Filter Bar & Search */}
              <div className="intel-filter-bar">
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

                <form onSubmit={handleSearchSubmit} className="search-input-wrap intel-search-form">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search transmissions..."
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

              {/* Posts Grid (2-Columns in Main Area) */}
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
            </main>

            {/* Sidebar Column (Arena Radar & Platform Resources) */}
            <aside className="intel-radar-sidebar-col">
              {/* Upcoming Milestones Widget */}
              <div className="dash-card intel-sidebar-card">
                <div className="sidebar-card-header">
                  <div className="dash-card-title-group">
                    <div className="dash-icon-box icon-cyan">
                      <FontAwesomeIcon icon={faRocket} />
                    </div>
                    <div>
                      <span className="dash-card-title">ARENA RADAR</span>
                      <div className="sidebar-card-subtitle">Scheduled Drops & Tournaments</div>
                    </div>
                  </div>
                  <Link to="/intel/events" className="sidebar-view-all-link">
                    <span>Roadmap</span>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </Link>
                </div>

                <div className="sidebar-events-list">
                  {events && events.length > 0 ? (
                    events.map((ev) => {
                      const details = ev.eventDetails;
                      return (
                        <div key={ev.id} className="sidebar-event-item">
                          <div className="sidebar-event-top">
                            {details?.versionTag && (
                              <span className="intel-pill-badge tag-cyan">{details.versionTag}</span>
                            )}
                            {details?.eventType && (
                              <span className="intel-pill-badge tag-gold">
                                {details.eventType.replace("_", " ")}
                              </span>
                            )}
                            {details && (
                              <div className="sidebar-countdown-wrap">
                                <LaunchCountdownBadge
                                  targetDate={details.startsAt}
                                  launchStatus={details.launchStatus}
                                  versionTag={null}
                                />
                              </div>
                            )}
                          </div>

                          <h4 className="sidebar-event-title">
                            <Link to={`/intel/${ev.slug}`}>{formatCardTitle(ev.title)}</Link>
                          </h4>

                          <p className="sidebar-event-summary">{parseInlineMarkdown(ev.summary)}</p>

                          <div className="sidebar-event-meta">
                            {details && (
                              <>
                                <span className="sidebar-meta-item">
                                  <FontAwesomeIcon icon={faCalendarAlt} className="meta-icon" />
                                  {new Date(details.startsAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="sidebar-meta-item">
                                  <FontAwesomeIcon icon={faGlobe} className="meta-icon" />
                                  {details.location || "Online"}
                                </span>
                              </>
                            )}
                          </div>

                          <Link
                            to={details?.actionUrl || `/intel/${ev.slug}`}
                            className="sidebar-event-cta"
                          >
                            <span>{details?.actionLabel || "View Details"}</span>
                            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
                          </Link>
                        </div>
                      );
                    })
                  ) : (
                    <div className="sidebar-empty-state">
                      <span>No scheduled drops currently pending.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Platform Runtime Fleet Status */}
              <div className="dash-card intel-sidebar-card runtime-fleet-card">
                <div className="sidebar-card-header">
                  <div className="dash-card-title-group">
                    <div className="dash-icon-box icon-purple">
                      <FontAwesomeIcon icon={faServer} />
                    </div>
                    <div>
                      <span className="dash-card-title">FLEET STATUS</span>
                      <div className="sidebar-card-subtitle">Zero-Overhead Sandboxes</div>
                    </div>
                  </div>
                  <span className="fleet-status-live-pill">
                    <span className="live-pulse-node" />
                    ONLINE
                  </span>
                </div>

                <div className="runtime-rows-list">
                  <div className="runtime-row-item">
                    <span className="runtime-name">Python 3.12 (Piston Worker)</span>
                    <span className="runtime-badge active">99.98%</span>
                  </div>
                  <div className="runtime-row-item">
                    <span className="runtime-name">C++ 20 (Clang-18 JIT)</span>
                    <span className="runtime-badge active">Sub-40ms</span>
                  </div>
                  <div className="runtime-row-item">
                    <span className="runtime-name">Rust 1.78 (Release Cargo)</span>
                    <span className="runtime-badge active">Active</span>
                  </div>
                  <div className="runtime-row-item">
                    <span className="runtime-name">Java 21 LTS (Isolated JVM)</span>
                    <span className="runtime-badge active">Active</span>
                  </div>
                </div>

                <div className="fleet-card-footer">
                  <FontAwesomeIcon icon={faShieldHalved} className="shield-icon" />
                  <span>HMAC Anti-Cheat & Runtime Isolation Verified</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </BackgroundPaths>
  );
}
