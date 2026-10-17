import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCheck,
  faStar,
  faUserCircle,
  faShieldHalved,
  faPalette,
  faRotateLeft,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { AVATARS, FRAMES, getFrameById, getAvatarById } from '../../data/avatarConfig';
import UserAvatar from '../Common/UserAvatar/UserAvatar';
import './AvatarCustomizerModal.css';

export default function AvatarCustomizerModal({
  isOpen,
  onClose,
  currentPhotoURL,
  currentFrame,
  originalPhotoURL,
  displayName = 'Player',
  onSave,
}) {
  const [activeTab, setActiveTab] = useState('avatars'); // 'avatars' | 'frames'
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(currentPhotoURL || '/avatars/avatar_1.png');
  const [selectedFrameId, setSelectedFrameId] = useState(currentFrame || 'none');
  const [avatarCategory, setAvatarCategory] = useState('All');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if modal reopens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedAvatarUrl(currentPhotoURL || '/avatars/avatar_1.png');
      setSelectedFrameId(currentFrame || 'none');
    }
  }, [isOpen, currentPhotoURL, currentFrame]);

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(AVATARS.map((a) => a.category))];
    return cats;
  }, []);

  const filteredAvatars = useMemo(() => {
    if (avatarCategory === 'All') return AVATARS;
    return AVATARS.filter((a) => a.category === avatarCategory);
  }, [avatarCategory]);

  const selectedFrameObj = useMemo(() => {
    return getFrameById(selectedFrameId);
  }, [selectedFrameId]);

  const selectedAvatarObj = useMemo(() => {
    return AVATARS.find((a) => a.url === selectedAvatarUrl) || null;
  }, [selectedAvatarUrl]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave({
        photoURL: selectedAvatarUrl,
        avatarFrame: selectedFrameId === 'none' ? '' : selectedFrameId,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save avatar customizer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedAvatarUrl(originalPhotoURL || '/avatars/avatar_1.png');
    setSelectedFrameId('none');
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="avatar-modal-backdrop" onClick={onClose}>
        <motion.div
          className="avatar-modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="avatar-modal-header">
            <div className="avatar-modal-title-box">
              <span className="avatar-modal-kicker">
                <FontAwesomeIcon icon={faStar} /> IDENTITY CUSTOMIZER
              </span>
              <h2 className="avatar-modal-title">Customize Avatar & Frame</h2>
            </div>
            <button
              type="button"
              className="avatar-modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="avatar-modal-body">
            {/* Live Interactive Preview Bar */}
            <div className="avatar-preview-showcase">
              <div className="avatar-preview-halo-wrap">
                <UserAvatar
                  src={selectedAvatarUrl}
                  frame={selectedFrameId}
                  name={displayName}
                  size="preview"
                  glow={true}
                />
              </div>

              <div className="avatar-preview-info">
                <div className="avatar-preview-badge-row">
                  <span className="preview-pill avatar-pill">
                    <FontAwesomeIcon icon={faUserCircle} /> {selectedAvatarObj ? selectedAvatarObj.name : 'Custom Photo'}
                  </span>
                  <span
                    className="preview-pill frame-pill"
                    style={{
                      borderColor: selectedFrameObj?.glowColor || 'rgba(255, 255, 255, 0.2)',
                      color: selectedFrameObj?.glowColor || '#94a3b8',
                    }}
                  >
                    <FontAwesomeIcon icon={faShieldHalved} /> {selectedFrameObj ? selectedFrameObj.name : 'No Frame'}
                  </span>
                </div>
                <p className="avatar-preview-hint">
                  Your avatar and frame are displayed on your profile, battle lobbies, leaderboards, and navbar.
                </p>
                <button
                  type="button"
                  className="avatar-reset-btn"
                  onClick={handleReset}
                  title="Reset to original defaults"
                >
                  <FontAwesomeIcon icon={faRotateLeft} /> Reset Selection
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="avatar-modal-tabs">
              <button
                type="button"
                className={`avatar-tab-btn ${activeTab === 'avatars' ? 'active' : ''}`}
                onClick={() => setActiveTab('avatars')}
              >
                <FontAwesomeIcon icon={faPalette} />
                <span>Avatars</span>
                <span className="tab-count-badge">40</span>
              </button>
              <button
                type="button"
                className={`avatar-tab-btn ${activeTab === 'frames' ? 'active' : ''}`}
                onClick={() => setActiveTab('frames')}
              >
                <FontAwesomeIcon icon={faBolt} />
                <span>Frames</span>
                <span className="tab-count-badge">20</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="avatar-modal-content-scroll">
              {activeTab === 'avatars' ? (
                <div className="avatars-tab-content">
                  {/* Category Filter Pills */}
                  <div className="category-filter-row">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`category-pill-btn ${avatarCategory === cat ? 'active' : ''}`}
                        onClick={() => setAvatarCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Avatars Grid */}
                  <div className="avatars-grid">
                    {/* Original Photo Option if available */}
                    {originalPhotoURL && (
                      <div
                        className={`avatar-item-card ${selectedAvatarUrl === originalPhotoURL ? 'selected' : ''}`}
                        onClick={() => setSelectedAvatarUrl(originalPhotoURL)}
                        title="Your original photo"
                      >
                        <div className="avatar-item-thumb-circle">
                          <img
                            src={originalPhotoURL}
                            alt="Original"
                            className="avatar-item-img"
                          />
                        </div>
                        <span className="avatar-item-name">Original</span>
                        {selectedAvatarUrl === originalPhotoURL && (
                          <div className="selected-check-badge">
                            <FontAwesomeIcon icon={faCheck} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 40 Avatars */}
                    {filteredAvatars.map((av) => {
                      const isSelected = selectedAvatarUrl === av.url;
                      return (
                        <div
                          key={av.id}
                          className={`avatar-item-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedAvatarUrl(av.url)}
                          title={`${av.name} (${av.category})`}
                        >
                          <div className="avatar-item-thumb-circle">
                            <img
                              src={av.url}
                              alt={av.name}
                              className="avatar-item-img"
                              loading="lazy"
                            />
                          </div>
                          <span className="avatar-item-name">{av.name}</span>
                          {isSelected && (
                            <div className="selected-check-badge">
                              <FontAwesomeIcon icon={faCheck} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="frames-tab-content">
                  {/* Frames Grid */}
                  <div className="frames-grid">
                    {/* No Frame Option */}
                    <div
                      className={`frame-item-card no-frame-card ${selectedFrameId === 'none' || !selectedFrameId ? 'selected' : ''}`}
                      onClick={() => setSelectedFrameId('none')}
                    >
                      <div className="frame-none-preview">
                        <FontAwesomeIcon icon={faTimes} />
                      </div>
                      <span className="frame-item-name">No Frame</span>
                      {(selectedFrameId === 'none' || !selectedFrameId) && (
                        <div className="selected-check-badge">
                          <FontAwesomeIcon icon={faCheck} />
                        </div>
                      )}
                    </div>

                    {/* 20 Frames */}
                    {FRAMES.map((fr) => {
                      const isSelected = selectedFrameId === fr.id || selectedFrameId === fr.url;
                      return (
                        <div
                          key={fr.id}
                          className={`frame-item-card ${isSelected ? 'selected' : ''}`}
                          style={{
                            '--frame-glow': fr.glowColor,
                          }}
                          onClick={() => setSelectedFrameId(fr.id)}
                        >
                          <div className="frame-thumb-box">
                            <img
                              src={fr.url}
                              alt={fr.name}
                              className="frame-item-img"
                              loading="lazy"
                            />
                          </div>
                          <span className="frame-item-name">{fr.name}</span>
                          {isSelected && (
                            <div className="selected-check-badge">
                              <FontAwesomeIcon icon={faCheck} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="avatar-modal-footer">
            <button
              type="button"
              className="avatar-modal-btn cancel-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="avatar-modal-btn save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="btn-spinner" /> Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} /> Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
