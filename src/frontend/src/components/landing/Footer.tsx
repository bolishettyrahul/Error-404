import React from "react";
import { Icon } from "../ui/Icon";

/** Footer — flat, light closing bar for the marketing landing page. */
export function Footer() {
  return (
    <footer style={{ padding: "48px 32px", background: "var(--paper)" }}>
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-semibold)" as any,
            color: "var(--ink)",
          }}
        >
          <Icon name="shield-check" size={16} color="var(--ink)" />
          TrueBatch
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            color: "var(--text-secondary)",
            maxWidth: 520,
            textAlign: "right",
          }}
        >
          TrueBatch records checkpoints on the Cardano Preview testnet. It does not certify material safety or verify
          the truthfulness of any submitted data — only that, once recorded, it cannot be altered.
        </p>
      </div>
    </footer>
  );
}
