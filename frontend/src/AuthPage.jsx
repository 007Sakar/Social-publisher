
import { useState } from "react";
import { apiFetch } from "./api";
import { LockKeyhole, Mail, User, ArrowRight } from "lucide-react";
import "./AuthPage.css";
import { GoogleLogin } from "@react-oauth/google";

export default function AuthPage({ onLogin, theme }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  async function handleGoogleSuccess(credentialResponse) {
  setError("");
  setLoading(true);

  try {
    const response = await apiFetch("accounts/google/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential: credentialResponse.credential,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Google login failed.");
      return;
    }

    onLogin(data);

  } catch (error) {
    setError("Unable to connect to the server.");
  } finally {
    setLoading(false);
  }
}

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (isRegister && password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister
        ? "accounts/register/"
        : "accounts/login/";

      const body = isRegister
        ? { username, email, password, password2 }
        : { username, password };

      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const messages = Object.values(data)
          .flat()
          .map((item) =>
            typeof item === "string" ? item : JSON.stringify(item)
          );

        setError(messages.join(" ") || "Something went wrong.");
        return;
      }

      onLogin(data);
    } catch {
      setError("Unable to connect to the server. Make sure Django is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`auth-page ${theme === "light" ? "auth-light" : ""}`}>
      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-logo">S</div>
          <span>SocialFlow</span>
        </div>

        <div className="auth-heading">
          <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p>
            {isRegister
              ? "Start managing your social media in one place."
              : "Sign in to continue to your SocialFlow dashboard."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={!isRegister ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={isRegister ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          <label>Username</label>
          <div className="auth-input">
            <User size={18} />
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {isRegister && (
            <>
              <label>Email address</label>
              <div className="auth-input">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </>
          )}

          <label>Password</label>
          <div className="auth-input">
            <LockKeyhole size={18} />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>

          {isRegister && (
            <>
              <label>Confirm password</label>
              <div className="auth-input">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}


<div className="google-login-section">

  <div className="auth-divider">
    <span>OR CONTINUE WITH</span>
  </div>

  <div className="google-login-button">
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => setError("Google login was unsuccessful.")}
      useOneTap={false}
      theme="outline"
      size="large"
      shape="rectangular"
      text="continue_with"
      width="100%"
    />
  </div>

</div>


          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Sign In"}

            {!loading && <ArrowRight size={18} />}
          </button>

        </form>

        <p className="auth-footer">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? "login" : "register");
              setError("");
            }}
          >
            {isRegister ? "Sign in" : "Create account"}
          </button>
        </p>

      </div>
    </div>
  );
}
