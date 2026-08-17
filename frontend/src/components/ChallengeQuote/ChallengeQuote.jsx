import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTerminal } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./ChallengeQuote.css";

const ChallengeQuote = () => {
  const navigate = useNavigate();

  return (
    <div className="challenge-quote-wrapper">
      <div className="challenge-quote-box">
        <h3 className="quote-title">
          Wanna <span className="quote-highlight">Battle</span>
          <FontAwesomeIcon icon={faTerminal} className="quote-icon" />
        </h3>
        <button className="quote-btn" onClick={() => navigate("/home")}>
          <span>Come & Join Us</span>
        </button>
      </div>
    </div>
  );
};

export default ChallengeQuote;
