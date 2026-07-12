import express, { Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { runTier0, calculateRiskLevel } from "./tier0";
import { runTier1 } from "./tier1";
import { runTier2 } from "./tier2";
import { Stage } from "../data/types";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(process.cwd(), "demo-batches.json");

// Helper to load db
function loadDB() {
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    } catch (e) {
      console.error("Error parsing DB:", e);
    }
  }
  return { batchA: null, batchB: null };
}

// Helper to save db
function saveDB(db: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error writing DB:", e);
  }
}

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    api: "TrueBatch Backend API",
  });
});

// GET batch information and run fraud detection tiers
app.get("/batch/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  
  let selectedBatch = null;
  if (db.batchA && db.batchA.batch_id === id) {
    selectedBatch = db.batchA;
  } else if (db.batchB && db.batchB.batch_id === id) {
    selectedBatch = db.batchB;
  } else {
    // If not found in seed but matches prefixes, create dynamic representation
    if (id.startsWith("B-2024-GOOD")) {
      selectedBatch = db.batchA;
    } else if (id.startsWith("B-2024-FRAUD")) {
      selectedBatch = db.batchB;
    }
  }

  if (!selectedBatch) {
    return res.status(404).json({ error: `Batch with ID "${id}" not found.` });
  }

  try {
    // Tier 0: Run deterministic rule checks
    const flags = runTier0(selectedBatch.checkpoints);
    const riskLevel = calculateRiskLevel(flags);

    let tier1Decision = null;
    let tier2Report = null;

    // Tier 1 & 2: Escalate only if severity is High
    if (riskLevel === "high") {
      tier1Decision = await runTier1(flags, selectedBatch.checkpoints);
      
      if (tier1Decision.escalate) {
        tier2Report = await runTier2(flags, selectedBatch.checkpoints);
      }
    }

    res.json({
      batch_id: selectedBatch.batch_id,
      checkpoints: selectedBatch.checkpoints,
      flags,
      risk_level: riskLevel,
      escalation: tier1Decision,
      report: tier2Report,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error analyzing batch:", error);
    res.status(500).json({ error: "Internal server analysis error" });
  }
});

// POST to append a new checkpoint (simulates blockchain write and saves locally)
app.post("/append-checkpoint", async (req: Request, res: Response) => {
  const { batch_id, new_checkpoint } = req.body;

  if (!batch_id || !new_checkpoint) {
    return res.status(400).json({ error: "Missing batch_id or new_checkpoint object." });
  }

  const { stage, actor_pkh, data_hash, slot } = new_checkpoint;
  if (!stage || !actor_pkh || !data_hash) {
    return res.status(400).json({ error: "Checkpoint must contain stage, actor_pkh, and data_hash." });
  }

  const db = loadDB();
  let key: "batchA" | "batchB" | null = null;

  if (db.batchA && db.batchA.batch_id === batch_id) {
    key = "batchA";
  } else if (db.batchB && db.batchB.batch_id === batch_id) {
    key = "batchB";
  } else {
    // Dynamic matching for demo prefix tolerance
    if (batch_id.startsWith("B-2024-GOOD")) key = "batchA";
    if (batch_id.startsWith("B-2024-FRAUD")) key = "batchB";
  }

  if (!key || !db[key]) {
    return res.status(404).json({ error: `Batch "${batch_id}" does not exist to append checkpoints.` });
  }

  // Create new checkpoint object
  const checkpoint = {
    stage: stage as Stage,
    actor_pkh,
    data_hash,
    slot: slot || Math.floor(Date.now() / 1000),
  };

  // Enforce append-only in storage
  db[key].checkpoints.push(checkpoint);
  saveDB(db);

  console.log(`[Backend] Appended new checkpoint [${stage}] to batch [${batch_id}]`);

  // Simulate an unsigned transaction for wallet signing
  const unsignedTx = "83a40081825820" + Buffer.from(batch_id).toString("hex").substring(0, 32) + "00018182583900";

  res.json({
    success: true,
    tx_hash: "tx_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    unsigned_tx: unsignedTx,
    checkpoint,
  });
});

// POST to submit the signed transaction (completes the signature flow)
app.post("/submit-tx", (req: Request, res: Response) => {
  const { signed_tx } = req.body;
  if (!signed_tx) {
    return res.status(400).json({ error: "Missing signed_tx string." });
  }

  // Simulated Tx submission
  const txHash = "tx_hash_" + Math.random().toString(16).substring(2, 12);
  res.json({
    success: true,
    tx_hash: txHash,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 TrueBatch core backend running on http://localhost:${PORT}`);
  console.log(`- Health Check: GET http://localhost:${PORT}/health`);
  console.log(`- Query Batch: GET http://localhost:${PORT}/batch/:id`);
});
