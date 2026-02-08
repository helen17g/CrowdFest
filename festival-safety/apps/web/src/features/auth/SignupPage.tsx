import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const auth = getAuth();
  const functions = getFunctions();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createUserWithEmailAndPassword(auth, email, password);

      // ✅ web is organizers only
      const setAccountType = httpsCallable(functions, "setAccountType");
      await setAccountType({ accountType: "organizer" });

      // go to organizer onboarding/profile setup
      navigate("/profile/setup", { replace: true });
    } catch (err: any) {
      // allowlist typically shows up as a permission/failed-precondition style error
      setError(err?.message || "Signup failed (are you allowlisted?)");
    }
  }

  return (
    <form onSubmit={handleSignup}>
      <h1>Organizer Sign Up</h1>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Organizer email"
        required
      />

      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        required
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button type="submit">Create organizer account</button>

      <button type="button" onClick={() => navigate("/login")}>
        Back to login
      </button>
    </form>
  );
}
