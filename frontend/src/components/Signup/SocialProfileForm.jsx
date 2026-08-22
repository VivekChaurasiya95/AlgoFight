import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { requestJson } from "../../services/api";
import "./Signup.css";

export default function SocialProfileForm({ onComplete }) {
    const { user } = useAuth();
    const { notify } = useNotification();
    const [githubUrl, setGithubUrl] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await requestJson("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    username: user.displayName || user.email.split("@")[0],
                    githubUrl: githubUrl.trim() || null,
                    linkedinUrl: linkedinUrl.trim() || null,
                }),
                includeAuth: true,
            });
            notify({ type: "success", title: "Profile Updated", message: "Social links saved!" });
            if (onComplete) onComplete();
        } catch (err) {
            notify({ type: "error", title: "Error", message: "Failed to save profile links." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="Signup-Container" style={{ marginTop: "20px" }}>
            <div className="Signup-Header">
                <h2>COMPLETE YOUR PROFILE</h2>
                <span className="auth-subtitle">Add your GitHub and LinkedIn to get verified (Optional)</span>
            </div>
            <form onSubmit={handleSubmit} className="Signup-Form-Options">
                <div className="input-group">
                    <input
                        type="url"
                        placeholder="GitHub Profile URL (Optional)"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        pattern="https?://(www\.)?github\.com/.*"
                        title="Must be a valid GitHub URL"
                    />
                </div>
                <div className="input-group">
                    <input
                        type="url"
                        placeholder="LinkedIn Profile URL (Optional)"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        pattern="https?://(www\.)?linkedin\.com/in/.*"
                        title="Must be a valid LinkedIn URL"
                    />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? "SAVING..." : "SAVE & CONTINUE"}
                </button>
                <button type="button" onClick={onComplete} className="auth-submit-btn" style={{ marginTop: "10px", background: "transparent", border: "1px solid #4ade80" }}>
                    SKIP
                </button>
            </form>
        </div>
    );
}
