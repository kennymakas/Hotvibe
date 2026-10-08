import { useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import HotVibeAPI from "../hotvibe-api";

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      await HotVibeAPI.login(password, email.trim());
      onSuccess();
    } catch (err) {
      setError(err.message || "Incorrect email or password. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <section className="admin-login">
      <div className="admin-login-icon"><LockKeyhole size={25} /></div>
      <div className="admin-heading">
        <h2>HotVibe Admin</h2>
        <p>Sign in to publish photos and videos to the feed.</p>
      </div>
      <form className="admin-login-form" onSubmit={submit}>
        <label className="upload-field">
          <span>Admin email</span>
          <input type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="admin@example.com" autoComplete="username" required />
        </label>
        <label className="upload-field">
          <span>Admin password</span>
          <input type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Enter your password" autoComplete="current-password" required />
        </label>
        {error && <p className="upload-error">{error}</p>}
        <button className="publish-button" type="submit" disabled={loading}>
          <LogIn size={17} /> {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
