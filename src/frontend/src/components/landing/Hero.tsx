import React from "react";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { BatchIdChip } from "../ui/BatchIdChip";
import { Input } from "../ui/Input";
import { Reveal } from "./Reveal";

export interface HeroProps {
  onSearch: (batchId: string) => void;
  wallet?: string | null;
  onConnect?: () => void;
}

/** Hero — the landing page's dark, always-on-brand opening statement. Not affected by the app's light/dark toggle. */
export function Hero({ onSearch, wallet, onConnect }: HeroProps) {
  const [q, setQ] = React.useState("");

  return (
    <section
      id="hero"
      data-theme="dark"
      style={{
        position: "relative",
        overflow: "hidden",
        paddingTop: 168,
        paddingBottom: 120,
        background: "radial-gradient(ellipse 900px 560px at 50% -10%, #2c2c2e 0%, #1D1D1F 46%, #000000 100%)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 700px 420px at 50% 0%, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 700px 420px at 50% 0%, black, transparent 72%)",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "0 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Reveal>
          <Badge
            tone="neutral"
            icon={<Icon name="link-2" size={12} color="#F5F5F7" />}
            style={{ background: "rgba(255,255,255,0.08)", color: "#F5F5F7" }}
          >
            Built on Cardano · Preview testnet
          </Badge>
        </Reveal>

        <Reveal delay={80}>
          <h1
            style={{
              margin: "28px 0 0",
              fontFamily: "var(--font-display)",
              fontWeight: "var(--weight-semibold)" as any,
              fontSize: "clamp(40px, 6vw, 64px)",
              lineHeight: "var(--leading-tight)",
              letterSpacing: "var(--tracking-tight)",
              color: "#F5F5F7",
              maxWidth: 780,
            }}
          >
            An unforgeable record for every material batch
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p
            style={{
              margin: "22px 0 0",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-lg)",
              lineHeight: "var(--leading-normal)",
              color: "rgba(245,245,247,0.68)",
              maxWidth: 620,
            }}
          >
            TrueBatch signs every checkpoint — manufactured, lab-tested, dispatched, delivered — to an append-only
            record on Cardano. Nothing can be rewritten after the fact.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) onSearch(q.trim());
            }}
            style={{ display: "flex", gap: 10, marginTop: 40, flexWrap: "wrap", justifyContent: "center" }}
          >
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Batch ID, e.g. B-2024-GOOD"
              monospace
              icon={<Icon name="search" size={16} color="rgba(245,245,247,0.5)" />}
              style={{ width: 300, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
            />
            <Button type="submit" variant="primary" size="lg" style={{ background: "#F5F5F7", color: "#1D1D1F" }}>
              Search
            </Button>
            <Button
              variant="secondary"
              size="lg"
              style={{ background: "rgba(255,255,255,0.10)", color: "#F5F5F7" }}
              icon={<Icon name={wallet ? "shield-check" : "wallet"} size={16} color="#F5F5F7" />}
              onClick={onConnect}
            >
              {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet"}
            </Button>
          </form>
        </Reveal>

        <Reveal delay={340} style={{ marginTop: 64, width: "100%", display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: "min(560px, 100%)",
              background: "rgba(28,28,30,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--radius-card)",
              padding: "22px 26px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  color: "rgba(245,245,247,0.5)",
                  letterSpacing: "var(--tracking-wide)",
                }}
              >
                BATCH
              </span>
              <BatchIdChip value="B-2024-GOOD" copyable={false} />
            </div>
            {[
              { s: "Manufactured", t: "complete" },
              { s: "Lab tested", t: "complete" },
              { s: "Dispatched", t: "pending" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0" }}>
                <Icon
                  name={row.t === "complete" ? "check-circle-2" : "clock"}
                  size={16}
                  color={row.t === "complete" ? "#32D74B" : "#FFD60A"}
                />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "#F5F5F7" }}>
                  {row.s}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
