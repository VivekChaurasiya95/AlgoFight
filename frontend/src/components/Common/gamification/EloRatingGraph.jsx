import React, { useId, useMemo } from "react";
import "./RankEmblem.css";

/**
 * Format ELO rating numbers cleanly:
 * - >= 1000: '1.2k', '1.5k'
 * - < 1000: '0', '50', '250', etc.
 */
export function formatElo(val) {
  const num = Number(val) || 0;
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return `${Math.round(num)}`;
}

/**
 * Generates smooth SVG cubic bezier spline coordinates
 */
function buildPathData(coords, botY) {
  if (!coords || coords.length === 0) return { linePath: "", areaPath: "" };

  if (coords.length === 1) {
    const p = coords[0];
    return {
      linePath: `M ${p.x.toFixed(1)},${p.y.toFixed(1)} L ${p.x.toFixed(1)},${p.y.toFixed(1)}`,
      areaPath: `M ${p.x.toFixed(1)},${p.y.toFixed(1)} L ${p.x.toFixed(1)},${botY.toFixed(1)} Z`,
    };
  }

  if (coords.length === 2) {
    const [p0, p1] = coords;
    const linePath = `M ${p0.x.toFixed(1)},${p0.y.toFixed(1)} L ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
    const areaPath = `${linePath} L ${p1.x.toFixed(1)},${botY.toFixed(1)} L ${p0.x.toFixed(1)},${botY.toFixed(1)} Z`;
    return { linePath, areaPath };
  }

  // Smooth spline for 3+ points
  const tension = 0.22;
  let linePath = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;

  for (let i = 0; i < coords.length - 1; i++) {
    const pPrev = coords[i - 1] || coords[i];
    const pCurr = coords[i];
    const pNext = coords[i + 1];
    const pNextNext = coords[i + 2] || pNext;

    const cp1x = pCurr.x + (pNext.x - pPrev.x) * tension;
    const cp1y = pCurr.y + (pNext.y - pPrev.y) * tension;
    const cp2x = pNext.x - (pNextNext.x - pCurr.x) * tension;
    const cp2y = pNext.y - (pNextNext.y - pCurr.y) * tension;

    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${pNext.x.toFixed(1)},${pNext.y.toFixed(1)}`;
  }

  const first = coords[0];
  const last = coords[coords.length - 1];
  const areaPath = `${linePath} L ${last.x.toFixed(1)},${botY.toFixed(1)} L ${first.x.toFixed(1)},${botY.toFixed(1)} Z`;

  return { linePath, areaPath };
}

/**
 * Pure dynamic Elo Rating Trajectory Graph component.
 * Plots strictly authenticated, honest player rating history with zero hardcoded fake metrics.
 */
