import { checkSignature, deserializeAddress } from "@meshsdk/core";

export interface CheckpointCore {
  batch_id: string;
  stage: string;
  data_hash: string;
  slot: number;
}

export interface VerifyInput {
  payload: string;
  signature: string;
  key: string;
  address: string;
  actor_pkh: string;
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

// MUST stay byte-identical to the frontend copy in src/frontend/src/wallet.ts
export function buildCheckpointPayload(c: CheckpointCore): string {
  return `${c.batch_id}|${c.stage}|${c.data_hash}|${c.slot}`;
}

export function deriveActorPkh(address: string): string {
  return deserializeAddress(address).pubKeyHash;
}

// Note: @meshsdk/core checkSignature is async (returns a Promise<boolean>) in v1.9.x.
export async function verifyCheckpoint(input: VerifyInput): Promise<VerifyResult> {
  const { payload, signature, key, address, actor_pkh } = input;

  let sigOk = false;
  try {
    sigOk = await checkSignature(payload, { signature, key }, address);
  } catch {
    return { ok: false, reason: "signature verification failed to parse" };
  }
  if (!sigOk) return { ok: false, reason: "invalid signature" };

  let derived: string;
  try {
    derived = deriveActorPkh(address);
  } catch {
    return { ok: false, reason: "invalid address" };
  }
  if (derived !== actor_pkh) {
    return { ok: false, reason: "actor_pkh does not match signer" };
  }
  return { ok: true };
}
