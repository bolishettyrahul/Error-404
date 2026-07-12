pub type Stage {
  Manufactured
  LabTested
  Dispatched
  Delivered
}

pub type Checkpoint {
  stage: Stage,
  actor_pkh: ByteArray,       // Public key hash of authorized actor
  data_hash: ByteArray,        // Hash of cert/GPS/delivery note (32 bytes)
  slot: Int,                   // Cardano slot number (timestamp)
}

pub type BatchDatum {
  batch_id: ByteArray,         // Unique batch identifier
  checkpoints: List<Checkpoint>,  // Append-only history of checkpoints
}

pub type BatchRedeemer {
  AppendCheckpoint { new_checkpoint: Checkpoint }
}
