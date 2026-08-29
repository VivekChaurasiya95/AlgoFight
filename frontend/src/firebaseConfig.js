import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDKDDmwFHNhLX3VEWOy-9pfosIX0JfMki4",
  authDomain: "algo-fight.firebaseapp.com",
  projectId: "algo-fight",
  storageBucket: "algo-fight.firebasestorage.app",
  messagingSenderId: "811777562185",
  appId: "1:811777562185:web:210953e018470785aad198",
  measurementId: "G-E1RY503D7K"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
const googleBox = new GoogleAuthProvider();
const githubBox = new GithubAuthProvider();

const getProviderLabel = (providerId) => {
  if (providerId === "google.com") return "Google";
  if (providerId === "github.com") return "GitHub";
  return providerId || "another provider";
};

const accountExistsNotice = (email, providerId) => ({
  type: "warning",
  title: "Account Already Exists",
  message: `${email} is already registered with ${getProviderLabel(providerId)}. Sign in with that provider first to link your account.`,
});

// 1. Email & Password Sign In
export const emailPasswordSignIn = async (email, password) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return {
      user: cred.user,
      notice: {
        type: "success",
        title: "Signed In",
        message: `Welcome back, ${cred.user.displayName || cred.user.email}!`,
      },
    };
  } catch (error) {
    let message = "Invalid email or password.";
    if (error.code === "auth/user-not-found") message = "No account found with this email.";
    if (error.code === "auth/wrong-password") message = "Incorrect password.";
    if (error.code === "auth/invalid-email") message = "Invalid email format.";
    return {
      user: null,
      errorCode: error.code,
      notice: {
        type: "error",
        title: "Sign-In Failed",
        message,
      },
    };
  }
};

// 2. Email & Password Sign Up with College Identity
export const emailPasswordSignUp = async ({ email, password, username, userType, institutionName, secondaryEmail }) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (username) {
      await updateProfile(cred.user, { displayName: username });
    }

    const platformPrefix = userType === "STUDENT" ? "AF-STU" : userType === "FACULTY" ? "AF-FAC" : "AF-USR";
    const platformCode = `${platformPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Sync user identity to backend API
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cred.user.uid,
        username: username || email.split("@")[0],
        email: email,
        primaryEmail: email,
        secondaryEmail: secondaryEmail || null,
        userType: userType || "INDIVIDUAL",
        institutionName: institutionName || null,
        platformCode,
      }),
    }).catch(() => { });

    return {
      user: cred.user,
      platformCode,
      notice: {
        type: "success",
        title: "Account Created",
        message: `Welcome to AlgoFight! Your Institutional Code is ${platformCode}`,
      },
    };
  } catch (error) {
    let message = error.message;
    if (error.code === "auth/email-already-in-use") message = "This email is already registered.";
    if (error.code === "auth/weak-password") message = "Password must be at least 6 characters.";
    return {
      user: null,
      errorCode: error.code,
      notice: {
        type: "error",
        title: "Sign-Up Failed",
        message,
      },
    };
  }
};

// 3. Social Sign In (Google)
export const googleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleBox);
    return {
      user: result.user,
      notice: {
        type: "success",
        title: "Signed In",
        message: "Welcome back. Signed in with Google.",
      },
    };
  } catch (error) {
    return {
      user: null,
      errorCode: error.code,
      notice: {
        type: "error",
        title: "Google Sign-In Failed",
        message: "Unable to sign in with Google right now.",
      },
    };
  }
};

// 4. Social Sign In (GitHub)
export const githubSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, githubBox);
    return {
      user: result.user,
      notice: {
        type: "success",
        title: "Signed In",
        message: "Welcome back. Signed in with GitHub.",
      },
    };
  } catch (error) {
    return {
      user: null,
      errorCode: error.code,
      notice: {
        type: "error",
        title: "GitHub Sign-In Failed",
        message: "Unable to sign in with GitHub right now.",
      },
    };
  }
};
