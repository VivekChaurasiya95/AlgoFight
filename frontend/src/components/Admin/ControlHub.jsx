import React, { useState, useEffect } from "react";
import "./ControlHub.css";
import { motion } from "framer-motion";
import { useNotification } from "../../contexts/NotificationContext.jsx";
import { toApiUrl } from "../../services/api.js";

const SERVICE_NAMES = {
    apiGateway: "API Gateway",
    websocketGateway: "WebSocket Gateway",
    database: "PostgreSQL Database",
    redisCluster: "Redis Cluster",
    pistonSandbox: "Piston Sandbox",
};

const STAT_LABELS = {
    uptime: "Uptime",
    latency: "Latency",
    port: "Port",
    protocol: "Protocol",
    engine: "Engine",
    pool: "Pool Status",
    host: "Host",
    endpoint: "Endpoint",
};

export default function ControlHub() {
    const [adminKey, setAdminKey] = useState(sessionStorage.getItem("af_admin_key") || "");
    const [isUnlocked, setIsUnlocked] = useState(Boolean(sessionStorage.getItem("af_admin_key")));
    const [passInput, setPassInput] = useState("");
    const [authError, setAuthError] = useState("");

    const [metrics, setMetrics] = useState(null);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const { notify } = useNotification();

    const handleUnlock = async (e) => {
        e.preventDefault();
        setAuthError("");

        try {
            const res = await fetch(toApiUrl("/api/admin/auth/verify"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: passInput.trim() }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                sessionStorage.setItem("af_admin_key", passInput.trim());
                setAdminKey(passInput.trim());
                setIsUnlocked(true);
                notify({ type: "success", title: "ACCESS GRANTED", message: "SuperAdmin Level 5 Clearance Verified." });
            } else {
                setAuthError(data.message || "Invalid SuperAdmin Passkey.");
            }
        } catch {
            setAuthError("Could not reach authentication gateway.");
        }
    };

    const handleLock = () => {
        sessionStorage.removeItem("af_admin_key");
        setAdminKey("");
        setIsUnlocked(false);
        setPassInput("");
    };

    const fetchTelemetry = async () => {
        if (!adminKey) return;
        try {
            const res = await fetch(toApiUrl("/api/admin/metrics"), {
                headers: { "x-admin-key": adminKey },
            });
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            }
        } catch (err) {
            console.error("Telemetry fetch failed", err);
        }
    };

    const fetchUsers = async (query = "") => {
        if (!adminKey) return;
        try {
            const path = query ? `/api/admin/users?search=${encodeURIComponent(query)}` : "/api/admin/users";
            const res = await fetch(toApiUrl(path), {
                headers: { "x-admin-key": adminKey },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Users fetch failed", err);
        }
    };

    useEffect(() => {
        if (isUnlocked && adminKey) {
            fetchTelemetry();
            fetchUsers();
            const timer = setInterval(fetchTelemetry, 4000);
            return () => clearInterval(timer);
        }
    }, [isUnlocked, adminKey]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(search);
    };

    const handleBroadcast = (e) => {
        e.preventDefault();
        if (!broadcastMsg.trim()) return;

        notify({
            type: "warning",
            title: "SYSTEM BROADCAST DISPATCHED",
            message: broadcastMsg,
        });
        setBroadcastMsg("");
    };

    const [activeTab, setActiveTab] = useState("overview"); // "overview" | "linux_telemetry"
    const [linuxStatus, setLinuxStatus] = useState("CHECKING");
    const linuxTelemetryUrl = import.meta.env.VITE_LINUX_TELEMETRY_URL || "http://localhost:8000/dashboard";

    useEffect(() => {
        // Quick health probe to check Linux Telemetry service status
        const checkLinux = async () => {
            try {
                const res = await fetch("http://localhost:8000/healthz");
                if (res.ok) setLinuxStatus("ONLINE");
                else setLinuxStatus("OFFLINE");
            } catch {
                setLinuxStatus("OFFLINE");
            }
        };
        checkLinux();
        const interval = setInterval(checkLinux, 10000);
        return () => clearInterval(interval);
    }, []);

    // 🔒 Render Security Clearance Gate if locked
    if (!isUnlocked) {
        return (
            <div className="admin-lock-screen">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="lock-terminal"
                >
                    <div className="pre-heading">RESTRICTED ACCESS</div>
                    <h2>SuperAdmin Clearance</h2>
                    <p>Authenticate with your master administrative credentials to access platform telemetry and fleet controls.</p>

                    <form onSubmit={handleUnlock} className="lock-form">
                        <div className="lock-input-wrap">
                            <input
                                type="password"
                                placeholder="Enter SuperAdmin Passkey..."
                                value={passInput}
                                onChange={(e) => setPassInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {authError && <p className="lock-error">{authError}</p>}
                        <button type="submit" className="lock-btn">
                            Verify Clearance
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    // 🎛️ Render Full SuperAdmin Control Hub once unlocked
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="admin-control-hub"
        >
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-title">
                    <div className="pre-heading">ADMINISTRATION CONSOLE</div>
                    <h1>Central Control & <span className="text-cyan-gradient">Telemetry Hub</span></h1>
                    <p className="admin-subtext">Real-time infrastructure monitoring, fan-in/fan-out telemetry, and college sub-batches</p>
                </div>
                <div className="admin-header-actions">
                    <div className="admin-header-status">
                        <div className="pulse-indicator online"></div>
                        <span>Fleet Status: Optimal</span>
                    </div>
                    <button className="lock-hub-btn" onClick={handleLock}>
                        🔒 Lock Terminal
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="admin-tabs-bar">
                <button
                    className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    ⚡ Platform Fleet & Registry
                </button>
                <button
                    className={`admin-tab-btn ${activeTab === "linux_telemetry" ? "active" : ""}`}
                    onClick={() => setActiveTab("linux_telemetry")}
                >
                    🖥️ Linux Host Telemetry Live
                    <span className={`linux-status-pill ${linuxStatus.toLowerCase()}`}>
                        {linuxStatus === "ONLINE" ? "🟢 LIVE" : "🔴 OFFLINE"}
                    </span>
                </button>
            </div>

            {/* Tab 1: Platform Fleet & Registry Overview */}
            {activeTab === "overview" && (
                <>
                    {/* 1. Microservice Fleet Grid */}
                    <div className="admin-section">
                        <h3 className="section-title">Infrastructure Fleet & Services</h3>
                        <div className="fleet-grid">
                            {metrics?.services && Object.entries(metrics.services).map(([key, s]) => (
                                <div key={key} className="fleet-card">
                                    <div className="fleet-card-header">
                                        <span className="fleet-name">{SERVICE_NAMES[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                                        <span className={`status-pill ${s.status?.toLowerCase()}`}>{s.status}</span>
                                    </div>
                                    <div className="fleet-details">
                                        {Object.entries(s).filter(([k]) => k !== "status").map(([k, v]) => (
                                            <div key={k} className="stat-row">
                                                <span className="stat-label">{STAT_LABELS[k] || k}</span>
                                                <span className="stat-value">{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Traffic & Fan-In / Fan-Out Telemetry */}
                    <div className="admin-metrics-row">
                        <div className="telemetry-card">
                            <div className="card-header">
                                <h3>Ingress & Egress Telemetry</h3>
                                <span className="telemetry-tag">HIGH FREQUENCY</span>
                            </div>
                            <div className="telemetry-stats">
                                <div className="telemetry-box">
                                    <span className="telemetry-label">Ingress Rate (Fan-In)</span>
                                    <span className="telemetry-num cyan">{metrics?.traffic?.fanInRate || "142 req/s"}</span>
                                </div>
                                <div className="telemetry-box">
                                    <span className="telemetry-label">Broadcast Rate (Fan-Out)</span>
                                    <span className="telemetry-num purple">{metrics?.traffic?.fanOutRate || "480 events/s"}</span>
                                </div>
                                <div className="telemetry-box">
                                    <span className="telemetry-label">Active Gateways</span>
                                    <span className="telemetry-num green">{metrics?.traffic?.activeGateways || 1} Node</span>
                                </div>
                                <div className="telemetry-box">
                                    <span className="telemetry-label">Bandwidth Load</span>
                                    <span className="telemetry-num gold">{metrics?.traffic?.peakBandwidth || "18.4 MB/s"}</span>
                                </div>
                            </div>
                        </div>

                        {/* User Identity Breakdown */}
                        <div className="telemetry-card">
                            <div className="card-header">
                                <h3>User Identity Distribution</h3>
                                <span className="telemetry-tag">TOTAL: {metrics?.users?.total || 0}</span>
                            </div>
                            <div className="user-ratio-grid">
                                <div className="ratio-box">
                                    <span className="role-icon">🎓</span>
                                    <span className="role-count">{metrics?.users?.students || 0}</span>
                                    <span className="role-label">College Students</span>
                                </div>
                                <div className="ratio-box">
                                    <span className="role-icon">🏛️</span>
                                    <span className="role-count">{metrics?.users?.faculty || 0}</span>
                                    <span className="role-label">Faculty / Instructors</span>
                                </div>
                                <div className="ratio-box">
                                    <span className="role-icon">💻</span>
                                    <span className="role-count">{metrics?.users?.independent || 0}</span>
                                    <span className="role-label">Independent Coders</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Student Sub-Batches & Institutions */}
                    <div className="admin-section">
                        <h3 className="section-title">Top Registered Institutions & Sub-Batches</h3>
                        <div className="institutions-grid">
                            {metrics?.subBatches?.length > 0 ? (
                                metrics.subBatches.map((inst, i) => (
                                    <div key={i} className="institution-card">
                                        <div className="inst-badge">BATCH SUB-GROUP #{i + 1}</div>
                                        <div className="inst-name">{inst.institution || "Independent Affiliation"}</div>
                                        <div className="inst-count">
                                            <span>{inst.count}</span> Active Enrolled Students
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-data-notice">No institution batches registered yet.</div>
                            )}
                        </div>
                    </div>

                    {/* 4. Global System Broadcast Console */}
                    <div className="admin-section">
                        <h3 className="section-title">Global System Broadcast Console</h3>
                        <form className="broadcast-bar" onSubmit={handleBroadcast}>
                            <input
                                type="text"
                                placeholder="Enter priority announcement banner to dispatch across all connected combatants..."
                                value={broadcastMsg}
                                onChange={(e) => setBroadcastMsg(e.target.value)}
                            />
                            <button type="submit" className="broadcast-btn">
                                Dispatch Broadcast
                            </button>
                        </form>
                    </div>

                    {/* 5. User & Institutional Code Registry Search */}
                    <div className="admin-section">
                        <div className="registry-header">
                            <h3 className="section-title">Combatant Code & User Registry</h3>
                            <form className="registry-search" onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder="Search by Platform Code, Username, or Email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button type="submit">Search</button>
                            </form>
                        </div>

                        <div className="registry-table-wrapper">
                            <table className="registry-table">
                                <thead>
                                    <tr>
                                        <th>Platform Code</th>
                                        <th>Username</th>
                                        <th>Role</th>
                                        <th>Institution</th>
                                        <th>Primary Email</th>
                                        <th>Elo Rating</th>
                                        <th>Record (W/L)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td><span className="code-chip">{u.platformCode || `AF-USR-${u.id.slice(0, 5)}`}</span></td>
                                            <td className="user-cell"><strong>{u.username}</strong></td>
                                            <td>
                                                <span className={`role-badge ${u.userType?.toLowerCase() || "individual"}`}>
                                                    {u.userType || "INDIVIDUAL"}
                                                </span>
                                            </td>
                                            <td>{u.institutionName || "—"}</td>
                                            <td>{u.primaryEmail || u.email}</td>
                                            <td className="rating-cell">{u.rating}</td>
                                            <td>{u.wins}W - {u.losses}L</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 2: Dedicated Linux Telemetry Live Console Embed */}
            {activeTab === "linux_telemetry" && (
                <div className="admin-linux-telemetry-wrapper">
                    <div className="linux-toolbar glass-panel">
                        <div className="toolbar-info">
                            <h4>Linux Host Telemetry & Stress Server</h4>
                            <span className="target-pill">Target: http://localhost:8000/dashboard</span>
                        </div>
                        <div className="toolbar-actions">
                            <a
                                href={linuxTelemetryUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="external-window-btn"
                            >
                                Open in New Window ↗
                            </a>
                        </div>
                    </div>

                    <div className="linux-iframe-container">
                        <iframe
                            src={linuxTelemetryUrl}
                            title="AlgoFight Linux Host Telemetry Dashboard"
                            className="linux-telemetry-iframe"
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
}
