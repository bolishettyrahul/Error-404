# CIP-30 Wallet Integration (Preprod) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace TrueBatch's simulated wallet with a real CIP-30 Lace/Eternl connection on Cardano Preprod, where appending a checkpoint requires a real CIP-8 wallet signature that the backend cryptographically verifies.

**Architecture:** Frontend uses Mesh SDK (`@meshsdk/react`) for the connect UI and `wallet.signData()` CIP-8 signing. A canonical checkpoint payload string is signed by the wallet and sent to the backend. The backend verifies the signature with `checkSignature` and confirms the signer's public-key hash equals the submitted `actor_pkh` before appending to the JSON store. No on-chain transaction; balance/identity come from the wallet itself.

**Tech Stack:** TypeScript, React 18 + Vite (frontend), Express (backend), `@meshsdk/react` + `@meshsdk/core`, Vitest (backend tests).

## Global Constraints

- Network: **Preprod** testnet. All user-facing copy says "Preprod", never "Preview".
- CIP-30 `getNetworkId()` returns `0` for any testnet, `1` for mainnet. Guard: reject when id ≠ 0 (blocks mainnet only; cannot distinguish Preprod from Preview — documented limitation).
- Authorization is **signature-only**: valid CIP-8 signature AND `actor_pkh === deserializeAddress(address).pubKeyHash`. No role/whitelist.
- `actor_pkh` is always derived from the connected wallet — never hand-typed.
- The canonical payload string is `` `${batch_id}|${stage}|${data_hash}|${slot}` `` and MUST be byte-identical on frontend and backend.
- No on-chain transactions, no Aiken validator, no datum serialization in this plan.
- Mesh version resolved at install time; if an imported symbol's signature differs from this plan, confirm against `node_modules/@meshsdk/core` typings — the run-test steps will surface any drift.

---

### Task 1: Backend checkpoint verification unit (TDD)

**Files:**
- Create: `src/backend/verifyCheckpoint.ts`
- Create: `src/backend/verifyCheckpoint.test.ts`
- Modify: `package.json` (add Vitest + `test` script)
- Create: `vitest.config.ts`

**Interfaces:**
- Produces:
  - `buildCheckpointPayload(c: CheckpointCore): string` where `CheckpointCore = { batch_id: string; stage: string; data_hash: string; slot: number }`
  - `deriveActorPkh(address: string): string`
  - `verifyCheckpoint(input: VerifyInput): VerifyResult` where
    `VerifyInput = { payload: string; signature: string; key: string; address: string; actor_pkh: string }`
    and `VerifyResult = { ok: boolean; reason?: string }`

- [ ] **Step 1: Install test + Mesh deps at repo root**

Run:
```bash
npm install --save-dev vitest@^1.6.0
npm install @meshsdk/core@^1.5.8
```
Expected: installs succeed; `@meshsdk/core` appears under `dependencies` (it was declared but not installed).

- [ ] **Step 2: Add `test` script to `package.json`**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

Mesh loads WASM crypto; inline it so Vitest can resolve it in Node.
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    server: {
      deps: {
        inline: [/@meshsdk/, /@sidan-lab/],
      },
    },
  },
});
```

- [ ] **Step 4: Write the failing test**

Create `src/backend/verifyCheckpoint.test.ts`. The test generates a real signature at runtime with a `MeshWallet` built from a fixed test mnemonic, so no fabricated vectors are needed and the assertions stay self-consistent.
```ts
import { describe, it, expect, beforeAll } from "vitest";
import { MeshWallet } from "@meshsdk/core";
import { buildCheckpointPayload, deriveActorPkh, verifyCheckpoint } from "./verifyCheckpoint";

