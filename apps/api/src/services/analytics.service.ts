// apps/api/src/services/analytics.service.ts
import { normalizeIp, normalizeMethod } from "../utils/ip.util";
import { auditService } from "./audit.service";
import { prisma } from "@algofight/database";

export interface ActiveSession {
    sessionId: string;
    ip: string;
    userId?: string;
    username?: string;
    currentPath: string;
    currentTitle?: string;
    device: "Desktop" | "Mobile" | "Tablet";
    browser: string;
    startTime: number;
    lastActive: number;
    totalDwellSeconds: number;
}

export interface PageStat {
    path: string;
    title: string;
    hits: number;
    uniqueIps: Set<string>;
    totalDurationSeconds: number;
    lastHit: number;
}

export interface IpTrafficRecord {
    ip: string;
    totalRequests: number;
    methods: Record<string, number>;
    paths: Record<string, number>;
    lastSeen: number;
    userAgent?: string;
    username?: string;
}

export interface HourlyBucket {
    hour: string;
    hits: number;
    activeUsers: number;
}

export interface AnalyticsSnapshot {
    activeUsersNow: number;
    authenticatedUsers: number;
    guestUsers: number;
    peakUsers24h: number;
    totalPageViews: number;
    totalSessions: number;
    avgSurfingSeconds: number;
    avgSurfingFormatted: string;
    topPages: Array<{
        path: string;
        title: string;
        hits: number;
        percentage: number;
        uniqueIpsCount: number;
        avgSurfingSeconds: number;
        avgSurfingFormatted: string;
        lastHit: string;
    }>;
    methodBreakdown: Record<string, number>;
    topIpOrigins: Array<{
        ip: string;
        totalRequests: number;
        primaryMethod: string;
        topPath: string;
        lastSeen: string;
        username?: string;
    }>;
    hourlyTimeline: HourlyBucket[];
    deviceBreakdown: Record<string, number>;
    browserBreakdown: Record<string, number>;

    // Real Application Evaluation & Competitive Battle Analytics
    submissionMetrics: {
        totalSubmissions: number;
        acceptanceRate: number;
        verdictBreakdown: Array<{
            verdict: string;
            label: string;
            count: number;
            percentage: number;
            color: string;
        }>;
        languageBreakdown: Array<{
            language: string;
            count: number;
            percentage: number;
            color: string;
        }>;
    };
    battleMetrics: {
        totalRooms: number;
        totalParticipants: number;
        statusBreakdown: Array<{
            status: string;
            count: number;
            percentage: number;
        }>;
        modeBreakdown: Array<{
            mode: string;
            label: string;
            count: number;
            percentage: number;
        }>;
    };
    problemMetrics: {
        totalProblems: number;
        difficultyBreakdown: Array<{
            difficulty: string;
            count: number;
            percentage: number;
            color: string;
        }>;
    };
    userMetrics: {
        totalUsers: number;
        userTypeBreakdown: Array<{
            type: string;
            count: number;
            percentage: number;
        }>;
        tierDistribution: Array<{
            key?: string;
            tier: string;
            range: string;
            count: number;
            percentage: number;
            color: string;
        }>;
    };

    recentSessions: Array<{
        sessionId: string;
        ip: string;
        currentPath: string;
        surfingDurationFormatted: string;
        device: string;
        browser: string;
        lastActiveAgoSeconds: number;
        isAuthenticated: boolean;
        username?: string;
    }>;
    recentLogs: Array<{
        id: string;
        timestamp: string;
        category: string;
        severity: string;
        action: string;
        actor: string;
        details: string;
        ip?: string;
        method?: string;
        metadata?: any;
    }>;
}

export class AnalyticsService {
    private static instance: AnalyticsService;

    // Strict safety limits to prevent memory exhaustion (DoS / OOM protection)
    private static readonly MAX_SESSIONS = 500;
    private static readonly MAX_TRACKED_IPS = 200;
    private static readonly MAX_TRACKED_PATHS = 100;
    private static readonly ACTIVE_WINDOW_MS = 3 * 60 * 1000; // 3 minutes for live active user status

    private readonly sessions = new Map<string, ActiveSession>();
    private readonly pageStats = new Map<string, PageStat>();
    private readonly ipRecords = new Map<string, IpTrafficRecord>();
    private readonly methodCounters: Record<string, number> = {
        GET: 0,
        POST: 0,
        PUT: 0,
        DELETE: 0,
        PATCH: 0,
    };
    private readonly hourlyBuckets = new Map<string, { hits: number; users: Set<string> }>();

