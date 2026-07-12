import React from "react";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export interface BatchSearchProps {
  onSearch: (batchId: string) => void;
  recent: string[];
  loading?: boolean;
  error?: string | null;
}

/** BatchSearch — the dashboard's empty state: a centered lookup field, optionally seeded with recent/demo batch IDs. */
export function BatchSearch({ onSearch, recent, loading = false, error }: BatchSearchProps) {
  const [q, setQ] = React.useState("");

  return (
    <div style={{ maxWidth: 640, margin: "72px auto", padding: "0 24px", textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-semibold)" as any,
          color: "var(--text-primary)",
          letterSpacing: "var(--tracking-tight)",
          marginBottom: 10,
        }}
      >
        Look up a batch
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-base)",
          color: "var(--text-secondary)",
          margin: "0 0 32px",
          lineHeight: "var(--leading-normal)",
        }}
      >
        Every checkpoint since manufacture, signed on-chain and impossible to rewrite.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) onSearch(q.trim());
        }}
        style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Batch ID, e.g. B-2024-GOOD"
          monospace
          icon={<Icon name="search" size={16} />}
          style={{ width: 340 }}
        />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? (
            <>
              <Icon name="refresh-cw" size={15} className="tb-spin" />
              Searching…
            </>
          ) : (
            "Search"
          )}
        </Button>
      </form>

      {error && (
        <p style={{ marginTop: 16, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--status-flag)" }}>
          {error}
        </p>
      )}

      {recent.length > 0 && (
        <div style={{ marginTop: 28, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
            Try:
          </span>
          {recent.map((id) => (
            <button
              key={id}
              onClick={() => onSearch(id)}
              style={{
                border: "none",
                background: "var(--ink-08)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              {id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
