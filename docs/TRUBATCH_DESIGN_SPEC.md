# TrueBatch Prototype Design Spec
**Date:** 2026-07-12  
**Goal:** Full functional prototype for Cardano blockchain hackathon  
**Timeline:** 10 hours  
**Scope:** Production-quality prototype (live wallet signing, live Blockfrost queries, polished UI, comprehensive fraud detection)

---

## 1. Problem Statement

Construction material fraud (cement/steel adulteration, premature curing, faked test certificates) causes building failures. The 2013 Thane collapse near Mumbai (74 dead) was traced to substandard cement and bribery at every checkpoint. Root cause: paper certificates are fakeable, backdatable, and reusable—no independent verification trail.

**TrueBatch solves this:** Unforgeable, append-only digital history on Cardano for every material batch. Each supply-chain checkpoint requires cryptographic signatures; anomalies are flagged by AI; records cannot be rewritten.

---

## 2. Solution Overview

**Four-layer architecture:**

1. **Data Layer:** Blockfrost (Preview testnet) + CIP-68 token pairs + role whitelists
2. **Smart Contract Layer:** Aiken validator enforcing append-only, role-based, stage-sequence logic
3. **AI Detection Layer:** Tier 0 (deterministic rules) → Tier 1 (Ollama Qwen) → Tier 2 (Groq)
4. **Interface Layer:** React + Vite frontend, CIP-30 wallet connect, live Blockfrost queries

**Key claim:** We do NOT certify safety or guarantee honesty—only that records cannot be rewritten after the fact, and AI-flagged inconsistencies are signals for human verification.

---

## 3. On-Chain Data Model

### Cardano Types (Aiken)

```
Stage = Manufactured | LabTested | Dispatched | Delivered

Checkpoint:
  stage: Stage
  actor_pkh: ByteArray          -- whitelisted role for this stage
  data_hash: ByteArray          -- hash of cert/GPS/delivery note
  slot: Int                     -- Cardano timestamp

BatchDatum:
  batch_id: ByteArray
  checkpoints: List<Checkpoint> -- append-only, immutable history

Redeemer:
  AppendCheckpoint {
    new_checkpoint: Checkpoint
  }
```

### Validator Logic

On every `AppendCheckpoint` spend:
- ✅ Prove: `new_checkpoints = old_checkpoints + [new_checkpoint]` (no modification/removal)
- ✅ Verify: `signer_pkh` matches whitelisted role for this stage
- ✅ Enforce: `new_checkpoint.stage` comes strictly after previous stage in sequence
- ✅ Append: Produce new UTxO with updated datum

### CIP-68 Token Structure

- **Reference NFT:** Holds mutable datum (checkpoint history). Never transferred.
- **User NFT:** Transferable ownership token. Proves the batch owner.
- Both minted together with initial `BatchDatum`.

---

## 4. Frontend Architecture

**Single-page app (React + Vite + shadcn/ui + Tailwind)**

### Components

1. **BatchSearch**
   - Input: batch ID (text)
   - Queries Blockfrost for UTxO
   - Displays batch metadata + risk level badge

2. **Timeline**
   - Vertical timeline of all checkpoints
   - Stage, actor, timestamp, data hash for each
   - Color-coded: green (complete), orange (pending), red (anomalous)
   - Icons for visual clarity (lucide-react)

3. **RiskFlags**
   - List of Tier 0 anomalies (one card per flag)
   - Severity badge (red=high, yellow=medium, green=low)
   - Plain-language description of each rule triggered

4. **RiskReport** (conditional)
   - Displays Tier 2 (Groq) report if escalated
   - Plain text in a styled card
   - "AI-generated risk assessment" disclaimer

5. **AddCheckpointForm**
   - Stage dropdown (only valid next stages)
   - Actor field (lookup by role)
   - Data hash input (hash of cert/GPS/delivery note)
   - **[Connect Wallet (CIP-30)]** button
   - On success: displays transaction hash + "awaiting confirmation"
   - Polls Blockfrost every 3 seconds for new checkpoint

6. **Header**
   - App title + logo
   - Dark mode toggle
   - Wallet connection status

### UI/UX

- **Dark/Light Mode:** Built-in via shadcn + Tailwind (persists to localStorage)
- **Responsive:** Mobile-first, works on all screen sizes
- **Accessibility:** WCAG 2.1 AA (shadcn default)
- **Loading States:** Skeleton screens while Blockfrost queries
- **Error Handling:** User-friendly messages (not raw API errors)
- **Animations:** Smooth transitions (Tailwind opacity/scale)

---

## 5. Backend Architecture (Node.js)

**Two core endpoints:**

### GET `/batch/:id`
- Query Blockfrost for batch UTxO
- Deserialize datum → checkpoint list
- Run Tier 0 rule engine
- If severity high: call Tier 1 (Qwen) for escalation decision
- If escalated: call Tier 2 (Groq) for risk report
- Return: `{ batch_id, checkpoints[], flags[], report?, risk_level }`