    private totalPageViewsCount = 0;
    private totalSessionsCount = 0;
    private cumulativeDwellSeconds = 0;
    private peakActiveUsers = 1;

    private constructor() {
        this.seedBaselineTelemetry();
    }

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    /**
     * Record a page navigation or heartbeat beacon from the client
     */
    public recordPageVisit(params: {
        sessionId: string;
        ip: string;
        path: string;
        title?: string;
        durationOnPrevious?: number;
        referrer?: string;
        userAgent?: string;
        user?: { id?: string; username?: string };
    }): void {
        try {
            const now = Date.now();
            const cleanIp = normalizeIp(params.ip || "127.0.0.1");
            const rawPath = (params.path || "/").trim();
            const cleanPath = rawPath.startsWith("/") ? rawPath.slice(0, 80) : `/${rawPath.slice(0, 80)}`;
            const cleanSessionId = (params.sessionId || `anon_${cleanIp}_${now}`).slice(0, 64);
            const duration = Math.min(3600, Math.max(0, Math.round(params.durationOnPrevious || 0)));

            // Infer device & browser safely
            const ua = (params.userAgent || "").toLowerCase();
            let device: "Desktop" | "Mobile" | "Tablet" = "Desktop";
            if (/tablet|ipad|playbook|silk/i.test(ua)) device = "Tablet";
            else if (/mobile|iphone|android|touch/i.test(ua)) device = "Mobile";

            let browser = "Chrome";
            if (/edg\//i.test(ua)) browser = "Edge";
            else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
            else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
            else if (/opera|opr\//i.test(ua)) browser = "Opera";

            // 1. Session Management
            let session = this.sessions.get(cleanSessionId);
            if (!session) {
                if (this.sessions.size >= AnalyticsService.MAX_SESSIONS) {
                    // Evict oldest session
                    let oldestId = "";
                    let oldestTime = Infinity;
                    for (const [sId, s] of this.sessions.entries()) {
                        if (s.lastActive < oldestTime) {
                            oldestTime = s.lastActive;
                            oldestId = sId;
                        }
                    }
                    if (oldestId) this.sessions.delete(oldestId);
                }

                session = {
                    sessionId: cleanSessionId,
                    ip: cleanIp,
                    userId: params.user?.id,
                    username: params.user?.username,
                    currentPath: cleanPath,
                    currentTitle: params.title || cleanPath,
                    device,
                    browser,
                    startTime: now,
                    lastActive: now,
                    totalDwellSeconds: 0,
                };
                this.sessions.set(cleanSessionId, session);
                this.totalSessionsCount++;
            } else {
                session.ip = cleanIp;
                session.lastActive = now;
                session.currentPath = cleanPath;
                if (params.title) session.currentTitle = params.title;
                if (params.user?.username) session.username = params.user.username;
                if (duration > 0) {
                    session.totalDwellSeconds += duration;
                    this.cumulativeDwellSeconds += duration;
                }
            }

            // 2. Page Statistics
            this.totalPageViewsCount++;
            let pStat = this.pageStats.get(cleanPath);
            if (!pStat) {
                if (this.pageStats.size >= AnalyticsService.MAX_TRACKED_PATHS) {
                    // Evict least hit path
                    let minHits = Infinity;
                    let minPath = "";
                    for (const [p, stat] of this.pageStats.entries()) {
                        if (stat.hits < minHits) {
                            minHits = stat.hits;
                            minPath = p;
                        }
                    }
                    if (minPath) this.pageStats.delete(minPath);
                }

                pStat = {
                    path: cleanPath,
                    title: params.title || this.getRouteLabel(cleanPath),
                    hits: 0,
                    uniqueIps: new Set<string>(),
                    totalDurationSeconds: 0,
                    lastHit: now,
                };
                this.pageStats.set(cleanPath, pStat);
            }

            pStat.hits++;
            pStat.lastHit = now;
            if (pStat.uniqueIps.size < 500) {
                pStat.uniqueIps.add(cleanIp);
            }
            if (duration > 0) {
                pStat.totalDurationSeconds += duration;
            }

            // 3. Hourly Bucket
            const hourKey = new Date(now).toISOString().slice(11, 13) + ":00";
            let hBucket = this.hourlyBuckets.get(hourKey);
            if (!hBucket) {
                hBucket = { hits: 0, users: new Set<string>() };
                this.hourlyBuckets.set(hourKey, hBucket);
            }
            hBucket.hits++;
            if (hBucket.users.size < 500) {
                hBucket.users.add(cleanSessionId);
            }

            // 4. IP Tracking
            this.recordIpActivity(cleanIp, "POST", cleanPath, params.userAgent, params.user?.username);

            // Update peak concurrency
            const currentActive = this.getActiveUsersCount();
            if (currentActive > this.peakActiveUsers) {
                this.peakActiveUsers = currentActive;
            }
        } catch {
            // Non-blocking telemetry isolation
        }
    }

    /**
     * Record general incoming HTTP traffic from the Gateway
     */
    public recordHttpRequest(params: {
        ip: string;
        method: string;
        path: string;
        statusCode?: number;
        userAgent?: string;
        username?: string;
    }): void {
        try {
            const cleanIp = normalizeIp(params.ip || "127.0.0.1");
            const method = normalizeMethod(params.method);
            const path = (params.path || "/").split("?")[0].slice(0, 80);

            // Increment method counter
            this.methodCounters[method] = (this.methodCounters[method] || 0) + 1;

            // Record IP details
            this.recordIpActivity(cleanIp, method, path, params.userAgent, params.username);
        } catch {
            // Fail-safe
        }
    }

    private recordIpActivity(ip: string, method: string, path: string, ua?: string, username?: string): void {
        const now = Date.now();
        let record = this.ipRecords.get(ip);
        if (!record) {
            if (this.ipRecords.size >= AnalyticsService.MAX_TRACKED_IPS) {
                // Evict oldest IP
                let oldestIp = "";
                let oldestTime = Infinity;
                for (const [k, v] of this.ipRecords.entries()) {
                    if (v.lastSeen < oldestTime) {
                        oldestTime = v.lastSeen;
                        oldestIp = k;
                    }
                }
                if (oldestIp) this.ipRecords.delete(oldestIp);
            }

            record = {
                ip,
                totalRequests: 0,
                methods: {},
                paths: {},
                lastSeen: now,
                userAgent: ua,
                username,
            };
            this.ipRecords.set(ip, record);
        }

        record.totalRequests++;
        record.lastSeen = now;
        record.methods[method] = (record.methods[method] || 0) + 1;
        record.paths[path] = (record.paths[path] || 0) + 1;
        if (username) record.username = username;
    }

    /**
     * Return count of active concurrent sessions in the sliding window
     */
    public getActiveUsersCount(): number {
        const cutoff = Date.now() - AnalyticsService.ACTIVE_WINDOW_MS;
        let count = 0;
        for (const session of this.sessions.values()) {
            if (session.lastActive >= cutoff) count++;
        }
        return count;
    }

    /**
     * Build unified, statistical snapshot for the Control Hub UI with real database analytics
     */
    public async getSnapshot(): Promise<AnalyticsSnapshot> {
        const now = Date.now();
        const cutoff = now - AnalyticsService.ACTIVE_WINDOW_MS;

        // Active sessions
        let activeCount = 0;
        let authCount = 0;
        let guestCount = 0;
        const recentSessions: AnalyticsSnapshot["recentSessions"] = [];

        // Dynamic Device & Browser Aggregators
        const deviceBreakdown: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
        const browserBreakdown: Record<string, number> = {};

        for (const s of this.sessions.values()) {
            const isLive = s.lastActive >= cutoff;
            const isAuthenticated = Boolean(s.username || s.userId);

            if (isLive) {
                activeCount++;
                if (isAuthenticated) authCount++;
                else guestCount++;
            }

            if (s.device) {
                deviceBreakdown[s.device] = (deviceBreakdown[s.device] || 0) + 1;
            }
            if (s.browser) {
                browserBreakdown[s.browser] = (browserBreakdown[s.browser] || 0) + 1;
            }

            // Only include authenticated sessions as requested
            if (isAuthenticated) {
                recentSessions.push({
                    sessionId: s.sessionId.slice(0, 14) + "...",
                    ip: s.ip,
                    currentPath: s.currentPath,
                    surfingDurationFormatted: this.formatDuration(s.totalDwellSeconds),
                    device: s.device,
                    browser: s.browser,
                    lastActiveAgoSeconds: Math.max(0, Math.floor((now - s.lastActive) / 1000)),
                    isAuthenticated: true,
                    username: s.username,
                });
            }
        }

        // Sort sessions by recency
        recentSessions.sort((a, b) => a.lastActiveAgoSeconds - b.lastActiveAgoSeconds);

        // Calculate Average Surfing Duration
        const avgSeconds = this.totalSessionsCount > 0
            ? Math.round(this.cumulativeDwellSeconds / this.totalSessionsCount)
            : 420;

        // Top Pages
        const topPages = Array.from(this.pageStats.values())
            .map((p) => {
                const avgPageTime = p.hits > 0 ? Math.round(p.totalDurationSeconds / p.hits) : 60;
                return {
                    path: p.path,
                    title: p.title || this.getRouteLabel(p.path),
                    hits: p.hits,
                    percentage: this.totalPageViewsCount > 0 ? Number(((p.hits / this.totalPageViewsCount) * 100).toFixed(1)) : 0,
                    uniqueIpsCount: Math.max(1, p.uniqueIps.size),
                    avgSurfingSeconds: avgPageTime,
                    avgSurfingFormatted: this.formatDuration(avgPageTime),
                    lastHit: new Date(p.lastHit).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                };
            })
            .sort((a, b) => b.hits - a.hits)
            .slice(0, 10);

        // Top IP origins (Sorted by request volume)
        const topIpOrigins = Array.from(this.ipRecords.values())
            .map((rec) => {
                let primaryMethod = "GET";
                let maxMCount = 0;
                for (const [m, c] of Object.entries(rec.methods)) {
                    if (c > maxMCount) {
                        maxMCount = c;
                        primaryMethod = m;
                    }
                }

                let topPath = "/";
                let maxPCount = 0;
                for (const [p, c] of Object.entries(rec.paths)) {
                    if (c > maxPCount) {
                        maxPCount = c;
                        topPath = p;
                    }
                }

                return {
                    ip: rec.ip,
                    totalRequests: rec.totalRequests,
                    primaryMethod,
                    topPath,
                    lastSeen: new Date(rec.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                    username: rec.username,
                };
            })
            .sort((a, b) => b.totalRequests - a.totalRequests)
            .slice(0, 10);

        // Hourly Timeline (Last 12 hours)
        const hourlyTimeline: HourlyBucket[] = [];
        const currentHour = new Date(now).getHours();
        for (let i = 11; i >= 0; i--) {
            const h = (currentHour - i + 24) % 24;
            const hourStr = `${String(h).padStart(2, "0")}:00`;
            const bucket = this.hourlyBuckets.get(hourStr);
            hourlyTimeline.push({
                hour: hourStr,
                hits: bucket ? bucket.hits : 0,
                activeUsers: bucket ? bucket.users.size : 0,
            });
        }

        // ==========================================
        // REAL APPLICATION DATABASE METRICS (PostgreSQL)
        // ==========================================
        const [
            totalSubmissions,
            submissionsByVerdict,
            submissionsByLanguage,
            totalRooms,
            totalParticipants,
            roomsByStatus,
            roomsByMode,
            totalProblems,
            problemsByDifficulty,
            totalUsers,
            usersByType,
            userRatings,
        ] = await Promise.all([
            prisma.submission.count().catch(() => 0),
            prisma.submission.groupBy({
                by: ["verdict"],
                _count: { verdict: true },
            }).catch(() => []),
            prisma.submission.groupBy({
                by: ["language"],
                _count: { language: true },
            }).catch(() => []),
            prisma.battleRoom.count().catch(() => 0),
            prisma.battleParticipant.count().catch(() => 0),
            prisma.battleRoom.groupBy({
                by: ["status"],
                _count: { status: true },
            }).catch(() => []),
            prisma.battleRoom.groupBy({
                by: ["battleMode"],
                _count: { battleMode: true },
            }).catch(() => []),
            prisma.problem.count().catch(() => 0),
            prisma.problem.groupBy({
                by: ["difficulty"],
                _count: { difficulty: true },
            }).catch(() => []),
            prisma.user.count().catch(() => 0),
            prisma.user.groupBy({
                by: ["userType"],
                _count: { userType: true },
            }).catch(() => []),
            prisma.user.findMany({
                select: { rating: true },
            }).catch(() => []),
        ]);

        // 1. Verdict Breakdown
        const verdictLabels: Record<string, { label: string; color: string }> = {
            ACCEPTED: { label: "Accepted (AC)", color: "#10b981" },
            WRONG_ANSWER: { label: "Wrong Answer (WA)", color: "#ef4444" },
            TIME_LIMIT_EXCEEDED: { label: "Time Limit (TLE)", color: "#f59e0b" },
            MEMORY_LIMIT_EXCEEDED: { label: "Memory Limit (MLE)", color: "#ec4899" },
            COMPILATION_ERROR: { label: "Compile Error (CE)", color: "#8b5cf6" },
            RUNTIME_ERROR: { label: "Runtime Error (RTE)", color: "#f97316" },
            SYSTEM_ERROR: { label: "System Error", color: "#64748b" },
        };

        let acceptedCount = 0;
        const verdictBreakdown = (submissionsByVerdict as any[]).map((row) => {
            const vKey = row.verdict || "UNKNOWN";
            const cnt = row._count?.verdict || 0;
            if (vKey === "ACCEPTED") acceptedCount += cnt;
            const meta = verdictLabels[vKey] || { label: vKey, color: "#94a3b8" };
            return {
                verdict: vKey,
                label: meta.label,
                count: cnt,
                percentage: totalSubmissions > 0 ? Number(((cnt / totalSubmissions) * 100).toFixed(1)) : 0,
                color: meta.color,
            };
        }).sort((a, b) => b.count - a.count);

        const acceptanceRate = totalSubmissions > 0
            ? Number(((acceptedCount / totalSubmissions) * 100).toFixed(1))
            : 0;

        // 2. Language Breakdown
        const langColors: Record<string, string> = {
            python: "#3b82f6",
            cpp: "#00e5ff",
            c: "#0284c7",
            java: "#f59e0b",
            javascript: "#eab308",
            typescript: "#38bdf8",
            go: "#06b6d4",
            rust: "#ea580c",
        };

        const languageBreakdown = (submissionsByLanguage as any[]).map((row) => {
            const lKey = (row.language || "other").toLowerCase();
            const cnt = row._count?.language || 0;
            return {
                language: lKey,
                count: cnt,
                percentage: totalSubmissions > 0 ? Number(((cnt / totalSubmissions) * 100).toFixed(1)) : 0,
                color: langColors[lKey] || "#8b5cf6",
            };
        }).sort((a, b) => b.count - a.count);

        // 3. Battle Modes & Status Breakdown
        const modeLabels: Record<string, string> = {
            DUEL_1V1: "1v1 Duel",
            SQUAD_BATTLE: "Squad Battle",
            PRACTICE_SOLO: "Solo Sparring",
        };
        const battleModeBreakdown = (roomsByMode as any[]).map((row) => {
            const mKey = row.battleMode || "DUEL_1V1";
            const cnt = row._count?.battleMode || 0;
            return {
                mode: mKey,
                label: modeLabels[mKey] || mKey,
                count: cnt,
                percentage: totalRooms > 0 ? Number(((cnt / totalRooms) * 100).toFixed(1)) : 0,
            };
        }).sort((a, b) => b.count - a.count);

        const battleStatusBreakdown = (roomsByStatus as any[]).map((row) => {
            const sKey = row.status || "UNKNOWN";
            const cnt = row._count?.status || 0;
            return {
                status: sKey,
                count: cnt,
                percentage: totalRooms > 0 ? Number(((cnt / totalRooms) * 100).toFixed(1)) : 0,
            };
        }).sort((a, b) => b.count - a.count);

        // 4. Problem Difficulties Breakdown
        const diffColors: Record<string, string> = {
            EASY: "#10b981",
            MEDIUM: "#f59e0b",
            HARD: "#ef4444",
        };
        const problemDifficultyBreakdown = (problemsByDifficulty as any[]).map((row) => {
            const dKey = row.difficulty || "MEDIUM";
            const cnt = row._count?.difficulty || 0;
            return {
                difficulty: dKey,
                count: cnt,
                percentage: totalProblems > 0 ? Number(((cnt / totalProblems) * 100).toFixed(1)) : 0,
                color: diffColors[dKey] || "#94a3b8",
            };
        }).sort((a, b) => {
            const order: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };
            return (order[a.difficulty] || 99) - (order[b.difficulty] || 99);
        });

        // 5. User Types Breakdown
        const userTypeBreakdown = (usersByType as any[]).map((row) => {
            const tKey = row.userType || "INDIVIDUAL";
            const cnt = row._count?.userType || 0;
            return {
                type: tKey,
                count: cnt,
                percentage: totalUsers > 0 ? Number(((cnt / totalUsers) * 100).toFixed(1)) : 0,
            };
        }).sort((a, b) => b.count - a.count);

        // 6. ELO Rating Tier Distribution (Based on authoritative RANK_TIERS)
        const tierBuckets = [
            { key: "ROOKIE", tier: "Rookie", range: "0 - 399", min: -Infinity, max: 399, count: 0, color: "#94a3b8" },
            { key: "EXPERT", tier: "Expert", range: "400 - 799", min: 400, max: 799, count: 0, color: "#06b6d4" },
            { key: "MASTER", tier: "Master", range: "800 - 1199", min: 800, max: 1199, count: 0, color: "#a855f7" },
            { key: "GRANDMASTER", tier: "Grandmaster", range: "1200 - 1599", min: 1200, max: 1599, count: 0, color: "#ef4444" },
            { key: "LEGEND", tier: "Legend", range: "1600 - 1999", min: 1600, max: 1999, count: 0, color: "#f59e0b" },
            { key: "SUPREME", tier: "Supreme", range: "2000+", min: 2000, max: Infinity, count: 0, color: "#ec4899" },
        ];

        for (const u of (userRatings as any[])) {
            const r = typeof u.rating === "number" ? u.rating : 0;
            const b = tierBuckets.find((tb) => r >= tb.min && r <= tb.max) || tierBuckets[0];
            if (b) b.count++;
        }

        const tierDistribution = tierBuckets.map((b) => ({
            key: b.key,
            tier: b.tier,
            range: b.range,
            count: b.count,
            percentage: totalUsers > 0 ? Number(((b.count / totalUsers) * 100).toFixed(1)) : 0,
            color: b.color,
        }));

        return {
            activeUsersNow: activeCount,
            authenticatedUsers: authCount,
            guestUsers: guestCount,
            peakUsers24h: Math.max(this.peakActiveUsers, activeCount),
            totalPageViews: this.totalPageViewsCount,
            totalSessions: this.totalSessionsCount,
            avgSurfingSeconds: avgSeconds,
            avgSurfingFormatted: this.formatDuration(avgSeconds),
            topPages,
            methodBreakdown: { ...this.methodCounters },
            topIpOrigins,
            hourlyTimeline,
            deviceBreakdown,
            browserBreakdown,
            submissionMetrics: {
                totalSubmissions,
                acceptanceRate,
                verdictBreakdown,
                languageBreakdown,
            },
            battleMetrics: {
                totalRooms,
                totalParticipants,
                statusBreakdown: battleStatusBreakdown,
                modeBreakdown: battleModeBreakdown,
            },
            problemMetrics: {
                totalProblems,
                difficultyBreakdown: problemDifficultyBreakdown,
            },
            userMetrics: {
                totalUsers,
                userTypeBreakdown,
                tierDistribution,
            },
            recentSessions: recentSessions.slice(0, 8),
            recentLogs: auditService.getRecentLogs(80),
        };
    }

    private formatDuration(seconds: number): string {
        const s = Math.max(0, Math.round(seconds));
        if (s < 60) return `${s}s`;
        const mins = Math.floor(s / 60);
        const remSecs = s % 60;
        if (mins < 60) return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs}h ${remMins}m`;
    }

    private getRouteLabel(path: string): string {
        if (path === "/" || path === "") return "Landing Page";
        if (path.startsWith("/home")) return "Combatant Dashboard (Home)";
        if (path.startsWith("/battle/room")) return "Live Battle Room";
        if (path.startsWith("/battle")) return "Battle Arena & Matchmaking";
        if (path.startsWith("/practice/")) return "Practice Workspace (IDE)";
        if (path.startsWith("/practice")) return "Practice Problems Library";
        if (path.startsWith("/leaderboard")) return "Global Hall of Fame";
        if (path.startsWith("/profile")) return "Combatant Dossier & Profile";
        if (path.startsWith("/admin")) return "Central Control Hub";
        if (path.startsWith("/login")) return "Combatant Access Gateway";
        if (path.startsWith("/signup")) return "Combatant Registration";
        if (path.startsWith("/rewards")) return "Season Rewards & Badges";
        if (path.startsWith("/about")) return "About AlgoFight";
        if (path.startsWith("/blog")) return "Dev Blog & Changelog";
        return path;
    }

    /**
     * Seeds initial telemetry distribution so statistics are immediately rich, logical,
     * and visual upon launching the Control Hub without requiring days of production traffic.
     */
    private seedBaselineTelemetry(): void {
        // Seeding removed as per user request to only show authenticated/real content.
    }
}

export const analyticsService = AnalyticsService.getInstance();
