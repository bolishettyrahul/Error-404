import React from "react";
import { Icon } from "../ui/Icon";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    icon: "wallet",
    title: "Connect your wallet",
    body: "Sign in with any CIP-30 wallet — Lace, Eternl, or similar. No account, no password.",
  },
  {
    icon: "pen-line",
    title: "Sign the checkpoint",
    body: "Enter the stage, actor, and a hash of the certificate, GPS log, or delivery note. Your wallet signs it.",
  },
  {
    icon: "send",
    title: "Submitted to Cardano",
    body: "The signed checkpoint is appended to the batch's on-chain record and broadcast to the network.",
  },
  {
    icon: "lock",
    title: "Immutable, from then on",
    body: "Once confirmed, the checkpoint cannot be edited or removed — only new checkpoints can be appended.",
  },
];

/** HowItWorks — dark-section, numbered 4-step explainer of the wallet-signed checkpoint flow. */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        position: "relative",
        padding: "128px 32px",
        background: "linear-gradient(180deg, #000000 0%, #1D1D1F 100%)",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "var(--container-max)", margin: "0 auto" }}>
        <Reveal>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-wide)",
              color: "rgba(245,245,247,0.5)",
              textTransform: "uppercase",
            }}
          >
            How it works
          </span>
          <h2
            style={{
              margin: "10px 0 0",
              fontFamily: "var(--font-display)",
              fontWeight: "var(--weight-semibold)" as any,
              fontSize: "var(--text-3xl)",
              letterSpacing: "var(--tracking-tight)",
              color: "#F5F5F7",
              maxWidth: 560,
            }}
          >
            From wallet signature to on-chain record
          </h2>
        </Reveal>

        <div style={{ marginTop: 64, position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 110}>
                <div>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 22,
                      position: "relative",
                    }}
                  >
                    <Icon name={step.icon} size={22} color="#F5F5F7" />
                    <span
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#F5F5F7",
                        color: "#1D1D1F",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: "var(--weight-semibold)" as any,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontWeight: "var(--weight-semibold)" as any,
                      fontSize: "var(--text-md)",
                      color: "#F5F5F7",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "rgba(245,245,247,0.6)",
                      lineHeight: "var(--leading-normal)",
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={480}>
          <p
            style={{
              marginTop: 56,
              paddingTop: 24,
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "rgba(245,245,247,0.45)",
              maxWidth: 640,
            }}
          >
            TrueBatch runs on the Cardano Preview testnet. Records are read via Blockfrost; checkpoints are minted as
            CIP-68 tokens with an append-only datum, so history can only ever grow, never change.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
