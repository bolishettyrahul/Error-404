import { BatchData, Stage } from "../types";
import type { DashboardBatch } from "../components/dashboard/BatchDetail";
import type { CheckpointStatus } from "../components/domain/CheckpointTimeline";
import type { FlagSeverity } from "../components/domain/RiskFlagCard";

export const STAGE_SEQUENCE = [Stage.Manufactured, Stage.LabTested, Stage.Dispatched, Stage.Delivered];

// Backend does a prefix match (`id.startsWith("B-2024-GOOD" | "B-2024-FRAUD")`),
// so the short demo-script IDs resolve to the full seeded batch IDs.
export const DEMO_BATCH_IDS = ["B-2024-GOOD", "B-2024-FRAUD"];

export function shortenHex(value: string, length = 8): string {
  if (!value || value.length <= length * 2) return value;
  return `${value.slice(0, length)}…${value.slice(-4)}`;
}

// `slot` is a Cardano slot number, not a Unix timestamp — seeded demo data uses small
// synthetic slot counters (e.g. 100000), so it can't be safely rendered as a calendar date.
function formatTimestamp(slot: number): string {
  return `Slot ${slot.toLocaleString()}`;
}

const riskLevelMap: Record<BatchData["risk_level"], DashboardBatch["riskLevel"]> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Maps the backend's BatchData response into the shape the design system's dashboard components expect. */
export function toDashboardBatch(data: BatchData): DashboardBatch {
  const checkpoints = data.checkpoints.map((cp, idx) => {
    const isFlagged = data.flags.some((f) => f.checkpoint_indices?.includes(idx));
    const isLast = idx === data.checkpoints.length - 1;
    const status: CheckpointStatus = isFlagged ? "anomalous" : isLast ? "pending" : "complete";
    return {
      stage: cp.stage,
      status,
      actor: shortenHex(cp.actor_pkh, 10),
      timestamp: formatTimestamp(cp.slot),
    };
  });

  const flags = data.flags.map((f) => ({
    severity: f.severity as FlagSeverity,
    message: f.message,
    detail: f.rule_id ? f.rule_id.replace(/_/g, " ") : undefined,
  }));

  return {
    id: data.batch_id,
    riskLevel: data.flags.length ? riskLevelMap[data.risk_level] : "None",
    checkpoints,
    flags,
    report: data.report ? { text: data.report.report, confidence: data.report.confidence } : null,
  };
}

export function nextStageOptions(checkpointCount: number): { value: string; label: string }[] {
  const next = STAGE_SEQUENCE[checkpointCount];
  if (!next) return [];
  return [{ value: next, label: next.replace(/([A-Z])/g, " $1").trim() }];
}
