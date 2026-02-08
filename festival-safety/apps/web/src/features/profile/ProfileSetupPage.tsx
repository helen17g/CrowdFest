import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../app/theme";
import { OrganizerRole, useAppStore } from "../../state/store";

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const setOrganizerProfile = useAppStore((s) => s.setOrganizerProfile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<OrganizerRole>("OUT_OF_FIELD");

  const canSave = useMemo(() => {
    return name.trim().length > 1 && email.trim().length > 3 && role === "OUT_OF_FIELD";
  }, [name, email, role]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `org_${Math.random().toString(16).slice(2)}`;

    setOrganizerProfile({
      id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
    });

    navigate("/dashboard", { replace: true });
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h2 style={styles.h2}>Organizer Profile Setup</h2>
        <div style={styles.subtext}>Web (Out-of-Field)</div>
      </div>

      <form onSubmit={onSave} style={styles.panel}>
        <div style={styles.grid2}>
          <div>
            <div style={styles.label}>Full Name</div>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First Last"
            />
          </div>

          <div>
            <div style={styles.label}>Email</div>
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
            />
          </div>

          <div>
            <div style={styles.label}>Phone (optional)</div>
            <input
              style={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(###) ###-####"
            />
          </div>

          <div>
          <div>
  <label style={{ fontWeight: 800 }}>Role</label>
  <div
    style={{
      marginTop: 6,
      padding: "10px 12px",
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: theme.bg,
      fontWeight: 700,
    }}
  >
    Out-of-Field Organizer
  </div>
</div>

            {role !== "OUT_OF_FIELD" && (
              <div style={styles.warn}>
                Web access is for Out-of-Field Organizers. Select Out-of-Field to continue.
              </div>
            )}
          </div>
        </div>

        <button type="submit" style={{ ...styles.primaryBtn, opacity: canSave ? 1 : 0.55 }} disabled={!canSave}>
          Save Profile
        </button>

        <div style={styles.note}>
          This is stored locally for now (MVP). Backend auth/profile can replace this later.
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 14 },

  headerRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 16,
    background: theme.surface,
    border: `1px solid ${theme.border}`,
  },
  h2: { margin: 0, fontSize: 22, fontWeight: 900, color: theme.text, letterSpacing: -0.2 },
  subtext: { fontSize: 13, fontWeight: 700, color: theme.muted },

  panel: {
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: 14,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },

  label: { fontSize: 12, fontWeight: 900, color: theme.muted, marginBottom: 6 },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    outline: "none",
    fontSize: 14,
  },

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    outline: "none",
    fontSize: 14,
    background: "white",
  },

  warn: { marginTop: 8, fontSize: 12, fontWeight: 800, color: theme.coral },

  primaryBtn: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.blue}`,
    background: theme.blue,
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },

  note: { marginTop: 10, fontSize: 12, color: theme.muted, fontWeight: 700 },
};
