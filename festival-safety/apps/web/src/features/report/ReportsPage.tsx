import React from "react";
import { theme } from "../../app/theme";
import { useAppStore } from "../../state/store";

type ReportItem = {
  id: string;
  createdAt: string;
  type: "PING_ATTENDEES" | "DISPATCH_ORGANIZERS";
  message: string;
  target: string;
  status: "queued" | "sent";
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ReportsPage() {
  const events = useAppStore((s) => s.events);

  const [selectedEventId, setSelectedEventId] = React.useState<string>(
    events[0]?.id || ""
  );
  const [message, setMessage] = React.useState(
    "Please stay calm and move away from the area."
  );
  const [zone, setZone] = React.useState("Main Stage");
  const [banner, setBanner] = React.useState<string | null>(null);

  const [reports, setReports] = React.useState<ReportItem[]>([]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  React.useEffect(() => {
    if (!selectedEventId && events[0]?.id) setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  const pushBanner = (text: string) => {
    setBanner(text);
    setTimeout(() => setBanner(null), 1400);
  };

  const pingAttendees = () => {
    const r: ReportItem = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      type: "PING_ATTENDEES",
      message: message.trim() || "(no message)",
      target: selectedEvent ? selectedEvent.name : "No event selected",
      status: "sent",
    };
    setReports((prev) => [r, ...prev]);
    pushBanner("Ping sent (placeholder).");
  };

  const dispatchOrganizers = () => {
    const r: ReportItem = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      type: "DISPATCH_ORGANIZERS",
      message: `Dispatch to: ${zone}`,
      target: selectedEvent ? selectedEvent.name : "No event selected",
      status: "queued",
    };
    setReports((prev) => [r, ...prev]);
    pushBanner("Dispatch queued (placeholder).");
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.h2}>Reports</h2>
          <div style={styles.subtext}>
            Safety response actions: ping attendees + dispatch organizers (MVP)
          </div>
        </div>
      </div>

      {banner && <div style={styles.banner}>{banner}</div>}

      <div style={styles.panel}>
        <div style={styles.panelTitle}>Active Event</div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={styles.select}
          >
            <option value="">(Select event)</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          <div style={styles.note}>
            {selectedEvent
              ? `Link: ${selectedEvent.link}`
              : "Create an event first to target actions."}
          </div>
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Ping Attendees</div>
          <div style={styles.note}>
            Sends a safety notification to attendees (placeholder).
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={styles.textarea}
          />

          <button
            onClick={pingAttendees}
            style={styles.primaryBtn}
            disabled={!selectedEventId}
            title={!selectedEventId ? "Select an event first" : ""}
          >
            Send Ping
          </button>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Dispatch Organizers</div>
          <div style={styles.note}>
            Dispatch in-field staff to a danger zone (placeholder).
          </div>

          <input
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="Zone / area (e.g., Main Stage)"
            style={styles.input}
          />

          <button
            onClick={dispatchOrganizers}
            style={styles.secondaryBtn}
            disabled={!selectedEventId}
            title={!selectedEventId ? "Select an event first" : ""}
          >
            Dispatch Team
          </button>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}>Activity Log (MVP)</div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td style={styles.td}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td style={styles.tdStrong}>
                    {r.type === "PING_ATTENDEES"
                      ? "Ping attendees"
                      : "Dispatch organizers"}
                  </td>
                  <td style={styles.td}>{r.target}</td>
                  <td style={styles.td}>{r.message}</td>
                  <td style={styles.td}>{r.status}</td>
                </tr>
              ))}

              {reports.length === 0 && (
                <tr>
                  <td style={styles.tdMuted} colSpan={5}>
                    No actions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.note}>
          Later: wire to backend notification + dispatch endpoints and store reports per event.
        </div>
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

  subtext: { fontSize: 13, fontWeight: 700, color: theme.muted, marginTop: 4 },

  banner: {
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: "10px 12px",
    fontWeight: 900,
    color: theme.text,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 12,
  },

  panel: {
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: 14,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
  },

  panelTitle: { fontWeight: 900, color: theme.text, marginBottom: 10, fontSize: 14 },

  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontWeight: 800,
    outline: "none",
    minWidth: 240,
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontWeight: 800,
    outline: "none",
    marginBottom: 10,
  },

  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontWeight: 800,
    outline: "none",
    resize: "vertical",
    marginBottom: 10,
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
    verticalAlign: "top",
  },

  tdMuted: { padding: "12px", fontSize: 14, color: theme.muted },

  note: { marginTop: 10, fontSize: 12, color: theme.muted, fontWeight: 700 },
};
