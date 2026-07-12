import React from "react";
import { Icon } from "./Icon";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/** Dialog — modal overlay for the add-checkpoint flow. Scrim (no blur) + shadow-modal, fade+scale-in. */
export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--scrim)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        animation: "tb-fade var(--duration-base) var(--ease-standard)",
      }}
      onClick={onClose}
    >
      <style>{`@keyframes tb-fade{from{opacity:0}to{opacity:1}} @keyframes tb-scale{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-modal)",
          width: 420,
          maxWidth: "90vw",
          padding: "var(--space-6)",
          animation: "tb-scale var(--duration-slow) var(--ease-out)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              fontWeight: "var(--weight-semibold)" as any,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-secondary)" }}
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>{footer}</div>}
      </div>
    </div>
  );
}
