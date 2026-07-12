import React from "react";
import { Dialog } from "../ui/Dialog";
import { Select, type SelectOption } from "../ui/Select";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { BatchIdChip } from "../ui/BatchIdChip";
import { WalletButton } from "../domain/WalletButton";

export interface AddCheckpointDialogProps {
  open: boolean;
  onClose: () => void;
  wallet?: string | null;
  actorPkh?: string | null;
  onConnect: () => void;
  onSubmit: (values: { stage: string; hash: string }) => void;
  nextStages: SelectOption[];
  submitting?: boolean;
  error?: string | null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-xs)",
          color: "var(--text-secondary)",
          marginBottom: 6,
          fontWeight: "var(--weight-medium)" as any,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

/**
 * AddCheckpointDialog — the wallet-signed append flow: stage + data hash, gated on wallet connection.
 * The actor is not typed in — it's the payment key hash of the connected wallet's change address.
 */
export function AddCheckpointDialog({
  open,
  onClose,
  wallet,
  actorPkh,
  onConnect,
  onSubmit,
  nextStages,
  submitting = false,
  error,
}: AddCheckpointDialogProps) {
  const [stage, setStage] = React.useState("");
  const [hash, setHash] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setStage(nextStages[0]?.value ?? "");
      setHash("");
    }
  }, [open, nextStages]);

  const canSubmit = !!stage && !!hash.trim() && !!wallet && !!actorPkh && !submitting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add checkpoint"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSubmit({ stage, hash: hash.trim() })} disabled={!canSubmit}>
            {submitting ? "Signing…" : "Sign & submit"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Stage">
          <Select value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Select next stage…" options={nextStages} />
        </Field>
        <Field label="Data hash">
          <Input value={hash} onChange={(e) => setHash(e.target.value)} placeholder="Hash of cert / GPS / delivery note" monospace />
        </Field>
        <Field label="Wallet">
          <WalletButton connected={!!wallet} address={wallet} onConnect={onConnect} />
        </Field>
        {actorPkh && (
          <Field label="Actor (derived from wallet)">
            <BatchIdChip value={actorPkh} truncate copyable={false} />
          </Field>
        )}
        {error && (
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--status-flag)" }}>{error}</div>
        )}
      </div>
    </Dialog>
  );
}
