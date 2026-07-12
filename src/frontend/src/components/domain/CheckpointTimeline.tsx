import React from "react";
import { Icon } from "../ui/Icon";
import { Badge, type BadgeTone } from "../ui/Badge";

export type CheckpointStatus = "complete" | "pending" | "anomalous";

export interface TimelineCheckpoint {
  stage: string;
  status: CheckpointStatus;
  actor: string;
  timestamp: string;
}

const stageIcon: Record<string, string> = {
  Manufactured: "factory",
  LabTested: "flask-conical",
  Dispatched: "truck",
  Delivered: "package-check",
};
const statusTone: Record<CheckpointStatus, BadgeTone> = { complete: "good", pending: "pending", anomalous: "flag" };
const statusLabel: Record<CheckpointStatus, string> = { complete: "Complete", pending: "Pending", anomalous: "Flagged" };

export interface CheckpointTimelineProps {
  checkpoints: TimelineCheckpoint[];
}

/** CheckpointTimeline — vertical list of on-chain checkpoints for one batch. The dashboard's central artifact. */
export function CheckpointTimeline({ checkpoints }: CheckpointTimelineProps) {
  return (
    <div>
      {checkpoints.map((cp, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 16,
            padding: "16px 0",
            borderBottom: i < checkpoints.length - 1 ? "1px solid var(--hairline)" : "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: cp.status === "anomalous" ? "var(--status-flag-bg)" : "var(--ink-08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: cp.status === "anomalous" ? "var(--status-flag)" : "var(--text-primary)",
            }}
          >
            <Icon name={stageIcon[cp.stage] || "circle"} size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: "var(--weight-semibold)" as any,
                  fontSize: "var(--text-base)",
                  color: "var(--text-primary)",
                }}
              >
                {cp.stage}
              </span>
              <Badge tone={statusTone[cp.status] || "neutral"}>{statusLabel[cp.status] || cp.status}</Badge>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                color: "var(--text-secondary)",
                wordBreak: "break-all",
              }}
            >
              {cp.actor} · {cp.timestamp}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
