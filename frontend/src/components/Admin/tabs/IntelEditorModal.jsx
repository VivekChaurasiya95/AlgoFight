import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCompass,
  faSave,
  faPaperPlane,
  faRocket,
  faEye,
  faCode,
  faTrash,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { createAdminIntelPost, updateAdminIntelPost } from "../../../services/api";
import { useNotification } from "../../../contexts/NotificationContext";

const CATEGORIES = [
  { value: "ANNOUNCEMENT", label: "Announcement (General & Platform)" },
  { value: "PRODUCT_UPDATE", label: "Product & Releases (Changelogs & Drops)" },
  { value: "EVENT", label: "Event (Tournaments & Hackathons)" },
  { value: "ENGINEERING", label: "Engineering (Deep-Dives & Architecture)" },
  { value: "COMMUNITY", label: "Community (Spotlights & Partnerships)" },
];

const EVENT_TYPES = [
  { value: "FEATURE_LAUNCH", label: "Feature Launch / Drop" },
  { value: "TOURNAMENT", label: "Tournament / Contest" },
  { value: "RUNTIME_RELEASE", label: "Runtime Sandbox Release" },
  { value: "MAINTENANCE", label: "Scheduled Maintenance" },
  { value: "COMMUNITY_EVENT", label: "Community Meet / AMA" },
];