### POST `/append-checkpoint`
- Body: `{ batch_id, new_checkpoint (stage/actor_pkh/data_hash), wallet_signature }`
- Validate wallet signature (CIP-30)
- Build Mesh SDK transaction (consume old UTxO, produce new datum with appended checkpoint)
- Submit to Preview testnet via Blockfrost
- Return: `{ tx_hash, success, status }`

### Supporting Functions

**Tier 0 Rule Engine** (deterministic, no LLM)
```
Rules:
1. Missing checkpoint — stage jumped (e.g., Manufactured → Delivered, skipped LabTested)
2. Curing time violation — LabTested < 7 days after Manufactured
3. Impossible transit times — Dispatched → Delivered in < 24 hours for standard distance
4. Test value anomalies — Cement compressive strength < 45 MPa (IS-456 spec)
5. Batch ID reuse — Same batch_id in two active deliveries
6. Actor mismatch — Non-lab actor signs LabTested checkpoint
7. Timestamp reversal — Checkpoint timestamp < previous checkpoint timestamp

Output: { rule_id, severity (low/medium/high), message, checkpoint_pair, details }
```

**Tier 1 (Ollama Qwen 2.5:7b)**
- Input: Tier 0 flags + checkpoint history
- Prompt: "Do these flags indicate intentional fraud or data entry errors? Should escalate?"
- Output: { escalate: bool, reasoning: string }
- Local, free, ~500ms latency

**Tier 2 (Groq API)**
- Input: Checkpoints + Tier 0 flags + Tier 1 reasoning
- Prompt: "For a site engineer: What could go wrong? What should they verify? Who to contact?"
- Output: { report: string (150-200 words), confidence: float }
- Only called if Tier 1.escalate = true
- Free tier sufficient for hackathon

---

## 6. Smart Contract (Aiken)

**Single validator file: `validators/batch.ak`**

- Type definitions (Stage, Checkpoint, BatchDatum, Redeemer)
- Spend handler: validate append-only + role + sequence
- Unit tests (Aiken testing framework)
- No production optimizations—prioritize correctness

**Compilation:** `aiken check` (local testing only, no testnet debugging)

---

## 7. Off-Chain Infrastructure (Mesh SDK + TypeScript)

**Scripts:**

1. **mint-batch.ts:** Mint CIP-68 batch NFT with initial datum
   - Input: batch_id, manufacturer_pkh, initial stage (Manufactured)
   - Output: tx_hash, reference_nft_id, user_nft_id

2. **query-batch.ts:** Fetch batch UTxO from Blockfrost + deserialize datum
   - Input: batch_id
   - Output: checkpoints[]

3. **append-checkpoint.ts:** Build transaction to append checkpoint
   - Input: batch_id, new checkpoint data
   - Output: unsigned transaction (to be signed by wallet)

**Seeded Demo Data:**
- Batch A (clean): `B-2024-GOOD` — all stages, proper timing, valid test values
- Batch B (anomalous): `B-2024-FRAUD` — multiple violations, triggers all three AI tiers

---

## 8. Implementation Sequence (10 Hours, Git Worktrees)

### Phase 1: Environment & Setup (1 hour, parallel across branches)
- Ensure: Aiken installed, Blockfrost API key ready, testnet wallet + faucet ADA
- Create git repo, scaffold branches: `aiken`, `data`, `backend`, `frontend`, `main`

### Phase 2: Aiken Validator (1.5 hours, branch: `aiken`)
- Define types (Stage, Checkpoint, BatchDatum, Redeemer)
- Implement spend validator (append-only + role + sequence)
- Write unit tests
- `aiken check` passes locally
- Commit to `aiken` branch (not deployed yet)

### Phase 3: Off-Chain Data (1.5 hours, branch: `data`, parallel with Phase 2)
- Set up Blockfrost client
- Build Mesh SDK transaction builders (mint-batch, append-checkpoint)
- Build Blockfrost query script
- Mint two demo batches to Preview testnet
- Store batch IDs + initial checkpoints locally for seeding
- Commit to `data` branch

### Phase 4: Backend (2 hours, branch: `backend`, starts after Phase 2)
- Set up Node.js + Express (or Fastify)
- Implement Tier 0 rule engine (7 rules, ~150 lines)
- Integrate Blockfrost queries (use Phase 3 script)
- Integrate Ollama Qwen (connect to local model)
- Integrate Groq API (use free tier, handle rate limits)
- Implement GET `/batch/:id` endpoint
- Implement POST `/append-checkpoint` endpoint
- Commit to `backend` branch

