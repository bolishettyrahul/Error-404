import React, { useState } from "react";
import axios from "axios";
import type { BrowserWallet } from "@meshsdk/core";
import { BatchData, Checkpoint } from "./types";
import { toDashboardBatch, nextStageOptions, DEMO_BATCH_IDS } from "./lib/adapters";
import { checkpointPayload, signCheckpoint, type ConnectedWallet } from "./lib/wallet";

import { Navbar } from "./components/landing/Navbar";
import { Hero } from "./components/landing/Hero";
import { ProductOverview } from "./components/landing/ProductOverview";
import { HowItWorks } from "./components/landing/HowItWorks";
import { Footer } from "./components/landing/Footer";

import { Header } from "./components/dashboard/Header";
import { BatchSearch } from "./components/dashboard/BatchSearch";
import { BatchDetail } from "./components/dashboard/BatchDetail";
import { AddCheckpointDialog } from "./components/dashboard/AddCheckpointDialog";
import { WalletPicker } from "./components/domain/WalletPicker";

import { Toast, type ToastTone } from "./components/ui/Toast";

const BACKEND_URL = "http://localhost:3000";

interface AppendCheckpointResponse {
  success: boolean;
  proof: string;
  checkpoint: Checkpoint;
}

type View = "landing" | "app";

function App() {
  const [view, setView] = useState<View>("landing");

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      return true;
    }
    document.documentElement.removeAttribute("data-theme");
    return false;
  });

  const [walletInstance, setWalletInstance] = useState<BrowserWallet | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [actorPkh, setActorPkh] = useState<string | null>(null);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);

  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ tone: ToastTone; text: string } | null>(null);

  const triggerToast = (text: string, tone: ToastTone = "good") => {
    setToast({ tone, text });
    setTimeout(() => setToast(null), 3400);
  };

  const toggleDarkMode = (next: boolean) => {
    setDarkMode(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  const openWalletPicker = () => setWalletPickerOpen(true);

  const handleWalletConnected = (wallet: ConnectedWallet) => {
    setWalletInstance(wallet.instance);
    setWalletAddress(wallet.address);
    setActorPkh(wallet.actorPkh);
    setWalletPickerOpen(false);
    triggerToast("Wallet connected to Cardano Preview testnet.", "info");
  };

  const disconnectWallet = () => {
    setWalletInstance(null);
    setWalletAddress(null);
    setActorPkh(null);
    triggerToast("Wallet disconnected.", "info");
  };

  const runSearch = async (id: string) => {
    setView("app");
    setSearchLoading(true);
    setSearchError(null);
    setBatchData(null);

    try {
      const response = await axios.get<BatchData>(`${BACKEND_URL}/batch/${id}`);
      setBatchData(response.data);
    } catch (err: any) {
      const message = err.response?.data?.error || `No batch found for "${id}".`;
      setSearchError(message);
      triggerToast(message, "flag");
    } finally {
      setSearchLoading(false);
    }
  };

  const goHome = () => {
    setView("landing");
    setBatchData(null);
    setSearchError(null);
  };

  const backToSearch = () => {
    setBatchData(null);
    setSearchError(null);
  };

  const submitCheckpoint = async ({ stage, hash }: { stage: string; hash: string }) => {
    if (!batchData || !walletInstance || !walletAddress || !actorPkh) return;
    setFormLoading(true);
    setFormError(null);

    try {
      const slot = Math.floor(Date.now() / 1000);
      const payload = checkpointPayload(batchData.batch_id, stage, hash, slot);
      const { signature, key } = await signCheckpoint(walletInstance, walletAddress, payload);

      const response = await axios.post<AppendCheckpointResponse>(`${BACKEND_URL}/append-checkpoint`, {
        batch_id: batchData.batch_id,
        new_checkpoint: { stage, actor_pkh: actorPkh, data_hash: hash, slot },
        signature,
        key,
        address: walletAddress,
      });

      if (response.data.success) {
        const proof = response.data.proof;
        triggerToast(`Checkpoint recorded on-chain. Proof ${proof.slice(0, 16)}…`, "info");
        setDialogOpen(false);
        const refreshed = await axios.get<BatchData>(`${BACKEND_URL}/batch/${batchData.batch_id}`);
        setBatchData(refreshed.data);
      } else {
        setFormError("Checkpoint submission failed.");
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || "Failed to sign or append checkpoint.";
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const dashboardBatch = batchData ? toDashboardBatch(batchData) : null;
  const nextStages = batchData ? nextStageOptions(batchData.checkpoints.length) : [];

  return (
    <div style={{ minHeight: "100vh" }}>
      {view === "landing" && (
        <div>
          <Navbar wallet={walletAddress} onConnect={openWalletPicker} onDisconnect={disconnectWallet} />
          <Hero onSearch={runSearch} wallet={walletAddress} onConnect={openWalletPicker} />
          <ProductOverview />
          <HowItWorks />
          <Footer />
        </div>
      )}

      {view === "app" && (
        <div>
          <Header
            darkMode={darkMode}
            onToggleDark={toggleDarkMode}
            wallet={walletAddress}
            onConnect={openWalletPicker}
            onDisconnect={disconnectWallet}
            onLogoClick={goHome}
          />

          {!dashboardBatch && (
            <div className="tb-view" style={{ animation: "tb-fade-in 420ms var(--ease-out) both" }}>
              <BatchSearch onSearch={runSearch} recent={DEMO_BATCH_IDS} loading={searchLoading} error={searchError} />
            </div>
          )}

          {dashboardBatch && (
            <div className="tb-view" style={{ animation: "tb-fade-in 420ms var(--ease-out) both" }}>
              <div style={{ maxWidth: "var(--container-max)", margin: "20px auto 0", padding: "0 24px" }}>
                <button
                  onClick={backToSearch}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ← Search
                </button>
              </div>
              <BatchDetail
                batch={dashboardBatch}
                onAddCheckpoint={() => setDialogOpen(true)}
                addCheckpointDisabled={nextStages.length === 0}
              />
              <AddCheckpointDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                wallet={walletAddress}
                actorPkh={actorPkh}
                onConnect={openWalletPicker}
                onSubmit={submitCheckpoint}
                nextStages={nextStages}
                submitting={formLoading}
                error={formError}
              />
            </div>
          )}
        </div>
      )}

      <WalletPicker open={walletPickerOpen} onClose={() => setWalletPickerOpen(false)} onConnected={handleWalletConnected} />

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200 }}>
          <Toast tone={toast.tone} onDismiss={() => setToast(null)}>
            {toast.text}
          </Toast>
        </div>
      )}
    </div>
  );
}

export default App;
