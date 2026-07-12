import React from "react";

export interface InputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  monospace?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
}

/** Input — single-line text field. Used for batch ID search, actor lookups, data-hash entry. */
export function Input({
  value,
  defaultValue,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  icon,
  monospace = false,
  required,
  style,
}: InputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: disabled ? "var(--ink-08)" : "var(--surface)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-field)",
        padding: "10px 14px",
        boxShadow: focused ? "var(--shadow-focus)" : "none",
        transition: "box-shadow var(--duration-base) var(--ease-standard)",
        ...style,
      }}
    >
      {icon}
      <input
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          width: "100%",
          fontSize: "var(--text-sm)",
          fontFamily: monospace ? "var(--font-mono)" : "var(--font-body)",
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
}
