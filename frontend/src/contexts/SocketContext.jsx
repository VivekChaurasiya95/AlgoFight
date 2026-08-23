import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useUserStore } from "../store/useUserStore";
import { useGameStore } from "../store/useGameStore";
import { useGlobalStore } from "../store/useGlobalStore";

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { user, loading } = useAuth();
  const [socketWrapper, setSocketWrapper] = useState(null);
  const wsRef = useRef(null);

  // Zustand Store integrations
  const setMatchState = useGameStore((state) => state.setMatchState);
  const setLeaderboard = useGlobalStore((state) => state.setLeaderboard);
  const setProfileData = useUserStore((state) => state.setProfileData);

  useEffect(() => {
    // Only connect if user is authenticated and finished loading
    if (!loading && user) {
      // Connect to the native WebSocket server
      const socketUrl = import.meta.env.VITE_WS_URL || "ws://localhost:4001";
      const ws = new WebSocket(socketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket Connected");
        // Identify / Auth with the backend immediately
        ws.send(JSON.stringify({
          action: "auth",
          data: {
            userId: user.uid,
            email: user.email,
            username: user.displayName || user.email?.split("@")[0]
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const type = parsed.event; // The backend responds with { event: "...", ...payload }
          const data = parsed; // The payload data

          // Handle global events
          switch (type) {
            case "profile_update":
              setProfileData(data.payload || data);
              break;
            case "leaderboard_update":
              setLeaderboard(data.payload || data);
              break;
            case "match_found":
              setMatchState({
                matchId: data.roomId,
                opponent: data.players?.find(p => p !== (user.displayName || user.email?.split("@")[0])) || "Opponent",
                matchStatus: "found",
                problems: data.problems,
                timeLimitSeconds: data.timeLimitSeconds
              });
              break;
            case "battle_started":
            case "match_started":
              setMatchState({ matchStatus: "in-progress" });
              break;
            case "battle_state_sync":
            case "battle_stats_update":
              setMatchState({ battleStats: data });
              break;
            case "error":
              console.error("WebSocket Server Error:", data);
              break;
            default:
              // Handle other events or ignore
              break;
          }
        } catch (err) {
          console.error("Failed to parse websocket message", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket Disconnected");
      };

      ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };

      // Create a wrapper object that mimics the old socket.io API
      // so we don't break existing components that call socket.emit()
      const wrapper = {
        emit: (action, data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action, data }));
          } else {
            console.warn("WebSocket is not open. Cannot emit:", action);
          }
        },
        send: (action, data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action, data }));
          }
        },
        disconnect: () => {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        },
        on: () => {
          console.warn("socket.on is not supported outside SocketContext. Handle events inside SocketContext.jsx.");
        }
      };

      setSocketWrapper(wrapper);

      // Clean up connection on unmount
      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    }
  }, [user, loading, setMatchState, setLeaderboard, setProfileData]);

  return (
    <SocketContext.Provider value={{ socket: socketWrapper }}>
      {children}
    </SocketContext.Provider>
  );
}
