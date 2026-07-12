import React from "react";

export type BadgeTone = "good" | "pending" | "flag" | "info" | "neutral";

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  good: { bg: "var(--status-good-bg)", fg: "var(--status-good)" },
  pending: { bg: "var(--status-pending-bg)", fg: "var(--status-pending)" },
  flag: { bg: "var(--status-flag-bg)", fg: "var(--status-flag)" },
  info: { bg: "var(--status-info-bg)", fg: "var(--status-info)" },
  neutral: { bg: "var(--ink-08)", fg: "var(--text-secondary)" },
};

export interface BadgeProps {
  children?: React.ReactNode;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Badge — status pill (risk level, checkpoint state). Muted bg + saturated fg, never a solid fill. */
export function Badge({ children, tone = "neutral", icon, style }: BadgeProps) {
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: t.bg,
        color: t.fg,
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-medium)" as any,
        padding: "4px 10px",
        borderRadius: "var(--radius-pill)",
        lineHeight: 1.4,
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
}
