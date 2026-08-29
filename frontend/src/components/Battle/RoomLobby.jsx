import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCrown,
    faCheckCircle,
    faHourglassHalf,
    faCopy,
    faPlay,
    faArrowLeft,
    faUsers,
    faShieldHalved,
    faBolt
} from "@fortawesome/free-solid-svg-icons";
import { requestJson } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import "./RoomLobby.css";

const rawWsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:4001";
const WS_URL = rawWsUrl.startsWith("http")
    ? rawWsUrl.replace(/^http/, "ws")
    : rawWsUrl;

export default function RoomLobby() {
    const { roomCode } = useParams();
    const { user } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [countdown, setCountdown] = useState(null);

    const socketRef = useRef(null);

    const currentUserId = user?.uid || user?.email || "Guest";
    const currentUsername = user?.displayName || user?.email?.split("@")[0] || "Player";
    const isHost = room?.hostId === currentUserId || room?.host?.id === currentUserId;

    // 1. Fetch Room State from REST API
    const loadRoom = async (isBackgroundSync = false) => {
        try {
            if (!isBackgroundSync) setLoading(true);
            const data = await requestJson(`/api/battle/rooms/${encodeURIComponent(roomCode)}`);
            const roomData = data.room || data;

            if (roomData?.status === "CANCELLED") {
                notify({ type: "info", title: "Lobby Closed", message: "The host left or the lobby was cancelled." });
                navigate("/battle");
                return;
            }

            setRoom(roomData);
            setParticipants(data.participants || roomData?.participants || []);

            const me = (data.participants || roomData?.participants || []).find((p) => p.userId === currentUserId);
            if (me) setIsReady(me.isReady);
        } catch (err) {
            if (!isBackgroundSync) {
                notify({ type: "error", title: "Lobby Error", message: err.message || "Failed to load lobby." });
                navigate("/battle");
            }
        } finally {
            if (!isBackgroundSync) setLoading(false);
        }
    };

    // Initial load + automatic 2.5s background sync fallback
    useEffect(() => {
        loadRoom();
        const interval = setInterval(() => {
            loadRoom(true);
        }, 2500);
        return () => clearInterval(interval);
    }, [roomCode, currentUserId]);

    // 2. Connect to WebSocket for Instant Real-Time Lobby Sync
    useEffect(() => {
        let ws;
        try {
            ws = new WebSocket(WS_URL);
            socketRef.current = ws;

            ws.onopen = () => {
                // Authenticate socket & join room channel
                ws.send(JSON.stringify({
                    action: "identify",
                    payload: { userId: currentUserId, username: currentUsername },
                }));

                ws.send(JSON.stringify({
                    action: "join_room_channel",
                    payload: { roomCode, userId: currentUserId, username: currentUsername },
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    const { event: evt, payload } = message;

                    if (evt === "player_left") {
                        if (payload?.username && payload.userId !== currentUserId) {
                            notify({
                                type: "warning",
                                title: "Combatant Departed",
                                message: `${payload.username} has left the lobby.`
                            });
                        }
                        loadRoom(true);
                    }

                    if (evt === "room_updated" || evt === "player_joined" || evt === "player_ready_changed") {
                        if (evt === "player_joined" && payload?.username && payload.userId !== currentUserId) {
                            notify({
                                type: "info",
                                title: "Combatant Joined",
                                message: `${payload.username} joined the lobby.`
                            });
                        }
                        loadRoom(true);
                    }

                    if (evt === "battle_started" || evt === "match_found") {
                        setStarting(true);
                        setCountdown(3);

                        let count = 3;
                        const timer = setInterval(() => {
                            count -= 1;
                            setCountdown(count);
                            if (count <= 0) {
                                clearInterval(timer);
                                navigate("/battle/live", { state: { matchData: payload, roomCode } });
                            }
                        }, 1000);
                    }
                } catch (err) {
                    console.error("Socket error in lobby:", err);
                }
            };
        } catch (err) {
            console.warn("Could not initiate WebSocket in lobby:", err);
        }

        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [roomCode, currentUserId, currentUsername]);

    // Copy Room Code to Clipboard
    const copyCode = () => {
        navigator.clipboard.writeText(roomCode);
        notify({ type: "success", title: "Copied!", message: `Room Code ${roomCode} copied to clipboard.` });
    };

    // Leave Lobby
    const handleLeaveLobby = async () => {
        try {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    action: "leave_room_channel",
                    payload: { roomCode, userId: currentUserId, username: currentUsername },
                }));
            }

            if (room?.id || roomCode) {
                await requestJson(`/api/battle/rooms/${room?.id || roomCode}/leave`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: currentUserId }),
                    includeAuth: true,
                }).catch(() => {});
            }
        } finally {
            navigate("/battle");
        }
    };

    // Toggle Ready Status
    const handleToggleReady = async () => {
        try {
            const nextReady = !isReady;
            setIsReady(nextReady);

            if (room?.id) {
                await requestJson(`/api/battle/rooms/${room.id}/ready`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: currentUserId, isReady: nextReady }),
                    includeAuth: true,
                });
            }

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    action: "toggle_ready",
                    payload: { roomCode, userId: currentUserId, isReady: nextReady },
                }));
            }
        } catch (err) {
            setIsReady(!isReady); // Revert on failure
            notify({ type: "error", title: "Ready Check Failed", message: err.message });
        }
    };

    // Host Starts Battle
    const handleStartBattle = async () => {
        try {
            setStarting(true);
            if (room?.id) {
                await requestJson(`/api/battle/rooms/${room.id}/start`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ hostId: currentUserId }),
                    includeAuth: true,
                });
            }

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    action: "start_room_battle",
                    payload: { roomCode, hostId: currentUserId },
                }));
            }
        } catch (err) {
            setStarting(false);
            notify({ type: "error", title: "Launch Failed", message: err.message || "Cannot start battle." });
        }
    };

    const allReady = participants.length >= 2 && participants.every((p) => p.isReady || p.userId === room?.hostId);

    if (loading) {
        return (
            <div className="lobby-root">
                <div className="lobby-loader">
                    <FontAwesomeIcon icon={faBolt} spin />
                    <h2>INITIALIZING COMBAT LOBBY...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="lobby-root">
            {countdown !== null && (
                <div className="countdown-overlay">
                    <motion.div
                        className="countdown-number"
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                    >
                        {countdown === 0 ? "FIGHT!" : countdown}
                    </motion.div>
                </div>
            )}

            <div className="lobby-container">
                {/* Header Bar */}
                <div className="lobby-header">
                    <button className="btn-hud-back" onClick={handleLeaveLobby}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Leave Lobby
                    </button>
                    <div className="lobby-badge">
                        <FontAwesomeIcon icon={faShieldHalved} /> SECURE PROTOCOL LOBBY
                    </div>
                </div>

                {/* Room Information Card */}
                <motion.div
                    className="lobby-card-main"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="room-meta-strip">
                        <div className="room-code-display" onClick={copyCode} title="Click to copy code">
                            <span className="code-label">ROOM PASSCODE</span>
                            <div className="code-value">
                                {roomCode} <FontAwesomeIcon icon={faCopy} className="copy-icon" />
                            </div>
                        </div>

                        <div className="room-specs">
                            <div className="spec-item">
                                <span className="spec-label">Capacity</span>
                                <span className="spec-val">{participants.length} / {room?.maxPlayers || 2}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Time Limit</span>
                                <span className="spec-val">{room?.timeLimitMinutes || 15} Mins</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Status</span>
                                <span className={`spec-status ${room?.status?.toLowerCase()}`}>{room?.status || "WAITING"}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Participants Grid */}
                <div className="participants-section">
                    <h3 className="section-title-hud">
                        <FontAwesomeIcon icon={faUsers} /> COMBATANTS IN LOBBY ({participants.length}/{room?.maxPlayers || 2})
                    </h3>

                    <div className="participants-grid">
                        {participants.map((player, idx) => {
                            const isPlayerHost = player.userId === room?.hostId || player.userId === room?.host?.id;
                            const isMe = player.userId === currentUserId;

                            return (
                                <motion.div
                                    key={player.userId || idx}
                                    className={`participant-card ${isMe ? "me" : ""}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="participant-avatar">
                                        {(player.user?.username || player.username || "P")[0].toUpperCase()}
                                    </div>

                                    <div className="participant-info">
                                        <div className="participant-name">
                                            {player.user?.username || player.username || `Player ${idx + 1}`}
                                            {isMe && <span className="me-badge">YOU</span>}
                                            {isPlayerHost && <span className="host-badge"><FontAwesomeIcon icon={faCrown} /> HOST</span>}
                                        </div>
                                        <div className="participant-rating">
                                            Rating: {player.user?.rating || 1200}
                                        </div>
                                    </div>

                                    <div className="participant-status">
                                        {player.isReady || isPlayerHost ? (
                                            <span className="status-pill ready">
                                                <FontAwesomeIcon icon={faCheckCircle} /> READY
                                            </span>
                                        ) : (
                                            <span className="status-pill waiting">
                                                <FontAwesomeIcon icon={faHourglassHalf} /> WAITING
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, (room?.maxPlayers || 2) - participants.length) }).map((_, idx) => (
                            <div key={`empty-${idx}`} className="participant-card empty-slot">
                                <div className="empty-slot-text">
                                    <FontAwesomeIcon icon={faUsers} />
                                    <span>Waiting for player to join...</span>
                                    <span className="slot-code">Share code: <b>{roomCode}</b></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Bottom Bar */}
                <div className="lobby-actions-footer">
                    <button
                        className={`btn-hud-ready ${isReady ? "is-ready" : ""}`}
                        onClick={handleToggleReady}
                        disabled={starting}
                    >
                        <FontAwesomeIcon icon={faCheckCircle} /> {isReady ? "SET AS NOT READY" : "READY UP"}
                    </button>

                    {isHost && (
                        <button
                            className="btn-hud-launch"
                            onClick={handleStartBattle}
                            disabled={starting || !allReady}
                            title={!allReady ? "Waiting for all players to be ready" : "Launch Match"}
                        >
                            <FontAwesomeIcon icon={faPlay} /> {starting ? "LAUNCHING..." : "START BATTLE"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
