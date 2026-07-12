# TrueBatch — Real CIP-30 Wallet Integration (Preprod) Design

**Date:** 2026-07-12
**Status:** Approved — ready for implementation planning
**Author:** Backend review + brainstorming session

---

## 1. Problem

The committee brief requires a genuinely wallet-connected dApp on the Cardano **Preprod** testnet
(connect Lace/Eternl, grab faucet ADA, use CIP-30). The current prototype only *simulates* all of
this:

- `handleConnectWallet` (`src/frontend/src/App.tsx`) flips a boolean and hardcodes
  `addr_test1qzp7y...9wxl8a`. No `window.cardano`, no `enable()`.
- Frontend has no wallet library (`@meshsdk/react` / Lucid absent).
- "Signing" is a `setTimeout(…, 1500)` — the `unsigned_tx` is never signed or submitted.
- `/append-checkpoint` accepts any hand-typed `actor_pkh` with zero authorization or signature check.
- The network is labelled **Preview** everywhere, not **Preprod**.

The result: clicking "Connect Wallet" never opens Lace, and no cryptographic authorization exists.

## 2. Goal & Scope

Make the wallet connection and checkpoint authorization **real**, with the minimum surface needed
for a credible hackathon demo.

**In scope (approved decisions):**
- Integration depth: **Real connect, no on-chain transaction.** Real CIP-30 connect on Preprod,
  real address/PKH/balance from the wallet, network guard. Checkpoints remain in backend JSON.
- Cryptographic proof: **CIP-8 `signData`** over each checkpoint payload, verified server-side.
- Library: **Mesh SDK** (`@meshsdk/react` frontend, `@meshsdk/core` backend — already a backend dep).
- Authorization: **Signature only.** Verify the CIP-8 signature and that `actor_pkh` equals the
  signing key's hash. No stage→role whitelist.

**Explicitly out of scope:** on-chain transactions, Aiken validator UTxO spending, datum
(de)serialization, role/whitelist enforcement, mainnet support.

## 3. Architecture

Two new isolated units keep signing/verification out of the large `App.tsx` and `index.ts`:

| Unit | Location | Responsibility | Depends on |
|------|----------|----------------|------------|
| `useTrueBatchWallet` hook | `src/frontend/src/wallet.ts` | Connect flow, network guard, expose address/PKH/`signCheckpoint()` | `@meshsdk/react`, `@meshsdk/core` |
| `verifyCheckpoint` | `src/backend/verifyCheckpoint.ts` | Verify CIP-8 signature + PKH match | `@meshsdk/core` |

Data flow for an append:

```
User (Lace/Eternl on Preprod)
  │  connect
  ▼
useTrueBatchWallet ──getNetworkId()==0? guard──► address ──deserializeAddress──► actor_pkh
  │  build payload {batch_id, stage, data_hash, slot}
  │  wallet.signData(payload)  → { signature, key }   (Lace popup)
  ▼
POST /append-checkpoint { batch_id, new_checkpoint, payload, signature, key, address }
  │
  ▼
verifyCheckpoint:
  checkSignature(payload, {signature,key}, address) === true
  AND deserializeAddress(address).pubKeyHash === new_checkpoint.actor_pkh
  │ pass                              │ fail
  ▼                                   ▼
append to demo-batches.json        401 Unauthorized
return verified checkpoint + signature proof
```

## 4. Component Details

### 4.1 Frontend connect & identity (`wallet.ts`, `main.tsx`, `App.tsx`)
- Wrap the tree in `<MeshProvider>` in `main.tsx`.
- `useTrueBatchWallet` wraps Mesh's `useWallet` + `useWalletList`:
  - `connect(walletName)` → after connect, call `wallet.getNetworkId()`. If it is **not `0`**,
    immediately `disconnect()` and surface an error ("Switch your wallet to Preprod testnet").
  - On success, read `await wallet.getChangeAddress()`; derive
    `pkh = deserializeAddress(address).pubKeyHash`.
  - Expose: `connected`, `walletName`, `address`, `pkh`, `balanceLovelace`
    (from `wallet.getBalance()`), `connect`, `disconnect`, `signCheckpoint(payload)`.
