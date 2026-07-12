import React from "react";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
}

/** Tabs — simple underline tab switcher, e.g. Batch detail: Timeline / Risk flags. */
export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--hairline)" }}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange && onChange(item.value)}
            style={{
              border: "none",
              background: "transparent",
              padding: "10px 2px",
              marginBottom: -1,
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: (active ? "var(--weight-semibold)" : "var(--weight-regular)") as any,
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
              borderBottom: active ? "2px solid var(--ink)" : "2px solid transparent",
              cursor: "pointer",
              transition: "color var(--duration-base) var(--ease-standard)",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
