import { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "./app";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * AuthCallback — Google OAuth redirect landing page.
 * Google redirects to /auth/callback?code=...
 * This component POSTs the code to the backend, gets a JWT, and redirects to /dashboard.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { setToken } = useContext(AuthContext);
  const [status, setStatus] = useState("Processing your login...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Extract the authorization code from the URL query parameters
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        setError("No authorization code found in the URL. Please try logging in again.");
        return;
      }

      try {
        setStatus("Verifying your Google account...");
        // POST the code to the backend callback endpoint
        const response = await axios.post(`${API}/auth/callback`, { code });
        const { access_token } = response.data;

        if (access_token) {
          setToken(access_token);
          setStatus("Login successful! Redirecting...");
          // Small delay for UX, then navigate to dashboard
          setTimeout(() => navigate("/dashboard"), 800);
        } else {
          setError("Login failed: No token received from server.");
        }
      } catch (err) {
        const detail = err.response?.data?.detail || err.message || "Unknown error";
        setError(`Login failed: ${detail}`);
      }
    };

    handleCallback();
  }, []); // eslint-disable-line

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        textAlign: "center",
        padding: "3rem 2rem",
        background: "white",
        borderRadius: "1.5rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
        maxWidth: "420px",
        width: "90%",
      }}>
        {/* HerBlock Logo */}
        <div style={{
          width: 64, height: 64,
          background: "linear-gradient(135deg, #10b981, #059669)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem",
          fontSize: 28,
        }}>
          🌿
        </div>

        {error ? (
          <>
            <div style={{ fontSize: 40, marginBottom: "1rem" }}>❌</div>
            <h2 style={{ color: "#dc2626", marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
              Authentication Failed
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              {error}
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "#10b981", color: "white",
                border: "none", borderRadius: "0.75rem",
                padding: "0.75rem 2rem",
                fontSize: "1rem", fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div style={{
              width: 48, height: 48,
              border: "4px solid #dcfce7",
              borderTop: "4px solid #10b981",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 1.5rem",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <h2 style={{ color: "#111827", marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
              HerBlock
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>{status}</p>
            <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.75rem" }}>
              Please wait while we verify your account
            </p>
          </>
        )}
      </div>
    </div>
  );
}
