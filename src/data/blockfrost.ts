import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.BLOCKFROST_API_KEY || "preview_mock_key";

export const blockfrost = new BlockFrostAPI({
  projectId: API_KEY,
});

export async function getNetworkInfo() {
  if (API_KEY === "preview_mock_key") {
    console.warn("⚠️ Using mock Blockfrost API key. Network queries will be simulated.");
    return { network: "preview", supply: { total: "0", circulating: "0" } };
  }
  try {
    const info = await blockfrost.network();
    console.log("✅ Blockfrost connected", info.network);
    return info;
  } catch (error) {
    console.error("❌ Blockfrost connection failed, falling back to offline simulation:", error);
    return { network: "preview", error: "Offline/Invalid API key" };
  }
}
