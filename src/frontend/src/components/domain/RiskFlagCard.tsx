import React from "react";
import { Icon } from "../ui/Icon";
import { Badge, type BadgeTone } from "../ui/Badge";

export type FlagSeverity = "high" | "medium" | "low";

const sevTone: Record<FlagSeverity, BadgeTone> = { high: "flag", medium: "pending", low: "neutral" };
const sevLabel: Record<FlagSeverity, string> = { high: "High", medium: "Medium", low: "Low" };

export interface RiskFlagCardProps {
  severity?: FlagSeverity;
  message: string;
  detail?: string;
}

/** RiskFlagCard — one Tier-0 deterministic rule violation. Plain-language, exact numbers, no jargon. */
export function RiskFlagCard({ severity = "medium", message, detail }: RiskFlagCardProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "14px 16px",
        background: severity === "high" ? "var(--status-flag-bg)" : "var(--surface)",
        border: severity === "high" ? "none" : "1px solid var(--hairline)",
        borderRadius: "var(--radius-field)",
      }}
    >
      <Icon
        name={severity === "high" ? "alert-triangle" : "alert-circle"}
        size={18}
        color={severity === "high" ? "var(--status-flag)" : "var(--status-pending)"}
        style={{ marginTop: 1 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: "var(--weight-medium)" as any,
              fontSize: "var(--text-sm)",
              color: "var(--text-primary)",
            }}
          >
            {message}
          </span>
          <Badge tone={sevTone[severity]}>{sevLabel[severity]}</Badge>
        </div>
        {detail && <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{detail}</div>}
      </div>
    </div>
  );
}
