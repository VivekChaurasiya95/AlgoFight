import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { motion } from "framer-motion";
import { GoogleIcon, GithubIcon } from "../Common/Icons";
import { emailPasswordSignIn, googleSignIn, githubSignIn } from "../../firebaseConfig.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useNotification } from "../../contexts/NotificationContext.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthToken, setOauthToken] = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    if (user && !showOAuthModal) navigate("/home");
  }, [user, navigate, showOAuthModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    let isValid = true;
    if (!email.trim()) {
      setEmailError("Email address is required");
      isValid = false;
    }
    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    }
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await emailPasswordSignIn(email.trim(), password);
      if (res.notice) notify(res.notice);
      if (res.user) {
        navigate("/home");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await googleSignIn();
      if (result?.notice) notify(result.notice);
      if (result?.user) {
        const token = await result.user.getIdToken();
        setOauthToken(token);
        setShowOAuthModal(true);
      }
    } catch {
      notify({ type: "error", title: "Sign-In Error", message: "Google sign-in failed." });
    }
  };

  const handleGithubAuth = async () => {
    try {
      const result = await githubSignIn();
      if (result?.notice) notify(result.notice);
      if (result?.user) {
        const token = await result.user.getIdToken();
        setOauthToken(token);
        setShowOAuthModal(true);
      }
    } catch {
      notify({ type: "error", title: "Sign-In Error", message: "GitHub sign-in failed." });
    }
  };

  const submitOAuthProfile = async () => {
    setLoading(true);
    try {
      if (user && oauthToken) {
        await fetch("/api/users", {
          method: "POST", 
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${oauthToken}`
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            githubUrl: githubUrl.trim() || null,
            linkedinUrl: linkedinUrl.trim() || null
          })
        });
      }
      navigate("/home");
    } catch (err) {
      console.error(err);
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, x: -40 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.92, x: 40 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="login-page"
    >
      <form className="Login-Container" onSubmit={handleSubmit}>
        <div className="Login-Header">
          <h2>LOGIN TO ALGOFIGHT</h2>
          <span className="auth-subtitle">ENTER THE ARENA WITH YOUR CREDENTIALS</span>
        </div>

        <div className="input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Primary / College Email"
            autoComplete="email"
          />
          <p className="error-message">{emailError || "\u00A0"}</p>
        </div>

        <div className="input-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
          <p className="error-message">{passwordError || "\u00A0"}</p>
        </div>

        <div className="auth-switch-text">
          <span>Don't have an account?</span>
          <Link to="/signup" className="signup-link">Sign Up</Link>
        </div>

        <div className="Login-Separator">
          <span>OR CONTINUE WITH</span>
        </div>

        <div className="Login-Social-Options">
          <button className="social-btn google" type="button" onClick={handleGoogleAuth} aria-label="Google Login">
            <GoogleIcon size={20} />
            <span>Google</span>
          </button>
          <button className="social-btn github" type="button" onClick={handleGithubAuth} aria-label="GitHub Login">
            <GithubIcon size={20} />
            <span>GitHub</span>
          </button>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? "AUTHENTICATING..." : "ENTER ARENA"}
        </button>
      </form>

      {showOAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Complete Profile</h2>
            <p className="text-gray-400 text-sm mb-6">Add your social links (Optional)</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-400 text-sm mb-1" htmlFor="oauth-github">GitHub Profile</label>
                <input
                  type="url"
                  id="oauth-github"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1" htmlFor="oauth-linkedin">LinkedIn Profile</label>
                <input
                  type="url"
                  id="oauth-linkedin"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => navigate("/home")}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button 
                type="button" 
                onClick={submitOAuthProfile}
                disabled={loading}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Login;
