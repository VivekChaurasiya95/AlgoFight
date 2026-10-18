import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faRocket, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import "./LaunchCountdownBadge.css";

export default function LaunchCountdownBadge({ targetDate, launchStatus = "UPCOMING", versionTag = null, compact = true }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  function calculateTimeLeft(target) {
    if (!target) return { isPassed: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) {
      return { isPassed: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      isPassed: false,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (launchStatus === "CANCELLED") {
    return <span className="intel-badge intel-badge-cancelled">Cancelled</span>;
  }

  if (launchStatus === "POSTPONED") {
    return <span className="intel-badge intel-badge-postponed">Postponed</span>;
  }

  if (timeLeft.isPassed || launchStatus === "LIVE") {
    return (
      <div className="intel-launch-badge live">
        <span className="live-dot" />
        <FontAwesomeIcon icon={faCheckCircle} className="badge-icon" />
        <span className="badge-text">LIVE</span>
        {versionTag && <span className="version-tag">{versionTag}</span>}
      </div>
    );
  }

  const timeLabel = compact
    ? timeLeft.days > 0
      ? `${timeLeft.days}d ${timeLeft.hours}h`
      : `${timeLeft.hours}h ${timeLeft.minutes}m`
    : `T-${timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}${timeLeft.hours}h ${timeLeft.minutes}m`;

  return (
    <div className="intel-launch-badge upcoming">
      <FontAwesomeIcon icon={faRocket} className="badge-icon rocket-pulse" />
      <span className="badge-text">{timeLabel}</span>
      {versionTag && <span className="version-tag">{versionTag}</span>}
    </div>
  );
}
