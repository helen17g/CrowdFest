import React from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../app/theme";
import { useAppStore } from "../../state/store";

// Dummy event id generator (MVP)
function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function CreateEventPage() {
  const navigate = useNavigate();
  const addEvent = useAppStore((s) => s.addEvent);

  const [name, setName] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");

  const [created, setCreated] = React.useState<null | {
    eventId: string;
    link: string;
  }>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCopied(false);

    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!startsAt) {
      setError("Start date/time is required.");
      return;
    }

    const eventId = makeId();
    const link = `${window.location.origin}/events/${eventId}`;

    // ✅ SAVE EVENT (persisted via store.ts)
    addEvent({
      id: eventId,
      name: name.trim(),
      venue: venue.trim() || null,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      link,
    });

    setCreated({ eventId, link });
  };

  const onCopy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setError("Could not copy link. You can select and copy it manually.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.h2}>Create Event</h2>
          <div style={styles.subtext}>Generate an event link + QR for invites</div>
        </div>

        <button onClick={() => navigate("/events")} style={styles.secondaryBtn}>
          Back to Events
        </button>
      </div>

      <div style={styles.panel}>
        {!created ? (
          <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
            <Field label="Event Name *">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="CrowdFest Day 1"
                style={styles.input}
              />
            </Field>

            <Field label="Venue (optional)">
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Main Stage"
                style={styles.input}
              />
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

            {error && <div style={styles.error}>{error}</div>}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" style={styles.primaryBtn}>
                Create Event
              </button>

              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={() => {
                  setName("");
                  setVenue("");
                  setStartsAt("");
                  setEndsAt("");
                  setError(null);
                }}
              >
                Clear
              </button>
            </div>

            <div style={styles.note}>
              MVP: dummy ID + QR. Later replace with backend <code>createEvent</code>.
            </div>
          </form>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={styles.successTitle}>Event created ✅</div>

            <div style={styles.linkRow}>
              <input value={created.link} readOnly style={styles.input} />
              <button onClick={onCopy} style={styles.primaryBtn}>
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <div style={styles.qrWrap}>
              <div style={styles.qrTitle}>Invite QR (dummy)</div>

              <img
                alt="QR code"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  created.link
                )}`}
                style={styles.qrImg}
              />

              <div style={styles.note}>
                Attendees can scan this QR to open the invite link.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate(`/events/${created.eventId}/invites`)}
                style={styles.secondaryBtn}
              >
                Go to Invites
              </button>

              <button onClick={() => navigate("/events")} style={styles.secondaryBtn}>
                Back to Events
              </button>

              <button onClick={() => setCreated(null)} style={styles.secondaryBtn}>
                Create Another
              </button>
            </div>
          </div>
        )}
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

  note: { fontSize: 12, color: theme.muted, fontWeight: 700 },

  successTitle: { fontSize: 16, fontWeight: 950, color: theme.text },

  linkRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  qrWrap: {
    borderRadius: 16,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    padding: 14,
    display: "grid",
    gap: 10,
    justifyItems: "start",
  },

  qrTitle: { fontWeight: 900, color: theme.text, fontSize: 13 },

  qrImg: {
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
  },
};
