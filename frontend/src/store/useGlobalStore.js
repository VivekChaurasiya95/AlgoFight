import { create } from "zustand";

export const useGlobalStore = create((set) => ({
  leaderboard: [],
  globalNotifications: [],
  
  setLeaderboard: (data) => set({ leaderboard: data }),
  addGlobalNotification: (notification) =>
    set((state) => ({
      globalNotifications: [...state.globalNotifications, notification],
    })),
  clearGlobalNotifications: () => set({ globalNotifications: [] }),
}));
