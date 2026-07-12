import { BrowserWallet, deserializeAddress } from "@meshsdk/core";

export interface ConnectedWallet {
  instance: BrowserWallet;
  address: string;
  actorPkh: string;
}

/** Lists CIP-30 wallet extensions installed in the current browser (Lace, Eternl, etc.). */
export function listInstalledWallets() {
  return BrowserWallet.getInstalledWallets();
}

/** Enables a CIP-30 wallet by name and resolves its change address + derived payment key hash. */
export async function connectWallet(walletId: string): Promise<ConnectedWallet> {
  const instance = await BrowserWallet.enable(walletId);
  const address = await instance.getChangeAddress();
  const { pubKeyHash } = deserializeAddress(address);
  return { instance, address, actorPkh: pubKeyHash };
}

/** Builds the checkpoint's canonical signing payload — must match the backend byte-for-byte. */
export function checkpointPayload(batchId: string, stage: string, dataHash: string, slot: number): string {
  return `${batchId}|${stage}|${dataHash}|${slot}`;
}

/** Signs a checkpoint payload with CIP-8 data signing (wallet.signData takes payload, then address). */
export async function signCheckpoint(wallet: BrowserWallet, address: string, payload: string) {
  return wallet.signData(payload, address);
}
