import React from "react";
import { Icon } from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Select — dropdown for constrained choices, e.g. "next valid stage" in AddCheckpointForm. */
export function Select({ value, onChange, options, placeholder = "Select…", disabled = false, style }: SelectProps) {
  return (
    <div style={{ position: "relative", ...style }}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          appearance: "none",
          width: "100%",
          background: disabled ? "var(--ink-08)" : "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-field)",
          padding: "10px 36px 10px 14px",
          fontSize: "var(--text-sm)",
          fontFamily: "var(--font-body)",
          color: value ? "var(--text-primary)" : "var(--text-secondary)",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--text-secondary)",
        }}
      >
        <Icon name="chevron-down" size={16} />
      </span>
    </div>
  );
}
