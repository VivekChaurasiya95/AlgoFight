import React from "react";
import { motion } from "framer-motion";
import "./Modal.css";

export default function Modal({ opponent, onClose, onConfirm }) {

  const ready = Math.random() > 0.25;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <h3>Confirm Challenge</h3>
        <p className="modal-info">
          <strong>{opponent?.name}</strong> — Rank #{opponent?.rank}
        </p>

        <div className="ready-row">
          <div className={`status ${ready ? "ok" : "no"}`}>{ready ? "Player ready to battle" : "Player not ready"}</div>
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={() => onConfirm(opponent, false)}>Cancel</button>
          <button
            className="btn primary"
            onClick={() => onConfirm(opponent, ready)}
          >
            {ready ? "Proceed to Battle" : "Send Request"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
