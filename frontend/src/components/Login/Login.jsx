import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Login.css";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useNotification } from "../../contexts/NotificationContext.jsx";
import GoogleAuthButton from "../Common/GoogleAuthButton.jsx";
import { isGoogleAuthAvailable } from "../../services/googleAuth";
import BackgroundPaths from "../BackgroundPaths/BackgroundPaths.jsx";
import "../BackgroundPaths/BackgroundPaths.css";
import ThemeSelector from "../Theme/ThemeSelector.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faArrowLeft,
  faBolt,
  faShieldHalved,
  faTrophy,
  faCircleCheck,
  faCircleExclamation,
  faCircleQuestion,
  faTimes,
  faCode,
} from "@fortawesome/free-solid-svg-icons";
import arinPic from "../../assets/devs/arin.png";
import vivekPic from "../../assets/devs/vivek.png";
import krishPic from "../../assets/devs/krish.jpg";
import atulPic from "../../assets/devs/atul.png";

const developers = [
  {
    name: "Arin Gupta",
    role: "Full Stack & Systems Lead",
    pic: arinPic,
    badge: "Core Architecture",
    tone: "tone-cyan",
  },
  {
    name: "Vivek Chaurasiya",
    role: "Backend & Sandbox Lead",
    pic: vivekPic,
    badge: "Runtime Engines",
    tone: "tone-emerald",
  },
  {
    name: "Krish Dargar",
    role: "Frontend & UI/UX Architect",
    pic: krishPic,
    badge: "Design Systems",
    tone: "tone-pink",
  },
  {
    name: "Mr. Atul Chauhan",
    role: "Faculty Mentor & Advisor",
    pic: atulPic,
    badge: "Technical Guidance",
    tone: "tone-amber",
  },
];

