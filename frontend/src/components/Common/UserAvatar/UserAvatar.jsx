import React, { useState } from 'react';
import { getFrameById } from '../../../data/avatarConfig';
import './UserAvatar.css';

/**
 * UserAvatar Component
 * Renders avatar image with optional gaming decorative frame and ambient lighting.
 *
 * @param {string} src - Avatar image URL
 * @param {string} frame - Frame ID (e.g. 'frame_1') or frame URL
 * @param {string} name - User's name for fallback initial
 * @param {string|number} size - 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' or pixel number
 * @param {boolean} glow - Whether to display ambient frame glow
 * @param {string} className - Additional CSS class
 * @param {Function} onClick - Optional click handler
 */
export default function UserAvatar({
  src,
  frame,
  name = 'Player',
  size = 'md',
  glow = true,
  className = '',
  onClick,
  style = {},
  showIndicator = false,
  indicatorStatus = 'online', // 'online' | 'offline' | 'battle'
}) {
  const [imgError, setImgError] = useState(false);
  const frameObj = getFrameById(frame);
  const frameUrl = frameObj ? frameObj.url : (frame && frame !== 'none' ? frame : null);
  const glowColor = frameObj ? frameObj.glowColor : 'rgba(0, 229, 255, 0.4)';

  const sizeClass = typeof size === 'string' ? `size-${size}` : '';
  const inlineSize = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {};

  const initial = (name || 'P').trim()[0]?.toUpperCase() || 'P';

  return (
    <div
      className={`user-avatar-root ${sizeClass} ${frameUrl ? 'has-frame' : 'no-frame'} ${className}`}
      style={{
        ...inlineSize,
        ...style,
        ...(frameUrl && glow ? { '--frame-glow-color': glowColor } : {}),
      }}
      onClick={onClick}
    >
      <div className="avatar-core-circle">
        {src && !imgError ? (
          <img
            src={src}
            alt={`${name}'s avatar`}
            className="avatar-core-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="avatar-initial-fallback">{initial}</div>
        )}
      </div>

      {frameUrl && (
        <img
          src={frameUrl}
          alt={frameObj?.name || 'Avatar Frame'}
          className="avatar-frame-overlay"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          loading="lazy"
        />
      )}

      {showIndicator && (
        <span className={`avatar-status-dot status-${indicatorStatus}`} />
      )}
    </div>
  );
}
