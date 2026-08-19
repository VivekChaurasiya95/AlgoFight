import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus, faUsers, faClock, faFire } from "@fortawesome/free-solid-svg-icons";
import { requestJson } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

export default function CreateRoomModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();

    const [maxPlayers, setMaxPlayers] = useState(2);
    const [timeLimit, setTimeLimit] = useState(15);
    const [difficulty, setDifficulty] = useState("MEDIUM");
    const [creating, setCreating] = useState(false);

    if (!isOpen) return null;

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user) {
            notify({ type: "error", title: "Authentication Required", message: "Please log in to create a custom room." });
            return;
        }

        try {
            setCreating(true);
            const res = await requestJson("/api/battle/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hostId: user.uid || user.email,
                    maxPlayers: Number(maxPlayers),
                    timeLimitMinutes: Number(timeLimit),
                }),
                includeAuth: true,
            });

            const roomCode = res.room?.roomCode || res.roomCode;
            notify({ type: "success", title: "Room Created!", message: `Room Code: ${roomCode}` });
            onClose();
            navigate(`/battle/room/${roomCode}`);
        } catch (err) {
            notify({ type: "error", title: "Room Creation Failed", message: err.message || "Could not create room." });
        } finally {
            setCreating(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    className="modal-content-hud"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="modal-title-group">
                            <span className="modal-tag">Lobby Host</span>
                            <h2>Create Custom Battle Room</h2>
                        </div>
                        <button className="modal-close-btn" onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="modal-form">
                        <div className="form-group-hud">
                            <label><FontAwesomeIcon icon={faUsers} /> Max Participants</label>
                            <div className="pill-selector">
                                {[2, 4, 6, 8].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        className={`pill-btn ${maxPlayers === num ? "active" : ""}`}
                                        onClick={() => setMaxPlayers(num)}
                                    >
                                        {num} Players
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group-hud">
                            <label><FontAwesomeIcon icon={faClock} /> Time Limit</label>
                            <div className="pill-selector">
                                {[5, 10, 15, 30].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        className={`pill-btn ${timeLimit === mins ? "active" : ""}`}
                                        onClick={() => setTimeLimit(mins)}
                                    >
                                        {mins} Mins
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group-hud">
                            <label><FontAwesomeIcon icon={faFire} /> Problem Difficulty</label>
                            <div className="pill-selector">
                                {["EASY", "MEDIUM", "HARD"].map((diff) => (
                                    <button
                                        key={diff}
                                        type="button"
                                        className={`pill-btn ${difficulty === diff ? "active" : ""}`}
                                        onClick={() => setDifficulty(diff)}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-hud-secondary" onClick={onClose} disabled={creating}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-hud-primary" disabled={creating}>
                                <FontAwesomeIcon icon={faPlus} /> {creating ? "Generating Room..." : "Create Room"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