// Fixed 24-word test mnemonic (testnet only, never funded).
const TEST_MNEMONIC =
  "solution few spatial peace umbrella disagree page sad melt fabric wheat guess prefer sugar bicycle napkin cotton unhappy sausage sniff fiscal jealous glance leaf".split(
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
  // Some Mesh versions require an explicit init before address/signing calls.
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
  it("accepts a valid signature whose signer matches actor_pkh", () => {
    expect(verifyCheckpoint({ payload, signature, key, address, actor_pkh })).toEqual({ ok: true });
  });

  it("rejects a tampered payload", () => {
    const bad = verifyCheckpoint({ payload: payload + "X", signature, key, address, actor_pkh });
    expect(bad.ok).toBe(false);
  });

  it("rejects when actor_pkh does not match the signer", () => {
    const bad = verifyCheckpoint({ payload, signature, key, address, actor_pkh: "00".repeat(28) });
    expect(bad.ok).toBe(false);
    expect(bad.reason).toMatch(/actor_pkh/);
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `verifyCheckpoint.ts` does not exist / imports unresolved.

- [ ] **Step 6: Write the minimal implementation**

Create `src/backend/verifyCheckpoint.ts`:
```ts
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

export function verifyCheckpoint(input: VerifyInput): VerifyResult {
  const { payload, signature, key, address, actor_pkh } = input;

  let sigOk = false;
  try {
    sigOk = checkSignature(payload, { signature, key }, address);
  } catch {
    return { ok: false, reason: "signature verification failed to parse" };
  }
  if (!sigOk) return { ok: false, reason: "invalid signature" };

  const derived = deriveActorPkh(address);
  if (derived !== actor_pkh) {
    return { ok: false, reason: "actor_pkh does not match signer" };
  }
  return { ok: true };
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (3 passing). If `checkSignature`/`MeshWallet`/`signData` signatures differ in the installed Mesh version, adjust the call to match `node_modules/@meshsdk/core` typings, then re-run until green.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/backend/verifyCheckpoint.ts src/backend/verifyCheckpoint.test.ts
git commit -m "feat: add CIP-8 checkpoint signature verification with tests"
```

---

### Task 2: Wire verification into `/append-checkpoint`

**Files:**
- Modify: `src/backend/index.ts:106-158`

**Interfaces:**
- Consumes: `buildCheckpointPayload`, `verifyCheckpoint` from `./verifyCheckpoint`
- Produces: `/append-checkpoint` now requires `{ batch_id, new_checkpoint, signature, key, address }` and returns `{ success, proof, checkpoint }` (the random `tx_hash` is replaced by `proof` = the signature).

- [ ] **Step 1: Add the import**

At the top of `src/backend/index.ts`, alongside the existing tier imports, add:
```ts
import { buildCheckpointPayload, verifyCheckpoint } from "./verifyCheckpoint";
```

- [ ] **Step 2: Replace the body of the `/append-checkpoint` handler**

Replace the handler at `src/backend/index.ts:106-158` with:
```ts
app.post("/append-checkpoint", async (req: Request, res: Response) => {
  const { batch_id, new_checkpoint, signature, key, address } = req.body;

  if (!batch_id || !new_checkpoint) {
    return res.status(400).json({ error: "Missing batch_id or new_checkpoint object." });
  }

  const { stage, actor_pkh, data_hash, slot } = new_checkpoint;
  if (!stage || !actor_pkh || !data_hash || typeof slot !== "number") {
    return res.status(400).json({ error: "Checkpoint must contain stage, actor_pkh, data_hash, and numeric slot." });
  }
  if (!signature || !key || !address) {
    return res.status(400).json({ error: "Missing wallet signature, key, or address." });
  }

  // Verify the CIP-8 signature and that the signer owns actor_pkh.
  const payload = buildCheckpointPayload({ batch_id, stage, data_hash, slot });
  const verification = verifyCheckpoint({ payload, signature, key, address, actor_pkh });
  if (!verification.ok) {
    return res.status(401).json({ error: `Authorization failed: ${verification.reason}` });
  }

  const db = loadDB();
  let key_name: "batchA" | "batchB" | null = null;
  if (db.batchA && db.batchA.batch_id === batch_id) {
    key_name = "batchA";
  } else if (db.batchB && db.batchB.batch_id === batch_id) {
    key_name = "batchB";
  } else {
    if (batch_id.startsWith("B-2024-GOOD")) key_name = "batchA";
    if (batch_id.startsWith("B-2024-FRAUD")) key_name = "batchB";
  }

  if (!key_name || !db[key_name]) {
    return res.status(404).json({ error: `Batch "${batch_id}" does not exist to append checkpoints.` });
  }

  const checkpoint = { stage: stage as Stage, actor_pkh, data_hash, slot };
  db[key_name].checkpoints.push(checkpoint);
  saveDB(db);

  console.log(`[Backend] Verified + appended checkpoint [${stage}] to batch [${batch_id}] by signer ${actor_pkh.substring(0, 12)}…`);

  res.json({
    success: true,
    proof: signature,
    checkpoint,
  });
});
```

- [ ] **Step 3: Manually verify the endpoint rejects unsigned requests**

Start the backend: `npm run backend` (in a second terminal). Then:
```bash
curl -s -X POST http://localhost:3000/append-checkpoint \
  -H "Content-Type: application/json" \
  -d '{"batch_id":"B-2024-GOOD","new_checkpoint":{"stage":"LabTested","actor_pkh":"ab","data_hash":"cd","slot":1}}'
```
Expected: HTTP 400 `{"error":"Missing wallet signature, key, or address."}` (proves the signature gate is wired). Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/backend/index.ts
git commit -m "feat: require verified CIP-8 signature to append a checkpoint"
```

---

### Task 3: Switch network copy Preview → Preprod (backend/data)

**Files:**
- Modify: `src/data/blockfrost.ts`
- Modify: `.env.template`

**Interfaces:** none exported; string/config changes only.

- [ ] **Step 1: Update `.env.template`**

Change the Blockfrost URL line to Preprod:
```
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0
```

- [ ] **Step 2: Update `blockfrost.ts` network labels**

In `src/data/blockfrost.ts`, replace the two `"preview"` network literals returned by `getNetworkInfo()` (lines 15 and 23) with `"preprod"`, and update the warning text to reference Preprod. The mock-key default string `"preview_mock_key"` may stay as-is (it is only an internal sentinel), but update the `console.warn` copy to say "Preprod".

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors from these files.

- [ ] **Step 4: Commit**

```bash
git add src/data/blockfrost.ts .env.template
git commit -m "chore: point Blockfrost config and labels at Preprod"
```

---

### Task 4: Frontend Mesh dependencies + Vite polyfill setup

**Files:**
- Modify: `src/frontend/package.json`
- Modify: `src/frontend/vite.config.js`

**Interfaces:** makes `@meshsdk/react` / `@meshsdk/core` importable in the frontend; no code symbols yet.

- [ ] **Step 1: Install Mesh + Vite polyfills in the frontend package**

Run:
```bash
cd src/frontend
npm install @meshsdk/react@^1.5.8 @meshsdk/core@^1.5.8
npm install --save-dev vite-plugin-node-polyfills@^0.22.0
```
Expected: installs succeed.

- [ ] **Step 2: Configure Vite for Mesh (WASM + node polyfills + top-level await)**

Replace `src/frontend/vite.config.js` with:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Mesh SDK needs node polyfills (buffer) and esnext target for top-level await in its WASM loader.
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  server: { port: 5173 },
  build: { target: 'esnext' },
  optimizeDeps: { esbuildOptions: { target: 'esnext' } },
})
```

- [ ] **Step 3: Verify the dev server boots**

Run: `npm run dev` (from `src/frontend`)
Expected: Vite starts on port 5173 with no module-resolution errors for `@meshsdk/*`. Stop the server.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add src/frontend/package.json src/frontend/package-lock.json src/frontend/vite.config.js
git commit -m "chore: add Mesh SDK and Vite polyfills to frontend"
```

---

### Task 5: Frontend wallet hook (`useTrueBatchWallet`)

**Files:**
- Create: `src/frontend/src/wallet.ts`

**Interfaces:**
- Consumes: `useWallet`, `useWalletList` from `@meshsdk/react`; `deserializeAddress` from `@meshsdk/core`
- Produces: `useTrueBatchWallet()` returning
  ```ts
  {
    available: { id: string; name: string; icon: string }[];
    connected: boolean;
    walletName: string | undefined;
    address: string;      // "" when disconnected
    pkh: string;          // "" when disconnected
    balanceLovelace: string; // "" when unknown
    error: string;        // "" when none
    connect: (id: string) => Promise<void>;
    disconnect: () => void;
    signCheckpoint: (core: { batch_id: string; stage: string; data_hash: string; slot: number })
      => Promise<{ payload: string; signature: string; key: string; address: string }>;
  }
  ```

- [ ] **Step 1: Create the hook**

Create `src/frontend/src/wallet.ts`:
```ts
import { useEffect, useState } from "react";
import { useWallet, useWalletList } from "@meshsdk/react";
import { deserializeAddress } from "@meshsdk/core";

// MUST stay byte-identical to the backend copy in src/backend/verifyCheckpoint.ts
export function buildCheckpointPayload(c: {
  batch_id: string;
  stage: string;
  data_hash: string;
  slot: number;
}): string {
  return `${c.batch_id}|${c.stage}|${c.data_hash}|${c.slot}`;
}

export function useTrueBatchWallet() {
  const { wallet, connected, name, connect, disconnect } = useWallet();
  const available = useWalletList();

  const [address, setAddress] = useState("");
  const [pkh, setPkh] = useState("");
  const [balanceLovelace, setBalanceLovelace] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!connected) {
        setAddress("");
        setPkh("");
        setBalanceLovelace("");
        return;
      }
      try {
        const networkId = await wallet.getNetworkId();
        if (networkId !== 0) {
          setError("Wrong network. Switch your wallet to the Preprod testnet and reconnect.");
          disconnect();
          return;
        }
        const addr = await wallet.getChangeAddress();
        const lovelace = await wallet.getLovelace();
        if (cancelled) return;
        setAddress(addr);
        setPkh(deserializeAddress(addr).pubKeyHash);
        setBalanceLovelace(lovelace);
        setError("");
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to read wallet.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [connected, wallet, disconnect]);

  async function signCheckpoint(core: {
    batch_id: string;
    stage: string;
    data_hash: string;
    slot: number;
  }) {
    if (!connected) throw new Error("Connect a wallet first.");
    const payload = buildCheckpointPayload(core);
    const ds = await wallet.signData(payload, address);
    return { payload, signature: ds.signature, key: ds.key, address };
  }

  return {
    available,
    connected,
    walletName: name,
    address,
    pkh,
    balanceLovelace,
    error,
    connect,
    disconnect,
    signCheckpoint,
  };
}
```

- [ ] **Step 2: Verify it type-checks / boots**

Run: `npm run dev` (from `src/frontend`)
Expected: no TypeScript/module errors for `wallet.ts`. (`wallet.getLovelace()` exists on Mesh's browser wallet; if the installed version lacks it, use `await wallet.getBalance()` and pick the `unit === "lovelace"` amount — adjust per typings.) Stop the server.

- [ ] **Step 3: Commit**

```bash
cd ../..
git add src/frontend/src/wallet.ts
git commit -m "feat: add useTrueBatchWallet CIP-30 hook with Preprod guard"
```

---

### Task 6: Wire real connect + signing into the UI

**Files:**
- Modify: `src/frontend/src/main.tsx`
- Modify: `src/frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useTrueBatchWallet` from `./wallet`

- [ ] **Step 1: Wrap the app in `MeshProvider`**

Replace `src/frontend/src/main.tsx` with:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { MeshProvider } from '@meshsdk/react'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MeshProvider>
      <App />
    </MeshProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 2: Replace the wallet state in `App.tsx` with the hook**

In `src/frontend/src/App.tsx`, add the import near the top (after the `./types` import):
```ts
import { useTrueBatchWallet } from "./wallet";
```
Delete the simulated wallet state (lines ~44-46: `walletConnected`, `walletAddress`) and the whole `handleConnectWallet` function (lines ~120-130). Add a wallet-picker open state and the hook near the other `useState` calls:
```ts
const {
  available: availableWallets,
  connected: walletConnected,
  address: walletAddress,
  pkh: walletPkh,
  balanceLovelace,
  error: walletError,
  connect: connectWallet,
  disconnect: disconnectWallet,
  signCheckpoint,
} = useTrueBatchWallet();
const [walletPickerOpen, setWalletPickerOpen] = useState(false);
```

- [ ] **Step 3: Surface wallet errors as toasts**

Add an effect (near the theme `useEffect`) so the Preprod guard message reaches the user:
```ts
useEffect(() => {
  if (walletError) triggerToast(walletError, "error");
}, [walletError]);
```

- [ ] **Step 4: Auto-fill the actor PKH from the wallet**

Add an effect so the form field always mirrors the connected wallet:
```ts
useEffect(() => {
  setActorPkh(walletPkh);
}, [walletPkh]);
```

- [ ] **Step 5: Replace the header wallet button with a real picker**

Replace the header wallet `<button>` block (`App.tsx:244-254`) with a connect/disconnect control plus a dropdown of injected wallets:
```tsx
<div className="relative">
  <button
    onClick={() => (walletConnected ? disconnectWallet() : setWalletPickerOpen((o) => !o))}
    className={`ui-button-secondary hover-lift press-scale px-4 py-2 ${walletConnected ? "status-good" : ""}`}
  >
    <Wallet size={16} strokeWidth={2} />
    <span className="text-scale-xs font-semibold">
      {walletConnected ? shortenHash(walletAddress, 6) : "Connect Wallet"}
    </span>
  </button>

  {walletPickerOpen && !walletConnected && (
    <div className="absolute right-0 mt-2 w-56 ui-card shadow-modal z-50 p-2 flex flex-col gap-1">
      {availableWallets.length === 0 && (
        <p className="text-[11px] text-gray-500 p-2">
          No Cardano wallet found. Install Lace or Eternl and switch it to Preprod.
        </p>
      )}
      {availableWallets.map((w) => (
        <button
          key={w.id}
          onClick={async () => {
            setWalletPickerOpen(false);
            await connectWallet(w.id);
          }}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface text-scale-xs font-semibold text-left"
        >
          <img src={w.icon} alt="" className="w-4 h-4" />
          {w.name}
        </button>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 6: Make the Actor PKH field read-only**

At `App.tsx:603-610`, add `readOnly` and a hint to the actor PKH `<input>`, and change its placeholder:
```tsx
<input
  type="text"
  placeholder={walletConnected ? "" : "Connect a wallet to autofill"}
  value={actorPkh}
  readOnly
  className="ui-field w-full font-mono text-scale-xs opacity-80 cursor-not-allowed"
/>
```

- [ ] **Step 7: Replace the faked signing in `handleAddCheckpoint`**

Replace the body of `handleAddCheckpoint` (`App.tsx:132-182`) so it signs with the wallet and only reports success after the backend verifies. Remove the `setTimeout`:
```ts
const handleAddCheckpoint = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!batchData) return;
  if (!dataHash.trim()) {
    setFormError("The verification document hash is required.");
    return;
  }
  if (!walletConnected) {
    setFormError("Please connect your CIP-30 wallet first.");
    return;
  }

  setFormLoading(true);
  setFormError("");

  const slot = Math.floor(Date.now() / 1000);
  try {
    triggerToast("Awaiting wallet signature…", "info");
    const signed = await signCheckpoint({
      batch_id: batchData.batch_id,
      stage: nextStage,
      data_hash: dataHash.trim(),
      slot,
    });

    const response = await axios.post(`${BACKEND_URL}/append-checkpoint`, {
      batch_id: batchData.batch_id,
      new_checkpoint: { stage: nextStage, actor_pkh: walletPkh, data_hash: dataHash.trim(), slot },
      signature: signed.signature,
      key: signed.key,
      address: signed.address,
    });

    if (response.data.success) {
      triggerToast(`Checkpoint verified & recorded. Proof: ${response.data.proof.substring(0, 16)}…`, "success");
      const refreshResponse = await axios.get(`${BACKEND_URL}/batch/${batchData.batch_id}`);
      setBatchData(refreshResponse.data);
      setDataHash("");
      setActiveTab("timeline");
    } else {
      setFormError("Checkpoint recording failed.");
    }
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.error || err?.message || "Failed to sign or append checkpoint.";
    setFormError(errorMsg);
    triggerToast(errorMsg, "error");
  } finally {
    setFormLoading(false);
  }
};
```

- [ ] **Step 8: Update UI copy Preview → Preprod**

In `src/frontend/src/App.tsx`, replace every user-facing "Preview" with "Preprod": the connect toast is gone (removed with `handleConnectWallet`), but update the hero subtitle (line ~279 "Cardano Preview testnet"), the append-tab helper text (line ~580), and the footer (line ~665). Optionally show `balanceLovelace` next to the connected address in the header.

- [ ] **Step 9: Manual end-to-end verification**

With real Lace/Eternl set to **Preprod** and funded from the faucet:
1. Run backend (`npm run backend`) and frontend (`cd src/frontend && npm run dev`).
2. Click **Connect Wallet** → the injected-wallet dropdown lists Lace/Eternl → selecting one opens the real wallet popup.
3. Confirm the header shows your real `addr_test…` address.
4. **Wrong-network check:** switch the wallet to mainnet and reconnect → expect the auto-disconnect + "Switch to Preprod" toast.
5. Load a demo batch, open **Append Checkpoint (CIP-30)** → the Actor PKH field is auto-filled and read-only.
6. Enter a data hash, click **Build & Sign Checkpoint** → the wallet signing popup appears → after signing, the record appears in the timeline.
7. **Tamper check (optional):** with DevTools, POST to `/append-checkpoint` with a modified payload → expect HTTP 401.

- [ ] **Step 10: Commit**

```bash
git add src/frontend/src/main.tsx src/frontend/src/App.tsx
git commit -m "feat: real CIP-30 connect, wallet-derived PKH, and signed checkpoint append"
```

---

## Notes for the implementer

- **Mesh API drift:** Mesh minor versions occasionally rename or reshape `checkSignature`, `signData`, and balance helpers. When a run-test or dev-server step fails on an import/signature, reconcile against the installed `node_modules/@meshsdk/*` typings rather than changing the verification logic.
- **Payload sync:** `buildCheckpointPayload` is intentionally duplicated in `src/backend/verifyCheckpoint.ts` and `src/frontend/src/wallet.ts`. If you change one, change both — the signature will not verify otherwise.
- **Out of scope (future plans):** real on-chain metadata/self-send tx with `signTx`+submit, Aiken validator UTxO with `BatchDatum`, and stage→role whitelist enforcement.
