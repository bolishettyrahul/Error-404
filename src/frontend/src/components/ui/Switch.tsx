import React from "react";

export interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

/** Switch — on/off toggle, e.g. dark mode. */
export function Switch({ checked, onChange, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      style={{
        width: 42,
        height: 25,
        borderRadius: "var(--radius-pill)",
        border: "none",
        padding: 3,
        background: checked ? "var(--status-good)" : "var(--hairline)",
        display: "flex",
        justifyContent: checked ? "flex-end" : "flex-start",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background var(--duration-base) var(--ease-standard)",
      }}
    >
      <span
        style={{
          width: 19,
          height: 19,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          transition: "transform var(--duration-base) var(--ease-standard)",
        }}
      />
    </button>
  );
}
