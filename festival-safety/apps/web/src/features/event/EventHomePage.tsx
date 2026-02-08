import React from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../app/theme";
import { useAppStore } from "../../state/store";

export default function EventHomePage() {
  const navigate = useNavigate();
  const events = useAppStore((s) => s.events);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.h2}>Events</h2>
          <div style={styles.subtext}>Create and manage festival events</div>
        </div>

        <button onClick={() => navigate("/events/new")} style={styles.primaryBtn}>
          + Create Event
        </button>
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}>All Events</div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>Venue</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td style={styles.tdStrong}>{e.name}</td>
                  <td style={styles.td}>
                    {new Date(e.startsAt).toLocaleString()}
                  </td>
                  <td style={styles.td}>{e.venue || "—"}</td>

                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => navigate(`/events/${e.id}`)}
                        style={styles.secondaryBtn}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => navigate(`/events/${e.id}/invites`)}
                        style={styles.secondaryBtn}
                      >
                        Invites
                      </button>

                      <button
                        onClick={() => navigator.clipboard.writeText(e.link)}
                        style={styles.secondaryBtn}
                      >
                        Copy Link
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {events.length === 0 && (
                <tr>
                  <td style={styles.tdMuted} colSpan={4}>
                    No events yet. Click “Create Event” to make your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.note}>Events are saved locally (MVP).</div>
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

  h2: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: theme.text,
    letterSpacing: -0.2,
  },

  subtext: {
    fontSize: 13,
    fontWeight: 700,
    color: theme.muted,
    marginTop: 4,
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
    padding: "8px 10px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  panel: {
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: 14,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
  },

  panelTitle: {
    fontWeight: 900,
    color: theme.text,
    marginBottom: 10,
    fontSize: 14,
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: theme.surface,
  },

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

  td: {
    padding: "12px",
    fontSize: 14,
    color: theme.text,
    borderBottom: `1px solid ${theme.border}`,
    verticalAlign: "top",
  },

  tdStrong: {
    padding: "12px",
    fontSize: 14,
    color: theme.text,
    borderBottom: `1px solid ${theme.border}`,
    fontWeight: 900,
  },

  tdMuted: {
    padding: "12px",
    fontSize: 14,
    color: theme.muted,
  },

  note: {
    marginTop: 10,
    fontSize: 12,
    color: theme.muted,
    fontWeight: 700,
  },
};
