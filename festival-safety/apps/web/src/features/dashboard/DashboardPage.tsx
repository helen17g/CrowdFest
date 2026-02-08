import React from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../app/theme";
import { useAppStore } from "../../state/store";

type CVSignal = "None" | "Crowd surge" | "Waving hands" | "Flashing signal";

function pickCurrentOrNextEvent(events: { startsAt: string; endsAt?: string | null }[]) {
  const now = Date.now();

  // running = now between start and end (or start only)
  const running = events.find((e) => {
    const start = new Date(e.startsAt).getTime();
    const end = e.endsAt ? new Date(e.endsAt).getTime() : null;
    if (Number.isNaN(start)) return false;
    if (end && !Number.isNaN(end)) return start <= now && now <= end;
    return start <= now; // if no end, treat as started
  });
  if (running) return running;

  // next = soonest upcoming start
  const upcoming = events
    .map((e) => ({ e, t: new Date(e.startsAt).getTime() }))
    .filter((x) => !Number.isNaN(x.t) && x.t >= now)
    .sort((a, b) => a.t - b.t)[0]?.e;

  return upcoming || null;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const attendees = useAppStore((s) => s.attendees);
  const events = useAppStore((s) => s.events);

  const highRisk = attendees.filter((a) => a.medicallyHighRisk);

  const currentEvent = React.useMemo(() => {
    // typesafe enough for MVP
    return pickCurrentOrNextEvent(events as any) as any;
  }, [events]);

  // MVP CV preview state (local only)
  const [cvCamera, setCvCamera] = React.useState("Main Stage — Cam 1");
  const [cvSignal, setCvSignal] = React.useState<CVSignal>("None");

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h2 style={styles.h2}>Dashboard</h2>
        <div style={styles.subtext}>Off-Field Admin</div>
      </div>

      {/* ✅ New: Top preview row */}
      <div style={styles.previewRow}>
        {/* Current Running Event */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Current Event</div>

          {currentEvent ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 950, color: theme.text }}>
                {currentEvent.name}
              </div>

              <div style={styles.meta}>
                <span style={styles.metaLabel}>Starts:</span>{" "}
                {new Date(currentEvent.startsAt).toLocaleString()}
              </div>

              <div style={styles.meta}>
                <span style={styles.metaLabel}>Venue:</span>{" "}
                {currentEvent.venue || "—"}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                <button
                  onClick={() => navigate(`/events/${currentEvent.id}`)}
                  style={styles.secondaryBtn}
                >
                  View / Edit
                </button>

                <button
                  onClick={() => navigate(`/events/${currentEvent.id}/invites`)}
                  style={styles.secondaryBtn}
                >
                  Invites
                </button>

                <button
                  onClick={() => navigator.clipboard.writeText(currentEvent.link)}
                  style={styles.secondaryBtn}
                >
                  Copy Link
                </button>
              </div>

              <div style={styles.note}>
                {isRunning(currentEvent) ? "Status: running" : "Status: upcoming"}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={styles.note}>No events yet.</div>
              <button onClick={() => navigate("/events/new")} style={styles.primaryBtn}>
                + Create Event
              </button>
            </div>
          )}
        </div>

        {/* Computer Vision Preview */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Computer Vision</div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={styles.meta}>
              <span style={styles.metaLabel}>Camera:</span>{" "}
              <select
                value={cvCamera}
                onChange={(e) => setCvCamera(e.target.value)}
                style={styles.select}
              >
                <option>Main Stage — Cam 1</option>
                <option>Entrance Gate — Cam 2</option>
                <option>Food Court — Cam 3</option>
              </select>
            </div>

            <div style={styles.alertBox}>
              <div style={{ fontWeight: 950, color: theme.text }}>Last Signal</div>
              <div style={{ marginTop: 6, fontWeight: 950, color: theme.text }}>
                {cvSignal}
              </div>
              <div style={styles.note}>MVP preview (not connected yet).</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setCvSignal("Crowd surge")}
                style={styles.secondaryBtn}
              >
                Simulate Surge
              </button>
              <button
                onClick={() => setCvSignal("Waving hands")}
                style={styles.secondaryBtn}
              >
                Simulate Hands
              </button>
              <button
                onClick={() => setCvSignal("Flashing signal")}
                style={styles.secondaryBtn}
              >
                Simulate Flash
              </button>
              <button onClick={() => setCvSignal("None")} style={styles.secondaryBtn}>
                Clear
              </button>
            </div>

            <button onClick={() => navigate("/computer-vision")} style={styles.primaryBtn}>
              Open Vision
            </button>
          </div>
        </div>
      </div>

      {/* Existing stats */}
      <div style={styles.cards}>
        <StatCard title="Total Attendees" value={String(attendees.length)} accent="blue" />
        <StatCard title="Medically High Risk" value={String(highRisk.length)} accent="coral" />
      </div>

      {/* Existing attendee table */}
      <div style={styles.panel}>
        <div style={styles.panelTitle}>All Attendees (risk flags)</div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Risk Flag</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((a) => (
                <tr key={a.id}>
                  <td style={styles.td}>{a.name}</td>
                  <td style={styles.td}>
                    {a.medicallyHighRisk ? (
                      <span style={styles.badgeHigh}>HIGH RISK</span>
                    ) : (
                      <span style={styles.badgeOk}>OK</span>
                    )}
                  </td>
                </tr>
              ))}
              {attendees.length === 0 && (
                <tr>
                  <td style={styles.tdMuted} colSpan={2}>
                    No attendees yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.note}>
          Flags indicate attendees marked as medically high risk.
        </div>
      </div>
    </div>
  );
}

