import React, { useState, useEffect } from "react";
import axios from "axios";
import { BatchData, Checkpoint, Stage, Flag } from "./types";
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  Plus, 
  ArrowRight, 
  Sun, 
  Moon, 
  Wallet, 
  Info,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  X
} from "lucide-react";

const BACKEND_URL = "http://localhost:3000";

function App() {
  const [batchId, setBatchId] = useState("");
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // New Checkpoint Form State
  const [nextStage, setNextStage] = useState<Stage>(Stage.Manufactured);
  const [actorPkh, setActorPkh] = useState("");
  const [dataHash, setDataHash] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  
  // Custom Toast/Notification Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Tab State: "timeline" or "append"
  const [activeTab, setActiveTab] = useState<"timeline" | "append">("timeline");

  // Wallet Simulation State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Dark Mode Theme State
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or set default light mode
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      setDarkMode(false);
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  const triggerToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!batchId.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    setBatchData(null);
    setFormError("");

    try {
      const response = await axios.get(`${BACKEND_URL}/batch/${batchId.trim()}`);
      setBatchData(response.data);
      triggerToast("Batch records fetched from blockchain ledger.", "success");
      
      // Determine what the next stage should be
      const currentCheckpoints = response.data.checkpoints;
      if (currentCheckpoints.length > 0) {
        const lastStage = currentCheckpoints[currentCheckpoints.length - 1].stage;
        const stageSequence = [Stage.Manufactured, Stage.LabTested, Stage.Dispatched, Stage.Delivered];
        const lastIdx = stageSequence.indexOf(lastStage);
        if (lastIdx !== -1 && lastIdx < stageSequence.length - 1) {
          setNextStage(stageSequence[lastIdx + 1]);
        } else {
          setNextStage(Stage.Delivered); 
        }
      } else {
        setNextStage(Stage.Manufactured);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Batch not found or connection to verification API failed.";
      setSearchError(errMsg);
      triggerToast(errMsg, "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConnectWallet = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress("");
      triggerToast("Wallet disconnected.", "info");
    } else {
      setWalletConnected(true);
      setWalletAddress("addr_test1qzp7y...9wxl8a");
      triggerToast("Lace wallet connected to Cardano Preview Testnet.", "success");
    }
  };

  const handleAddCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchData) return;
    if (!actorPkh.trim() || !dataHash.trim()) {
      setFormError("All validator fields must be completed.");
      return;
    }
    if (!walletConnected) {
      setFormError("Please connect your CIP-30 wallet first.");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/append-checkpoint`, {
        batch_id: batchData.batch_id,
        new_checkpoint: {
          stage: nextStage,
          actor_pkh: actorPkh.trim(),
          data_hash: dataHash.trim(),
          slot: Math.floor(Date.now() / 1000)
        }
      });

      if (response.data.success) {
        triggerToast("Transaction built. Awaiting wallet signing...", "info");
        
        // Simulating wallet signature duration
        setTimeout(async () => {
          triggerToast(`Transaction signed. Submitted to ledger. Tx Hash: ${response.data.tx_hash.substring(0, 16)}...`, "success");
          
          // Re-fetch updated batch details
          const refreshResponse = await axios.get(`${BACKEND_URL}/batch/${batchData.batch_id}`);
          setBatchData(refreshResponse.data);
          setActorPkh("");
          setDataHash("");
          setActiveTab("timeline");
        }, 1500);
      } else {
        setFormError("Cardano transaction building failed.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to append checkpoint.";
      setFormError(errorMsg);
      triggerToast(errorMsg, "error");
    } finally {
      setFormLoading(false);
    }
  };

  const selectDemoBatch = (id: string) => {
    setBatchId(id);
    setSearchLoading(true);
    setSearchError("");
    setBatchData(null);
    
    // Trigger automatic API query
    setTimeout(async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/batch/${id}`);
        setBatchData(response.data);
        triggerToast(`Demo batch loaded. Risk Profile: ${response.data.risk_level.toUpperCase()}`, "success");
      } catch (err: any) {
        setSearchError(err.response?.data?.error || "Failed to load demo scenario.");
      } finally {
        setSearchLoading(false);
      }
    }, 200);
  };

  // Helper to format short addresses / hashes
  const shortenHash = (hash: string, length = 8) => {
    if (!hash || hash.length <= length * 2) return hash;
    return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
  };

  return (
    <div className="min-h-screen flex flex-col font-body bg-paper text-ink transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-space-3 px-space-6 py-4 rounded-[14px] shadow-modal border border-hairline text-scale-sm font-semibold ${
            toastType === "success" 
              ? "status-good" 
              : toastType === "error" 
              ? "status-flagged" 
              : "status-info"
          }`}>
            <span>{toastType === "success" ? "✓" : toastType === "error" ? "⚠" : "ℹ"}</span>
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header (Wordmark only, no logo) */}
      <header className="border-b border-hairline py-4 px-space-6 bg-paper sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-display font-bold text-scale-xl tracking-tight leading-none cursor-pointer" onClick={() => setBatchData(null)}>
              TrueBatch
            </span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Immutable Validation Network</span>
          </div>

          <div className="flex items-center gap-space-3">
            {/* Wallet Integration Button */}
            <button
              onClick={handleConnectWallet}
              className={`ui-button-secondary hover-lift press-scale px-4 py-2 ${
                walletConnected ? "status-good" : ""
              }`}
            >
              <Wallet size={16} strokeWidth={2} />
              <span className="text-scale-xs font-semibold">
                {walletConnected ? shortenHash(walletAddress, 6) : "Connect Wallet"}
              </span>
            </button>

            {/* Dark Mode Switch */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-hairline bg-surface text-ink hover-lift press-scale"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-space-6 flex flex-col gap-space-6 justify-center">
        
        {/* LANDING PAGE (NO SEARCH RESULTS YET) */}
        {!batchData && !searchLoading && (
          <div className="w-full max-w-3xl mx-auto py-12 flex flex-col gap-space-6">
            
            {/* Hero Section */}
            <div className="text-center space-y-3">
              <h2 className="font-display font-bold text-scale-3xl tracking-tight leading-tight">
                Immutable construction material validation. <br />
                <span className="text-gray-500 font-normal">Powered by Cardano Preview testnet.</span>
              </h2>
              <p className="text-scale-sm text-gray-500 max-w-lg mx-auto">
                Each material batch contains an append-only digital checkpoint trail signed by authorized manufacturers, labs, and inspectors. AI-analyzed for security anomalies.
              </p>
            </div>

            {/* Search Box Card */}
            <div className="ui-card shadow-card ui-stack">
              <h3 className="font-display font-semibold text-scale-sm uppercase tracking-wider text-gray-500">
                Verify Batch Registry
              </h3>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-space-3">
                <input
                  type="text"
                  placeholder="Enter a batch identifier..."
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="ui-field flex-1 text-scale-sm"
                  required
                />
                <button
                  type="submit"
                  className="ui-button hover-lift press-scale text-scale-sm font-semibold"
                >
                  <Search size={16} strokeWidth={2} />
                  <span>Verify Batch</span>
                </button>
              </form>

              {searchError && (
                <div className="p-3 status-flagged rounded-[14px] text-scale-xs">
                  {searchError}
                </div>
              )}
            </div>

          </div>
        )}

        {/* LOADING ANIMATION */}
        {searchLoading && (
          <div className="w-full max-w-xl mx-auto py-24 text-center space-y-4">
            <RefreshCw size={32} className="animate-spin text-gray-400 mx-auto" />
            <p className="text-scale-sm font-semibold text-gray-500">Querying Cardano ledger and running AI compliance engines...</p>
          </div>
        )}

        {/* DASHBOARD DETAILS (BATCH DATA LOADED) */}
        {batchData && !searchLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6 items-start">
            
            {/* Left Column: Summary and Alerts */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Batch Metadata Panel */}
              <div className="ui-card shadow-card ui-stack">
                <div className="flex items-center justify-between">
                  <span className="text-scale-xs font-bold uppercase tracking-wider text-gray-400">Batch Record</span>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    batchData.risk_level === "high" 
                      ? "status-flagged" 
                      : batchData.risk_level === "medium"
                      ? "status-pending"
                      : "status-good"
                  }`}>
                    {batchData.risk_level.toUpperCase()} RISK
                  </div>
                </div>

                <div className="flex flex-col gap-space-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Batch ID (Ledger Key)</label>
                  <div className="font-mono text-scale-sm p-3 bg-surface rounded-[14px] border border-hairline break-all">
                    {batchData.batch_id}
                  </div>
                </div>

                {/* Back to Home action */}
                <button 
                  onClick={() => { setBatchData(null); setBatchId(""); }} 
                  className="w-full ui-button-secondary hover-lift press-scale text-scale-xs font-semibold"
                >
                  ← New Query Search
                </button>
              </div>

              {/* Anomaly list using Signal Red accents only */}
              {batchData.flags.length > 0 && (
                <div className="ui-card border-red-500/30 ui-stack">
                  <h3 className="font-display font-bold text-scale-sm text-red-500 flex items-center gap-space-2">
                    <AlertTriangle size={16} strokeWidth={2} className="text-red-500" />
                    Ledger Risk Indicators ({batchData.flags.length})
                  </h3>
                  
                  <div className="flex flex-col gap-space-2">
                    {batchData.flags.map((flag, idx) => (
                      <div 
                        key={idx} 
                        className="status-flagged p-3 rounded-[14px] text-scale-xs flex flex-col gap-space-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[10px] uppercase tracking-wide">
                            {flag.rule_id.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] font-mono opacity-80 uppercase">{flag.severity}</span>
                        </div>
                        <p className="leading-relaxed opacity-95">{flag.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Inspector Copilot Analysis */}
              {batchData.report && (
                <div className="ui-card border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent ui-stack">
                  <div className="flex items-center gap-space-2">
                    <span className="text-scale-md">🤖</span>
                    <h3 className="font-display font-bold text-scale-sm text-ink">AI Safety Advisory Report</h3>
                  </div>
                  <p className="text-scale-xs leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-line">
                    {batchData.report.report}
                  </p>
                  <div className="border-t border-hairline pt-2 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span>Inference: Groq Mixtral</span>
                    <span>Confidence: {(batchData.report.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Interactive timeline and validation forms */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tab Selector */}
              <div className="flex border-b border-hairline">
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`px-4 py-2 font-display text-scale-sm font-semibold border-b-2 transition-all ${
                    activeTab === "timeline" 
                      ? "border-ink text-ink" 
                      : "border-transparent text-gray-400 hover:text-ink"
                  }`}
                >
                  Checkpoint Timeline
                </button>
                <button
                  onClick={() => setActiveTab("append")}
                  className={`px-4 py-2 font-display text-scale-sm font-semibold border-b-2 transition-all ${
                    activeTab === "append" 
                      ? "border-ink text-ink" 
                      : "border-transparent text-gray-400 hover:text-ink"
                  }`}
                >
                  Append Checkpoint (CIP-30)
                </button>
              </div>

              {/* TAB 1: CHECKPOINT TIMELINE */}
              {activeTab === "timeline" && (
                <div className="ui-card shadow-card ui-stack">
                  
                  <div className="relative pl-8 border-l border-hairline flex flex-col gap-space-4 py-2">
                    
                    {batchData.checkpoints.map((cp, idx) => {
                      // Check if this checkpoint is part of any flag indices
                      const isFlagged = batchData?.flags.some(f => 
                        f.checkpoint_indices?.includes(idx)
                      );

                      return (
                        <div key={idx} className="relative group">
                          
                          {/* Timeline Dot with special signal red styling for flagged items */}
                          <span className={`absolute -left-[41px] top-0 p-1.5 rounded-full border transition-all ${
                            isFlagged 
                              ? "bg-red-500 border-red-500 text-white shadow-[0_0_10px_rgba(255,69,58,0.4)]"
                              : idx === batchData.checkpoints.length - 1
                              ? "bg-ink border-ink text-paper"
                              : "bg-surface border-hairline text-gray-400"
                          }`}>
                            {isFlagged ? (
                              <AlertTriangle size={12} strokeWidth={2} />
                            ) : idx === batchData.checkpoints.length - 1 ? (
                              <Clock size={12} strokeWidth={2} />
                            ) : (
                              <CheckCircle size={12} strokeWidth={2} />
                            )}
                          </span>

                          <div className="flex flex-col gap-space-2">
                            <div className="flex flex-wrap items-center justify-between gap-space-2">
                              <div className="flex items-center gap-space-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isFlagged 
                                    ? "status-flagged"
                                    : "status-good"
                                }`}>
                                  {cp.stage}
                                </span>
                                
                                {isFlagged && (
                                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                                    Anomaly Flagged
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-gray-400">Cardano Slot: {cp.slot}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-3 p-4 bg-surface rounded-[14px] border border-hairline text-scale-xs">
                              <div className="space-y-1">
                                <span className="block uppercase text-[9px] tracking-wider text-gray-400 font-bold">Authorized Actor PKH</span>
                                <span className="font-mono break-all text-gray-500">{cp.actor_pkh}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="block uppercase text-[9px] tracking-wider text-gray-400 font-bold">Document Data Hash</span>
                                <span className="font-mono break-all text-gray-500">{cp.data_hash}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}

                  </div>

                </div>
              )}

              {/* TAB 2: APPEND CHECKPOINT */}
              {activeTab === "append" && (
                <div className="ui-card shadow-card ui-stack">
                  <div className="flex flex-col gap-space-1">
                    <h3 className="font-display font-bold text-scale-md">Append Digital Checkpoint</h3>
                    <p className="text-scale-xs text-gray-400">
                      Sign and push a new material validation checkpoint to the Preview testnet validator. This requires an active, connected CIP-30 wallet credential matching the whitelist role.
                    </p>
                  </div>

                  <form onSubmit={handleAddCheckpoint} className="ui-stack">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-3">
                      <div className="flex flex-col gap-space-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Checkpoint Stage</label>
                        <select
                          value={nextStage}
                          onChange={(e) => setNextStage(e.target.value as Stage)}
                          className="ui-field w-full"
                        >
                          <option value={Stage.Manufactured}>Manufactured (Manufacturer)</option>
                          <option value={Stage.LabTested}>LabTested (Testing Laboratory)</option>
                          <option value={Stage.Dispatched}>Dispatched (Logistic Transporter)</option>
                          <option value={Stage.Delivered}>Delivered (Site Inspector)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-space-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Actor Public Key Hash</label>
                        <input
                          type="text"
                          placeholder="Hex-encoded PKH (e.g. 11223344...)"
                          value={actorPkh}
                          onChange={(e) => setActorPkh(e.target.value)}
                          className="ui-field w-full font-mono text-scale-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-space-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Verification Document Hash (GPS / Certificate)</label>
                      <input
                        type="text"
                        placeholder="Hex-encoded 32-byte hash"
                        value={dataHash}
                        onChange={(e) => setDataHash(e.target.value)}
                        className="ui-field w-full font-mono text-scale-xs"
                        required
                      />
                    </div>

                    {formError && (
                      <div className="p-3 status-flagged rounded-[14px] text-scale-xs">
                        {formError}
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="ui-button hover-lift press-scale w-full sm:w-auto font-semibold text-scale-xs"
                      >
                        {formLoading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Processing Ledger transaction...</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} strokeWidth={2} />
                            <span>Build & Sign Checkpoint</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-6 text-center text-[10px] text-gray-500 font-mono mt-12 bg-paper">
        <p>TrueBatch Ledger Explorer — Cardano Preview Testnet Node Integration</p>
      </footer>
    </div>
  );
}

export default App;
