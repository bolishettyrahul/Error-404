export enum Stage {
  Manufactured = "Manufactured",
  LabTested = "LabTested",
  Dispatched = "Dispatched",
  Delivered = "Delivered",
}

export interface Checkpoint {
  stage: Stage;
  actor_pkh: string;      // Hex-encoded public key hash
  data_hash: string;      // Hex-encoded 32-byte hash
  slot: number;           // Cardano slot / timestamp proxy
}

export interface BatchDatum {
  batch_id: string;       // Unique batch ID
  checkpoints: Checkpoint[];
}

export interface QueryBatchResult {
  batch_id: string;
  checkpoints: Checkpoint[];
  utxo_ref: string;
}
