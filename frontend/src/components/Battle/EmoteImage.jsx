import React, { useState } from "react";
import { getEmoteUrl } from "../../constants/battleEmotes";

export default function EmoteImage({
  codepoint,
  alt = "Emote",
  size = 48,
  className = "",
  fallbackEmoji = "😎",
  priority = false,
}) {
  const [hasError, setHasError] = useState(false);
  const webpSrc = getEmoteUrl(codepoint, "webp");
  const gifSrc = getEmoteUrl(codepoint, "gif");

  if (hasError || !codepoint) {
    return (
      <span
        className={`fallback-emoji ${className}`}
        style={{ fontSize: `${Math.round(size * 0.7)}px`, lineHeight: 1 }}
      >
        {fallbackEmoji}
      </span>
    );
  }

  return (
    <picture className={`noto-animated-emote-wrap ${className}`}>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={gifSrc}
        alt={alt}
        width={size}
        height={size}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setHasError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: "contain",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </picture>
  );
}
