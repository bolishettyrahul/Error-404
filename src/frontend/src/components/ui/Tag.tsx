import React from "react";

export interface TagProps {
  children?: React.ReactNode;
}

/** Tag — small neutral label for non-status metadata (stage name, actor role). Square-ish, not a pill. */
export function Tag({ children }: TagProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--ink-08)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-medium)" as any,
        padding: "3px 8px",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {children}
    </span>
  );
}
