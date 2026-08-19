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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    if (user) navigate("/home");
  }, [user, navigate]);

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
      if (result?.user) navigate("/home");
    } catch {
      notify({ type: "error", title: "Sign-In Error", message: "Google sign-in failed." });
    }
  };

  const handleGithubAuth = async () => {
    try {
      const result = await githubSignIn();
      if (result?.notice) notify(result.notice);
      if (result?.user) navigate("/home");
    } catch {
      notify({ type: "error", title: "Sign-In Error", message: "GitHub sign-in failed." });
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
    </motion.div>
  );
}

export default Login;
