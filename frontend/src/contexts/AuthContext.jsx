// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getSessionToken,
  setSessionToken,
  getStoredUser,
  setStoredUser,
  clearAuthStorage,
} from "../services/authStorage";
import {
  loginWithGoogleApi,
  loginManualApi,
  signupManualApi,
  logoutApi,
  fetchMeApi,
  fetchUserProfile,
  updateFacultyProfile,
  syncUserToBackend,
} from "../services/api";
import { useUserStore } from "../store/useUserStore";
import { unifiedAnalytics } from "../services/analytics";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Normalize user object with helper getIdToken() for backwards-compatibility
export const formatUser = (userData, token) => {
  if (!userData) return null;
  const currentToken = token || getSessionToken();
  const identityMeta = userData.studentIdentityMetadata || {};
  const email = (userData.email || "").toLowerCase().trim();
  const isMitsFaculty = email.endsWith("@mitsgwalior.in") ||
                        email.endsWith(".mitsgwalior.in") ||
                        email.includes("mitsgwalior.in");
  const computedUserType = isMitsFaculty ? "FACULTY" : (userData.userType || "INDIVIDUAL");
  const computedRole = userData.role || (computedUserType === "FACULTY" ? "FACULTY" : "USER");
  const computedInstitution = userData.institutionName || (isMitsFaculty ? "Madhav Institute of Technology & Science" : null);
  const computedDesignation = userData.designation || identityMeta.designation || (computedUserType === "FACULTY" ? "Faculty Educator" : null);

  return {
    uid: userData.id || userData.uid,
    id: userData.id || userData.uid,
    email: userData.email,
    displayName: userData.username || userData.displayName || "Player",
    username: userData.username || userData.displayName || "Player",
    photoURL: userData.photoURL || identityMeta.photoURL || null,
    originalPhotoURL: userData.originalPhotoURL || identityMeta.originalPhotoURL || (typeof window !== 'undefined' ? localStorage.getItem('algofight_original_photo_url') : null) || (userData.photoURL?.startsWith('http') && !userData.photoURL?.includes('/avatars/') ? userData.photoURL : null) || (userData.username || userData.displayName || userData.email ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.username || userData.displayName || userData.email)}` : null) || null,
    avatarFrame: userData.avatarFrame || identityMeta.avatarFrame || null,
    unlockedAvatars: Array.isArray(userData.unlockedAvatars) ? userData.unlockedAvatars : (Array.isArray(identityMeta.unlockedAvatars) ? identityMeta.unlockedAvatars : []),
    unlockedFrames: Array.isArray(userData.unlockedFrames) ? userData.unlockedFrames : (Array.isArray(identityMeta.unlockedFrames) ? identityMeta.unlockedFrames : []),
    unlockedThemes: Array.isArray(userData.unlockedThemes) ? userData.unlockedThemes : (Array.isArray(identityMeta.unlockedThemes) ? identityMeta.unlockedThemes : []),
    role: computedRole,
    userType: computedUserType,
    platformCode: userData.platformCode,
    institutionName: computedInstitution,
    department: userData.department || identityMeta.department,
    school: userData.school || identityMeta.school,
    designation: computedDesignation,
    enrollmentNumber: (userData.enrollmentNumber || identityMeta.enrollmentNumber || null)?.toUpperCase() || null,
    rating: Number(userData.rating ?? 0),
    highestRating: Number(userData.highestRating ?? userData.rating ?? 0),
    highestRank: userData.highestRank || "ROOKIE",
    arenaPoints: Number(userData.arenaPoints ?? 0),
    wins: Number(userData.wins ?? userData.matchesWon ?? 0),
    losses: Number(userData.losses ?? userData.lossCount ?? 0),
    matchesWon: Number(userData.matchesWon ?? userData.wins ?? 0),
    matchesPlayed: Number(userData.matchesPlayed ?? ((userData.wins || 0) + (userData.losses || 0))),
    currentStreak: Number(userData.currentStreak ?? 0),
    longestStreak: Number(userData.longestStreak ?? userData.currentStreak ?? 0),
    totalSubmissions: Number(userData.totalSubmissions ?? (userData.practiceSubmissionCount ?? 0)),
    practiceSolvedCount: Number(userData.practiceSolvedCount ?? (userData.practiceSolvedProblemIds?.length ?? 0)),
    practiceSolvedProblemIds: Array.isArray(userData.practiceSolvedProblemIds) ? userData.practiceSolvedProblemIds : [],
    practiceSubmissionCount: Number(userData.practiceSubmissionCount ?? 0),
    ratingHistory: Array.isArray(userData.ratingHistory) ? userData.ratingHistory : [],
    ratingDelta: Number(userData.ratingDelta ?? 0),
    getIdToken: async () => currentToken || getSessionToken(),
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = getStoredUser();
    return stored ? formatUser(stored, getSessionToken()) : null;
  });
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const setGlobalUser = useUserStore((state) => state.setUser);
  const clearGlobalUser = useUserStore((state) => state.clearUser);
  const setGlobalProfileData = useUserStore((state) => state.setProfileData);

  const applyAuthenticatedState = useCallback(
    (authUser, token, profile) => {
      const mergedUser = {
        ...authUser,
        ...(profile || {}),
      };
      const formatted = formatUser(mergedUser, token);
      setUser(formatted);
      setStoredUser(formatted);
      if (token) setSessionToken(token);

      const profileObj = profile || formatted;
      setProfileData(profileObj);
      setGlobalProfileData(profileObj);
      setGlobalUser({
        uid: formatted.uid,
        email: formatted.email,
        displayName: formatted.displayName,
        photoURL: formatted.photoURL,
        avatarFrame: formatted.avatarFrame,
        accessToken: token || getSessionToken(),
      });
      unifiedAnalytics.setUserId(formatted.uid);
    },
    [setGlobalUser, setGlobalProfileData]
  );

  // Auto-restore session on page load / mount
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token = getSessionToken();
      if (!token) {
        if (active) {
          setUser(null);
          setProfileData(null);
          clearAuthStorage();
          clearGlobalUser();
          setLoading(false);
        }
        return;
      }

      try {
        const meRes = await fetchMeApi();
        if (!active) return;
        if (meRes?.user) {
          const profile = await fetchUserProfile(meRes.user.id).catch(() => null);
          if (active) {
            applyAuthenticatedState(meRes.user, token, profile);
          }
        } else {
          // Token invalid or expired
          clearAuthStorage();
          setUser(null);
          setProfileData(null);
          clearGlobalUser();
        }
      } catch (err) {
        // If server explicitly rejected authentication (401 or invalid session), clear stale storage immediately
        const isAuthRejection =
          err?.message?.includes("401") ||
          err?.message?.includes("Unauthorized") ||
          err?.message?.includes("Valid Gateway admission");

        if (isAuthRejection) {
          clearAuthStorage();
          if (active) {
            setUser(null);
            setProfileData(null);
            clearGlobalUser();
          }
        } else {
          // Degraded or network unreachable: use stored local profile if present
          const stored = getStoredUser();
          if (stored && active) {
            setUser(formatUser(stored, token));
          } else if (active) {
            clearAuthStorage();
            setUser(null);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [applyAuthenticatedState, clearGlobalUser]);

  // Google GIS Login
  const loginWithGoogle = useCallback(async (idToken) => {
    const res = await loginWithGoogleApi(idToken);
    if (res?.success && res.token && res.user) {
      if (res.user.originalPhotoURL || res.user.photoURL) {
        try {
          localStorage.setItem('algofight_original_photo_url', res.user.originalPhotoURL || res.user.photoURL);
        } catch {}
      }
      applyAuthenticatedState(res.user, res.token);
      return res.user;
    }
    throw new Error(res?.message || "Google authentication failed");
  }, [applyAuthenticatedState]);

  // Manual Email/Password Login
  const loginManual = useCallback(async (email, password) => {
    const res = await loginManualApi(email, password);
    if (res?.success && res.token && res.user) {
      applyAuthenticatedState(res.user, res.token);
      return res.user;
    }
    throw new Error(res?.message || "Login failed");
  }, [applyAuthenticatedState]);

  // Manual Signup
  const signupManual = useCallback(async (payload) => {
    const res = await signupManualApi(payload);
    if (res?.success && res.token && res.user) {
      applyAuthenticatedState(res.user, res.token);
      return res.user;
    }
    throw new Error(res?.message || "Signup failed");
  }, [applyAuthenticatedState]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignored
    } finally {
      clearAuthStorage();
      setUser(null);
      setProfileData(null);
      setGlobalProfileData(null);
      clearGlobalUser();
      unifiedAnalytics.setUserId(null);
    }
  }, [clearGlobalUser, setGlobalProfileData]);

  // Update faculty academic details
  const updateFacultyDetails = useCallback(async (details) => {
    const res = await updateFacultyProfile(details);
    if (res) {
      setProfileData((prev) => ({
        ...(prev || {}),
        ...res,
        school: details.school,
        department: details.department,
        designation: details.designation,
      }));
      setUser((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          userType: "FACULTY",
          school: details.school,
          department: details.department,
          designation: details.designation,
        };
        setStoredUser(updated);
        return updated;
      });
      return res;
    }
    return null;
  }, []);

  // Update avatar and frame appearance
  const updateAvatarAndFrame = useCallback(async ({ photoURL, avatarFrame }) => {
    const token = getSessionToken();
    const resolvedOriginal = user?.originalPhotoURL || (typeof localStorage !== 'undefined' ? localStorage.getItem('algofight_original_photo_url') : null) || null;
    try {
      const res = await syncUserToBackend({
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
        photoURL,
        originalPhotoURL: resolvedOriginal,
        avatarFrame,
        authToken: token,
      });

      const updatedUser = {
        ...(user || {}),
        photoURL,
        avatarFrame,
        originalPhotoURL: res?.originalPhotoURL || resolvedOriginal,
      };

      setUser(updatedUser);
      setStoredUser(updatedUser);
      setProfileData((prev) => ({
        ...(prev || {}),
        photoURL,
        avatarFrame,
      }));
      setGlobalProfileData((prev) => ({
        ...(prev || {}),
        photoURL,
        avatarFrame,
      }));
      setGlobalUser({
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
        photoURL,
        avatarFrame,
        accessToken: token,
      });

      return res || updatedUser;
    } catch (err) {
      console.error("Failed to sync avatar/frame to backend:", err);
      // Fallback local update
      const updatedUser = { ...(user || {}), photoURL, avatarFrame };
      setUser(updatedUser);
      setStoredUser(updatedUser);
      return updatedUser;
    }
  }, [user, setGlobalUser, setGlobalProfileData]);

  // Refresh user stats from server across entire app
  const refreshUser = useCallback(async () => {
    const token = getSessionToken();
    if (!token) return null;
    try {
      const meRes = await fetchMeApi();
      if (meRes?.user) {
        const profile = await fetchUserProfile(meRes.user.id).catch(() => null);
        applyAuthenticatedState(meRes.user, token, profile);
        return profile || meRes.user;
      }
    } catch {
      return null;
    }
  }, [applyAuthenticatedState]);

  const value = {
    user,
    profileData,
    setProfileData,
    loading,
    refreshUser,
    loginWithGoogle,
    loginManual,
    signupManual,
    updateFacultyDetails,
    updateAvatarAndFrame,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
