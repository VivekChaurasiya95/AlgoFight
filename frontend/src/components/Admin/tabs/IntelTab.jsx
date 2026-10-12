import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCompass,
  faPlus,
  faRotate,
  faMagnifyingGlass,
  faEdit,
  faTrash,
  faPaperPlane,
  faEyeSlash,
  faStar,
  faRocket,
  faCalendarAlt,
  faEye,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchAdminIntelPosts,
  publishAdminIntelPost,
  unpublishAdminIntelPost,
  deleteAdminIntelPost,
} from "../../../services/api";
import { useNotification } from "../../../contexts/NotificationContext";
import IntelEditorModal from "./IntelEditorModal";
import "./IntelTab.css";

export default function IntelTab({ adminKey }) {
  const { notify } = useNotification();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingPost, setEditingPost] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const res = await fetchAdminIntelPosts(adminKey, {
        status: statusFilter,
        search,
        page: 1,
        limit: 50,
      });
      if (res && res.success) {
        setPosts(res.posts || []);
      }
    } catch (err) {
      notify({ type: "error", title: "FETCH FAILED", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter, search, notify]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleTogglePublish = async (post) => {
    try {
      if (post.status === "PUBLISHED") {
        await unpublishAdminIntelPost(adminKey, post.id);
        notify({ type: "info", title: "UNPUBLISHED", message: `Reverted "${post.title}" to draft.` });
      } else {
        await publishAdminIntelPost(adminKey, post.id);
        notify({ type: "success", title: "PUBLISHED", message: `Published "${post.title}".` });
      }
      loadPosts();
    } catch (err) {
      notify({ type: "error", title: "ACTION FAILED", message: err.message });
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Are you sure you want to delete "${post.title}"?`)) return;
    try {
      await deleteAdminIntelPost(adminKey, post.id);
      notify({ type: "success", title: "POST DELETED", message: `Deleted "${post.title}".` });
      loadPosts();
    } catch (err) {
      notify({ type: "error", title: "DELETE FAILED", message: err.message });
    }
  };

  const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = posts.filter((p) => p.status === "DRAFT").length;
  const eventsCount = posts.filter((p) => Boolean(p.eventDetails)).length;

  return (
    <div className="page-view-stack">
      {/* 1. Telemetry Distribution Cards (Matches UsersTab / ControlHub ratio-grid) */}
      <div className="admin-section">
        <div className="user-ratio-grid">
          <div className="ratio-box glass-panel">
            <span className="role-icon icon-cyan">
              <FontAwesomeIcon icon={faPaperPlane} />
            </span>
            <span className="role-count">{publishedCount}</span>
            <span className="role-label">Published Transmissions</span>
          </div>
          <div className="ratio-box glass-panel">
            <span className="role-icon icon-purple">
              <FontAwesomeIcon icon={faRocket} />
            </span>
            <span className="role-count">{eventsCount}</span>
            <span className="role-label">Scheduled Milestones</span>
          </div>
          <div className="ratio-box glass-panel">
            <span className="role-icon icon-green">
              <FontAwesomeIcon icon={faEyeSlash} />
            </span>
            <span className="role-count">{draftCount}</span>
            <span className="role-label">Draft Transmissions</span>
          </div>
          <div className="ratio-box glass-panel">
            <span className="role-icon icon-trophy">
              <FontAwesomeIcon icon={faBookOpen} />
            </span>
            <span className="role-count">{posts.length}</span>
            <span className="role-label">Total Stories</span>
          </div>
        </div>
      </div>

      {/* 2. Transmission Registry Directory & Actions */}
      <div className="admin-section">
        <div className="registry-header-bar">
          <div>
            <h3 className="section-title">
              <FontAwesomeIcon icon={faCompass} className="section-icon" />
              Intelligence Transmissions & Event Schedule
            </h3>
            <p className="section-subtitle">
              Manage platform news, technical changelogs, tournament announcements, and live countdown timers.
            </p>
          </div>
          <div className="registry-actions">
            <div className="search-input-wrap">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
              <input
                type="text"
                placeholder="Search title, slug, or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="registry-search-input"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="audit-select intel-status-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Drafts Only</option>
            </select>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditingPost(null);
                setIsEditorOpen(true);
              }}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>New Transmission</span>
            </button>
            <button
              type="button"
              className="refresh-btn"
              onClick={loadPosts}
              title="Refresh transmissions list"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faRotate} className={loading ? "fa-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 3. Common Registry Table (Matches ControlHub Table Standards) */}
        <div className="registry-table-wrapper glass-panel">
          <table className="registry-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Status</th>
                <th>Transmission Title & Slug</th>
                <th>Category</th>
                <th>Attached Milestone / Drop</th>
                <th>Views</th>
                <th>Published Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="no-data-cell">
                    <FontAwesomeIcon icon={faRotate} spin style={{ marginRight: 8 }} />
                    Scanning intelligence database...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data-cell">
                    No intelligence posts found. Click "New Transmission" to author one.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <span className={`role-badge ${post.status === "PUBLISHED" ? "student" : "individual"}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="user-cell">
                      <div className="intel-title-cell-wrap">
                        {post.isFeatured && (
                          <FontAwesomeIcon icon={faStar} className="text-gold" title="Featured Story" />
                        )}
                        <strong>{post.title}</strong>
                      </div>
                      <span className="code-chip">/{post.slug}</span>
                    </td>
                    <td>
                      <span className="code-chip">{post.category?.replace("_", " ")}</span>
                    </td>
                    <td>
                      {post.eventDetails ? (
                        <div className="intel-table-event-meta">
                          <span className="inst-badge">
                            <FontAwesomeIcon icon={faRocket} style={{ marginRight: 5 }} />
                            {post.eventDetails.eventType?.replace("_", " ")}
                          </span>
                          {post.eventDetails.versionTag && (
                            <span className="code-chip">{post.eventDetails.versionTag}</span>
                          )}
                          <span className="event-date-text">
                            {new Date(post.eventDetails.startsAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="rating-cell">
                      <FontAwesomeIcon icon={faEye} style={{ marginRight: 5, opacity: 0.6 }} />
                      {post.views || 0}
                    </td>
                    <td className="email-cell">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Draft"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="intel-table-actions">
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => {
                            setEditingPost(post);
                            setIsEditorOpen(true);
                          }}
                          title="Edit Post"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          type="button"
                          className={`action-btn ${post.status === "PUBLISHED" ? "warn-btn" : "action-btn"}`}
                          onClick={() => handleTogglePublish(post)}
                          title={post.status === "PUBLISHED" ? "Revert to Draft" : "Publish Live"}
                        >
                          <FontAwesomeIcon icon={post.status === "PUBLISHED" ? faEyeSlash : faPaperPlane} />
                        </button>
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(post)}
                          title="Delete Post"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Editor Modal */}
      {isEditorOpen && (
        <IntelEditorModal
          adminKey={adminKey}
          postToEdit={editingPost}
          onClose={() => setIsEditorOpen(false)}
          onSaved={loadPosts}
        />
      )}
    </div>
  );
}
