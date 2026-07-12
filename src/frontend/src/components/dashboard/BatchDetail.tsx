import React from "react";
import { Icon } from "../ui/Icon";
import { Card } from "../ui/Card";
import { Badge, type BadgeTone } from "../ui/Badge";
import { Tag } from "../ui/Tag";
import { BatchIdChip } from "../ui/BatchIdChip";
import { Tabs } from "../ui/Tabs";
import { Button } from "../ui/Button";
import { CheckpointTimeline, type TimelineCheckpoint } from "../domain/CheckpointTimeline";
import { RiskFlagCard, type FlagSeverity } from "../domain/RiskFlagCard";

export interface DashboardBatch {
  id: string;
  material?: string;
  riskLevel: "High" | "Medium" | "Low" | "None";
  checkpoints: TimelineCheckpoint[];
  flags: { severity: FlagSeverity; message: string; detail?: string }[];
  report: { text: string; confidence?: number } | null;
}

export interface BatchDetailProps {
  batch: DashboardBatch;
  onAddCheckpoint: () => void;
  addCheckpointDisabled?: boolean;
}

const riskTone: Record<DashboardBatch["riskLevel"], BadgeTone> = { High: "flag", Medium: "pending", Low: "good", None: "good" };

/** BatchDetail — the core dashboard screen: batch header + Timeline / Risk flags / AI report tabs. */
export function BatchDetail({ batch, onAddCheckpoint, addCheckpointDisabled }: BatchDetailProps) {
  const [tab, setTab] = React.useState("timeline");

  return (
    <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "36px 24px 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                fontWeight: "var(--weight-semibold)" as any,
                color: "var(--text-primary)",
                letterSpacing: "var(--tracking-tight)",
              }}
            >
              Batch
            </span>
            <BatchIdChip value={batch.id} truncate />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Badge tone={riskTone[batch.riskLevel]}>{batch.riskLevel === "None" ? "No risk detected" : `${batch.riskLevel} risk`}</Badge>
            {batch.material && <Tag>{batch.material}</Tag>}
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Icon name="plus" size={16} />}
          onClick={onAddCheckpoint}
          disabled={addCheckpointDisabled}
        >
          Add checkpoint
        </Button>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "timeline", label: "Timeline" },
          { value: "flags", label: `Risk flags${batch.flags.length ? ` (${batch.flags.length})` : ""}` },
          { value: "report", label: "AI report" },
        ]}
      />

      <div style={{ marginTop: 24 }}>
        {tab === "timeline" && (
          <Card padding="8px 24px">
            <CheckpointTimeline checkpoints={batch.checkpoints} />
          </Card>
        )}

        {tab === "flags" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {batch.flags.length === 0 ? (
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--status-good)" }}>
                  <Icon name="check-circle-2" size={18} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                    No Tier 0 rule violations detected.
                  </span>
                </div>
              </Card>
            ) : (
              batch.flags.map((f, i) => <RiskFlagCard key={i} {...f} />)
            )}
          </div>
        )}

        {tab === "report" && (
          <Card>
            {batch.report ? (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-xs)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--tracking-wide)",
                    color: "var(--text-secondary)",
                    fontWeight: "var(--weight-medium)" as any,
                    marginBottom: 10,
                  }}
                >
                  AI-generated risk assessment
                </div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-base)",
                    lineHeight: "var(--leading-normal)",
                    color: "var(--text-primary)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {batch.report.text}
                </p>
                {typeof batch.report.confidence === "number" && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid var(--hairline)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-xs)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Confidence: {(batch.report.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                Not escalated — Tier 0 found nothing severe enough to warrant an AI report.
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
