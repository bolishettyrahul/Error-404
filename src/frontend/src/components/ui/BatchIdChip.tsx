import React from "react";
import { Icon } from "./Icon";

export interface BatchIdChipProps {
  value: string;
  copyable?: boolean;
  truncate?: boolean;
}

/** BatchIdChip — the monospaced, copyable unit for batch IDs / hashes / tx hashes used throughout the dashboard. */
export function BatchIdChip({ value, copyable = true, truncate = false }: BatchIdChipProps) {
  const [copied, setCopied] = React.useState(false);
  const display = truncate && value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--ink-08)",
        borderRadius: "var(--radius-sm)",
        padding: "4px 8px",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        color: "var(--text-primary)",
      }}
    >
      {display}
      {copyable && (
        <button
          onClick={copy}
          type="button"
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            display: "inline-flex",
            cursor: "pointer",
            color: copied ? "var(--status-good)" : "var(--text-secondary)",
          }}
          aria-label="Copy"
        >
          <Icon name={copied ? "check" : "copy"} size={12} />
        </button>
      )}
    </span>
  );
}