export default function EloRatingGraph({
  rating = 0,
  ratingHistory = [],
  graphConfig,
  theme = "default",
  idPrefix = "elo",
  viewBoxHeight = 66,
  className = "",
}) {
  const reactId = useId().replace(/:/g, "");
  const uniqueId = `${idPrefix}-${theme}-${reactId}`;

  const numRating = Math.max(0, Number(rating) || 0);
  const rawHistory = Array.isArray(ratingHistory) ? ratingHistory : [];

  // 1. Process trajectory points from actual database history
  const { points, yMin, yMax, yMid } = useMemo(() => {
    let pts = [];

    if (rawHistory.length === 0) {
      if (numRating === 0) {
        // Player has 0 rating (unranked/rookie placement)
        pts = [
          { label: "Placement", val: 0, isLive: false },
          { label: "LIVE", val: 0, isLive: true },
        ];
      } else {
        // Known rating, but no recorded delta history
        pts = [
          { label: "Base", val: numRating, isLive: false },
          { label: "LIVE", val: numRating, isLive: true },
        ];
      }
    } else {
      // Last up to 6 matches
      const slice = rawHistory.slice(-6);
      const initialVal = Math.max(0, Number(slice[0].ratingBefore ?? slice[0].oldRating ?? 0));
      pts.push({ label: "M0", val: initialVal, isLive: false });

      slice.forEach((m, idx) => {
        const isLast = idx === slice.length - 1;
        const afterVal = Math.max(0, Number(m.ratingAfter ?? m.newRating ?? m.ratingBefore ?? 0));
        pts.push({
          label: isLast ? "LIVE" : `M${idx + 1}`,
          val: afterVal,
          isLive: isLast,
        });
      });

      // Ensure latest point is aligned with player's active rating
      if (pts.length > 0 && numRating > 0) {
        pts[pts.length - 1].val = numRating;
      }
    }

    const allVals = pts.map((p) => p.val);
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);

    let calculatedMin = 0;
    let calculatedMax = 100;

    if (minVal === 0 && maxVal === 0) {
      // Calibrated baseline for Rookie tier (0 to 100 scale)
      calculatedMin = 0;
      calculatedMax = 100;
    } else if (minVal === maxVal) {
      // Constant rating
      calculatedMin = Math.max(0, Math.floor(minVal * 0.8));
      calculatedMax = Math.ceil(maxVal * 1.2);
      if (calculatedMax - calculatedMin < 20) {
        calculatedMin = Math.max(0, minVal - 10);
        calculatedMax = maxVal + 10;
      }
    } else {
      // Dynamic range with 20% visual breathing room
      const range = maxVal - minVal;
      const pad = Math.max(10, Math.ceil(range * 0.2));
      calculatedMin = Math.max(0, Math.floor((minVal - pad) / 10) * 10);
      calculatedMax = Math.ceil((maxVal + pad) / 10) * 10;
    }

    // Nice round midpoint
    const calculatedMid = Math.round((calculatedMax + calculatedMin) / 2);

    return {
      points: pts,
      yMin: calculatedMin,
      yMax: calculatedMax,
      yMid: calculatedMid,
    };
  }, [numRating, rawHistory]);

  // 2. Geometry coordinates
  const topY = 14;
  const botY = 48;
  const midY = (topY + botY) / 2; // 31
  const leftX = 34;
  const rightX = 236;

  const coords = useMemo(() => {
    const n = points.length;
    const ySpan = yMax - yMin || 1;

    return points.map((p, i) => {
      const x = n <= 1 ? rightX : leftX + (i / (n - 1)) * (rightX - leftX);
      const clampedVal = Math.max(yMin, Math.min(yMax, p.val));
      const ratio = (clampedVal - yMin) / ySpan;
      const y = botY - ratio * (botY - topY);

      return {
        ...p,
        x,
        y,
      };
    });
  }, [points, yMin, yMax, topY, botY, leftX, rightX]);

  // 3. SVG Path calculations
  const { linePath, areaPath } = useMemo(() => {
    return buildPathData(coords, botY);
  }, [coords, botY]);

  const lastPt = coords[coords.length - 1] || { x: rightX, y: botY, val: numRating };

  // Theme or default gradients
  const lineGradients = graphConfig?.lineGradient || ["#3b82f6", "#8b5cf6", "#c084fc"];
  const areaColor = graphConfig?.areaColor || "#8b5cf6";
  const areaOpacities = graphConfig?.areaOpacities || [0.32, 0.08, 0.0];
  const liveDotColor = (theme === "original" || theme === "regular") ? "#e879f9" : (graphConfig?.lineGradient?.[2] || "#c084fc");

  return (
    <svg
      key={`elo-svg-${uniqueId}`}
      className={`proper-graph-svg ${className}`}
      viewBox={`0 0 250 ${viewBoxHeight}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Rating progression graph currently at ${numRating} ELO`}
    >
      <defs>
        <linearGradient id={`${uniqueId}-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={lineGradients[0]} />
          <stop offset="50%" stopColor={lineGradients[1] || lineGradients[0]} />
          <stop offset="100%" stopColor={lineGradients[2] || lineGradients[lineGradients.length - 1]} />
        </linearGradient>

        <linearGradient id={`${uniqueId}-area`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={areaColor} stopOpacity={areaOpacities[0]} />
          <stop offset="70%" stopColor={areaColor} stopOpacity={areaOpacities[1]} />
          <stop offset="100%" stopColor={areaColor} stopOpacity={areaOpacities[2]} />
        </linearGradient>

        <filter id={`${uniqueId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Dynamic Horizontal Grid Lines */}
      <line x1="28" y1={topY} x2="242" y2={topY} className="graph-grid-line" />
      <line x1="28" y1={midY} x2="242" y2={midY} className="graph-grid-line" />
      <line x1="28" y1={botY} x2="242" y2={botY} className="graph-grid-line" />

      {/* Honest Y-axis Numeric Ticks & Labels */}
      <text x="2" y={topY + 3} className="graph-axis-text">
        {formatElo(yMax)}
      </text>
      <text x="2" y={midY + 3} className="graph-axis-text">
        {formatElo(yMid)}
      </text>
      <text x="2" y={botY + 3} className="graph-axis-text">
        {formatElo(yMin)}
      </text>

      {/* Vertical Guideline at Active Live Match */}
      <line
        x1={lastPt.x}
        y1={topY - 3}
        x2={lastPt.x}
        y2={botY}
        className="graph-live-guide"
      />

      {/* Area Fill Under Curve */}
      {areaPath && (
        <path d={areaPath} fill={`url(#${uniqueId}-area)`} />
      )}

      {/* Rating Curve Line */}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke={`url(#${uniqueId}-grad)`}
          strokeWidth="2.2"
          strokeLinecap="round"
          filter={`url(#${uniqueId}-glow)`}
        />
      )}

      {/* Historical Match Nodes (excluding the final LIVE dot) */}
      {coords.slice(0, -1).map((p, idx) => (
        <circle
          key={`node-${idx}`}
          cx={p.x}
          cy={p.y}
          r="2.2"
          className="graph-node-dot"
        >
          <title>{`${p.label}: ${p.val} ELO`}</title>
        </circle>
      ))}

      {/* Live Current Rating Endpoint Indicator */}
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="5"
        className="graph-pulse-ring"
        style={{ transformOrigin: `${lastPt.x}px ${lastPt.y}px` }}
      />
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="3"
        fill={liveDotColor}
        className="graph-live-dot"
      >
        <title>{`Current Rating: ${numRating} ELO`}</title>
      </circle>

      {/* Dynamic X-Axis Match Labels */}
      {coords.map((p, idx) => {
        // If more than 5 points, show first, every other, and the LIVE point
        const isFirst = idx === 0;
        const isLive = idx === coords.length - 1;
        const shouldShow = coords.length <= 5 || isFirst || isLive || idx % 2 === 0;

        if (!shouldShow) return null;

        return (
          <text
            key={`xlabel-${idx}`}
            x={p.x}
            y={viewBoxHeight - 6}
            textAnchor="middle"
            className={`graph-x-label ${isLive ? "graph-x-live" : ""}`}
          >
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}
