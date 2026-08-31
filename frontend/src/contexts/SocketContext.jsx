import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useUserStore } from "../store/useUserStore";
import { useGameStore } from "../store/useGameStore";
import { useGlobalStore } from "../store/useGlobalStore";
import { getSocket, connectSocket, disconnectSocket } from "../services/socket";

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { user, loading } = useAuth();
  const [socketWrapper, setSocketWrapper] = useState(null);

  // Zustand Store integrations
  const setMatchState = useGameStore((state) => state.setMatchState);
  const setLeaderboard = useGlobalStore((state) => state.setLeaderboard);
  const setProfileData = useUserStore((state) => state.setProfileData);

  useEffect(() => {
    if (loading) return;

    const socketClient = getSocket();

    if (!user) {
      disconnectSocket();
      setSocketWrapper(null);
      return;
    }

    // Handlers
    const handleProfileUpdate = (data) => setProfileData(data.payload || data);
    const handleLeaderboardUpdate = (data) => setLeaderboard(data.payload || data);
    const handleMatchFound = (data) => {
      setMatchState({
        matchId: data.roomId,
        opponent: data.players?.find(p => p !== (user.displayName || user.email?.split("@")[0])) || "Opponent",
        matchStatus: "found",
        problems: data.problems,
        timeLimitSeconds: data.timeLimitSeconds
      });
    };
    const handleMatchStarted = () => setMatchState({ matchStatus: "in-progress" });
    const handleBattleStateSync = (data) => setMatchState({ battleStats: data });
    
    // Stateful Reconnection Logic
    const handleConnect = () => {
       // if we reconnected, we might want to fetch state or send RECONNECT event.
       // The base client already sends `auth` automatically on open
       console.log("[SocketContext] Connected via BrowserSocketClient.");
    };

    socketClient.on("profile_update", handleProfileUpdate);
    socketClient.on("leaderboard_update", handleLeaderboardUpdate);
    socketClient.on("match_found", handleMatchFound);
    socketClient.on("battle_started", handleMatchStarted);
    socketClient.on("match_started", handleMatchStarted);
    socketClient.on("battle_state_sync", handleBattleStateSync);
    socketClient.on("battle_stats_update", handleBattleStateSync);
    socketClient.on("connect", handleConnect);

    // Connect
    connectSocket(null, user.uid, user.displayName || user.email?.split("@")[0]);

    // Provide a wrapper compatible with older code that expects `socket.emit`
    const wrapper = {
      emit: (action, data) => socketClient.emit(action, data),
      send: (action, data) => socketClient.emit(action, data),
      disconnect: () => disconnectSocket(),
      on: (event, cb) => socketClient.on(event, cb),
      off: (event, cb) => socketClient.off(event, cb)
    };

    setSocketWrapper(wrapper);

    return () => {
      socketClient.off("profile_update", handleProfileUpdate);
      socketClient.off("leaderboard_update", handleLeaderboardUpdate);
      socketClient.off("match_found", handleMatchFound);
      socketClient.off("battle_started", handleMatchStarted);
      socketClient.off("match_started", handleMatchStarted);
      socketClient.off("battle_state_sync", handleBattleStateSync);
      socketClient.off("battle_stats_update", handleBattleStateSync);
      socketClient.off("connect", handleConnect);
      disconnectSocket();
    };
  }, [user, loading, setMatchState, setLeaderboard, setProfileData]);

  return (
    <SocketContext.Provider value={{ socket: socketWrapper }}>
      {children}
    </SocketContext.Provider>
  );
}
