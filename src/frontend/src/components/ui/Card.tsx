import React from "react";

export interface CardProps {
  children?: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
}

/** Card — the system's single elevation surface: white, 18px radius, soft shadow, no border, no left-accent stripe. */
export function Card({ children, padding = "var(--space-6)", style }: CardProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
