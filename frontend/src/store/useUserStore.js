import { create } from "zustand";

export const useUserStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  profileData: null,

  setUser: (userData) =>
    set({
      user: userData,
      isAuthenticated: !!userData,
    }),

  setProfileData: (data) => set({ profileData: data }),
  
  clearUser: () => set({ user: null, isAuthenticated: false, profileData: null }),
}));
