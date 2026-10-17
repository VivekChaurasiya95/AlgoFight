import { RANK_TIERS as OFFICIAL_RANK_TIERS, getRankTier } from "../components/Common/gamification/RankEmblem";

export const RANK_TIERS = OFFICIAL_RANK_TIERS.map((t) => ({
  name: t.name,
  label: t.name,
  key: t.key,
  minRating: t.minRating,
  maxRating: t.maxRating,
  color: t.color,
  gradient: t.gradient,
  glowColor: t.glowColor,
  description: t.description,
}));

export function deriveRank(rating) {
  const tier = getRankTier(rating);
  return tier.name;
}

export function normalizeUserStats(profile = {}) {
  const rating = Math.max(0, Number(profile?.rating ?? 0));
  const matchesPlayed = Number(profile?.matchesPlayed ?? 0);
  const matchesWon = Number(profile?.matchesWon ?? (profile?.wins ?? 0));

  const solvedFromIds = Array.isArray(profile?.practiceSolvedProblemIds)
    ? profile.practiceSolvedProblemIds.length
    : 0;

  const practiceSolved = Number(profile?.practiceSolvedCount ?? solvedFromIds);
  const practiceSubmissions = Number(profile?.practiceSubmissionCount ?? 0);

  const lossCount = Math.max(0, matchesPlayed - matchesWon);
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
  const practiceAccuracy =
    practiceSubmissions > 0 ? Math.round((practiceSolved / practiceSubmissions) * 100) : 0;

  const tier = getRankTier(rating);

  const arenaPoints = Math.max(0, Number(profile?.arenaPoints ?? 0));

  const currentStreak = Number(profile?.currentStreak ?? 0);
  const longestStreak = Number(profile?.longestStreak ?? currentStreak);
  const solvedToday = Boolean(profile?.solvedToday);
  const todaySolvedCount = Number(profile?.todaySolvedCount ?? 0);
  const streakDates = Array.isArray(profile?.streakDates) ? profile.streakDates : [];

  return {
    rating,
    arenaPoints,
    matchesPlayed,
    matchesWon,
    lossCount,
    practiceSolved,
    practiceSubmissions,
    winRate,
    practiceAccuracy,
    currentStreak,
    longestStreak,
    solvedToday,
    todaySolvedCount,
    streakDates,
    rank: tier.name,
    rankKey: tier.key,
    rankTier: tier,
    highestRating: Math.max(rating, Number(profile?.highestRating ?? rating)),
    highestRank: profile?.highestRank || tier.key,
    ewma: Number(profile?.ewma ?? 0.5),
  };
}

/**
 * Returns date formatted as YYYY-MM-DD in India Standard Time (Asia/Kolkata).
 */
export function getISTDateString(d = new Date()) {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateObj);
}

/**
 * Shifts an IST date string by delta days.
 */
export function getShiftedISTDate(baseDateStr, dayDelta) {
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  utcDate.setUTCDate(utcDate.getUTCDate() + dayDelta);
  return utcDate.toISOString().split("T")[0];
}

/**
 * Returns remaining time until next 12:00 AM IST (daily streak boundary).
 */
export function getTimeUntilNextISTMidnight() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffsetMs);
  
  const nextMidnightIST = new Date(istNow);
  nextMidnightIST.setHours(24, 0, 0, 0);
  
  const diffMs = Math.max(0, nextMidnightIST.getTime() - istNow.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export const UNIVERSAL_EFFICIENCY_RULES = [
  {
    title: "⚡ Rapid Solver Multiplier (< 50% Allotted Time)",
    description: "Finishing a battle or challenge in less than half the time limit awards a +35% to +50% point surge.",
    multiplier: "Up to +50 Pts / Match",
    type: "Speed"
  },
  {
    title: "🧠 Optimal Complexity & Memory Efficiency",
    description: "Submissions that achieve sub-100ms sandboxed execution or top-tier memory percentiles receive an algorithmic efficiency bonus.",
    multiplier: "+30 Pts Bonus",
    type: "Efficiency"
  },
  {
    title: "🎯 Flawless First-Attempt Pass",
    description: "Passing 100% of test suites on the very first submission with zero runtime errors unlocks a perfection bonus.",
    multiplier: "+25 Pts Bonus",
    type: "Accuracy"
  }
];

export function calculateArenaPointBreakdown(stats) {
  const safeStats = normalizeUserStats(stats);

  const ratingPoints = safeStats.rating;
  const battleWinPoints = safeStats.matchesWon * 120;
  const speedEfficiencyPoints = Math.round(safeStats.matchesWon * 35 + safeStats.practiceSolved * 15);
  const practiceSolvedPoints = safeStats.practiceSolved * 50;
  const participationPoints = safeStats.lossCount * 20;

  const computedTotal = ratingPoints + battleWinPoints + speedEfficiencyPoints + practiceSolvedPoints + participationPoints;
  const total = safeStats.arenaPoints > 0 ? safeStats.arenaPoints : computedTotal;

  return {
    total,
    ratingPoints,
    battleWinPoints,
    speedEfficiencyPoints,
    practiceSolvedPoints,
    participationPoints,
  };
}

export function getRankProgressByRating(rating) {
  const score = Math.max(0, Number(rating) || 0);
  const currentTierIndex = RANK_TIERS.reduce((bestIndex, tier, index) => {
    if (score >= tier.minRating) return index;
    return bestIndex;
  }, 0);

  const currentTier = RANK_TIERS[currentTierIndex];
  const nextTier = RANK_TIERS[currentTierIndex + 1] || currentTier;

  const isMaxTier = currentTierIndex === RANK_TIERS.length - 1;

  const progressWithinTier = isMaxTier
    ? 100
    : Math.min(
        100,
        Math.max(
          0,
          ((score - currentTier.minRating) / (nextTier.minRating - currentTier.minRating)) * 100
        )
      );

  const progressToNext = isMaxTier
    ? 100
    : Math.min(100, Math.max(0, (score / nextTier.minRating) * 100));

  const ratingToNextTier = isMaxTier ? 0 : Math.max(0, nextTier.minRating - score);

  return {
    currentTier,
    nextTier,
    currentTierIndex,
    progressToNext,
    progressWithinTier,
    ratingToNextTier,
    isMaxTier,
  };
}
