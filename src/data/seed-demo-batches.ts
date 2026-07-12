import { Stage, Checkpoint, BatchDatum } from "./types";
import * as fs from "fs";
import * as path from "path";

const MANUFACTURER_PKH = "aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd";
const LAB_PKH = "1122334455667788990011223344556677889900112233445566778899001122";
const TRANSPORTER_PKH = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
const SITE_PKH = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

async function seedDemoBatches() {
  console.log("🌱 Seeding demo batches for TrueBatch local testing...");

  // Batch A: Clean (No anomalies)
  // Curing time: slot 100,000 to 704,800 is 604,800 slots = exactly 7 days (Cardano slot is 1 second on Preprod)
  // Transit time: slot 800,000 to 900,000 is 100,000 slots = ~27.7 hours (> 24 hours)
  const batchA_Checkpoints: Checkpoint[] = [
    {
      stage: Stage.Manufactured,
      actor_pkh: MANUFACTURER_PKH,
      data_hash: "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b",
      slot: 100000,
    },
    {
      stage: Stage.LabTested,
      actor_pkh: LAB_PKH,
      data_hash: "f2ca1bb6c7e900a8ecf2cb4275813e312a0f8bfdfb4142cf7918dca46eef24f1", // test strength = 50 MPa
      slot: 704800, // 7 days later
    },
    {
      stage: Stage.Dispatched,
      actor_pkh: TRANSPORTER_PKH,
      data_hash: "c381c4e9c7ff083818e6581452bc5b76cfd3809fb0317ea4729188aa6203cf7b",
      slot: 800000,
    },
    {
      stage: Stage.Delivered,
      actor_pkh: SITE_PKH,
      data_hash: "e578a1f6a8e8f81010a3cd84d9f67a21396bfe1d02c0192e4726e8ad73081eef",
      slot: 900000, // 27.7 hours transit
    },
  ];

  const batchA_Datum: BatchDatum = {
    batch_id: "B-2024-GOOD-0000000000000000000000000000000000000000000000000000000000",
    checkpoints: batchA_Checkpoints,
  };

  // Batch B: Fraudulent (Triggers multiple anomalies)
  // 1. Curing time violation: slot 100,000 to 186,400 is only 86,400 slots = 1 day (should be 7 days)
  // 2. Test strength anomaly: strength data hash is mapped to strength 20 MPa (should be >= 45 MPa)
  // 3. Impossible transit time: slot 200,000 to 210,000 is 10,000 slots = 2.7 hours (should be >= 24 hours)
  // 4. Timestamp reversal: last checkpoint slot is 150,000 (which is before 210,000)
  const batchB_Checkpoints: Checkpoint[] = [
    {
      stage: Stage.Manufactured,
      actor_pkh: MANUFACTURER_PKH,
      data_hash: "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b",
      slot: 100000,
    },
    {
      stage: Stage.LabTested,
      actor_pkh: LAB_PKH,
      data_hash: "a496871a2e7c912bb8006e814032a8efd3e3871adfb120cf7813aef11f8e12aa", // test strength = 20 MPa (substandard)
      slot: 186400, // Only 1 day curing
    },
    {
      stage: Stage.Dispatched,
      actor_pkh: TRANSPORTER_PKH,
      data_hash: "c381c4e9c7ff083818e6581452bc5b76cfd3809fb0317ea4729188aa6203cf7b",
      slot: 200000,
    },
    {
      stage: Stage.Delivered,
      actor_pkh: SITE_PKH,
      data_hash: "e578a1f6a8e8f81010a3cd84d9f67a21396bfe1d02c0192e4726e8ad73081eef",
      slot: 210000, // 2.7 hours transit
    },
    {
      stage: Stage.Delivered,
      actor_pkh: SITE_PKH,
      data_hash: "98eef81d102e3a58eef710898dfef180371aefd3e819bce481dca7e810efab7a",
      slot: 150000, // Timestamp reversal (goes back to 150,000 after being at 210,000)
    },
  ];

  const batchB_Datum: BatchDatum = {
    batch_id: "B-2024-FRAUD-000000000000000000000000000000000000000000000000000000",
    checkpoints: batchB_Checkpoints,
  };

  const db = {
    batchA: batchA_Datum,
    batchB: batchB_Datum,
  };

  const outputPath = path.join(process.cwd(), "demo-batches.json");
  fs.writeFileSync(outputPath, JSON.stringify(db, null, 2));

  console.log(`✅ Demo batches seeded successfully and saved to: ${outputPath}`);
}

seedDemoBatches().catch((err) => {
  console.error("❌ Seeding failed:", err);
});
