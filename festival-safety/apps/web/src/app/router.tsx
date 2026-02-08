import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";

import { theme } from "./theme";

import DashboardPage from "../features/dashboard/DashboardPage";
import ProfileSetupPage from "../features/profile/ProfileSetupPage";
import ProfilePage from "../features/profile/ProfilePage";

import EventHomePage from "../features/event/EventHomePage";
import CreateEventPage from "../features/event/CreateEventPage";
import EventDetailPage from "../features/event/EventDetailPage";

import InvitesPage from "../features/invites/InvitesPage";
import ComputerVisionPage from "../features/computer-vision/ComputerVisionPage";
import ReportsPage from "../features/report/ReportsPage";

import { useAppStore } from "../state/store";

/* ---------- Nav Link ---------- */
function NavItem({ to, label }: { to: string; label: string }) {
  const location = useLocation();

  // ✅ highlight parent tabs too (e.g. /events and /events/123)
  const active = location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <Link
      to={to}
      style={{
        padding: "8px 12px",
        borderRadius: 12,
        fontWeight: 800,
        fontSize: 13,
        textDecoration: "none",
        color: active ? theme.surface : theme.text,
        background: active ? theme.blue : "transparent",
        border: `1px solid ${active ? theme.blue : theme.border}`,
      }}
    >
      {label}
    </Link>
  );
}

/* ---------- App Shell ---------- */
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      }}
    >
      <header
        style={{
          background: theme.surface,
          borderBottom: `1px solid ${theme.border}`,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: -0.3,
            color: theme.text,
          }}
        >
          CrowdFest Admin
        </div>

        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <NavItem to="/dashboard" label="Dashboard" />
          <NavItem to="/computer-vision" label="Vision" />
          <NavItem to="/events" label="Events" />
          <NavItem to="/invites" label="Invites" />
          <NavItem to="/reports" label="Reports" />
          <NavItem to="/profile" label="Profile" />
        </nav>
      </header>

      <main style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}

function RequireOutOfField({ children }: { children: React.ReactNode }) {
  const profile = useAppStore((s) => s.organizerProfile);
  const location = useLocation();

  // Allow the setup page always
  if (location.pathname === "/profile/setup") return <>{children}</>;

  // No profile? force setup
  if (!profile) return <Navigate to="/profile/setup" replace />;

  // Wrong role? force setup
  if (profile.role !== "OUT_OF_FIELD") {
    return <Navigate to="/profile/setup" replace />;
  }

  return <>{children}</>;
}

/* ---------- Router ---------- */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <RequireOutOfField>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Profile */}
            <Route path="/profile/setup" element={<ProfileSetupPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Vision */}
            <Route path="/computer-vision" element={<ComputerVisionPage />} />

            {/* Events */}
            <Route path="/events" element={<EventHomePage />} />
            <Route path="/events/new" element={<CreateEventPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/events/:eventId/invites" element={<InvitesPage />} />

            {/* Invites (global placeholder) */}
            <Route path="/invites" element={<InvitesPage />} />

            {/* Reports */}
            <Route path="/reports" element={<ReportsPage />} />

            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </RequireOutOfField>
      </AppShell>
    </BrowserRouter>
  );
}
