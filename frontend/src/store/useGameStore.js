import { create } from "zustand";

export const useGameStore = create((set) => ({
  matchId: null,
  opponent: null,
  matchStatus: "idle", // 'idle', 'searching', 'found', 'in-progress', 'finished'
  battleStats: null,

  setMatchState: (state) => set((prev) => ({ ...prev, ...state })),
  resetMatch: () =>
    set({
      matchId: null,
      opponent: null,
      matchStatus: "idle",
      battleStats: null,
    }),
}));
