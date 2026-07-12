import React from "react";
import { Icon } from "./Icon";

export type ToastTone = "good" | "flag" | "info";

const tones: Record<ToastTone, { fg: string; icon: string }> = {
  good: { fg: "var(--status-good)", icon: "check-circle-2" },
  flag: { fg: "var(--status-flag)", icon: "alert-triangle" },
  info: { fg: "var(--status-info)", icon: "shield-check" },
};

export interface ToastProps {
  tone?: ToastTone;
  children?: React.ReactNode;
  onDismiss?: () => void;
}

/** Toast — transient confirmation, e.g. "Submitted to Preprod testnet". */
export function Toast({ tone = "info", children, onDismiss }: ToastProps) {
  const t = tones[tone] || tones.info;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--surface)",
        boxShadow: "var(--shadow-modal)",
        borderRadius: "var(--radius-field)",
        padding: "12px 16px",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-sm)",
        color: "var(--text-primary)",
        minWidth: 280,
      }}
    >
      <Icon name={t.icon} size={18} color={t.fg} />
      <div style={{ flex: 1 }}>{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-secondary)" }}
          aria-label="Dismiss"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}
