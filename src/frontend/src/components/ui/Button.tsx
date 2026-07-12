import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontWeight: "var(--weight-medium)" as any,
  fontSize: "var(--text-sm)",
  borderRadius: "var(--radius-field)",
  border: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition:
    "background var(--duration-base) var(--ease-standard), transform var(--duration-fast) var(--ease-standard), opacity var(--duration-base) var(--ease-standard)",
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "7px 14px", fontSize: "var(--text-xs)" },
  md: { padding: "10px 18px", fontSize: "var(--text-sm)" },
  lg: { padding: "13px 22px", fontSize: "var(--text-base)" },
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--ink)", color: "#fff" },
  secondary: { background: "var(--ink-08)", color: "var(--ink)" },
  ghost: { background: "transparent", color: "var(--ink)" },
  danger: { background: "var(--signal)", color: "#fff" },
};

const hoverBg: Record<ButtonVariant, string> = {
  primary: "#3a3a3c",
  secondary: "var(--ink-08)",
  ghost: "var(--ink-08)",
  danger: "#e0332a",
};

export interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  style?: React.CSSProperties;
}

/** Button — the system's single button primitive; variant + size cover every case in the dashboard. */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  icon,
  onClick,
  type = "button",
  style,
}: ButtonProps) {
  const [hover, setHover] = React.useState(false);
  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...base,
        ...sizes[size],
        ...v,
        background: disabled ? "var(--ink-08)" : hover ? hoverBg[variant] : v.background,
        color: disabled ? "var(--text-secondary)" : v.color,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