function Login() {
  const [authMethod, setAuthMethod] = useState(() =>
    isGoogleAuthAvailable() ? "google" : "manual"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const { user, loginManual, loginWithGoogle } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      notify({
        type: "success",
        title: "Signed In",
        message: "Welcome back! Signed in with Google.",
      });
      navigate(from, { replace: true });
    } catch (err) {
      notify({
        type: "error",
        title: "Sign-In Failed",
        message: err?.message || "Google authentication failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (err) => {
    console.warn("GIS login error:", err);
    notify({
      type: "error",
      title: "Google Sign-In Error",
      message: err?.message || "Could not complete Google Sign-In.",
    });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    let isValid = true;
    if (!email.trim()) {
      setEmailError("Email address is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError("Please enter a valid email format");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);
    try {
      await loginManual(email.trim(), password);
      notify({
        type: "success",
        title: "Signed In",
        message: "Welcome back! Preparing arena session...",
      });
      navigate(from, { replace: true });
    } catch (err) {
      notify({
        type: "error",
        title: "Sign-In Failed",
        message: err?.message || "Invalid email or password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundPaths>
      <div className="login-page">
        {/* Ambient atmospheric glows */}
        <div className="login-ambient-orb login-ambient-orb-1" aria-hidden="true" />
        <div className="login-ambient-orb login-ambient-orb-2" aria-hidden="true" />

        {/* Top bar with Navigation, Brand & Theme Selector */}
        <header className="auth-top-bar">
          <div className="auth-top-left">
            <Link to="/" className="auth-back-link" title="Return to Home">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back to Arena</span>
            </Link>
            <div className="auth-brand-separator" aria-hidden="true">/</div>
            <Link to="/" className="auth-brand-link" title="AlgoFight Arena">
              <span className="auth-brand-logo">⚔️ ALGOFIGHT</span>
              <span className="auth-live-badge">
                <span className="live-dot" /> LIVE
              </span>
            </Link>
          </div>
          <div className="auth-theme-wrap">
            <ThemeSelector />
          </div>
        </header>

        {/* Dual-Column Main Cockpit Wrapper */}
        <div className="login-main-wrapper">
          {/* Left Column: Arena Showcase & Telemetry */}
          <motion.aside
            className="login-showcase-panel"
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="auth-kicker-tag">
              <span className="pulse-dot" />
              <span className="kicker-code">// GATEWAY.SYS</span>
              <span>COMPETITIVE CODING ARENA</span>
            </div>

            <h1 className="auth-showcase-title">
              Level Up in <span className="word-glow-cyan">Real-Time</span> Coding Duels
            </h1>

            <p className="showcase-description">
              Step into high-pressure 1v1 algorithmic battles. Race opponents head-to-head, monitor live telemetry, and climb the global ELO ladder.
            </p>

            {/* Quick Feature Badges Strip */}
            <div className="showcase-features-strip">
              <div className="feature-pill-badge">
                <FontAwesomeIcon icon={faBolt} className="pill-icon icon-cyan" />
                <span>1v1 Real-Time Sync</span>
              </div>
              <div className="feature-pill-badge">
                <FontAwesomeIcon icon={faShieldHalved} className="pill-icon icon-pink" />
                <span>100% Fair Anti-Cheat</span>
              </div>
              <div className="feature-pill-badge">
                <FontAwesomeIcon icon={faTrophy} className="pill-icon icon-trophy" />
                <span>Global ELO Ranks</span>
              </div>
            </div>

            {/* Developers Team Showcase Card */}
            <div className="login-developers-section">
              <div className="developers-section-header">
                <div className="dev-header-badge">
                  <span className="pulse-dot" />
                  <span>PLATFORM ARCHITECTS & CREATORS</span>
                </div>
                <Link to="/developer" className="dev-meet-link" title="Explore Developer Profiles">
                  <span>Meet Team</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>

              <div className="login-developers-grid">
                {developers.map((dev) => (
                  <Link
                    to="/developer"
                    key={dev.name}
                    className={`login-dev-card ${dev.tone}`}
                    title={`View ${dev.name}'s profile`}
                  >
                    <div className="login-dev-avatar-wrap">
                      <img src={dev.pic} alt={dev.name} className="login-dev-avatar-img" />
                      <span className="login-dev-status-dot" />
                    </div>
                    <div className="login-dev-info">
                      <span className="login-dev-name">{dev.name}</span>
                      <span className="login-dev-role">{dev.role}</span>
                      <span className="login-dev-badge">{dev.badge}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* System Status Metrics Strip */}
            <div className="showcase-metrics-bar">
              <div className="metric-item">
                <span className="metric-val">&lt; 1.0s</span>
                <span className="metric-lbl">Judge Speed</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <span className="metric-val">1v1 Realtime</span>
                <span className="metric-lbl">Arena Mode</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <span className="metric-val">TLS 1.3</span>
                <span className="metric-lbl">Zero-Knowledge</span>
              </div>
            </div>
          </motion.aside>

          {/* Right Column: Authentication Form Card */}
          <motion.section
            className="login-card-wrapper"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut", delay: 0.05 }}
          >
            <div className="Login-Container">
              {/* Futuristic Top Glowing Accent Line */}
              <div className="card-top-accent" aria-hidden="true" />

              {/* Card Header */}
              <div className="Login-Heading">
                <div className="login-card-kicker">
                  <span className="kicker-mini-dot" />
                  <span>SECURE GATEWAY</span>
                </div>
                <h2>Welcome Back</h2>
                <p>Authenticate your credentials to enter the arena</p>
              </div>

              {/* Segmented Auth Mode Switcher */}
              <div className="auth-mode-switch" role="tablist" aria-label="Sign-in methods">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMethod === "google"}
                  className={`auth-mode-btn ${authMethod === "google" ? "active" : ""}`}
                  onClick={() => setAuthMethod("google")}
                >
                  <span className="auth-btn-icon">⚡</span>
                  <span>Google One-Tap</span>
                  {authMethod === "google" && (
                    <motion.div
                      className="auth-mode-pill"
                      layoutId="auth-mode-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMethod === "manual"}
                  className={`auth-mode-btn ${authMethod === "manual" ? "active" : ""}`}
                  onClick={() => setAuthMethod("manual")}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="auth-btn-icon" />
                  <span>Email & Password</span>
                  {authMethod === "manual" && (
                    <motion.div
                      className="auth-mode-pill"
                      layoutId="auth-mode-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                </button>
              </div>

              {/* Auth Forms */}
              <AnimatePresence mode="wait">
                {authMethod === "google" ? (
                  <motion.div
                    key="login-google-view"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="google-tab-content"
                  >
                    <div className="google-auth-button-container">
                      <GoogleAuthButton
                        mode="signin"
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        loading={loading}
                        onFallbackToManual={() => setAuthMethod("manual")}
                      />
                    </div>

                    <div className="google-perks-checklist">
                      <div className="google-perk-row">
                        <FontAwesomeIcon icon={faCircleCheck} className="perk-check-icon" />
                        <span>Instant 1-Click Access</span>
                      </div>
                      <div className="google-perk-row">
                        <FontAwesomeIcon icon={faCircleCheck} className="perk-check-icon" />
                        <span>Zero Passwords Needed</span>
                      </div>
                    </div>

                    <div className="auth-switch-prompt">
                      <span>Prefer manual login?</span>
                      <button
                        type="button"
                        className="text-action-link"
                        onClick={() => setAuthMethod("manual")}
                      >
                        Use Email & Password →
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="login-manual-view"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    onSubmit={handleManualSubmit}
                    className="Login-Box"
                  >
                    {/* Email Input */}
                    <div className="input-group">
                      <label className="input-field-label" htmlFor="login-email-input">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <span>EMAIL IDENTIFIER</span>
                      </label>
                      <div className={`input-field-wrapper ${emailError ? "input-has-error" : ""}`}>
                        <FontAwesomeIcon icon={faEnvelope} className="input-field-icon" />
                        <input
                          id="login-email-input"
                          type="email"
                          placeholder="coder@algofight.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError("");
                          }}
                          autoComplete="email"
                          disabled={loading}
                        />
                      </div>
                      {emailError && (
                        <p className="error-message">
                          <FontAwesomeIcon icon={faCircleExclamation} /> {emailError}
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="input-group">
                      <div className="input-label-row">
                        <label className="input-field-label" htmlFor="login-password-input">
                          <FontAwesomeIcon icon={faLock} />
                          <span>ACCESS KEY / PASSWORD</span>
                        </label>
                        <button
                          type="button"
                          className="forgot-pass-btn"
                          onClick={() => setShowForgotModal(true)}
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className={`input-field-wrapper ${passwordError ? "input-has-error" : ""}`}>
                        <FontAwesomeIcon icon={faLock} className="input-field-icon" />
                        <input
                          id="login-password-input"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError) setPasswordError("");
                          }}
                          autoComplete="current-password"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                      {passwordError && (
                        <p className="error-message">
                          <FontAwesomeIcon icon={faCircleExclamation} /> {passwordError}
                        </p>
                      )}
                    </div>

                    {/* Form Controls / Remember */}
                    <div className="form-controls-row">
                      <label className="remember-me-checkbox">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span className="checkbox-custom" />
                        <span className="checkbox-label-text">Remember this device</span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="cyber-spinner" />
                          <span>AUTHENTICATING...</span>
                        </>
                      ) : (
                        <>
                          <span>ENTER ARENA</span>
                          <FontAwesomeIcon icon={faArrowRight} className="submit-arrow-icon" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Card Footer: Switch to Signup */}
              <div className="auth-switch-text">
                <span>Need an arena combatant account?</span>
                <Link to="/signup" className="signup-link">
                  Create Account →
                </Link>
              </div>

              {/* Creators Attribution Strip */}
              <div className="auth-creators-footnote">
                <div className="creators-avatars-pile">
                  {developers.map((dev) => (
                    <img
                      key={dev.name}
                      src={dev.pic}
                      alt={dev.name}
                      title={`${dev.name} (${dev.role})`}
                      className="creator-pile-avatar"
                    />
                  ))}
                </div>
                <div className="creators-footnote-text">
                  <span>Engineered by</span>{" "}
                  <Link to="/developer" className="creators-team-link">
                    AlgoFight Core Team
                  </Link>
                </div>
              </div>

              {/* Security & Integrity Micro-Footer */}
              <div className="auth-security-strip">
                <FontAwesomeIcon icon={faShieldHalved} className="shield-icon" />
                <span>TLS 1.3 256-Bit Encrypted • Anti-Cheat Engine</span>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Account Recovery / Forgot Password Modal */}
        <AnimatePresence>
          {showForgotModal && (
            <div
              className="auth-modal-backdrop"
              onClick={() => setShowForgotModal(false)}
            >
              <motion.div
                className="auth-modal-dialog"
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-top-bar">
                  <div className="modal-title-wrap">
                    <FontAwesomeIcon icon={faCircleQuestion} className="modal-title-icon" />
                    <h3>Account Recovery</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close-button"
                    onClick={() => setShowForgotModal(false)}
                    aria-label="Close dialog"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="modal-content-body">
                  <div className="recovery-tip-card">
                    <span className="tip-badge">RECOMMENDED</span>
                    <p>
                      If your account was registered with <strong>Google One-Tap</strong>, passwords are not used! Simply click <em>Google One-Tap</em> on the login screen to sign right in.
                    </p>
                  </div>

                  <p className="recovery-help-text">
                    For manual email/password accounts, automated reset is currently managed by the arena administration to protect rating integrity.
                  </p>

                  <div className="recovery-contact-box">
                    <span className="contact-label">Official Support Desk:</span>
                    <code className="contact-email">support@algofight.com</code>
                  </div>
                </div>

                <div className="modal-actions-bar">
                  <button
                    type="button"
                    className="modal-primary-btn"
                    onClick={() => {
                      setShowForgotModal(false);
                      setAuthMethod("google");
                    }}
                  >
                    ⚡ Switch to Google One-Tap
                  </button>
                  <button
                    type="button"
                    className="modal-secondary-btn"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </BackgroundPaths>
  );
}

export default Login;
