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

  // Network guard: CIP-30 getNetworkId() returns 0 for any testnet, 1 for mainnet.
  // It can't distinguish Preprod from Preview, but it does reject mainnet — which is
  // what we need, since checkpoints and the faucet ADA only make sense on Preprod.
  const networkId = await instance.getNetworkId();
  if (networkId !== 0) {
    throw new Error("Wallet is on mainnet. Switch it to the Preprod testnet and reconnect.");
  }

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
