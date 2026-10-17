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
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { AVATARS, FRAMES, AVATAR_TIERS, FRAME_TIERS, getFrameById, getAvatarById } from '../../data/avatarConfig';
import UserAvatar from '../Common/UserAvatar/UserAvatar';
import './AvatarCustomizerModal.css';

export default function AvatarCustomizerModal({
  isOpen,
  onClose,
  currentPhotoURL,
  currentFrame,
  originalPhotoURL,
  unlockedAvatars = [],
  unlockedFrames = [],
  isAdmin = false,
  displayName = 'Player',
  onSave,
}) {
  const [activeTab, setActiveTab] = useState('avatars'); // 'avatars' | 'frames'
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(currentPhotoURL || '/avatars/avatar_1.png');
  const [selectedFrameId, setSelectedFrameId] = useState(currentFrame || 'none');
  const [avatarCategory, setAvatarCategory] = useState('All');
  const [frameCategory, setFrameCategory] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [lockNotice, setLockNotice] = useState('');

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedAvatarUrl(currentPhotoURL || '/avatars/avatar_1.png');
      setSelectedFrameId(currentFrame || 'none');
      setLockNotice('');
    }
  }, [isOpen, currentPhotoURL, currentFrame]);

  // Read locally cached unlocks for instant responsiveness
  const cachedUnlockedAvatars = useMemo(() => {
    try {
      const saved = localStorage.getItem('algofight_unlocked_avatars');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  const cachedUnlockedFrames = useMemo(() => {
    try {
      const saved = localStorage.getItem('algofight_unlocked_frames');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  // Resolve reliable original account photo from props or cached localStorage
  const effectiveOriginalPhoto = useMemo(() => {
    if (originalPhotoURL && typeof originalPhotoURL === 'string' && originalPhotoURL.startsWith('http')) {
      return originalPhotoURL;
    }
    try {
      const stored = localStorage.getItem('algofight_original_photo_url');
      if (stored && typeof stored === 'string' && stored.startsWith('http')) {
        return stored;
      }
    } catch {}
    if (displayName) {
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;
    }
    return originalPhotoURL || null;
  }, [originalPhotoURL, displayName]);

  const isAvatarUnlocked = (av) => {
    if (isAdmin) return true;
    if (av.id === 'avatar_1') return true;
    if (effectiveOriginalPhoto && av.url === effectiveOriginalPhoto) return true;
    return (
      (unlockedAvatars || []).includes(av.id) ||
      cachedUnlockedAvatars.includes(av.id)
    );
  };

  const isFrameUnlocked = (fr) => {
    if (isAdmin) return true;
    if (fr.id === 'none') return true;
    return (
      (unlockedFrames || []).includes(fr.id) ||
      cachedUnlockedFrames.includes(fr.id)
    );
  };

  const avatarCategories = useMemo(() => {
    return ['All', 'Recruit Protocol', 'Vanguard Syndicate', 'Apex Mythic'];
  }, []);

  const frameCategories = useMemo(() => {
    return ['All', 'Neon Edge', 'Quantum Surge', 'Cosmic Singularity'];
  }, []);

  const filteredAvatars = useMemo(() => {
    if (avatarCategory === 'All') return AVATARS;
    return AVATARS.filter((a) => a.category === avatarCategory);
  }, [avatarCategory]);

  const filteredFrames = useMemo(() => {
    if (frameCategory === 'All') return FRAMES;
    return FRAMES.filter((f) => f.category === frameCategory);
  }, [frameCategory]);

  const selectedFrameObj = useMemo(() => {
    return getFrameById(selectedFrameId);
  }, [selectedFrameId]);

  const selectedAvatarObj = useMemo(() => {
    return AVATARS.find((a) => a.url === selectedAvatarUrl) || null;
  }, [selectedAvatarUrl]);

  const handleSelectAvatar = (av) => {
    if (!isAvatarUnlocked(av)) {
      setLockNotice(`🔒 "${av.name}" is locked. Claim it in the Rewards section (${av.cost} PTS).`);
      return;
    }
    setLockNotice('');
    setSelectedAvatarUrl(av.url);
  };

  const handleSelectFrame = (fr) => {
    if (fr.id === 'none') {
      setLockNotice('');
      setSelectedFrameId('none');
      return;
    }
    if (!isFrameUnlocked(fr)) {
      setLockNotice(`🔒 "${fr.name}" is locked. Claim it in the Rewards section (${fr.cost} PTS).`);
      return;
    }
    setLockNotice('');
    setSelectedFrameId(fr.id);
  };

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

  // 1. Revert to previous (selection active when opening dialog)
  const handleResetToPrevious = () => {
    setSelectedAvatarUrl(currentPhotoURL || '/avatars/avatar_1.png');
    setSelectedFrameId(currentFrame || 'none');
    setLockNotice('');
  };

  // 2. Reset to original profile photo (account photo)
  const handleResetToOriginal = () => {
    const targetUrl = effectiveOriginalPhoto || (typeof window !== 'undefined' ? localStorage.getItem('algofight_original_photo_url') : null);
    if (targetUrl) {
      setSelectedAvatarUrl(targetUrl);
      setSelectedFrameId('none');
      setLockNotice('');
    } else {
      setSelectedAvatarUrl('/avatars/avatar_1.png');
      setSelectedFrameId('none');
      setLockNotice('Original Google/account photo could not be located. Defaulted to Avatar 1.');
    }
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
                {isAdmin && <span className="admin-free-badge">ADMIN UNLOCKED</span>}
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
                    <FontAwesomeIcon icon={faUserCircle} /> {selectedAvatarObj ? selectedAvatarObj.name : 'Account Photo'}
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
                  Your avatar and frame are displayed on your profile, battle lobbies, leaderboards, and arena workspaces.
                </p>

                {/* Reset Action Buttons */}
                <div className="avatar-reset-actions-row">
                  <button
                    type="button"
                    className="avatar-reset-btn"
                    onClick={handleResetToPrevious}
                    title="Undo modifications and revert to previously equipped"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} /> Revert to Previous
                  </button>
                  <button
                    type="button"
                    className="avatar-reset-btn highlight-original"
                    onClick={handleResetToOriginal}
                    title="Reset to your original account profile photo"
                  >
                    <FontAwesomeIcon icon={faUserCircle} /> Reset to Original Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Lock Notice Flash */}
            {lockNotice && (
              <div className="avatar-modal-lock-notice">
                <FontAwesomeIcon icon={faLock} />
                <span>{lockNotice}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="avatar-modal-tabs">
              <button
                type="button"
                className={`avatar-tab-btn ${activeTab === 'avatars' ? 'active' : ''}`}
                onClick={() => { setActiveTab('avatars'); setLockNotice(''); }}
              >
                <FontAwesomeIcon icon={faPalette} />
                <span>Avatars</span>
                <span className="tab-count-badge">35</span>
              </button>
              <button
                type="button"
                className={`avatar-tab-btn ${activeTab === 'frames' ? 'active' : ''}`}
                onClick={() => { setActiveTab('frames'); setLockNotice(''); }}
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
                    {avatarCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`category-pill-btn ${avatarCategory === cat ? 'active' : ''}`}
                        onClick={() => setAvatarCategory(cat)}
                      >
                        {cat}
                        {cat === 'Recruit Protocol' && <span className="cat-pts-badge">200 PTS</span>}
                        {cat === 'Vanguard Syndicate' && <span className="cat-pts-badge">500 PTS</span>}
                        {cat === 'Apex Mythic' && <span className="cat-pts-badge">1000 PTS</span>}
                      </button>
                    ))}
                  </div>

                  {/* Avatars Grid */}
                  <div className="avatars-grid">
                    {/* Original Photo Option if available */}
                    {effectiveOriginalPhoto && (
                      <div
                        className={`avatar-item-card ${selectedAvatarUrl === effectiveOriginalPhoto ? 'selected' : ''}`}
                        onClick={() => { setLockNotice(''); setSelectedAvatarUrl(effectiveOriginalPhoto); }}
                        title="Your original account photo"
                      >
                        <div className="avatar-item-thumb-circle">
                          <img
                            src={effectiveOriginalPhoto}
                            alt="Original Account Photo"
                            className="avatar-item-img"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/avatars/avatar_1.png';
                            }}
                          />
                        </div>
                        <span className="avatar-item-name">Account Photo</span>
                        <span className="avatar-item-status-pill unlocked">Original</span>
                        {selectedAvatarUrl === effectiveOriginalPhoto && (
                          <div className="selected-check-badge">
                            <FontAwesomeIcon icon={faCheck} />
                          </div>
                        )}
                      </div>
                    )}

                    {filteredAvatars.map((av) => {
                      const isSelected = selectedAvatarUrl === av.url;
                      const unlocked = isAvatarUnlocked(av);
                      return (
                        <div
                          key={av.id}
                          className={`avatar-item-card ${isSelected ? 'selected' : ''} ${!unlocked ? 'is-locked' : 'is-unlocked'}`}
                          onClick={() => handleSelectAvatar(av)}
                          title={`${av.name} (${av.category} · ${av.cost} PTS)`}
                        >
                          <div className="avatar-item-thumb-circle">
                            <img
                              src={av.url}
                              alt={av.name}
                              className="avatar-item-img"
                              loading="lazy"
                            />
                            {!unlocked && (
                              <div className="locked-overlay-shield">
                                <FontAwesomeIcon icon={faLock} />
                              </div>
                            )}
                          </div>
                          <span className="avatar-item-name">{av.name}</span>
                          <span className={`avatar-item-status-pill ${unlocked ? 'unlocked' : 'locked'}`}>
                            {unlocked ? 'Unlocked' : `${av.cost} PTS`}
                          </span>
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
                  {/* Category Filter Pills for Frames */}
                  <div className="category-filter-row">
                    {frameCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`category-pill-btn ${frameCategory === cat ? 'active' : ''}`}
                        onClick={() => setFrameCategory(cat)}
                      >
                        {cat}
                        {cat === 'Neon Edge' && <span className="cat-pts-badge">500 PTS</span>}
                        {cat === 'Quantum Surge' && <span className="cat-pts-badge">1000 PTS</span>}
                        {cat === 'Cosmic Singularity' && <span className="cat-pts-badge">2000 PTS</span>}
                      </button>
                    ))}
                  </div>

                  {/* Frames Grid */}
                  <div className="frames-grid">
                    {/* No Frame Option */}
                    <div
                      className={`frame-item-card no-frame-card ${selectedFrameId === 'none' || !selectedFrameId ? 'selected' : ''}`}
                      onClick={() => handleSelectFrame({ id: 'none' })}
                    >
                      <div className="frame-none-preview">
                        <FontAwesomeIcon icon={faTimes} />
                      </div>
                      <span className="frame-item-name">No Frame</span>
                      <span className="avatar-item-status-pill unlocked">Default</span>
                      {(selectedFrameId === 'none' || !selectedFrameId) && (
                        <div className="selected-check-badge">
                          <FontAwesomeIcon icon={faCheck} />
                        </div>
                      )}
                    </div>

                    {filteredFrames.map((fr) => {
                      const isSelected = selectedFrameId === fr.id || selectedFrameId === fr.url;
                      const unlocked = isFrameUnlocked(fr);
                      return (
                        <div
                          key={fr.id}
                          className={`frame-item-card ${isSelected ? 'selected' : ''} ${!unlocked ? 'is-locked' : 'is-unlocked'}`}
                          style={{
                            '--frame-glow': fr.glowColor,
                          }}
                          onClick={() => handleSelectFrame(fr)}
                          title={`${fr.name} (${fr.category} · ${fr.cost} PTS)`}
                        >
                          <div className="frame-thumb-box">
                            <img
                              src={fr.url}
                              alt={fr.name}
                              className="frame-item-img"
                              loading="lazy"
                            />
                            {!unlocked && (
                              <div className="locked-overlay-shield">
                                <FontAwesomeIcon icon={faLock} />
                              </div>
                            )}
                          </div>
                          <span className="frame-item-name">{fr.name}</span>
                          <span className={`avatar-item-status-pill ${unlocked ? 'unlocked' : 'locked'}`}>
                            {unlocked ? 'Unlocked' : `${fr.cost} PTS`}
                          </span>
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