- `App.tsx`:
  - Header button opens a wallet picker built from `useWalletList()` (only wallets actually
    injected). Replaces `handleConnectWallet`.
  - **Actor PKH field becomes read-only**, auto-filled from `pkh`; append submit disabled until a
    wallet is connected.
  - `handleAddCheckpoint` calls `signCheckpoint(payload)` (real Lace popup), then POSTs with the
    signature. The success toast fires only on backend 200 — no `setTimeout` fake.

### 4.2 Payload canonicalization
- Single shared shape, stable key order:
  `` `${batch_id}|${stage}|${data_hash}|${slot}` `` (hex-encoded before signing).
- Frontend and backend both build the string from the same fields so the verified bytes match.

### 4.3 Backend verification (`verifyCheckpoint.ts`, `index.ts`)
- `verifyCheckpoint({ payload, signature, key, address, actor_pkh })`:
  - `checkSignature(payload, { signature, key }, address)` from `@meshsdk/core` must be `true`.
  - `deserializeAddress(address).pubKeyHash === actor_pkh` must hold.
  - Returns `{ ok: true }` or `{ ok: false, reason }`.
- `/append-checkpoint` calls it before writing. On failure → `401 { error }` and no DB write.
- Response replaces the random `tx_hash` with the real `signature` as the on-record proof, plus
  the stored checkpoint.

### 4.4 Network correctness
- **Known CIP-30 limitation:** `getNetworkId()` returns `0` for *any* testnet (Preprod **and**
  Preview) and `1` for mainnet. It therefore **cannot** distinguish Preprod from Preview. Our guard
  blocks **mainnet** (id ≠ 0 → reject); the UI instructs the user to select Preprod, which is where
  the faucet ADA lands. Strict Preprod-vs-Preview detection (e.g. via a Blockfrost network lookup)
  is out of scope for this pass.
- `Preview → Preprod` in: `src/data/blockfrost.ts` (URL/comment), `.env.template`
  (`BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0`), and all UI copy in `App.tsx`
  ("Preview testnet" → "Preprod testnet", toast strings).
- The connect flow needs **no** Blockfrost key — balance comes from the wallet's CIP-30
  `getBalance()`. Blockfrost remains only for the (already-mocked) batch query path.

## 5. Error Handling

| Condition | Behavior |
|-----------|----------|
| No CIP-30 wallet injected | Picker shows "No Cardano wallet found — install Lace or Eternl" |
| Wallet on wrong network (id ≠ 0) | Auto-disconnect + toast: switch to Preprod |
| User rejects `signData` popup | Catch, toast "Signing cancelled", no POST |
| Invalid/tampered signature at backend | `401`, toast surfaces reason, no DB write |
| `actor_pkh` ≠ signer key hash | `401` (should not happen since field is wallet-derived, but enforced) |

## 6. Testing

- **TDD (backend):** `verifyCheckpoint` unit tests — (a) known-good signature passes,
  (b) tampered payload fails, (c) mismatched `actor_pkh` fails. Use a fixed test vector.
- **Manual end-to-end:** real Lace on Preprod → connect (verify wrong-network guard by trying
  mainnet), append a checkpoint, confirm the Lace signing popup appears and the record only lands
  after verification. Confirm the read-only PKH matches the wallet.

## 7. Dependencies to add

- Frontend `src/frontend/package.json`: `@meshsdk/react`, `@meshsdk/core`.
- Backend already has `@meshsdk/core`; add a test runner if none exists (e.g. `vitest` or plain
  `ts-node` assertions) — decided in the implementation plan.

## 8. Out of Scope / Future

- Real on-chain metadata/self-send tx with `signTx` + submit (explorer link).
- Aiken validator UTxO holding `BatchDatum` with append-only spend.
- Stage→role whitelist enforcement (self-enroll demo variant).