function isRunning(e: any) {
  const now = Date.now();
  const start = new Date(e.startsAt).getTime();
  const end = e.endsAt ? new Date(e.endsAt).getTime() : null;
  if (Number.isNaN(start)) return false;
  if (end && !Number.isNaN(end)) return start <= now && now <= end;
  return start <= now;
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: "blue" | "purple" | "coral";
}) {
  const accentColor =
    accent === "blue" ? theme.blue : accent === "purple" ? theme.purple : theme.coral;

  return (
    <div style={styles.card}>
      <div style={{ ...styles.accentBar, background: accentColor }} />
      <div style={styles.cardInner}>
        <div style={styles.cardTitle}>{title}</div>
        <div style={styles.cardValue}>{value}</div>
      </div>
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
    boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
  },

  h2: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: theme.text,
    letterSpacing: -0.2,
  },

  subtext: { fontSize: 13, fontWeight: 700, color: theme.muted },

  previewRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 12,
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },

  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
  },

  accentBar: { height: 6, width: "100%" },
  cardInner: { padding: 14 },
  cardTitle: { fontSize: 13, fontWeight: 800, color: theme.muted, marginBottom: 8 },
  cardValue: { fontSize: 34, fontWeight: 950, color: theme.text, lineHeight: 1 },

  panel: {
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: 14,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
  },

  panelTitle: { fontWeight: 900, color: theme.text, marginBottom: 10, fontSize: 14 },

  meta: { fontSize: 13, fontWeight: 800, color: theme.muted },
  metaLabel: { color: theme.text, fontWeight: 950 },

  select: {
    padding: "8px 10px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontWeight: 900,
    outline: "none",
  },

  alertBox: {
    borderRadius: 16,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    padding: 14,
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

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
  },

  table: { width: "100%", borderCollapse: "collapse", background: theme.surface },

  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 12,
    color: theme.muted,
    fontWeight: 900,
    borderBottom: `1px solid ${theme.border}`,
    background: theme.bg,
  },

  td: {
    padding: "12px",
    fontSize: 14,
    color: theme.text,
    borderBottom: `1px solid ${theme.border}`,
  },

  tdMuted: { padding: "12px", fontSize: 14, color: theme.muted },

  badgeHigh: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    color: theme.text,
    background: theme.coral,
    border: `1px solid ${theme.border}`,
  },

  badgeOk: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    color: theme.text,
    background: theme.purple,
    border: `1px solid ${theme.border}`,
  },

  note: { marginTop: 10, fontSize: 12, color: theme.muted, fontWeight: 700 },
};
