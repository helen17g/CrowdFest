export type Urgency = "EMERGENCY" | "NEEDS_HELP_SOON" | "FYI";
export type Category =
  | "MEDICAL"
  | "SAFETY/SECURITY"
  | "HARASSMENT"
  | "ACCESSIBILITY"
  | "LOST_PERSON"
  | "LOST_ITEM"
  | "FACILITY"
  | "OTHER";

export type ReportStatus =
  | "OPEN"
  | "CLAIMED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "ESCALATED";

export type LocationMode = "CURRENT" | "PICKED" | "MANUAL";

export interface ReportLocation {
  mode: LocationMode;
  label?: string | null;
  lat?: number | null;
  lng?: number | null;
  accuracyM?: number | null;
}

export interface ReportContact {
  needContactBack: boolean;
  method: "IN_APP_CHAT" | "TEXT" | "CALL" | "EMAIL";
  value?: string | null;
}

export interface CreateReportInput {
  urgency: Urgency;
  immediateDanger: boolean;
  category: Category;
  description: string;

  location: ReportLocation;
  contact: ReportContact;
}
