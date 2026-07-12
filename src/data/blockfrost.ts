import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.BLOCKFROST_API_KEY || "preprod_mock_key";

export const blockfrost = new BlockFrostAPI({
  projectId: API_KEY,
});

export async function getNetworkInfo() {
  if (API_KEY === "preprod_mock_key") {
    console.warn("⚠️ Using mock Blockfrost API key. Preprod network queries will be simulated.");
    return { network: "preprod", supply: { total: "0", circulating: "0" } };
  }
  try {
    const info = await (blockfrost as any).network();
    console.log("✅ Blockfrost connected", info.network);
    return info;
  } catch (error) {
    console.error("❌ Blockfrost connection failed, falling back to offline simulation:", error);
    return { network: "preprod", error: "Offline/Invalid API key" };
  }
}