export default function IntelEditorModal({ adminKey, postToEdit, onClose, onSaved }) {
  const { notify } = useNotification();
  const isEditing = Boolean(postToEdit);

  // Form State
  const [title, setTitle] = useState(postToEdit?.title || "");
  const [slug, setSlug] = useState(postToEdit?.slug || "");
  const [category, setCategory] = useState(postToEdit?.category || "PRODUCT_UPDATE");
  const [summary, setSummary] = useState(postToEdit?.summary || "");
  const [content, setContent] = useState(postToEdit?.content || "");
  const [coverImageUrl, setCoverImageUrl] = useState(postToEdit?.coverImageUrl || "");
  const [isFeatured, setIsFeatured] = useState(postToEdit?.isFeatured || false);
  const [readingTimeMin, setReadingTimeMin] = useState(postToEdit?.readingTimeMin || 4);

  // Event Details State
  const [hasEvent, setHasEvent] = useState(Boolean(postToEdit?.eventDetails));
  const [eventType, setEventType] = useState(postToEdit?.eventDetails?.eventType || "FEATURE_LAUNCH");
  const [versionTag, setVersionTag] = useState(postToEdit?.eventDetails?.versionTag || "");
  const [startsAt, setStartsAt] = useState(
    postToEdit?.eventDetails?.startsAt
      ? new Date(postToEdit.eventDetails.startsAt).toISOString().slice(0, 16)
      : ""
  );
  const [actionLabel, setActionLabel] = useState(postToEdit?.eventDetails?.actionLabel || "");
  const [actionUrl, setActionUrl] = useState(postToEdit?.eventDetails?.actionUrl || "");

  const [activeTab, setActiveTab] = useState("WRITE"); // WRITE | PREVIEW
  const [submitting, setSubmitting] = useState(false);

  const generateSlug = () => {
    const autoSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(autoSlug);
  };

  const handleSave = async (submitStatus) => {
    if (!title.trim()) {
      notify({ type: "error", title: "VALIDATION ERROR", message: "Headline title is required." });
      return;
    }
    if (!slug.trim()) {
      notify({ type: "error", title: "VALIDATION ERROR", message: "URL slug is required." });
      return;
    }
    if (!content.trim()) {
      notify({ type: "error", title: "VALIDATION ERROR", message: "Transmission markdown content is required." });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        category,
        summary: summary.trim(),
        content: content.trim(),
        coverImageUrl: coverImageUrl.trim() || null,
        isFeatured,
        status: submitStatus,
        readingTimeMin: Number(readingTimeMin) || 3,
        eventDetails: hasEvent && startsAt ? {
          eventType,
          versionTag: versionTag.trim() || null,
          startsAt: new Date(startsAt).toISOString(),
          actionLabel: actionLabel.trim() || null,
          actionUrl: actionUrl.trim() || null,
        } : null,
      };

      let res;
      if (isEditing) {
        res = await updateAdminIntelPost(adminKey, postToEdit.id, payload);
      } else {
        res = await createAdminIntelPost(adminKey, payload);
      }

      if (res && res.success) {
        notify({
          type: "success",
          title: isEditing ? "TRANSMISSION UPDATED" : "TRANSMISSION CREATED",
          message: `Successfully saved "${title}" [${submitStatus}].`,
        });
        onSaved();
        onClose();
      } else {
        notify({
          type: "error",
          title: "SAVE FAILED",
          message: res?.message || "Failed to save transmission.",
        });
      }
    } catch (err) {
      notify({ type: "error", title: "ERROR", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fleet-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="fleet-modal-content intel-editor-modal-container"
          style={{ maxWidth: 900 }}
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="fleet-modal-header">
            <div className="fleet-modal-header-info">
              <div className="fleet-modal-badges">
                <span className="fleet-badge">
                  <span className="badge-pulse-dot" /> TRANSMISSION EDITOR
                </span>
                <span className="fleet-sub-badge">ALGOFIGHT INTEL ENGINE</span>
              </div>
              <h3 className="fleet-modal-title">
                <FontAwesomeIcon icon={faCompass} className="probe-title-icon" />
                {isEditing ? "Edit Intelligence Transmission" : "Draft New Intelligence Transmission"}
              </h3>
            </div>
            <button
              type="button"
              className="fleet-modal-close-btn"
              onClick={onClose}
              title="Close modal"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Body */}
          <div className="intel-modal-body-scrollable">
            {/* Step 1: Core Details */}
            <div className="composer-card glass-panel" style={{ marginBottom: 16 }}>
              <div className="composer-card-header">
                <span className="card-step-badge">01</span>
                <h4>Transmission Metadata & Routing</h4>
              </div>
              <div className="composer-card-body">
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Transmission Headline *</label>
                  <input
                    type="text"
                    placeholder="e.g. AlgoFight 2.4: Rust Sandbox Runtimes & Clan Battles Mode Drop"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="composer-row-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div className="form-group">
                    <label>URL Slug * (Auto-generatable)</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="algofight-2-4-rust-sandbox"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={generateSlug}
                        className="preset-btn"
                        style={{ whiteSpace: "nowrap", padding: "0 12px" }}
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Summary / Excerpt (Displayed on Cards & Social Feeds)</label>
                  <textarea
                    rows={2}
                    placeholder="Concise overview of what this transmission covers..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                <div className="composer-row-2" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                  <div className="form-group">
                    <label>Cover Image URL (Optional CDN / Asset Link)</label>
                    <input
                      type="url"
                      placeholder="https://assets.algofight.com/intel/cover-2.4.png"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Est. Reading Time (Mins)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={readingTimeMin}
                      onChange={(e) => setReadingTimeMin(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    id="feat-checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    style={{ width: "auto", cursor: "pointer" }}
                  />
                  <label htmlFor="feat-checkbox" style={{ margin: 0, cursor: "pointer", fontSize: "0.86rem", color: "var(--text-primary)" }}>
                    Showcase as Hero Featured Transmission at top of Intel Hub
                  </label>
                </div>
              </div>
            </div>

            {/* Step 2: Milestone & Live Countdown (Optional) */}
            <div className="composer-card glass-panel" style={{ marginBottom: 16 }}>
              <div className="composer-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="card-step-badge">02</span>
                  <h4>Scheduled Milestone & Live T-Minus Countdown</h4>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0, fontSize: "0.82rem" }}>
                  <input
                    type="checkbox"
                    checked={hasEvent}
                    onChange={(e) => setHasEvent(e.target.checked)}
                    style={{ width: "auto" }}
                  />
                  <span>Attach Launch Date</span>
                </label>
              </div>

              {hasEvent && (
                <div className="composer-card-body" style={{ marginTop: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div className="form-group">
                      <label>Milestone Type</label>
                      <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                        {EVENT_TYPES.map((et) => (
                          <option key={et.value} value={et.value}>{et.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Release Tag / Version (e.g. v2.4.0)</label>
                      <input
                        type="text"
                        placeholder="v2.4.0 / Season 4 Drop"
                        value={versionTag}
                        onChange={(e) => setVersionTag(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <div className="form-group">
                      <label>Launch Timestamp (UTC / Local) *</label>
                      <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>CTA Button Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Enter Battle Arena"
                        value={actionLabel}
                        onChange={(e) => setActionLabel(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>CTA Redirect URL</label>
                      <input
                        type="text"
                        placeholder="e.g. /battle or /practice"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Markdown Content */}
            <div className="composer-card glass-panel">
              <div className="composer-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="card-step-badge">03</span>
                  <h4>Article Markdown Content *</h4>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className={`preset-btn ${activeTab === "WRITE" ? "preset-alpha" : ""}`}
                    onClick={() => setActiveTab("WRITE")}
                  >
                    <FontAwesomeIcon icon={faCode} style={{ marginRight: 6 }} />
                    Editor
                  </button>
                  <button
                    type="button"
                    className={`preset-btn ${activeTab === "PREVIEW" ? "preset-alpha" : ""}`}
                    onClick={() => setActiveTab("PREVIEW")}
                  >
                    <FontAwesomeIcon icon={faEye} style={{ marginRight: 6 }} />
                    Live Preview
                  </button>
                </div>
              </div>

              <div className="composer-card-body" style={{ marginTop: 12 }}>
                {activeTab === "WRITE" ? (
                  <textarea
                    rows={12}
                    placeholder="Write article transmission using standard Markdown (## Headings, ```code blocks, bullet points)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ fontFamily: "monospace", fontSize: "0.88rem", lineHeight: 1.6 }}
                  />
                ) : (
                  <div className="intel-markdown-preview glass-panel" style={{ padding: 18, minHeight: 220 }}>
                    <div style={{ whiteSpace: "pre-wrap", color: "var(--text-primary)", fontSize: "0.92rem", lineHeight: 1.7 }}>
                      {content || <span style={{ color: "var(--text-muted)" }}>Markdown preview will appear here...</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="fleet-modal-footer intel-modal-footer">
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => handleSave("DRAFT")}
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faSave} style={{ marginRight: 6 }} />
                Save Draft
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSave("PUBLISHED")}
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 6 }} />
                {isEditing && postToEdit.status === "PUBLISHED" ? "Update Transmission" : "Publish Live"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
