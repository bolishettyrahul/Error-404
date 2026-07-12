import { describe, it, expect, beforeAll } from "vitest";
import { MeshWallet } from "@meshsdk/core";
import { buildCheckpointPayload, deriveActorPkh, verifyCheckpoint } from "./verifyCheckpoint";

// Fixed, valid BIP39 test mnemonic (testnet only, never funded). Generated with MeshWallet.brew().
const TEST_MNEMONIC =
  "collect tackle depth because state knock cherry debris shell pill agree spatial crisp moment allow disagree drill riot leopard coast warrior under wrong strong".split(
    " "
  );

const core = { batch_id: "B-2024-GOOD", stage: "LabTested", data_hash: "aa".repeat(32), slot: 1234567 };

let address: string;
let signature: string;
let key: string;
let payload: string;
let actor_pkh: string;

beforeAll(async () => {
  const wallet = new MeshWallet({
    networkId: 0,
    key: { type: "mnemonic", words: TEST_MNEMONIC },
  });
  if (typeof (wallet as any).init === "function") {
    await (wallet as any).init();
  }
  address = await wallet.getChangeAddress();
  actor_pkh = deriveActorPkh(address);
  payload = buildCheckpointPayload(core);
  const ds = await wallet.signData(payload, address);
  signature = ds.signature;
  key = ds.key;
});

describe("buildCheckpointPayload", () => {
  it("is deterministic and pipe-delimited", () => {
    expect(buildCheckpointPayload(core)).toBe("B-2024-GOOD|LabTested|" + "aa".repeat(32) + "|1234567");
  });
});

describe("verifyCheckpoint", () => {
  it("accepts a valid signature whose signer matches actor_pkh", async () => {
    expect(await verifyCheckpoint({ payload, signature, key, address, actor_pkh })).toEqual({ ok: true });
  });

  it("rejects a tampered payload", async () => {
    const bad = await verifyCheckpoint({ payload: payload + "X", signature, key, address, actor_pkh });
    expect(bad.ok).toBe(false);
  });

  it("rejects when actor_pkh does not match the signer", async () => {
    const bad = await verifyCheckpoint({ payload, signature, key, address, actor_pkh: "00".repeat(28) });
    expect(bad.ok).toBe(false);
    expect(bad.reason).toMatch(/actor_pkh/);
  });
});
