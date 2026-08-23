import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { connectSocket, disconnectSocket } from "../../services/socket";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext.jsx";
import { requestJson } from "../../services/api";
import ProblemStatement from "../Common/ProblemStatement.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCode,
  faFlask,
  faForward,
  faShieldHalved,
  faUsers,
  faTimes,
  faCheckCircle,
  faTrophy,
  faBolt
} from "@fortawesome/free-solid-svg-icons";
import "./LiveBattle.css";

const PostBattleSummaryModal = ({ battleResult, liveState, problems, onClose }) => {
  if (!battleResult) return null;
  const isWin = battleResult.winner === "You";

  return (
    <div className="modal-overlay">
      <motion.div
        className="modal-content-hud"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className={`modal-tag ${isWin ? "win" : "loss"}`}>
              {isWin ? "VICTORY" : "DEFEAT"}
            </span>
            <h2>Battle Summary</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-body summary-body">
          <p className="summary-reason">{battleResult.message}</p>
          
          <div className="summary-leaderboard">
            <h3>Final Leaderboard</h3>
            <div className="leaderboard-grid">
              <div className="lb-header">Player</div>
              <div className="lb-header">Points</div>
              <div className="lb-header">Status</div>
              {liveState?.players?.map((p, i) => (
                <React.Fragment key={p.userId}>
                  <div className="lb-cell">
                    {i === 0 && <FontAwesomeIcon icon={faTrophy} style={{ color: "gold", marginRight: "8px" }} />}
                    {p.username}
                  </div>
                  <div className="lb-cell">{p.points}</div>
                  <div className="lb-cell">{p.solvedCount === problems.length ? "Completed" : "Incomplete"}</div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="summary-matrix" style={{ marginTop: '20px' }}>
            <h3>Per-Question Breakdown</h3>
            <div className="matrix-grid" style={{ 
               display: 'grid', 
               gridTemplateColumns: `1.5fr repeat(${problems.length}, 1fr)`,
               gap: '10px',
               marginTop: '10px'
            }}>
              <div className="mx-header" style={{ fontWeight: 'bold' }}>Player</div>
              {problems.map((_, i) => (
                <div key={i} className="mx-header" style={{ fontWeight: 'bold', textAlign: 'center' }}>Q{i + 1}</div>
              ))}
              {liveState?.players?.map((p) => (
                <React.Fragment key={p.userId}>
                  <div className="mx-cell">{p.username}</div>
                  {problems.map((prob) => {
                     const solvedData = p.solvedProblems?.find(sp => sp.problemId === prob.id);
                     return (
                        <div key={prob.id} className="mx-cell" style={{ 
                           textAlign: 'center',
                           color: solvedData ? '#4ade80' : '#ef4444',
                           background: 'rgba(255,255,255,0.05)',
                           borderRadius: '4px',
                           padding: '4px'
                        }}>
                          {solvedData ? `✓ ${solvedData.timeString}` : "✗ --"}
                        </div>
                     );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="livebattle-leave-btn" onClick={onClose}>Return to Arena</button>
        </div>
      </motion.div>
    </div>
  );
};

export default function LiveBattle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { notify } = useNotification();

  const initialMatch = location.state?.matchData;
  const initialRoomCode = location.state?.roomCode;

  const [status, setStatus] = useState(initialMatch || initialRoomCode ? "matched" : "connecting");
  const [problems, setProblems] = useState(initialMatch?.problems || []);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [opponentName, setOpponentName] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [timeLeft, setTimeLeft] = useState(initialMatch?.timeLimitSeconds || 0);
  const [liveState, setLiveState] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [roomId, setRoomId] = useState(initialMatch?.roomId || null);
  const [battleResult, setBattleResult] = useState(null);

  const problem = problems[activeProblemIndex] || null;

  // Fetch full room and problem details from API if problem statement/testcases are missing or on direct match entry
  useEffect(() => {
    const targetId = roomId || initialMatch?.roomId || initialMatch?.roomCode || initialRoomCode;
    if (!targetId) return;

    let active = true;
    requestJson(`/api/battle/rooms/${encodeURIComponent(targetId)}`)
      .then((data) => {
        if (!active) return;
        const roomData = data?.room || data;
        if (roomData) {
          if (roomData.id) setRoomId(roomData.id);
          if (Array.isArray(roomData.problems) && roomData.problems.length > 0) {
            setProblems(roomData.problems);
          }
          if (roomData.timeLimitMinutes) {
            setTimeLeft((prev) => (prev > 0 ? prev : roomData.timeLimitMinutes * 60));
          }
          setStatus("matched");
        }
      })
      .catch((err) => {
        console.warn("Could not load battle room details from REST API:", err?.message || err);
      });

    return () => {
      active = false;
    };
  }, [roomId, initialRoomCode]);

  useEffect(() => {
    if (problem && problem.starterCode && typeof problem.starterCode === "object") {
      const isDefaultCode = !code || Object.values(problem.starterCode).includes(code) || code === "// write your solution here";
      if (isDefaultCode) {
         setCode(problem.starterCode[language] || "// write your solution here");
      }
    } else if (problem && typeof problem.starterCode === "string") {
       if (!code || code === "// write your solution here") setCode(problem.starterCode);
    }
  }, [language, problem, activeProblemIndex]);

  const [output, setOutput] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [submissionMeta, setSubmissionMeta] = useState(null);
  const [running, setRunning] = useState(false);
  const [runMode, setRunMode] = useState("idle");
  const socketRef = useRef(null);
  const username = user?.displayName || user?.email || "Player";

  const sampleCases = Array.isArray(problem?.testCases) ? problem.testCases.slice(0, 2) : [];

  useEffect(() => {
    let timer;
    if (status === "matched" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    let cancelled = false;
    let socket = null;

    const setupSocket = async () => {
      const token = user ? await user.getIdToken().catch(() => null) : null;
      if (cancelled) return;

      socket = connectSocket(token, user?.uid || null);
      socketRef.current = socket;

      socket.on("connect", () => {
        const currentTarget = roomId || initialMatch?.roomId || initialMatch?.roomCode || initialRoomCode;
        if (currentTarget) {
          socket.emit("join_room_channel", { roomCode: currentTarget, userId: user?.uid, username });
        } else if (status !== "matched") {
          setStatus("waiting");
          notify({ type: "info", title: "Connected", message: "Connected to battle server. Looking for an opponent...", duration: 2600 });
          socket.emit("find_match", { username });
        }
      });

      socket.on("waiting_for_opponent", () => {
        if (!roomId && !initialMatch) {
          setStatus("waiting");
        }
      });

      socket.on("match_found", (data) => {
        const rid = data?.roomId || data?.payload?.roomId;
        const probs = data?.problems || (data?.problem ? [data.problem] : []);
        const players = Array.isArray(data?.players) ? data.players : [username, "Opponent"];
        
        setRoomId(rid);
        setProblems(probs);
        setActiveProblemIndex(0);
        setLanguage("javascript");
        if (data.timeLimitSeconds) setTimeLeft(data.timeLimitSeconds);
        
        setCode("// write your solution here");
        setOutput("");
        setLastResult(null);
        setSubmissionMeta(null);

        const opp = players.find((p) => p !== username) || "Opponent";
        setOpponentName(opp);
        setStatus("matched");

        notify({ type: "success", title: "Match Found", message: `You are now battling ${opp}.`, duration: 3000 });
      });

      socket.on("battle_started", (data) => {
        const rid = data?.roomId || data?.payload?.roomId;
        const probs = data?.problems || (data?.problem ? [data.problem] : []);
        
        setRoomId(rid);
        setProblems(probs);
        setActiveProblemIndex(0);
        setLanguage("javascript");
        if (data.timeLimitSeconds) setTimeLeft(data.timeLimitSeconds);
        
        setCode("// write your solution here");
        setOutput("");
        setLastResult(null);
        setStatus("matched");

        notify({ type: "success", title: "Battle Started", message: `The group battle has begun!`, duration: 3000 });
      });

      socket.on("battle_state_sync", (state) => {
        setLiveState(state);
      });

      socket.on("code_result", (data) => {
        const result = data?.result || data?.payload?.result || data;
        setRunning(false);
        setRunMode("idle");
        setLastResult(result || null);
        setOutput(result?.output || "No output returned.");

        if (result?.passed) {
          notify({ type: "success", title: "Execution Passed", message: `Passed ${result.passedTestCases ?? 0}/${result.totalTestCases ?? 0} test cases.`, duration: 2200 });
        }
      });

      socket.on("battle_over", (data) => {
        const winner = data?.winner || "Opponent";
        const youWin = winner === username;
        setBattleResult({
          winner: youWin ? "You" : winner,
          message: data.reason === "ALL_SOLVED" 
            ? `${winner} completed all questions first!` 
            : `Time is up! ${winner} wins.`,
        });
        if (data.finalState) {
           setLiveState(data.finalState);
        }
        setStatus("finished");
        setShowSummary(true);
      });

      socket.on("opponent_disconnected", () => {
        setBattleResult({ winner: "You", message: "Your opponent disconnected. You win!" });
        setStatus("finished");
        setShowSummary(true);
      });
    };

    setupSocket();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("waiting_for_opponent");
        socketRef.current.off("match_found");
        socketRef.current.off("battle_started");
        socketRef.current.off("battle_state_sync");
        socketRef.current.off("code_result");
        socketRef.current.off("battle_over");
        disconnectSocket();
      }
    };
  }, [notify, user?.uid, username]);

  const onTestCode = () => {
    if (!roomId || !socketRef.current) return;
    setRunning(true);
    setRunMode("test");
    setOutput("Testing against sample cases...");
    socketRef.current.emit("test_code", { code, language, roomId });
  };

  const onSubmitCode = () => {
    if (!roomId || !socketRef.current || !problem) return;
    setRunning(true);
    setRunMode("submit");
    setOutput("Testing against hidden and edge cases...");
    socketRef.current.emit("submit_code", { code, language, roomId, problemId: problem.id });
  };

  const goBack = () => {
    navigate("/battle", { state: battleResult ? { result: battleResult } : undefined });
  };

  if (status === "connecting" || status === "waiting") {
    return (
      <div className="livebattle-page">
        <section className="livebattle-header-card">
          <div className="livebattle-header-copy">
            <div className="livebattle-pre">LIVE BATTLE</div>
            <h1>{status === "connecting" ? "Connecting to server" : "Finding your opponent"}</h1>
            <p>Matchmaking uses your rating and recent performance to find a fair challenge.</p>
          </div>
          <button className="livebattle-leave-btn" onClick={() => navigate("/battle")}>Cancel</button>
        </section>

        <section className="livebattle-wait-panel">
          <div className="livebattle-loader">Searching for an opponent...</div>
          <div className="livebattle-wait-steps">
            <article>
              <FontAwesomeIcon icon={faUsers} />
              <h3>Queue</h3>
              <p>Scanning available coders near your rating.</p>
            </article>
            <article>
              <FontAwesomeIcon icon={faShieldHalved} />
              <h3>Match Integrity</h3>
              <p>Verifying battle room and fair-play checks.</p>
            </article>
            <article>
              <FontAwesomeIcon icon={faCode} />
              <h3>Problem Setup</h3>
              <p>Preparing starter code and evaluation suite.</p>
            </article>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="livebattle-page">
      {showSummary && (
         <PostBattleSummaryModal 
           battleResult={battleResult} 
           liveState={liveState} 
           problems={problems}
           onClose={goBack} 
         />
      )}

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="livebattle-header-card">
        <div className="livebattle-header-copy" style={{ flex: 1 }}>
          <div className="livebattle-pre">LIVE BATTLE</div>
          <h1>Room {roomId}</h1>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
             {liveState?.players?.map(p => (
                <div key={p.userId} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                   <span style={{ opacity: 0.7, fontSize: '0.8rem', display: 'block' }}>{p.username}</span>
                   <strong>{p.points} pts</strong> ({p.solvedCount}/{problems.length})
                </div>
             ))}
          </div>
        </div>

        <div className="livebattle-header-right">
          <div className={`livebattle-timer flashing`} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faClock} /> {formatTime(timeLeft)}
          </div>
          <button className="livebattle-leave-btn" onClick={goBack}>
            {status === "finished" ? "Back to Arena" : "Leave Battle"}
          </button>
        </div>
      </motion.section>

      <div className="livebattle-grid">
        <section className="livebattle-panel livebattle-problem-panel">
          <div className="livebattle-panel-head" style={{ paddingBottom: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
             <div className="problem-tabs" style={{ display: 'flex', gap: '10px' }}>
                {problems.map((p, idx) => (
                   <button 
                     key={p.id}
                     className={`tab-btn ${activeProblemIndex === idx ? 'active' : ''}`}
                     onClick={() => setActiveProblemIndex(idx)}
                     style={{
                        padding: '10px 16px',
                        background: activeProblemIndex === idx ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: activeProblemIndex === idx ? '2px solid var(--primary-color)' : '2px solid transparent',
                        color: '#fff',
                        cursor: 'pointer'
                     }}
                   >
                     Q{idx + 1}
                     {liveState?.players?.find(pl => pl.username === username)?.solvedProblems?.find(sp => sp.problemId === p.id) && (
                        <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#4ade80', marginLeft: '6px' }} />
                     )}
                   </button>
                ))}
             </div>
          </div>

          <div className="livebattle-problem-scroll">
            <ProblemStatement problem={problem} />
          </div>
        </section>

          <section className="livebattle-panel livebattle-editor-panel">
          <div className="livebattle-panel-head">
            <h3>Solution</h3>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="livebattle-chip"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', outline: 'none' }}
              disabled={status === "finished" || running}
            >
              <option value="javascript" style={{ background: '#111' }}>JavaScript</option>
              <option value="cpp" style={{ background: '#111' }}>C++</option>
              <option value="python" style={{ background: '#111' }}>Python</option>
            </select>
          </div>

          <textarea
            className="livebattle-code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            disabled={status === "finished"}
          />
        </section>

        <section className="livebattle-panel livebattle-submit-panel">
          <div className="livebattle-panel-head">
            <h3>Submit Solution</h3>
          </div>

          <div className="livebattle-submit-body">
            <div className="livebattle-actions-row">
              <button
                className="livebattle-action-btn test-btn"
                onClick={onTestCode}
                disabled={running || status === "finished"}
              >
                <FontAwesomeIcon icon={faFlask} />
                {running && runMode === "test" ? "Testing..." : "Test (Sample)"}
              </button>

              <button
                className="livebattle-action-btn submit-btn"
                onClick={onSubmitCode}
                disabled={running || status === "finished"}
              >
                <FontAwesomeIcon icon={faForward} />
                {running && runMode === "submit" ? "Submitting..." : "Submit (All)"}
              </button>
            </div>

            {lastResult ? (
              <div className="livebattle-result-meta">
                <div>
                  <span>Verdict</span>
                  <strong className={lastResult.passed ? "pass" : "fail"}>{lastResult.passed ? "Passed" : "Failed"}</strong>
                </div>
                <div>
                  <span>Tests</span>
                  <strong>
                    {lastResult.passedTestCases ?? 0}/{lastResult.totalTestCases ?? 0}
                  </strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{lastResult.executionTime ?? 0} ms</strong>
                </div>
              </div>
            ) : null}

            <div className="livebattle-output-box">
              {running ? (
                <div className="livebattle-loader livebattle-inline-loader">Evaluating...</div>
              ) : (
                <pre>{output || "Output will appear here."}</pre>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
