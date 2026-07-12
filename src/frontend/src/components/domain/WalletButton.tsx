import React from "react";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";

export interface WalletButtonProps {
  connected: boolean;
  address?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/** WalletButton — CIP-30 connect affordance. Shows a connect action, or the connected address once signed in. */
export function WalletButton({ connected, address, onConnect, onDisconnect }: WalletButtonProps) {
  if (connected && address) {
    return (
      <button
        onClick={onDisconnect}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--status-good-bg)",
          color: "var(--status-good)",
          border: "none",
          borderRadius: "var(--radius-pill)",
          padding: "7px 14px",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--weight-medium)" as any,
          cursor: "pointer",
        }}
      >
        <Icon name="shield-check" size={14} />
        <span style={{ fontFamily: "var(--font-mono)" }}>
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      </button>
    );
  }
  return (
    <Button variant="secondary" size="sm" icon={<Icon name="wallet" size={15} />} onClick={onConnect}>
      Connect wallet
    </Button>
  );
}
