import React from "react";
import { theme } from "../../app/theme";

type Feed = {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  lastSignal: "None" | "Crowd surge" | "Waving hands" | "Flashing signal";
};

const DEMO_FEEDS: Feed[] = [
  { id: "cam-1", name: "Main Stage — Cam 1", status: "disconnected", lastSignal: "None" },
  { id: "cam-2", name: "Entrance Gate — Cam 2", status: "disconnected", lastSignal: "None" },
  { id: "cam-3", name: "Food Court — Cam 3", status: "disconnected", lastSignal: "None" },
];

export default function ComputerVisionPage() {
  const [feeds, setFeeds] = React.useState<Feed[]>(DEMO_FEEDS);
  const [selected, setSelected] = React.useState<string>(DEMO_FEEDS[0].id);
  const [banner, setBanner] = React.useState<string | null>(null);

  const current = feeds.find((f) => f.id === selected)!;

  const setFeed = (id: string, patch: Partial<Feed>) => {
    setFeeds((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const connect = () => {
    setFeed(selected, { status: "connected" });
    setBanner(`Connected to ${current.name} (placeholder).`);
    setTimeout(() => setBanner(null), 1500);
  };

  const disconnect = () => {
    setFeed(selected, { status: "disconnected", lastSignal: "None" });
    setBanner(`Disconnected from ${current.name}.`);
    setTimeout(() => setBanner(null), 1500);
  };

  // Demo “detections”
  const simulate = (signal: Feed["lastSignal"]) => {
    if (current.status !== "connected") {
      setBanner("Connect to a camera first.");
      setTimeout(() => setBanner(null), 1400);
      return;
    }
    setFeed(selected, { lastSignal: signal });
    setBanner(`Detection: ${signal}`);
    setTimeout(() => setBanner(null), 1500);
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.h2}>Computer Vision</h2>
          <div style={styles.subtext}>
            Monitor camera feeds for crowd danger signals (placeholder)
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {current.status === "connected" ? (
            <button onClick={disconnect} style={styles.secondaryBtn}>
              Disconnect
            </button>
          ) : (
            <button onClick={connect} style={styles.primaryBtn}>
              Connect Camera
            </button>
          )}
        </div>
      </div>

      {banner && <div style={styles.banner}>{banner}</div>}

      <div style={styles.grid}>
        {/* Left: Feeds list */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Cameras</div>

          <div style={{ display: "grid", gap: 8 }}>
            {feeds.map((f) => {
              const active = f.id === selected;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelected(f.id)}
                  style={{
                    ...styles.feedBtn,
                    borderColor: active ? theme.blue : theme.border,
                    background: active ? theme.bg : theme.surface,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 950, color: theme.text }}>{f.name}</div>
                    <span
                      style={{
                        ...styles.pill,
                        background: f.status === "connected" ? theme.purple : theme.bg,
                      }}
                    >
                      {f.status}
                    </span>
                  </div>

                  <div style={{ marginTop: 6, color: theme.muted, fontWeight: 800, fontSize: 12 }}>
                    Last signal: <span style={{ color: theme.text }}>{f.lastSignal}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={styles.note}>
            MVP: this list is static. Later you’ll pull cameras from config + connect to streams.
          </div>
        </div>

        {/* Right: Feed preview + controls */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Feed Preview</div>

          <div style={styles.preview}>
            <div style={styles.previewInner}>
              <div style={{ fontWeight: 950, color: theme.text }}>{current.name}</div>
              <div style={{ color: theme.muted, fontWeight: 800, marginTop: 6 }}>
                Status:{" "}
                <span style={{ color: theme.text, fontWeight: 950 }}>{current.status}</span>
              </div>

              <div style={{ marginTop: 10, color: theme.muted, fontWeight: 800 }}>
                (Video stream placeholder)
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={styles.panelTitle}>Detection Controls (Demo)</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => simulate("Crowd surge")} style={styles.secondaryBtn}>
                Simulate Crowd Surge
              </button>
              <button onClick={() => simulate("Waving hands")} style={styles.secondaryBtn}>
                Simulate Waving Hands
              </button>
              <button onClick={() => simulate("Flashing signal")} style={styles.secondaryBtn}>
                Simulate Flashing Signal
              </button>
              <button onClick={() => simulate("None")} style={styles.secondaryBtn}>
                Clear
              </button>
            </div>

            <div style={styles.alertBox}>
              <div style={{ fontWeight: 950 }}>Current Detection</div>
              <div style={{ marginTop: 6, fontWeight: 900, color: theme.text }}>
                {current.lastSignal}
              </div>
              <div style={styles.note}>
                Later: this will be real-time CV inference + event-linked alerts.
              </div>
            </div>
          </div>
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

  h2: { margin: 0, fontSize: 22, fontWeight: 900, color: theme.text, letterSpacing: -0.2 },

  subtext: { fontSize: 13, fontWeight: 700, color: theme.muted, marginTop: 4 },

  banner: {
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: "10px 12px",
    fontWeight: 900,
    color: theme.text,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
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

  feedBtn: {
    textAlign: "left",
    padding: 12,
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    cursor: "pointer",
  },

  pill: {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    fontWeight: 950,
    fontSize: 12,
    color: theme.text,
    height: "fit-content",
    whiteSpace: "nowrap",
  },

  preview: {
    borderRadius: 16,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    overflow: "hidden",
    marginBottom: 12,
    minHeight: 240,
    display: "grid",
    placeItems: "center",
  },

  previewInner: {
    width: "100%",
    padding: 16,
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

  note: { marginTop: 10, fontSize: 12, color: theme.muted, fontWeight: 700 },
};
