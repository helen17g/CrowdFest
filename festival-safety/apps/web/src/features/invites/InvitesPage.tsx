import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { theme } from "../../app/theme";
import { useAppStore } from "../../state/store";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function InvitesPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const events = useAppStore((s) => s.events);
  const invites = useAppStore((s) => s.invites);
  const addInvite = useAppStore((s) => s.addInvite);

  const currentEvent = eventId ? events.find((e) => e.id === eventId) : null;

  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const visibleInvites = eventId
    ? invites.filter((i) => i.eventId === eventId)
    : invites;

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!eventId) {
      setError("Open invites from an event to send invites.");
      return;
    }

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email.");
      return;
    }

    addInvite({
      id: makeId(),
      eventId,
      email: trimmed,
      createdAt: new Date().toISOString(),
      status: "pending",
    });

    setEmail("");
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.h2}>Invites</h2>
          <div style={styles.subtext}>
            {eventId ? `For: ${currentEvent?.name || eventId}` : "All invites"}
          </div>
        </div>

        <button
          onClick={() => navigate(eventId ? "/events" : "/dashboard")}
          style={styles.secondaryBtn}
        >
          {eventId ? "Back to Events" : "Back"}
        </button>
      </div>

      {eventId && (
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Send Invite</div>

          <form onSubmit={onSend} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="attendee@email.com"
              style={{ ...styles.input, minWidth: 260 }}
            />
            <button type="submit" style={styles.primaryBtn}>
              Send Invite
            </button>
          </form>

          {error && <div style={styles.error}>{error}</div>}

          {currentEvent?.link && (
            <div style={styles.note}>
              Event link:{" "}
              <a href={currentEvent.link} style={{ color: theme.blue, fontWeight: 900 }}>
                {currentEvent.link}
              </a>
            </div>
          )}
        </div>
      )}

      <div style={styles.panel}>
        <div style={styles.panelTitle}>
          {eventId ? "Invites for this Event" : "All Invites"}
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {!eventId && <th style={styles.th}>Event</th>}
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {visibleInvites.map((inv) => {
                const ev = events.find((e) => e.id === inv.eventId);
                return (
                  <tr key={inv.id}>
                    {!eventId && <td style={styles.tdStrong}>{ev?.name || inv.eventId}</td>}
                    <td style={styles.td}>{inv.email}</td>
                    <td style={styles.td}>{inv.status}</td>
                    <td style={styles.td}>{new Date(inv.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}

              {visibleInvites.length === 0 && (
                <tr>
                  <td style={styles.tdMuted} colSpan={eventId ? 3 : 4}>
                    No invites yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.note}>Invites are saved locally (MVP).</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 14 },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 12px",
    borderRadius: 16,
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
  },

  h2: { margin: 0, fontSize: 22, fontWeight: 900, color: theme.text, letterSpacing: -0.2 },

  subtext: { fontSize: 13, fontWeight: 700, color: theme.muted, marginTop: 4 },

  panel: {
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: 14,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
  },

  panelTitle: { fontWeight: 900, color: theme.text, marginBottom: 10, fontSize: 14 },

  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontWeight: 800,
    outline: "none",
    flex: 1,
  },

  primaryBtn: {
    background: theme.blue,
    color: theme.surface,
    border: `1px solid ${theme.blue}`,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  secondaryBtn: {
    background: theme.surface,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  tableWrap: { width: "100%", overflowX: "auto", borderRadius: 14, border: `1px solid ${theme.border}` },

  table: { width: "100%", borderCollapse: "collapse", background: theme.surface },

  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 12,
    color: theme.muted,
    fontWeight: 900,
    borderBottom: `1px solid ${theme.border}`,
    background: theme.bg,
    whiteSpace: "nowrap",
  },

  td: { padding: "12px", fontSize: 14, color: theme.text, borderBottom: `1px solid ${theme.border}` },

  tdStrong: {
    padding: "12px",
    fontSize: 14,
    color: theme.text,
    borderBottom: `1px solid ${theme.border}`,
    fontWeight: 900,
  },

  tdMuted: { padding: "12px", fontSize: 14, color: theme.muted },

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.coral,
    color: theme.text,
    fontWeight: 900,
  },

  note: { marginTop: 10, fontSize: 12, color: theme.muted, fontWeight: 700 },
};
