export type Level = "high" | "medium" | "low";

export interface Evidence {
  rule: string;
  title: string;
  detail: string;
  points: number;
  message_ids: string[];
  data: {
    pairs?: { a: string; b: string; similarity?: number; gap_minutes?: number }[];
  };
}

export type ReviewStatus = "needs_review" | "escalated" | "dismissed";

export interface Review {
  status: ReviewStatus;
  note: string;
  updated_at: string | null;
}

export interface Cluster {
  id: string;
  key: string;
  review: Review;
  status: string;
  score: number;
  level: Level;
  message_ids: string[];
  accounts: string[];
  urls: string[];
  first_seen: string;
  last_seen: string;
  evidence: Evidence[];
  limitations: string[];
  summary: string;
  summary_source: string;
}

export interface GraphNode {
  id: string;
  type: "account" | "message" | "url";
  label: string;
  cluster_id: string | null;
  degree: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "sent" | "contains" | "similar";
  weight: number | null;
}

export interface MessageRow {
  message_id: string;
  sender_id: string;
  timestamp: string;
  text: string;
  urls: string[];
  cluster_id: string | null;
}

export interface Dataset {
  id: number;
  name: string;
  uploaded_at: string;
  message_count: number;
}

export interface Analysis {
  dataset: Dataset;
  stats: { messages: number; accounts: number; urls: number; clusters: number; flagged_messages: number };
  clusters: Cluster[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  messages: MessageRow[];
  config: { similarity_threshold: number; time_window_minutes: number; min_tokens: number };
  disclaimer: string;
  review_statuses: Record<ReviewStatus, string>;
}

export interface ValidationReport {
  total_rows: number;
  accepted: number;
  rejected: number;
  errors: { row: number; message_id: string | null; reason: string }[];
}

export interface UploadResult {
  dataset: Dataset;
  validation: ValidationReport;
}
