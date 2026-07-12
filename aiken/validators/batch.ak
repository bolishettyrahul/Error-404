use aiken/collection/list
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction, InlineDatum}
use lib/types.{BatchDatum, BatchRedeemer, Checkpoint, Stage, Manufactured, LabTested, Dispatched, Delivered, AppendCheckpoint}

// Hardcoded role whitelist (hackathon scope)
const manufacturer_pkh: ByteArray = #"aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd"
const lab_pkh: ByteArray = #"1122334455667788990011223344556677889900112233445566778899001122"
const transporter_pkh: ByteArray = #"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
const site_pkh: ByteArray = #"fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"

fn get_expected_pkh(stage: Stage) -> ByteArray {
  when stage is {
    Manufactured -> manufacturer_pkh
    LabTested -> lab_pkh
    Dispatched -> transporter_pkh
    Delivered -> site_pkh
  }
}

fn is_next_stage(current: Stage, next: Stage) -> Bool {
  when (current, next) is {
    (Manufactured, LabTested) -> True
    (LabTested, Dispatched) -> True
    (Dispatched, Delivered) -> True
    _ -> False
  }
}

validator batch {
  spend(
    datum: Option<BatchDatum>,
    redeemer: BatchRedeemer,
    _utxo: OutputReference,
    self: Transaction,
  ) {
    expect Some(old_datum) = datum
    let AppendCheckpoint(new_checkpoint) = redeemer
    
    // Extract current checkpoints
    let old_checkpoints = old_datum.checkpoints
    
    // 1. Verify sequence is valid
    let sequence_ok = 
      when list.last(old_checkpoints) is {
        None -> new_checkpoint.stage == Manufactured
        Some(last) -> is_next_stage(last.stage, new_checkpoint.stage)
      }
      
    // 2. Verify actor matches the role expected for the stage
    let expected_pkh = get_expected_pkh(new_checkpoint.stage)
    let actor_ok = new_checkpoint.actor_pkh == expected_pkh
    
    // 3. Verify that the tx signer is the actor
    let signed_by_actor = list.has(self.extra_signatories, new_checkpoint.actor_pkh)
    
    // 4. Verify that output datum has exactly the new checkpoints appended
    let expected_checkpoints = list.concat(old_checkpoints, [new_checkpoint])
    
    // Find output pointing to the same validator address
    let output_datum_ok = 
      list.any(self.outputs, fn(output) {
        when output.datum is {
          InlineDatum(raw_d) -> {
            expect d: BatchDatum = raw_d
            d.batch_id == old_datum.batch_id && d.checkpoints == expected_checkpoints
          }
          _ -> False
        }
      })
      
    sequence_ok && actor_ok && signed_by_actor && output_datum_ok
  }
}
