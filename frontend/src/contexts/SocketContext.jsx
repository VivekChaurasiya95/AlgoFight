import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
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
  const [socket, setSocket] = useState(null);

  // Zustand Store integrations
  const setMatchState = useGameStore((state) => state.setMatchState);
  const setLeaderboard = useGlobalStore((state) => state.setLeaderboard);
  const setProfileData = useUserStore((state) => state.setProfileData);

  useEffect(() => {
    // Only connect if user is authenticated and finished loading
    if (!loading && user) {
      // Connect to the WebSocket server (adjust URL based on environment)
      const socketUrl = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:4001";
      
      const newSocket = io(socketUrl, {
        auth: { token: user.accessToken },
        transports: ["websocket"],
      });

      setSocket(newSocket);

      // --- GLOBAL EVENT LISTENERS ---

      // Example: Real-time Profile Updates
      newSocket.on("profile_update", (data) => {
        setProfileData(data);
      });

      // Example: Global Leaderboard Updates
      newSocket.on("leaderboard_update", (data) => {
        setLeaderboard(data);
      });

      // Example: Game / Matchmaking Events
      newSocket.on("match_found", (data) => {
        setMatchState({
          matchId: data.matchId,
          opponent: data.opponent,
          matchStatus: "found",
        });
      });

      newSocket.on("match_started", () => {
        setMatchState({ matchStatus: "in-progress" });
      });

      newSocket.on("battle_stats_update", (data) => {
        setMatchState({ battleStats: data });
      });

      // Handle disconnection
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, loading, setMatchState, setLeaderboard, setProfileData]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}
