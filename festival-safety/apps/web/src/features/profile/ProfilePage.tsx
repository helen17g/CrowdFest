import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../state/store";
import { theme } from "../../app/theme";

export default function ProfilePage() {
  const navigate = useNavigate();
  const organizerProfile = useAppStore((s) => s.organizerProfile);
  const clearOrganizerProfile = useAppStore((s) => s.clearOrganizerProfile);

  // If no profile yet, send to setup
  React.useEffect(() => {
    if (!organizerProfile) navigate("/profile/setup", { replace: true });
  }, [organizerProfile, navigate]);

  if (!organizerProfile) return null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
          Organizer Profile
        </div>

        <div style={{ color: theme.muted, fontWeight: 700, marginBottom: 12 }}>
          Web (Out-of-Field Organizer)
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <Field label="Name" value={organizerProfile.name} />
          <Field label="Email" value={organizerProfile.email} />
          <Field label="Phone" value={organizerProfile.phone || "—"} />
          <Field label="Role" value="Out-of-Field Organizer" />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/profile/setup")}
            style={btn(theme.blue, theme.surface)}
          >
            Edit Profile
          </button>

          <button
            onClick={() => {
              clearOrganizerProfile();
              navigate("/profile/setup");
            }}
            style={btn(theme.surface, theme.text, theme.border)}
          >
            Log out (MVP)
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
      <div style={{ fontWeight: 800, color: theme.muted }}>{label}</div>
      <div style={{ fontWeight: 800, color: theme.text }}>{value}</div>
    </div>
  );
}

function btn(bg: string, color: string, border?: string) {
  return {
    background: bg,
    color,
    border: border ? `1px solid ${border}` : "none",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900 as const,
    cursor: "pointer",
  };
}
