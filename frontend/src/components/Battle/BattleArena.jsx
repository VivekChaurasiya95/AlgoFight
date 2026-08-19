import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ResultPopup from "./ResultPopup.jsx";
import CreateRoomModal from "./CreateRoomModal.jsx";
import JoinRoomModal from "./JoinRoomModal.jsx";
import { useAuth } from "../../contexts/AuthContext";
import { fetchUserProfile } from "../../services/api";
import { normalizeUserStats } from "../../utils/playerMetrics";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faBullseye,
  faBolt,
  faMagnifyingGlass,
  faCrosshairs,
  faPlus,
  faKey,
  faShieldHalved
} from "@fortawesome/free-solid-svg-icons";
import "./BattleArena.css";

export default function BattleArena() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [resultBox, setResultBox] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Fetch profile stats from backend
  useEffect(() => {
    if (user?.uid) {
      fetchUserProfile(user.uid)
        .then((data) => { if (data) setProfile(data); })
        .catch((err) => console.error("Failed to fetch profile:", err));
    }
  }, [user]);

  // Re-fetch stats when returning from a battle
  useEffect(() => {
    if (location.state && location.state.result) {
      setResultBox(location.state.result);
      window.history.replaceState({}, document.title);
      if (user?.uid) {
        fetchUserProfile(user.uid)
          .then((data) => { if (data) setProfile(data); })
          .catch(() => { });
      }
    }
  }, [location.state, user]);

  const { rating, matchesWon, winRate } = normalizeUserStats(profile || {});

  return (
    <div className="arena-root">
      <div className="arena-inner">
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="arena-header"
        >
          <div className="pre-heading">COMPETITIVE ARENA</div>
          <h1 className="arena-title">
            Real-Time <span className="text-cyan-gradient"> Battles</span>
          </h1>
          <p className="arena-subtitle">
            Compete in live algorithmic duels, host private multiplayer rooms, or join custom code battles with peers.
          </p>
        </motion.div>

        {/* Player Stats Grid */}
        <section className="arena-stats">
          <div className="stat-card tone-gold">
            <div className="stat-icon-wrapper">
              <FontAwesomeIcon icon={faTrophy} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{rating}</div>
              <div className="stat-label">Global Rating</div>
            </div>
          </div>
          <div className="stat-card tone-pink">
            <div className="stat-icon-wrapper">
              <FontAwesomeIcon icon={faBullseye} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{matchesWon}</div>
              <div className="stat-label">Battles Won</div>
            </div>
          </div>
          <div className="stat-card tone-cyan">
            <div className="stat-icon-wrapper">
              <FontAwesomeIcon icon={faBolt} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{winRate}%</div>
              <div className="stat-label">Win Rate</div>
            </div>
          </div>
        </section>

        {/* 3 Game Modes Grid */}
        <section className="arena-modes-section">
          <div className="modes-grid">
            {/* Mode 1: Quick 1v1 Match */}
            <motion.div
              className="mode-card featured"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mode-card-header">
                <span className="mode-tag ranked">Ranked Matchmaking</span>
                <div className="mode-icon-accent"><FontAwesomeIcon icon={faBolt} /></div>
              </div>
              <h3>Quick 1v1 Duel</h3>
              <p>Instant automated matchmaking against players of similar rating. Win rating points and climb the global leaderboard.</p>
              <button className="btn-mode-action btn-primary" onClick={() => navigate("/battle/live")}>
                <FontAwesomeIcon icon={faMagnifyingGlass} /> Find 1v1 Match
              </button>
            </motion.div>

            {/* Mode 2: Create Custom Room */}
            <motion.div
              className="mode-card"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mode-card-header">
                <span className="mode-tag custom">Custom Lobby</span>
                <div className="mode-icon-accent custom"><FontAwesomeIcon icon={faPlus} /></div>
              </div>
              <h3>Create Private Room</h3>
              <p>Host a private room for 2 to 8 players. Custom time limits, curated difficulty, and private room codes.</p>
              <button className="btn-mode-action btn-secondary" onClick={() => setShowCreateModal(true)}>
                <FontAwesomeIcon icon={faPlus} /> Host Custom Room
              </button>
            </motion.div>

            {/* Mode 3: Join Room with Code */}
            <motion.div
              className="mode-card"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mode-card-header">
                <span className="mode-tag direct">Direct Join</span>
                <div className="mode-icon-accent direct"><FontAwesomeIcon icon={faKey} /></div>
              </div>
              <h3>Join with Code</h3>
              <p>Have a room passcode from a friend or classmate? Enter your code to enter their lobby instantly.</p>
              <button className="btn-mode-action btn-secondary" onClick={() => setShowJoinModal(true)}>
                <FontAwesomeIcon icon={faKey} /> Enter Room Code
              </button>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />

      {/* Result Modal */}
      <AnimatePresence>
        {resultBox && (
          <ResultPopup
            result={resultBox}
            onClose={() => setResultBox(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
