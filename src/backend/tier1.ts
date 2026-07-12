import { Flag, calculateRiskLevel } from "./tier0";
import { Checkpoint } from "../data/types";
import axios from "axios";

export interface Tier1Decision {
  escalate: boolean;
  reasoning: string;
}

export async function runTier1(
  flags: Flag[],
  checkpoints: Checkpoint[]
): Promise<Tier1Decision> {
  const riskLevel = calculateRiskLevel(flags);

  // If risk is not high, no need to escalate
  if (riskLevel !== "high") {
    return {
      escalate: false,
      reasoning: `Risk level is ${riskLevel}, no escalation required.`,
    };
  }

  const flagSummary = flags.map((f) => `- ${f.message}`).join("\n");
  const timelineSummary = checkpoints
    .map((cp) => `- Stage: ${cp.stage}, Slot: ${cp.slot}, Hash: ${cp.data_hash.substring(0, 8)}...`)
    .join("\n");

  const prompt = `You are a material quality control AI auditor.
Analyze the following material checkpoint timeline and detected risk anomalies:

--- DETECTED ANOMALIES ---
${flagSummary}

--- MATERIAL TIMELINE ---
${timelineSummary}

-------------------------
Answer ONLY with "YES" or "NO".
Should we escalate this batch to generate a detailed hazard warning report for construction engineers? (e.g. if the anomalies suggest structural issues or faked certifications vs. simple typo errors).`;

  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  try {
    const response = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model: "qwen2.5:7b",
        prompt,
        stream: false,
      },
      { timeout: 3000 } // Don't block the backend thread for too long
    );

    const text = response.data.response.trim().toUpperCase();
    const escalate = text.includes("YES");

    return {
      escalate,
      reasoning: `Qwen 2.5:7b Model Response: "${text}". Escalation ${escalate ? "Approved" : "Denied"}.`,
    };
  } catch (error: any) {
    console.warn(`[Tier 1] Ollama Qwen request failed (${error.message}). Falling back to auto-escalation for High Risk.`);
    return {
      escalate: true,
      reasoning: "Local Ollama model unavailable. Auto-escalated based on High Risk severity profile.",
    };
  }
}
