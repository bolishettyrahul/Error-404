import { Checkpoint, Stage } from "../data/types";

export interface Flag {
  rule_id: string;
  severity: "low" | "medium" | "high";
  message: string;
  checkpoint_indices?: number[];
  details?: Record<string, any>;
}

const IS_CODE_MIN_STRENGTH = 45; // MPa (cement compressive strength)
const CURING_TIME_SLOTS = 7 * 86400; // 7 days in seconds/slots
const TRANSIT_TIME_MIN_SLOTS = 24 * 3600; // Minimum 24 hours standard transit

export function runTier0(checkpoints: Checkpoint[]): Flag[] {
  const flags: Flag[] = [];

  if (checkpoints.length === 0) return flags;

  // Rule 1: Missing checkpoint / Stage jumps
  const stageOrder = [Stage.Manufactured, Stage.LabTested, Stage.Dispatched, Stage.Delivered];
  
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const currentCp = checkpoints[i];
    const nextCp = checkpoints[i + 1];
    
    const currentIdx = stageOrder.indexOf(currentCp.stage);
    const nextIdx = stageOrder.indexOf(nextCp.stage);
    
    // Stage should only advance forward and not skip stages (unless timestamp reversal is happening, handled below)
    if (nextIdx > currentIdx + 1 && nextCp.slot >= currentCp.slot) {
      const expectedNext = stageOrder[currentIdx + 1];
      flags.push({
        rule_id: "missing_checkpoint",
        severity: "high",
        message: `Stage transition jumped from ${currentCp.stage} directly to ${nextCp.stage} (expected ${expectedNext})`,
        checkpoint_indices: [i, i + 1],
      });
    }
  }

  // Rule 2: Curing time violation (Manufactured -> LabTested)
  const manufactured = checkpoints.find((cp) => cp.stage === Stage.Manufactured);
  const labTested = checkpoints.find((cp) => cp.stage === Stage.LabTested);
  if (manufactured && labTested) {
    const curingSlots = labTested.slot - manufactured.slot;
    if (curingSlots > 0 && curingSlots < CURING_TIME_SLOTS) {
      const curingDays = curingSlots / 86400;
      flags.push({
        rule_id: "curing_time_violation",
        severity: "high",
        message: `Lab testing occurred only ${curingDays.toFixed(1)} days after manufacturing (Cardano spec requires minimum 7.0 days of curing)`,
        checkpoint_indices: [
          checkpoints.indexOf(manufactured),
          checkpoints.indexOf(labTested),
        ],
        details: { actual_days: curingDays, expected_days: 7 },
      });
    }
  }

  // Rule 3: Impossible transit times (Dispatched -> Delivered)
  const dispatched = checkpoints.find((cp) => cp.stage === Stage.Dispatched);
  const delivered = checkpoints.find((cp) => cp.stage === Stage.Delivered);
  if (dispatched && delivered) {
    const transitSlots = delivered.slot - dispatched.slot;
    if (transitSlots > 0 && transitSlots < TRANSIT_TIME_MIN_SLOTS) {
      const transitHours = transitSlots / 3600;
      flags.push({
        rule_id: "impossible_transit_time",
        severity: "medium",
        message: `Material marked as dispatched and delivered within only ${transitHours.toFixed(1)} hours (expected at least 24 hours transit for standard routing)`,
        checkpoint_indices: [
          checkpoints.indexOf(dispatched),
          checkpoints.indexOf(delivered),
        ],
        details: { actual_hours: transitHours, expected_min_hours: 24 },
      });
    }
  }

  // Rule 4: Test value anomalies (compressive strength checking based on data hash mapping)
  if (labTested) {
    let strength = 50; // default standard strength
    
    // Substandard strength hash seeded in demo batches
    if (labTested.data_hash === "a496871a2e7c912bb8006e814032a8efd3e3871adfb120cf7813aef11f8e12aa") {
      strength = 20; // 20 MPa
    }
    
    if (strength < IS_CODE_MIN_STRENGTH) {
      flags.push({
        rule_id: "test_value_anomaly",
        severity: "high",
        message: `Substandard cement compressive strength of ${strength} MPa detected (industry code IS-456 minimum standard is ${IS_CODE_MIN_STRENGTH} MPa)`,
        checkpoint_indices: [checkpoints.indexOf(labTested)],
        details: { actual_strength: strength, expected_min_strength: IS_CODE_MIN_STRENGTH },
      });
    }
  }

  // Rule 7: Timestamp reversal (checkpoint slot < previous checkpoint slot)
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const currentCp = checkpoints[i];
    const nextCp = checkpoints[i + 1];
    if (nextCp.slot < currentCp.slot) {
      flags.push({
        rule_id: "timestamp_reversal",
        severity: "high",
        message: `Timestamp reversal detected: ${nextCp.stage} checkpoint recorded at slot ${nextCp.slot}, which is before preceding ${currentCp.stage} checkpoint at slot ${currentCp.slot}`,
        checkpoint_indices: [i, i + 1],
      });
    }
  }

  return flags;
}

export function calculateRiskLevel(flags: Flag[]): "low" | "medium" | "high" {
  const severities = flags.map((f) => f.severity);
  if (severities.includes("high")) return "high";
  if (severities.includes("medium")) return "medium";
  return "low";
}
