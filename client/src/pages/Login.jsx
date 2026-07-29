import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { login } from "../services/authService.js";
import { APPEARANCE_KEY, DEFAULT_APPEARANCE, loadPreference, saveAppearance } from "../preferences.js";
import { APP_DESCRIPTION } from "../theme.js";
import novaFleetLogo from "../assets/novafleet-logo.png";

export default function Login({ onAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [appearance, setAppearance] = useState(() => loadPreference(APPEARANCE_KEY, DEFAULT_APPEARANCE));

  const changeTheme = (theme) => {
    const next = { ...appearance, theme };
    setAppearance(next);
    saveAppearance(next);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login({ email, password });
      onAuthenticated(user);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="portal-appearance-switch" aria-label="Portal appearance">
        {[{ theme: "light", icon: "&#9788;", label: "Light mode" }, { theme: "dark", icon: "&#9680;", label: "Dark mode" }].map((option) => (
          <button type="button" className={appearance.theme === option.theme ? "active" : ""} key={option.theme} onClick={() => changeTheme(option.theme)} aria-label={option.label} title={option.label}>
            <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: option.icon }} />
          </button>
        ))}
      </div>
      <section className="login-brand">
        <div className="login-brand-content">
          <img className="logo-mark" src={novaFleetLogo} alt="NovaFleet" />
          <h1 className="login-title">NovaFleet</h1>
          <p className="login-copy">{APP_DESCRIPTION}</p>
        </div>
      </section>

      <section className="login-form">
        <h2 className="login-heading">Welcome back</h2>
        <p className="login-subtitle">Sign in with your authorized fleet operations account.</p>

        <form className="grid" style={{ gap: 20 }} onSubmit={handleLogin} noValidate>
          <Input
            id="email"
            label="Work email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@organization.com"
            autoComplete="email"
            required
          />
          <label className="input-wrap password-input-wrap" htmlFor="password">
            <span className="input-label">Password</span>
            <span className="password-input-control">
              <input
                id="password"
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                                {showPassword ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.2 5.3A9.7 9.7 0 0 1 12 5c5 0 8.5 4.5 9.5 7a12.2 12.2 0 0 1-3.1 4.3" />
                    <path d="M6.5 6.8A12.5 12.5 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7a9.8 9.8 0 0 0 4.1-.9" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </span>
          </label>
          <Button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? "Verifying account..." : "Sign in securely"}
          </Button>
        </form>

        <p className="login-security-note">Your access level is assigned by your NovaFleet administrator.</p>
        {error && <div className="login-error" role="alert" aria-live="assertive">{error}</div>}
      </section>
    </div>
  );
}