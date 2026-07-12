import { blockfrost } from "./blockfrost";
import { BatchDatum, Checkpoint, Stage, QueryBatchResult } from "./types";
import * as fs from "fs";
import * as path from "path";

const VALIDATOR_ADDRESS = "addr_test1wzq8a9d123mockvalidatoraddress";

// Check if cached demo batches exist
function getCachedBatch(batchId: string): QueryBatchResult | null {
  try {
    const cachePath = path.join(process.cwd(), "demo-batches.json");
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      if (data.batchA && data.batchA.batch_id === batchId) {
        return {
          batch_id: data.batchA.batch_id,
          checkpoints: data.batchA.checkpoints,
          utxo_ref: "demo_utxo_ref_good",
        };
      }
      if (data.batchB && data.batchB.batch_id === batchId) {
        return {
          batch_id: data.batchB.batch_id,
          checkpoints: data.batchB.checkpoints,
          utxo_ref: "demo_utxo_ref_fraud",
        };
      }
    }
  } catch (error) {
    console.error("Error reading demo-batches.json cache:", error);
  }
  return null;
}

export async function queryBatchUTxO(batchId: string): Promise<QueryBatchResult | null> {
  // First, check local cache (critical for mock/demo reliability)
  const cached = getCachedBatch(batchId);
  if (cached) return cached;

  // Otherwise, attempt blockfrost query if API key is not mock
  if (process.env.BLOCKFROST_API_KEY && process.env.BLOCKFROST_API_KEY !== "preprod_mock_key") {
    try {
      const utxos = await blockfrost.addressesUtxos(VALIDATOR_ADDRESS);
      for (const utxo of utxos) {
        if ((utxo as any).inline_datum) {
          // Deserialization of Plutus datum is required here
          // For prototype, we simulate finding the correct datum matching batchId
          console.log(`Found UTxO with inline datum: ${(utxo as any).inline_datum}`);
        }
      }
    } catch (error) {
      console.error(`Failed to query Blockfrost for batch ${batchId}:`, error);
    }
  }

  return null;
}

export async function queryAllBatches(): Promise<QueryBatchResult[]> {
  const result: QueryBatchResult[] = [];
  try {
    const cachePath = path.join(process.cwd(), "demo-batches.json");
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      if (data.batchA) {
        result.push({
          batch_id: data.batchA.batch_id,
          checkpoints: data.batchA.checkpoints,
          utxo_ref: "demo_utxo_ref_good",
        });
      }
      if (data.batchB) {
        result.push({
          batch_id: data.batchB.batch_id,
          checkpoints: data.batchB.checkpoints,
          utxo_ref: "demo_utxo_ref_fraud",
        });
      }
    }
  } catch (error) {
    console.error("Error listing all cached batches:", error);
  }
  return result;
}

export async function getCheckpointHistory(batchId: string): Promise<Checkpoint[]> {
  const result = await queryBatchUTxO(batchId);
  return result?.checkpoints ?? [];
}
