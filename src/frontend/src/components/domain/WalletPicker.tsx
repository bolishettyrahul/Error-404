import React from "react";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { listInstalledWallets, connectWallet, type ConnectedWallet } from "../../lib/wallet";

export interface WalletPickerProps {
  open: boolean;
  onClose: () => void;
  onConnected: (wallet: ConnectedWallet) => void;
}

/** WalletPicker — lists installed CIP-30 wallet extensions and enables the one the user picks. */
export function WalletPicker({ open, onClose, onConnected }: WalletPickerProps) {
  const [connectingId, setConnectingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const wallets = React.useMemo(() => (open ? listInstalledWallets() : []), [open]);

  const pick = async (id: string) => {
    setConnectingId(id);
    setError(null);
    try {
      const wallet = await connectWallet(id);
      onConnected(wallet);
    } catch (err: any) {
      setError(err?.message || "Wallet connection was cancelled or failed.");
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Connect wallet">
      {wallets.length === 0 ? (
        <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          No CIP-30 wallet extension found in this browser. Install a Cardano wallet (Lace, Eternl) and reload.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => pick(w.id)}
              disabled={connectingId !== null}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                border: "1px solid var(--hairline)",
                background: "var(--surface)",
                borderRadius: "var(--radius-field)",
                padding: "10px 14px",
                cursor: connectingId !== null ? "not-allowed" : "pointer",
                opacity: connectingId !== null && connectingId !== w.id ? 0.5 : 1,
              }}
            >
              {w.icon && <img src={w.icon} alt="" width={24} height={24} style={{ borderRadius: 6 }} />}
              <span style={{ flex: 1, textAlign: "left", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)" as any, color: "var(--text-primary)" }}>
                {w.name}
              </span>
              {connectingId === w.id ? (
                <Icon name="refresh-cw" size={16} className="tb-spin" color="var(--text-secondary)" />
              ) : (
                <Icon name="chevron-down" size={16} color="var(--text-secondary)" style={{ transform: "rotate(-90deg)" }} />
              )}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p style={{ margin: "12px 0 0", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--status-flag)" }}>
          {error}
        </p>
      )}
    </Dialog>
  );
}
