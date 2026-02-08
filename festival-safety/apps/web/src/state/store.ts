import { create } from "zustand";

/* ---------- Types ---------- */
export type Attendee = {
  id: string;
  name: string;
  medicallyHighRisk: boolean;
};

// Web app is ONLY Out-of-Field
export type OrganizerRole = "OUT_OF_FIELD";

export type OrganizerProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: OrganizerRole; // always "OUT_OF_FIELD"
};

export type EventItem = {
  id: string;
  name: string;
  venue?: string | null;
  startsAt: string; // ISO
  endsAt?: string | null; // ISO
  link: string;
};

export type InviteItem = {
  id: string;
  eventId: string;
  email: string;
  createdAt: string; // ISO
  status: "pending" | "sent" | "accepted";
};

/* ---------- LocalStorage helpers ---------- */
const PROFILE_KEY = "festivalSafety.organizerProfile";
const LS_EVENTS = "cf_events_v1";
const LS_INVITES = "cf_invites_v1";

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore for MVP
  }
}

function loadProfile(): OrganizerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OrganizerProfile;
  } catch {
    return null;
  }
}

function saveProfile(profile: OrganizerProfile | null) {
  try {
    if (!profile) localStorage.removeItem(PROFILE_KEY);
    else localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore for MVP
  }
}

/* ---------- Store ---------- */
type StoreState = {
  attendees: Attendee[];

  organizerProfile: OrganizerProfile | null;
  setOrganizerProfile: (profile: OrganizerProfile) => void;
  clearOrganizerProfile: () => void;

  events: EventItem[];
  invites: InviteItem[];

  addEvent: (event: EventItem) => void;
  addInvite: (invite: InviteItem) => void;

  getInvitesForEvent: (eventId: string) => InviteItem[];

  // ✅ EDIT SUPPORT
  getEventById: (eventId: string) => EventItem | undefined;
  updateEvent: (eventId: string, patch: Partial<EventItem>) => void;

  clearAllEventData: () => void;
};

export const useAppStore = create<StoreState>((set, get) => ({
  attendees: [
    { id: "1", name: "Attendee 1", medicallyHighRisk: true },
    { id: "2", name: "Attendee 2", medicallyHighRisk: false },
    { id: "3", name: "Attendee 3", medicallyHighRisk: true },
  ],

  organizerProfile: typeof window !== "undefined" ? loadProfile() : null,

  setOrganizerProfile: (profile) => {
    saveProfile(profile);
    set({ organizerProfile: profile });
  },

  clearOrganizerProfile: () => {
    saveProfile(null);
    set({ organizerProfile: null });
  },

  events: typeof window !== "undefined" ? loadJson<EventItem[]>(LS_EVENTS, []) : [],
  invites:
    typeof window !== "undefined" ? loadJson<InviteItem[]>(LS_INVITES, []) : [],

  addEvent: (event) => {
    const next = [event, ...get().events];
    saveJson(LS_EVENTS, next);
    set({ events: next });
  },

  addInvite: (invite) => {
    const next = [invite, ...get().invites];
    saveJson(LS_INVITES, next);
    set({ invites: next });
  },

  getInvitesForEvent: (eventId) => {
    return get().invites.filter((i) => i.eventId === eventId);
  },

  // ✅ EDIT SUPPORT
  getEventById: (eventId) => get().events.find((e) => e.id === eventId),

  updateEvent: (eventId, patch) => {
    const next = get().events.map((e) =>
      e.id === eventId ? { ...e, ...patch } : e
    );
    saveJson(LS_EVENTS, next);
    set({ events: next });
  },

  clearAllEventData: () => {
    saveJson(LS_EVENTS, []);
    saveJson(LS_INVITES, []);
    set({ events: [], invites: [] });
  },
}));
