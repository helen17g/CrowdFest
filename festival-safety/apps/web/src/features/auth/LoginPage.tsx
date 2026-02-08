import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const auth = getAuth();
  const functions = getFunctions();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // ✅ verify role is organizer
      const getMyRole = httpsCallable(functions, "getMyRole");
      const res = await getMyRole();
      const role = (res.data as any)?.role as string | undefined;

      if (role !== "organizer") {
        setError("This web app is for organizers only. Please use the attendee app.");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <h1>Organizer Login</h1>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
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

      <button type="submit">Login</button>

      <button type="button" onClick={() => navigate("/signup")}>
        Create organizer account
      </button>
    </form>
  );
}
