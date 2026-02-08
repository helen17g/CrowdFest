import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { theme } from "../../app/theme";
import { useAppStore } from "../../state/store";

export default function EventDetailPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const getEventById = useAppStore((s) => s.getEventById);
  const updateEvent = useAppStore((s) => s.updateEvent);

  const event = eventId ? getEventById(eventId) : undefined;

  const [name, setName] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");

  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!event) return;
    setName(event.name || "");
    setVenue(event.venue || "");
    setStartsAt(toLocalInput(event.startsAt));
    setEndsAt(event.endsAt ? toLocalInput(event.endsAt) : "");
  }, [event]);

  if (!eventId || !event) {
    return (
      <div style={styles.page}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Event not found</div>
          <div style={styles.note}>
            This event doesn’t exist locally yet.
          </div>
          <button onClick={() => navigate("/events")} style={styles.secondaryBtn}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!startsAt) {
      setError("Start date/time is required.");
      return;
    }

    updateEvent(eventId, {
      name: name.trim(),
      venue: venue.trim() || null,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      // keep link same (or re-generate if you want)
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.h2}>Edit Event</h2>
          <div style={styles.subtext}>{event.name}</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => navigate(`/events/${eventId}/invites`)} style={styles.secondaryBtn}>
            Invites
          </button>
          <button onClick={() => navigate("/events")} style={styles.secondaryBtn}>
            Back to Events
          </button>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}>Event Details</div>

        <form onSubmit={onSave} style={{ display: "grid", gap: 12 }}>
          <Field label="Event Name *">
            <input value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
          </Field>

          <Field label="Venue (optional)">
            <input value={venue} onChange={(e) => setVenue(e.target.value)} style={styles.input} />
          </Field>

          <div style={styles.grid2}>
            <Field label="Starts At *">
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                style={styles.input}
              />
            </Field>

            <Field label="Ends At (optional)">
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                style={styles.input}
              />
            </Field>
          </div>

          <Field label="Invite Link">
            <input value={event.link} readOnly style={styles.input} />
          </Field>

          {error && <div style={styles.error}>{error}</div>}
          {saved && <div style={styles.saved}>Saved ✅</div>}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" style={styles.primaryBtn}>
              Save Changes
            </button>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigator.clipboard.writeText(event.link)}
            >
              Copy Link
            </button>
          </div>

          <div style={styles.note}>
            MVP: edits are saved locally. Later wire to backend update callable if available.
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={styles.label}>{label}</div>
      {children}
    </label>
  );
}

// Convert ISO string -> datetime-local input value (yyyy-MM-ddTHH:mm)
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
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

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },

  label: { fontSize: 12, fontWeight: 900, color: theme.muted },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontWeight: 800,
    outline: "none",
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

  error: {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.coral,
    color: theme.text,
    fontWeight: 900,
  },

  saved: {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.purple,
    color: theme.text,
    fontWeight: 900,
  },

  note: { fontSize: 12, color: theme.muted, fontWeight: 700 },
};
