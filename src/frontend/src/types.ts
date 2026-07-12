export enum Stage {
  Manufactured = "Manufactured",
  LabTested = "LabTested",
  Dispatched = "Dispatched",
  Delivered = "Delivered",
}

export interface Checkpoint {
  stage: Stage;
  actor_pkh: string;
  data_hash: string;
  slot: number;
}

export interface Flag {
  rule_id: string;
  severity: "low" | "medium" | "high";
  message: string;
  checkpoint_indices?: number[];
  details?: Record<string, any>;
}

export interface EscalateDecision {
  escalate: boolean;
  reasoning: string;
}

export interface Report {
  report: string;
  confidence: number;
}

export interface BatchData {
  batch_id: string;
  checkpoints: Checkpoint[];
  flags: Flag[];
  risk_level: "low" | "medium" | "high";
  escalation: EscalateDecision | null;
  report: Report | null;
}
