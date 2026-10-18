import React, { useMemo, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faChartLine,
  faGlobe,
  faLayerGroup,
  faUser,
  faUsers,
  faCheck,
  faMagnifyingGlass,
  faRotate,
  faCode,
  faGamepad,
  faTrophy,
  faShieldHalved,
  faDesktop,
  faMobileScreen,
  faFire,
  faCircleCheck,
  faBolt,
  faTerminal,
  faCoins,
  faGift,
  faFilter,
  faCalendarDays,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";
import RankEmblem from "../../Common/gamification/RankEmblem";
import { fetchRewardsAnalytics } from "../../../services/api";

const numberFormatter = new Intl.NumberFormat("en-US");

const DEFAULT_TIER_DISTRIBUTION = [
  { key: "ROOKIE", tier: "Rookie", range: "0 - 399", count: 0, percentage: 0, color: "#94a3b8" },
  { key: "EXPERT", tier: "Expert", range: "400 - 799", count: 0, percentage: 0, color: "#06b6d4" },
  { key: "MASTER", tier: "Master", range: "800 - 1199", count: 0, percentage: 0, color: "#a855f7" },
  { key: "GRANDMASTER", tier: "Grandmaster", range: "1200 - 1599", count: 0, percentage: 0, color: "#ef4444" },
  { key: "LEGEND", tier: "Legend", range: "1600 - 1999", count: 0, percentage: 0, color: "#f59e0b" },
  { key: "SUPREME", tier: "Supreme", range: "2000+", count: 0, percentage: 0, color: "#ec4899" },
];

export default function AnalyticsTab({
  adminKey,
  analyticsData,
  isAnalyticsLoading,
  fetchAnalytics,
  handleCopyIp,
  handleFilterByIp,
  copiedIp,
}) {
  const [rewardsTimeframe, setRewardsTimeframe] = useState("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [rewardsData, setRewardsData] = useState(null);
  const [isRewardsLoading, setIsRewardsLoading] = useState(false);
  const [rewardsSearchTerm, setRewardsSearchTerm] = useState("");

  const loadRewardsData = useCallback(
    async (tf = rewardsTimeframe, sDate = customStartDate, eDate = customEndDate) => {
      const activeAdminKey = adminKey || sessionStorage.getItem("af_admin_key") || "";
      if (!activeAdminKey) return;
      try {
        setIsRewardsLoading(true);
        const res = await fetchRewardsAnalytics(activeAdminKey, {
          timeframe: tf,
          startDate: sDate,
          endDate: eDate,
        });
        if (res && res.summary) {
          setRewardsData(res);
        }
      } catch (err) {
        console.error("Failed to fetch rewards analytics:", err);
      } finally {
        setIsRewardsLoading(false);
      }
    },
    [adminKey, rewardsTimeframe, customStartDate, customEndDate]
  );

  useEffect(() => {
    loadRewardsData(rewardsTimeframe);
  }, [loadRewardsData, rewardsTimeframe]);

  const handleRefreshAll = () => {
    if (fetchAnalytics) fetchAnalytics();
    loadRewardsData(rewardsTimeframe);
  };

  const subMetrics = analyticsData?.submissionMetrics || {
    totalSubmissions: 0,
    acceptanceRate: 0,
    verdictBreakdown: [],
    languageBreakdown: [],
  };

  const battleMetrics = analyticsData?.battleMetrics || {
    totalRooms: 0,
    totalParticipants: 0,
    statusBreakdown: [],
    modeBreakdown: [],
  };

  const problemMetrics = analyticsData?.problemMetrics || {
    totalProblems: 0,
    difficultyBreakdown: [],
  };

  const userMetrics = analyticsData?.userMetrics || {
    totalUsers: 0,
    userTypeBreakdown: [],
    tierDistribution: [],
  };

  const deviceBreakdown = analyticsData?.deviceBreakdown || {};
  const totalDevices = Object.values(deviceBreakdown).reduce((a, b) => a + b, 0) || 1;
  const browserBreakdown = analyticsData?.browserBreakdown || {};

  // Standardize tier spread to authoritative 6 tiers: Rookie, Expert, Master, Grandmaster, Legend, Supreme
  const displayTiers = useMemo(() => {
    const raw = userMetrics.tierDistribution;
    if (Array.isArray(raw) && raw.length > 0 && raw.some((t) => t.tier === "Supreme" || t.key === "SUPREME")) {
      return raw.map((t) => ({
        ...t,
        key: t.key || t.tier.toUpperCase(),
      }));
    }
    if (Array.isArray(raw) && raw.length > 0) {
      const counts = {};
      raw.forEach((r) => {
        counts[r.tier] = r.count;
      });
      return [
        { key: "ROOKIE", tier: "Rookie", range: "0 - 399", count: counts["Unrated / Rookie"] ?? counts["Rookie"] ?? 0, color: "#94a3b8" },
        { key: "EXPERT", tier: "Expert", range: "400 - 799", count: counts["Expert"] ?? 0, color: "#06b6d4" },
        { key: "MASTER", tier: "Master", range: "800 - 1199", count: counts["Bronze"] ?? counts["Master"] ?? 0, color: "#a855f7" },
        { key: "GRANDMASTER", tier: "Grandmaster", range: "1200 - 1599", count: counts["Silver"] ?? counts["Grandmaster"] ?? 0, color: "#ef4444" },
        { key: "LEGEND", tier: "Legend", range: "1600 - 1999", count: counts["Gold"] ?? counts["Legend"] ?? 0, color: "#f59e0b" },
        { key: "SUPREME", tier: "Supreme", range: "2000+", count: (counts["Platinum"] || 0) + (counts["Diamond+"] || 0) + (counts["Supreme"] || 0), color: "#ec4899" },
      ];
    }
    return DEFAULT_TIER_DISTRIBUTION;
  }, [userMetrics.tierDistribution]);

  // Find maximum count in ELO tier distribution for histogram scaling
  const maxTierCount = Math.max(
    1,
    ...displayTiers.map((t) => t.count)
  );

  return (
    <div className="admin-analytics-section">
      {/* Analytics Header Panel */}
      <div className="analytics-header-panel glass-panel">
        <div className="analytics-title-wrap">
          <div className="pre-heading">REAL-TIME PLATFORM INTELLIGENCE & EVALUATION ANALYTICS</div>
          <h3>
            <FontAwesomeIcon icon={faChartColumn} /> Live Platform Surfing, Battle & Code Intelligence
          </h3>
          <p>
            Real-time active concurrency, code evaluation verdicts, battle matchmaking telemetry, and combatant rank distributions.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="refresh-btn"
            onClick={handleRefreshAll}
            disabled={isAnalyticsLoading}
            title="Refresh analytics telemetry"
          >
            <FontAwesomeIcon icon={faRotate} className={isAnalyticsLoading ? "fa-spin" : ""} />{" "}
            Refresh Analytics
          </button>
        </div>
      </div>

      {/* Top 6 KPI Scorecard Deck */}
      <div className="analytics-kpi-grid-6">
        <div className="analytics-kpi-card glass-panel">
          <span className="kpi-tag-label">SURFING NOW</span>
          <div className="kpi-big-num cyan">{analyticsData?.activeUsersNow ?? 0}</div>
          <span className="kpi-footnote">Active clients (3m window)</span>
        </div>
        <div className="analytics-kpi-card glass-panel">
          <span className="kpi-tag-label">PLATFORM REQUESTS</span>
          <div className="kpi-big-num green">{analyticsData?.totalPageViews ?? 0}</div>
          <span className="kpi-footnote">Aggregated gateway hits</span>
        </div>
        <div className="analytics-kpi-card glass-panel">
          <span className="kpi-tag-label">CODE SUBMISSIONS</span>
          <div className="kpi-big-num purple">{subMetrics.totalSubmissions ?? 0}</div>
          <span className="kpi-footnote">Evaluated across all modes</span>
        </div>
        <div className="analytics-kpi-card glass-panel">
          <span className="kpi-tag-label">GLOBAL AC RATE</span>
          <div className="kpi-big-num green">{subMetrics.acceptanceRate ?? 0}%</div>
          <span className="kpi-footnote">Accepted verdict ratio</span>
        </div>
        <div className="analytics-kpi-card glass-panel">
          <span className="kpi-tag-label">BATTLES HOSTED</span>
          <div className="kpi-big-num gold">{battleMetrics.totalRooms ?? 0}</div>
          <span className="kpi-footnote">Arenas & tournament lobbies</span>
        </div>
        <div className="analytics-kpi-card glass-panel">
          <span className="kpi-tag-label">TOTAL COMBATANTS</span>
          <div className="kpi-big-num cyan">{userMetrics.totalUsers ?? 0}</div>
          <span className="kpi-footnote">Registered player accounts</span>
        </div>
      </div>

      {/* =========================================================
          SECTION 1: CODE SUBMISSION VERDICTS & LANGUAGE ADOPTION
          ========================================================= */}
      <div className="analytics-section-title">
        <h4>
          <FontAwesomeIcon icon={faCode} style={{ color: "#00e5ff" }} /> Code Evaluation & Language Intelligence
        </h4>
        <span className="telemetry-subtext">PostgreSQL Submission Ledger</span>
      </div>

      <div className="analytics-grid-row-2">
        {/* Card 1A: Submission Verdict Distribution */}
        <div className="telemetry-card glass-panel">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#10b981" }} /> Submission Verdict Breakdown
              </h3>
              <span className="telemetry-subtext">
                Real judge outcomes: Accepted, Wrong Answer, TLE, MLE, & Errors
              </span>
            </div>
            <span className="telemetry-tag tag-emerald">
              AC RATE: {subMetrics.acceptanceRate}%
            </span>
          </div>

          {subMetrics.verdictBreakdown.length === 0 ? (
            <div style={{ color: "var(--text-secondary, #8494ad)", padding: "32px 16px", textAlign: "center", fontSize: "0.85rem" }}>
              <FontAwesomeIcon icon={faTerminal} style={{ fontSize: "1.8rem", color: "var(--text-muted, #334155)", marginBottom: "8px" }} />
              <div>No submissions recorded yet.</div>
              <small style={{ color: "var(--text-muted, #64748b)" }}>Live battle and practice code executions will populate real verdicts automatically.</small>
            </div>
          ) : (
            <>
              {/* Segmented Verdict Bar */}
              <div className="analytics-segmented-bar">
                {subMetrics.verdictBreakdown.map((vb) => (
                  <div
                    key={vb.verdict}
                    className="bar-seg"
                    style={{
                      width: `${Math.max(1, vb.percentage)}%`,
                      backgroundColor: vb.color,
                    }}
                    title={`${vb.label}: ${vb.count} (${vb.percentage}%)`}
                  />
                ))}
              </div>

              {/* Verdict Grid */}
              <div className="verdict-chips-grid">
                {subMetrics.verdictBreakdown.map((vb) => (
                  <div key={vb.verdict} className="verdict-chip-card">
                    <div className="verdict-left">
                      <span className="verdict-color-dot" style={{ backgroundColor: vb.color }} />
                      <span className="verdict-name">{vb.label}</span>
                    </div>
                    <div className="verdict-stat">
                      <strong>{vb.count}</strong>
                      <small>({vb.percentage}%)</small>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Card 1B: Programming Language Distribution */}
        <div className="telemetry-card glass-panel">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faBolt} style={{ color: "#38bdf8" }} /> Compiler & Language Adoption
              </h3>
              <span className="telemetry-subtext">
                Distribution of programming languages utilized by combatants
              </span>
            </div>
            <span className="telemetry-tag tag-cyan">COMPILER TELEMETRY</span>
          </div>

          {subMetrics.languageBreakdown.length === 0 ? (
            <div style={{ color: "var(--text-secondary, #8494ad)", padding: "32px 16px", textAlign: "center", fontSize: "0.85rem" }}>
              <FontAwesomeIcon icon={faCode} style={{ fontSize: "1.8rem", color: "var(--text-muted, #334155)", marginBottom: "8px" }} />
              <div>No language data available.</div>
              <small style={{ color: "var(--text-muted, #64748b)" }}>Piston execution sandbox submissions will stream language share here.</small>
            </div>
          ) : (
            <div className="lang-stat-list">
              {subMetrics.languageBreakdown.map((lb) => (
                <div key={lb.language} className="lang-stat-row">
                  <div className="lang-row-header">
                    <span className="lang-name-tag">
                      <span className="lang-dot" style={{ backgroundColor: lb.color }} />
                      {lb.language}
                    </span>
                    <span className="lang-stat-vals">
                      <strong>{lb.count} solves</strong> ({lb.percentage}%)
                    </span>
                  </div>
                  <div className="lang-track">
                    <div
                      className="lang-fill"
                      style={{
                        width: `${lb.percentage}%`,
                        backgroundColor: lb.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          SECTION 2: ARENA BATTLES & MATCHMAKING TELEMETRY
          ========================================================= */}
      <div className="analytics-section-title">
        <h4>
          <FontAwesomeIcon icon={faGamepad} style={{ color: "#fbbf24" }} /> Competitive Matchmaking & Arena Telemetry
        </h4>
        <span className="telemetry-subtext">Atomic Battle State Machines</span>
      </div>

      <div className="analytics-grid-row-2">
        {/* Card 2A: Battle Mode Distribution */}
        <div className="telemetry-card glass-panel">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faFire} style={{ color: "#f97316" }} /> Matchmaking Mode Distribution
              </h3>
              <span className="telemetry-subtext">
                Ranked 1v1 duels vs collaborative squad battles
              </span>
            </div>
            <span className="telemetry-tag tag-gold">
              PARTICIPANTS: {battleMetrics.totalParticipants}
            </span>
          </div>

          <div className="battle-modes-grid">
            <div className="battle-mode-card">
              <FontAwesomeIcon icon={faBolt} className="battle-mode-icon" style={{ color: "#00e5ff" }} />
              <span className="battle-mode-title">1v1 Duels</span>
              <span className="battle-mode-count">
                {battleMetrics.modeBreakdown.find((m) => m.mode === "DUEL_1V1")?.count ?? 0}
              </span>
              <span className="battle-mode-pct">
                {battleMetrics.modeBreakdown.find((m) => m.mode === "DUEL_1V1")?.percentage ?? 0}% share
              </span>
            </div>

            <div className="battle-mode-card">
              <FontAwesomeIcon icon={faUsers} className="battle-mode-icon" style={{ color: "#10b981" }} />
              <span className="battle-mode-title">Squad Battles</span>
              <span className="battle-mode-count">
                {battleMetrics.modeBreakdown.find((m) => m.mode === "SQUAD_BATTLE")?.count ?? 0}
              </span>
              <span className="battle-mode-pct">
                {battleMetrics.modeBreakdown.find((m) => m.mode === "SQUAD_BATTLE")?.percentage ?? 0}% share
              </span>
            </div>

            <div className="battle-mode-card">
              <FontAwesomeIcon icon={faGamepad} className="battle-mode-icon" style={{ color: "#c084fc" }} />
              <span className="battle-mode-title">Solo Sparring</span>
              <span className="battle-mode-count">
                {battleMetrics.modeBreakdown.find((m) => m.mode === "PRACTICE_SOLO")?.count ?? 0}
              </span>
              <span className="battle-mode-pct">
                {battleMetrics.modeBreakdown.find((m) => m.mode === "PRACTICE_SOLO")?.percentage ?? 0}% share
              </span>
            </div>
          </div>

          {/* Segmented Mode Bar */}
          <div className="analytics-segmented-bar">
            {battleMetrics.modeBreakdown.map((mb, i) => (
              <div
                key={mb.mode}
                className="bar-seg"
                style={{
                  width: `${Math.max(1, mb.percentage)}%`,
                  backgroundColor: i === 0 ? "#00e5ff" : i === 1 ? "#10b981" : "#c084fc",
                }}
                title={`${mb.label}: ${mb.count} (${mb.percentage}%)`}
              />
            ))}
          </div>
        </div>

        {/* Card 2B: Battle Room Lifecycle Statuses */}
        <div className="telemetry-card glass-panel">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faTrophy} style={{ color: "#fbbf24" }} /> Battle Room Lifecycle Health
              </h3>
              <span className="telemetry-subtext">
                Completed matches, active duels, and pending lobbies
              </span>
            </div>
            <span className="telemetry-tag tag-cyan">LOBBY STATE</span>
          </div>

          {battleMetrics.statusBreakdown.length === 0 ? (
            <div style={{ color: "var(--text-secondary, #8494ad)", padding: "32px 16px", textAlign: "center", fontSize: "0.85rem" }}>
              No battle rooms created yet.
            </div>
          ) : (
            <div className="status-roster-list">
              {battleMetrics.statusBreakdown.map((sb) => (
                <div key={sb.status} className="status-roster-item">
                  <span className={`status-badge-pill status-${sb.status}`}>
                    {sb.status}
                  </span>
                  <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                    <strong className="status-roster-count">
                      {sb.count} rooms
                    </strong>
                    <small style={{ color: "var(--text-muted, #64748b)" }}>({sb.percentage}%)</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          SECTION 3: ELO RATING TIERS & PLATFORM DEMOGRAPHICS
          ========================================================= */}
      <div className="analytics-section-title">
        <h4>
          <FontAwesomeIcon icon={faTrophy} style={{ color: "#c084fc" }} /> Combatant ELO Tiers & Problem Bank Health
        </h4>
        <span className="telemetry-subtext">Competitive Ladder Distribution</span>
      </div>

      <div className="analytics-grid-row-2">
        {/* Card 3A: ELO Tier Distribution Histogram */}
        <div className="telemetry-card glass-panel">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faChartColumn} style={{ color: "#c084fc" }} /> ELO Rating Tier Spread
              </h3>
              <span className="telemetry-subtext">
                Combatant count across competitive ladder brackets
              </span>
            </div>
            <span className="telemetry-tag tag-purple">ELO SPREAD</span>
          </div>

          {displayTiers.length === 0 ? (
            <div style={{ color: "var(--text-secondary, #8494ad)", padding: "28px", textAlign: "center", fontSize: "0.85rem" }}>
              No combatant ratings available.
            </div>
          ) : (
            <div className="elo-histogram-box">
              {displayTiers.map((tb) => {
                const heightPct = Math.max(8, Math.round((tb.count / maxTierCount) * 100));
                const tierKey = tb.key || tb.tier?.toUpperCase();
                return (
                  <div key={tb.tier} className="elo-hist-col" title={`${tb.tier} (${tb.range}): ${tb.count} players`}>
                    <span className="elo-hist-val">{tb.count}</span>
                    <div className="elo-hist-bar-track">
                      <div
                        className="elo-hist-bar-fill"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: tb.color,
                          boxShadow: `0 0 10px ${tb.color}44`,
                        }}
                      />
                    </div>
                    <div className="elo-hist-label-group">
                      <RankEmblem rank={tierKey} size={15} glow={false} />
                      <span className="elo-hist-label">{tb.tier}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 3B: Problem Bank Difficulty & Account Roles */}
        <div className="telemetry-card glass-panel">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#00e5ff" }} /> Problem Balance & Roles
              </h3>
              <span className="telemetry-subtext">
                Available algorithmic problem bank and combatant types
              </span>
            </div>
            <span className="telemetry-tag tag-cyan">
              PROBLEMS: {problemMetrics.totalProblems}
            </span>
          </div>

          {/* Problem Difficulty Segmented Bar */}
          <div style={{ marginBottom: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--text-secondary, #8494ad)", marginBottom: "4px" }}>
              <span>Problem Difficulty Ratios</span>
              <span style={{ color: "var(--text-muted, #64748b)" }}>{problemMetrics.totalProblems} Total in Bank</span>
            </div>
            <div className="analytics-segmented-bar" style={{ margin: "4px 0 10px" }}>
              {problemMetrics.difficultyBreakdown.map((db) => (
                <div
                  key={db.difficulty}
                  className="bar-seg"
                  style={{
                    width: `${Math.max(2, db.percentage)}%`,
                    backgroundColor: db.color,
                  }}
                  title={`${db.difficulty}: ${db.count} (${db.percentage}%)`}
                />
              ))}
            </div>

            <div className="ratio-chips-deck">
              {problemMetrics.difficultyBreakdown.map((db) => (
                <div key={db.difficulty} className="ratio-chip-box">
                  <span className="rc-label" style={{ color: db.color }}>{db.difficulty}</span>
                  <div className="rc-num">{db.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Types */}
          <div className="analytics-card-divider">
            <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #8494ad)", marginBottom: "6px" }}>
              Combatant Account Roles
            </div>
            <div className="ratio-chips-deck">
              {userMetrics.userTypeBreakdown.map((ub) => (
                <div key={ub.type} className="ratio-chip-box">
                  <span className="rc-label">{ub.type}</span>
                  <div className="rc-num">{ub.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 4: REWARDS VAULT TELEMETRY & RANK CONSUMPTION DEMOGRAPHICS
          ========================================================= */}
      <div className="analytics-section-title" style={{ marginTop: "24px" }}>
        <h4>
          <FontAwesomeIcon icon={faCoins} style={{ color: "#fbbf24" }} /> Rewards Vault Redemptions & Rank Demographics
        </h4>
        <span className="telemetry-subtext">Statistical telemetry tracking claimed avatars, frames, themes & rank preferences</span>
      </div>

      <div className="rewards-telemetry-container">
        {/* Timeframe Filter Bar */}
        <div className="rewards-timeframe-bar glass-panel">
          <div className="timeframe-group-title">
            <FontAwesomeIcon icon={faCalendarDays} style={{ color: "#00e5ff" }} />
            <span>Time Window: {rewardsData?.timeframeLabel || "Past 30 Days (Month)"}</span>
          </div>

          <div className="timeframe-pills-row">
            {[
              { key: "7d", label: "7 Days (Week)" },
              { key: "30d", label: "30 Days (Month)" },
              { key: "90d", label: "90 Days (Quarter)" },
              { key: "all", label: "All Time" },
              { key: "custom", label: "Custom Range" },
            ].map((tf) => (
              <button
                key={tf.key}
                type="button"
                className={`timeframe-pill-btn ${rewardsTimeframe === tf.key ? "is-active" : ""}`}
                onClick={() => {
                  setRewardsTimeframe(tf.key);
                  if (tf.key !== "custom") {
                    loadRewardsData(tf.key);
                  }
                }}
              >
                {tf.label}
              </button>
            ))}

            {rewardsTimeframe === "custom" && (
              <div className="custom-range-inputs">
                <input
                  type="date"
                  className="custom-date-field"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  title="Start Date"
                />
                <span className="custom-date-sep">to</span>
                <input
                  type="date"
                  className="custom-date-field"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  title="End Date"
                />
                <button
                  type="button"
                  className="apply-date-btn"
                  onClick={() => loadRewardsData("custom", customStartDate, customEndDate)}
                  disabled={isRewardsLoading}
                >
                  <FontAwesomeIcon icon={faFilter} /> Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Scorecard KPI Deck */}
        <div className="rewards-kpi-deck">
          <div className="reward-kpi-card glass-panel">
            <span className="reward-kpi-label">
              <FontAwesomeIcon icon={faGift} style={{ color: "#00e5ff" }} /> TOTAL REWARDS CLAIMED
            </span>
            <div className="reward-kpi-val cyan">
              {numberFormatter.format(rewardsData?.summary?.totalClaims ?? 0)}
            </div>
            <span className="reward-kpi-sub">
              {rewardsData?.categoryBreakdown?.avatar?.count ?? 0} Avatars · {rewardsData?.categoryBreakdown?.frame?.count ?? 0} Frames · {rewardsData?.categoryBreakdown?.theme?.count ?? 0} Themes
            </span>
          </div>

          <div className="reward-kpi-card glass-panel">
            <span className="reward-kpi-label">
              <FontAwesomeIcon icon={faCoins} style={{ color: "#fbbf24" }} /> ARENA POINTS SUNK
            </span>
            <div className="reward-kpi-val gold">
              {numberFormatter.format(rewardsData?.summary?.totalPointsSunk ?? 0)} <span style={{ fontSize: "0.95rem" }}>PTS</span>
            </div>
            <span className="reward-kpi-sub">
              Avg {numberFormatter.format(rewardsData?.summary?.avgPointsPerClaim ?? 0)} PTS per claim
            </span>
          </div>

          <div className="reward-kpi-card glass-panel">
            <span className="reward-kpi-label">
              <FontAwesomeIcon icon={faUsers} style={{ color: "#c084fc" }} /> COMBATANT REDEEMERS
            </span>
            <div className="reward-kpi-val purple">
              {numberFormatter.format(rewardsData?.summary?.uniqueRedeemers ?? 0)}
            </div>
            <span className="reward-kpi-sub">
              Unique users claiming rewards in window
            </span>
          </div>

          <div className="reward-kpi-card glass-panel">
            <span className="reward-kpi-label">
              <FontAwesomeIcon icon={faCrown} style={{ color: "#f472b6" }} /> TOP CLAIMED ITEM
            </span>
            <div
              className="reward-kpi-val pink"
              style={{ fontSize: "1.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              title={rewardsData?.summary?.topClaimedItem?.title || "Awaiting claims"}
            >
              {rewardsData?.summary?.topClaimedItem ? rewardsData.summary.topClaimedItem.title : "None in Window"}
            </div>
            <span className="reward-kpi-sub">
              {rewardsData?.summary?.topClaimedItem
                ? `${rewardsData.summary.topClaimedItem.count} claims (${numberFormatter.format(rewardsData.summary.topClaimedItem.points)} PTS)`
                : "Awaiting first claim in timeframe"}
            </span>
          </div>
        </div>

        {/* Category Share Distribution Card */}
        <div className="telemetry-card glass-panel">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faLayerGroup} style={{ color: "#00e5ff" }} /> Reward Category Consumption Breakdown
              </h3>
              <span className="telemetry-subtext">
                Proportion of Arena Points spent on Avatars, Prestige Frames, vs Cyber HUD Themes
              </span>
            </div>
            <span className="telemetry-tag tag-cyan">CATEGORY SHARE</span>
          </div>

          <div style={{ margin: "4px 0 10px" }}>
            <div className="analytics-segmented-bar" style={{ height: "14px" }}>
              <div
                className="bar-seg"
                style={{
                  width: `${Math.max(rewardsData?.categoryBreakdown?.avatar?.count ? 2 : 0, rewardsData?.categoryBreakdown?.avatar?.percentage ?? 0)}%`,
                  backgroundColor: "#00e5ff",
                }}
                title={`Avatars: ${rewardsData?.categoryBreakdown?.avatar?.count ?? 0} (${rewardsData?.categoryBreakdown?.avatar?.percentage ?? 0}%)`}
              />
              <div
                className="bar-seg"
                style={{
                  width: `${Math.max(rewardsData?.categoryBreakdown?.frame?.count ? 2 : 0, rewardsData?.categoryBreakdown?.frame?.percentage ?? 0)}%`,
                  backgroundColor: "#fbbf24",
                }}
                title={`Prestige Frames: ${rewardsData?.categoryBreakdown?.frame?.count ?? 0} (${rewardsData?.categoryBreakdown?.frame?.percentage ?? 0}%)`}
              />
              <div
                className="bar-seg"
                style={{
                  width: `${Math.max(rewardsData?.categoryBreakdown?.theme?.count ? 2 : 0, rewardsData?.categoryBreakdown?.theme?.percentage ?? 0)}%`,
                  backgroundColor: "#a855f7",
                }}
                title={`Cyber Themes: ${rewardsData?.categoryBreakdown?.theme?.count ?? 0} (${rewardsData?.categoryBreakdown?.theme?.percentage ?? 0}%)`}
              />
            </div>

            <div className="ratio-chips-deck" style={{ marginTop: "12px" }}>
              <div className="ratio-chip-box">
                <span className="rc-label" style={{ color: "#00e5ff" }}>
                  🎭 AVATARS ({rewardsData?.categoryBreakdown?.avatar?.percentage ?? 0}%)
                </span>
                <div className="rc-num">
                  {numberFormatter.format(rewardsData?.categoryBreakdown?.avatar?.count ?? 0)}
                  <small style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "6px" }}>
                    ({numberFormatter.format(rewardsData?.categoryBreakdown?.avatar?.points ?? 0)} PTS)
                  </small>
                </div>
              </div>

              <div className="ratio-chip-box">
                <span className="rc-label" style={{ color: "#fbbf24" }}>
                  🛡️ PRESTIGE FRAMES ({rewardsData?.categoryBreakdown?.frame?.percentage ?? 0}%)
                </span>
                <div className="rc-num">
                  {numberFormatter.format(rewardsData?.categoryBreakdown?.frame?.count ?? 0)}
                  <small style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "6px" }}>
                    ({numberFormatter.format(rewardsData?.categoryBreakdown?.frame?.points ?? 0)} PTS)
                  </small>
                </div>
              </div>

              <div className="ratio-chip-box">
                <span className="rc-label" style={{ color: "#c084fc" }}>
                  🎨 HUD THEMES ({rewardsData?.categoryBreakdown?.theme?.percentage ?? 0}%)
                </span>
                <div className="rc-num">
                  {numberFormatter.format(rewardsData?.categoryBreakdown?.theme?.count ?? 0)}
                  <small style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "6px" }}>
                    ({numberFormatter.format(rewardsData?.categoryBreakdown?.theme?.points ?? 0)} PTS)
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Core Rank-to-Reward Cross-Tabulation Matrix */}
        <div className="telemetry-card glass-panel rank-matrix-card">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faTrophy} style={{ color: "#c084fc" }} /> Rank Tier Claim Preference Matrix
              </h3>
              <span className="telemetry-subtext">
                How different types of rank holders claim mostly which type of reward from their Arena Points
              </span>
            </div>
            <span className="telemetry-tag tag-purple">RANK PREFERENCE TELEMETRY</span>
          </div>

          <div className="rewards-table-wrapper">
            <table className="rewards-table">
              <thead>
                <tr>
                  <th>Rank Tier</th>
                  <th>Elo Bracket</th>
                  <th>Total Claims</th>
                  <th>Points Sunk</th>
                  <th>Avatars Claimed</th>
                  <th>Frames Claimed</th>
                  <th>Themes Claimed</th>
                  <th>Primary Consumption Preference</th>
                </tr>
              </thead>
              <tbody>
                {(!rewardsData?.rankDemographics || rewardsData.rankDemographics.length === 0) ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#8494ad" }}>
                      No rank redemption records available for this timeframe.
                    </td>
                  </tr>
                ) : (
                  rewardsData.rankDemographics.map((tier) => (
                    <tr key={tier.tierKey}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <RankEmblem rank={tier.tierName} rating={tier.tierKey === "SUPREME" ? 2100 : tier.tierKey === "LEGEND" ? 1700 : tier.tierKey === "GRANDMASTER" ? 1300 : tier.tierKey === "MASTER" ? 900 : tier.tierKey === "EXPERT" ? 500 : 200} size={28} showBadge={false} />
                          <strong style={{ color: tier.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                            {tier.tierName}
                          </strong>
                        </div>
                      </td>
                      <td>
                        <code style={{ color: "#cbd5e1" }}>{tier.ratingRange}</code>
                      </td>
                      <td>
                        <strong>{numberFormatter.format(tier.totalClaims)}</strong>
                      </td>
                      <td>
                        <strong className="cyan-text">{numberFormatter.format(tier.totalPointsSpent)} PTS</strong>
                      </td>
                      <td style={{ minWidth: "130px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem" }}>
                          <span style={{ color: "#00e5ff" }}>{tier.avatarCount}</span>
                          <span style={{ color: "#64748b" }}>{tier.avatarPct}%</span>
                        </div>
                        <div className="matrix-progress-track">
                          <div className="matrix-progress-fill" style={{ width: `${tier.avatarPct}%`, backgroundColor: "#00e5ff" }} />
                        </div>
                      </td>
                      <td style={{ minWidth: "130px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem" }}>
                          <span style={{ color: "#fbbf24" }}>{tier.frameCount}</span>
                          <span style={{ color: "#64748b" }}>{tier.framePct}%</span>
                        </div>
                        <div className="matrix-progress-track">
                          <div className="matrix-progress-fill" style={{ width: `${tier.framePct}%`, backgroundColor: "#fbbf24" }} />
                        </div>
                      </td>
                      <td style={{ minWidth: "130px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem" }}>
                          <span style={{ color: "#c084fc" }}>{tier.themeCount}</span>
                          <span style={{ color: "#64748b" }}>{tier.themePct}%</span>
                        </div>
                        <div className="matrix-progress-track">
                          <div className="matrix-progress-fill" style={{ width: `${tier.themePct}%`, backgroundColor: "#c084fc" }} />
                        </div>
                      </td>
                      <td>
                        <span className={`dominant-pill ${tier.dominantType}`}>
                          {tier.dominantType === "theme" && "🎨 "}
                          {tier.dominantType === "avatar" && "🎭 "}
                          {tier.dominantType === "frame" && "🛡️ "}
                          {tier.dominantLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Redemptions Live Ledger */}
        <div className="telemetry-card glass-panel">
          <div className="card-header" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3>
                <FontAwesomeIcon icon={faRotate} style={{ color: "#00e5ff" }} /> Recent Redemptions Ledger
              </h3>
              <span className="telemetry-subtext">
                Live stream of combatants acquiring items with Arena Points
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search combatant or item..."
                value={rewardsSearchTerm}
                onChange={(e) => setRewardsSearchTerm(e.target.value)}
                style={{
                  background: "rgba(5, 8, 17, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  color: "#f8fafc",
                  outline: "none",
                }}
              />
              <span className="telemetry-tag tag-cyan">
                {rewardsData?.recentRedemptions?.length ?? 0} LOGGED
              </span>
            </div>
          </div>

          <div className="rewards-table-wrapper" style={{ maxHeight: "320px" }}>
            <table className="rewards-table">
              <thead>
                <tr>
                  <th>Combatant</th>
                  <th>Rating & Tier</th>
                  <th>Item Unlocked</th>
                  <th>Type</th>
                  <th>Arena Points Spent</th>
                  <th>Claim Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {(!rewardsData?.recentRedemptions || rewardsData.recentRedemptions.length === 0) ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "#8494ad" }}>
                      No redemptions logged in this timeframe window.
                    </td>
                  </tr>
                ) : (
                  rewardsData.recentRedemptions
                    .filter((r) => {
                      if (!rewardsSearchTerm) return true;
                      const term = rewardsSearchTerm.toLowerCase();
                      return (
                        r.username?.toLowerCase().includes(term) ||
                        r.rewardTitle?.toLowerCase().includes(term) ||
                        r.itemType?.toLowerCase().includes(term)
                      );
                    })
                    .map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong className="green-text">
                            <FontAwesomeIcon icon={faUser} /> {item.username}
                          </strong>
                        </td>
                        <td>
                          <span style={{ color: item.rankColor, fontWeight: 700 }}>
                            {item.rankTier}
                          </span>{" "}
                          <small style={{ color: "#64748b" }}>({item.userRating} PTS)</small>
                        </td>
                        <td>
                          <strong>{item.rewardTitle}</strong>
                        </td>
                        <td>
                          <span className={`reward-type-chip ${item.itemType}`}>
                            {item.itemType}
                          </span>
                        </td>
                        <td>
                          <strong className="gold-text">
                            {item.cost === 0 ? "FREE / ADMIN" : `${numberFormatter.format(item.cost)} PTS`}
                          </strong>
                        </td>
                        <td>
                          <span style={{ color: "#94a3b8", fontSize: "0.76rem" }}>
                            {new Date(item.claimedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 5: INGRESS TRAFFIC, DEVICES & BROWSERS
          ========================================================= */}
      <div className="analytics-section-title">
        <h4>
          <FontAwesomeIcon icon={faDesktop} style={{ color: "#38bdf8" }} /> Network Ingress & Client Environment
        </h4>
        <span className="telemetry-subtext">HTTP Gateway & Device Profiling</span>
      </div>

      <div className="analytics-grid-row-2">
        {/* Card 4A: 24h Traffic Timeline Chart + Method Breakdown */}
        <div className="telemetry-card glass-panel timeline-card">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faChartLine} /> 24-Hour Traffic & Request Timeline
              </h3>
              <span className="telemetry-subtext">Hourly distribution of incoming hits</span>
            </div>
            <span className="telemetry-tag tag-cyan">HOURLY TREND</span>
          </div>

          <div className="svg-chart-container">
            <svg className="traffic-svg-chart" viewBox="0 0 520 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cyberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.45" />
                  <stop offset="65%" stopColor="#0088ff" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#0088ff" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="20" y1="30" x2="500" y2="30" className="chart-grid-line" strokeDasharray="3 3" />
              <line x1="20" y1="75" x2="500" y2="75" className="chart-grid-line" strokeDasharray="3 3" />
              <line x1="20" y1="120" x2="500" y2="120" className="chart-grid-line" strokeDasharray="3 3" />
              <line x1="20" y1="150" x2="500" y2="150" className="chart-axis-line" />

              {(() => {
                const timeline = analyticsData?.hourlyTimeline || [];
                if (timeline.length === 0) return null;
                const maxHits = Math.max(1, ...timeline.map((t) => t.hits));
                const points = timeline.map((t, i) => {
                  const x = 30 + i * (460 / Math.max(1, timeline.length - 1));
                  const y = 140 - (t.hits / maxHits) * 110;
                  return { x, y, hit: t.hits, hour: t.hour, users: t.activeUsers };
                });

                const pathD = points.reduce(
                  (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                  ""
                );
                const areaD = `${pathD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

                return (
                  <>
                    <path d={areaD} fill="url(#cyberAreaGrad)" />
                    <path d={pathD} fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
                    {points.map((p, idx) => (
                      <g key={idx} className="chart-point-group">
                        <circle cx={p.x} cy={p.y} r="4" className="chart-dot-point" stroke="#00e5ff" strokeWidth="2" />
                        <title>{`${p.hour} - ${p.hit} hits (${p.users} active surfers)`}</title>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>

            <div className="chart-x-labels">
              {(analyticsData?.hourlyTimeline || [])
                .filter((_, i) => i % 2 === 0)
                .map((t) => (
                  <span key={t.hour} className="x-label">
                    {t.hour}
                  </span>
                ))}
            </div>
          </div>

          {/* HTTP Method Breakdown */}
          <div className="analytics-card-divider">
            <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #8494ad)", marginBottom: "6px" }}>
              HTTP Method Distribution (Mutations vs Queries)
            </div>
            {(() => {
              const mb = analyticsData?.methodBreakdown || { GET: 1, POST: 1 };
              const total = Object.values(mb).reduce((a, b) => a + b, 0) || 1;
              const getPct = (((mb.GET || 0) / total) * 100).toFixed(1);
              const postPct = (((mb.POST || 0) / total) * 100).toFixed(1);
              const putPct = (((mb.PUT || 0) / total) * 100).toFixed(1);
              const delPct = (((mb.DELETE || 0) / total) * 100).toFixed(1);

              return (
                <div className="method-bar-deck">
                  <div className="multi-segmented-bar">
                    <div className="segment seg-get" style={{ width: `${getPct}%` }} title={`GET: ${getPct}%`} />
                    <div className="segment seg-post" style={{ width: `${postPct}%` }} title={`POST: ${postPct}%`} />
                    <div className="segment seg-put" style={{ width: `${putPct}%` }} title={`PUT: ${putPct}%`} />
                    <div className="segment seg-delete" style={{ width: `${delPct}%` }} title={`DELETE: ${delPct}%`} />
                  </div>

                  <div className="method-chips-grid">
                    <div className="method-chip-item chip-get">
                      <span className="m-tag">GET</span>
                      <strong>{mb.GET || 0}</strong>
                      <small>({getPct}%)</small>
                    </div>
                    <div className="method-chip-item chip-post">
                      <span className="m-tag">POST</span>
                      <strong>{mb.POST || 0}</strong>
                      <small>({postPct}%)</small>
                    </div>
                    <div className="method-chip-item chip-put">
                      <span className="m-tag">PUT</span>
                      <strong>{mb.PUT || 0}</strong>
                      <small>({putPct}%)</small>
                    </div>
                    <div className="method-chip-item chip-del">
                      <span className="m-tag">DELETE</span>
                      <strong>{mb.DELETE || 0}</strong>
                      <small>({delPct}%)</small>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Card 4B: Device & Web Browser Breakdown */}
        <div className="telemetry-card glass-panel">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faGlobe} style={{ color: "#38bdf8" }} /> Device & Browser Intelligence
              </h3>
              <span className="telemetry-subtext">
                Real client platforms extracted from active sessions
              </span>
            </div>
            <span className="telemetry-tag tag-cyan">PLATFORM SPECS</span>
          </div>

          <div className="devices-row">
            <div className="device-chip-card">
              <FontAwesomeIcon icon={faDesktop} />
              <span className="d-name">Desktop</span>
              <span className="d-count">{deviceBreakdown.Desktop ?? 0}</span>
              <small style={{ fontSize: "0.66rem", color: "var(--text-muted, #64748b)" }}>
                {Math.round(((deviceBreakdown.Desktop || 0) / totalDevices) * 100)}%
              </small>
            </div>

            <div className="device-chip-card">
              <FontAwesomeIcon icon={faMobileScreen} />
              <span className="d-name">Mobile</span>
              <span className="d-count">{deviceBreakdown.Mobile ?? 0}</span>
              <small style={{ fontSize: "0.66rem", color: "var(--text-muted, #64748b)" }}>
                {Math.round(((deviceBreakdown.Mobile || 0) / totalDevices) * 100)}%
              </small>
            </div>

            <div className="device-chip-card">
              <FontAwesomeIcon icon={faDesktop} style={{ opacity: 0.6 }} />
              <span className="d-name">Tablet</span>
              <span className="d-count">{deviceBreakdown.Tablet ?? 0}</span>
              <small style={{ fontSize: "0.66rem", color: "var(--text-muted, #64748b)" }}>
                {Math.round(((deviceBreakdown.Tablet || 0) / totalDevices) * 100)}%
              </small>
            </div>
          </div>

          <div className="analytics-card-divider">
            <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #8494ad)", marginBottom: "8px" }}>
              Web Browser User Agents
            </div>
            {Object.keys(browserBreakdown).length === 0 ? (
              <div style={{ color: "var(--text-muted, #64748b)", fontSize: "0.8rem" }}>
                No browser fingerprinting data recorded yet.
              </div>
            ) : (
              <div className="browsers-pills-row">
                {Object.entries(browserBreakdown).map(([browser, count]) => (
                  <div key={browser} className="browser-pill-chip">
                    <span>{browser}:</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 5: PAGE POPULARITY & ORIGIN IP DISTRIBUTION
          ========================================================= */}
      <div className="analytics-section-title">
        <h4>
          <FontAwesomeIcon icon={faGlobe} style={{ color: "#00e5ff" }} /> Platform Routes & Ingress IP Telemetry
        </h4>
        <span className="telemetry-subtext">Origin Node Records</span>
      </div>

      <div className="analytics-grid-row-2 telemetry-routes-grid">
        {/* Card 5A: Top Platform Routes Visited */}
        <div className="telemetry-card glass-panel top-routes-card">
          <div className="card-header">
            <div>
              <h3>Top Platform Routes Visited</h3>
              <span className="telemetry-subtext">Highest traffic endpoints & views</span>
            </div>
            <span className="telemetry-tag tag-cyan">PAGE POPULARITY</span>
          </div>

          <div className="top-routes-list">
            {(!analyticsData?.topPages || analyticsData.topPages.length === 0) ? (
              <div style={{ color: "var(--text-secondary, #8494ad)", padding: "20px", textAlign: "center", fontSize: "0.85rem" }}>
                No routes visited yet. Live traffic will appear here.
              </div>
            ) : (
              (analyticsData?.topPages || []).map((r, i) => (
                <div key={r.path || i} className="route-stat-item">
                  <div className="route-item-head">
                    <span className="route-rank">#{i + 1}</span>
                    <code className="route-path">{r.path}</code>
                    <span className="route-hits">{r.hits} hits</span>
                  </div>
                  <div className="route-progress-track">
                    <div
                      className="route-progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          (r.hits / Math.max(1, analyticsData?.totalPageViews || 1)) * 100 * 3
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 5B: Top Origin Client IPs */}
        <div className="telemetry-card glass-panel ip-origins-card">
          <div className="card-header">
            <div>
              <h3>
                <FontAwesomeIcon icon={faGlobe} /> Client Origin IP Distribution
              </h3>
              <span className="telemetry-subtext">
                Active remote IP addresses surfing managed nodes
              </span>
            </div>
            <span className="telemetry-tag tag-cyan">ORIGIN TELEMETRY</span>
          </div>

          <div className="ip-origins-table-wrap">
            <table className="ip-origins-table">
              <thead>
                <tr>
                  <th>Origin IP</th>
                  <th>Hits</th>
                  <th>Top Route</th>
                  <th>Combatant</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(!analyticsData?.topIpOrigins || analyticsData.topIpOrigins.length === 0) ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "28px", color: "var(--text-secondary, #8494ad)", fontSize: "0.85rem" }}>
                      No origin client IP activity recorded yet. Live telemetry will populate automatically.
                    </td>
                  </tr>
                ) : (
                  analyticsData?.topIpOrigins?.map((rec) => (
                    <tr key={rec.ip}>
                      <td>
                        <span
                          className={`ip-chip ${rec.ip === "127.0.0.1" ? "ip-local" : "ip-remote"}`}
                          onClick={(e) => handleCopyIp(rec.ip, e)}
                          title="Click to copy IP"
                        >
                          <FontAwesomeIcon icon={faGlobe} /> {rec.ip}
                          {copiedIp === rec.ip && (
                            <span className="copied-tag">
                              <FontAwesomeIcon icon={faCheck} />
                            </span>
                          )}
                        </span>
                      </td>
                      <td>
                        <strong className="cyan-text">{rec.totalRequests}</strong>
                      </td>
                      <td>
                        <code>{rec.topPath}</code>
                      </td>
                      <td>
                        {rec.username ? (
                          <strong className="green-text">
                            <FontAwesomeIcon icon={faUser} /> {rec.username}
                          </strong>
                        ) : (
                          <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Guest</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="inspect-ip-btn"
                          onClick={(e) => (handleFilterByIp ? handleFilterByIp(rec.ip, e) : handleCopyIp(rec.ip, e))}
                          title="Inspect events for this IP in Audit Stream"
                        >
                          <FontAwesomeIcon icon={faMagnifyingGlass} /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
