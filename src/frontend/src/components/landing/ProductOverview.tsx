import React from "react";
import { Icon } from "../ui/Icon";
import { Card } from "../ui/Card";
import { Reveal } from "./Reveal";

const TOOLS = [
  {
    icon: "search",
    title: "Batch search",
    body: "Look up any batch by ID to pull its full on-chain history straight from Cardano — no login required.",
  },
  {
    icon: "list-tree",
    title: "Checkpoint timeline",
    body: "Manufactured, lab-tested, dispatched, delivered — each stage shown with its signer, timestamp, and data hash.",
  },
  {
    icon: "flag",
    title: "Risk flags",
    body: "A deterministic rule engine checks curing time, test values, actor identity, and sequence — before anything reaches a human.",
  },
  {
    icon: "file-text",
    title: "AI risk report",
    body: "When flags cross a threshold, a plain-language report explains what to verify and who to contact — not a safety certification.",
  },
];

/** ProductOverview — light-section grid of the four dashboard tools, shown on the marketing landing page. */
export function ProductOverview() {
  return (
    <section id="product" style={{ padding: "128px 32px", background: "var(--paper)" }}>
      <div style={{ maxWidth: "var(--container-max)", margin: "0 auto" }}>
        <Reveal>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-wide)",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
            }}
          >
            The tools
          </span>
          <h2
            style={{
              margin: "10px 0 0",
              fontFamily: "var(--font-display)",
              fontWeight: "var(--weight-semibold)" as any,
              fontSize: "var(--text-3xl)",
              letterSpacing: "var(--tracking-tight)",
              color: "var(--ink)",
              maxWidth: 560,
            }}
          >
            Four tools. One append-only record.
          </h2>
          <p
            style={{
              margin: "14px 0 0",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-md)",
              color: "var(--text-secondary)",
              maxWidth: 560,
              lineHeight: "var(--leading-normal)",
            }}
          >
            TrueBatch does not certify safety or guarantee honesty. It guarantees the record cannot be rewritten, and
            surfaces the signals a site engineer needs to verify the rest.
          </p>
        </Reveal>

        <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {TOOLS.map((tool, i) => (
            <Reveal key={tool.title} delay={i * 90}>
              <Card style={{ height: "100%" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-field)",
                    background: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Icon name={tool.icon} size={20} color="#F5F5F7" />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontWeight: "var(--weight-semibold)" as any,
                    fontSize: "var(--text-lg)",
                    color: "var(--ink)",
                  }}
                >
                  {tool.title}
                </h3>
                <p
                  style={{
                    margin: "10px 0 0",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                    lineHeight: "var(--leading-normal)",
                  }}
                >
                  {tool.body}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