### Phase 5: Frontend (2.5 hours, branch: `frontend`, starts after Phase 1)
- Set up React + Vite
- Install shadcn/ui + Tailwind
- Build BatchSearch component → calls backend GET `/batch/:id`
- Build Timeline component (render checkpoints with lucide icons)
- Build RiskFlags component (display Tier 0 rules)
- Build RiskReport component (display Groq report if present)
- Build AddCheckpointForm + CIP-30 wallet connect
- Implement dark mode toggle
- Responsive layout (mobile-first)
- Commit to `frontend` branch

### Phase 6: Integration (1 hour, branch: `main`)
- Merge `aiken`, `data`, `backend`, `frontend` into `main`
- End-to-end test:
  1. Search batch B-2024-GOOD → no flags
  2. Search batch B-2024-FRAUD → 3+ flags, escalates to Groq, shows report
  3. Add checkpoint to B-2024-GOOD (via wallet) → transaction submitted, new checkpoint appears
- Fix any integration issues
- Commit final integration

### Phase 7: Demo Prep (1 hour)
- Write demo script (what judges see)
- Test on fresh browser (no cache)
- Verify wallet connect works with Lace/Eternl on Preview testnet
- Verify Groq API has budget (or switch to offline fallback)
- Final walkthrough

---

## 9. Demo Walkthrough (For Judges)

**Setup:** Lace/Eternl wallet connected to Preview testnet, TrueBatch frontend open

**Script:**

1. **"This is TrueBatch. We're solving construction material fraud on Cardano."**
   - Show GitHub repo + architecture diagram

2. **Search Batch B-2024-GOOD**
   - Timeline appears: Manufactured → LabTested → Dispatched (pending)
   - No flags, green badges
   - "This is a compliant batch."

3. **Search Batch B-2024-FRAUD**
   - Timeline appears with same stages
   - Tier 0 flags: "Curing time only 1 day (spec: 7)", "Test value 20 MPa (spec: 45)", "Batch ID reused in another delivery"
   - Risk badge: HIGH
   - "Our system detected anomalies. Let's escalate to AI."
   - Groq report appears: "This batch shows signs of adulteration. Do not use. Contact lab directly. Report to authorities."
   - "That's the signal a site engineer needs."

4. **Live Demo: Add Checkpoint**
   - Click "Add Next Checkpoint" on B-2024-GOOD
   - Select stage: Delivered
   - Enter actor + data hash
   - Click "[Connect Wallet]" → Lace wallet pops up
   - User approves transaction
   - "Submitted to Preview testnet!"
   - Wait 3-5 seconds → new checkpoint appears on timeline
   - "The blockchain is immutable. No going back. No forging certificates."

5. **"We built this in 10 hours on Cardano. Every checkpoint is signed, timestamped, and permanent."**

---

## 10. Non-Functional Requirements

- **Performance:** Blockfrost query < 2s, Tier 0 < 100ms, Qwen < 1s, Groq < 3s
- **Reliability:** Graceful degradation if Groq fails (show Tier 0 flags + Qwen decision)
- **Security:** No private keys in code, CIP-30 handles signing, Blockfrost is read-only API
- **Testability:** Aiken unit tests pass, demo batches are reproducible

---

## 11. Success Criteria

- ✅ Smart contract deploys to Preview testnet + validates checkpoint appends
- ✅ Blockfrost queries return real batch data
- ✅ Tier 0 detects all 7 fraud patterns in B-2024-FRAUD
- ✅ Tier 1 (Qwen) makes escalation decision
- ✅ Tier 2 (Groq) generates a useful, readable report
- ✅ Frontend loads in < 3 seconds, responsive on mobile
- ✅ CIP-30 wallet signing works end-to-end
- ✅ New checkpoints appear on-chain after wallet signature
- ✅ Demo runs smoothly without errors (judges see it working)

---

## 12. Appendix: Tech Stack

| Component | Tool | Reasoning |
|-----------|------|-----------|
| Smart Contract | Aiken | Type-safe, Cardano-native, fast compile feedback |
| Off-chain Tx Building | Mesh SDK (TypeScript) | Tightest Cardano integration, same language as backend |
| Chain Data Provider | Blockfrost API | Free, fast, no node hosting, handles all queries |
| Token Standard | CIP-68 | Mutable datum NFT pattern, perfect for append-only state |
| Tier 0 Engine | Plain TypeScript | Deterministic rules, no dependencies, testable |
| Tier 1 LLM | Ollama + Qwen 2.5:7b | Local, free, good reasoning for structured tasks |
| Tier 2 LLM | Groq API | Free tier, fast inference, best for text generation |
| Wallet Connect | CIP-30 (Lace/Eternl) | Standard, works with Mesh SDK, judges have wallets |
| Frontend | React + Vite | Fast iteration, shadcn/ui for polish, Tailwind for styling |
| Backend | Node.js + Express | JavaScript on both sides, integrates cleanly with Mesh SDK |
| Network | Cardano Preview Testnet | Free ADA faucet, live chain, stakes testnet (not mainnet) |
