import React from "react";
import { Icon } from "../ui/Icon";
import { Switch } from "../ui/Switch";
import { WalletButton } from "../domain/WalletButton";

export interface HeaderProps {
  darkMode: boolean;
  onToggleDark: (next: boolean) => void;
  wallet?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onLogoClick?: () => void;
}

/** Header — sticky dashboard header: wordmark, dark-mode switch, wallet status. Frosts once the page scrolls. */
export function Header({ darkMode, onToggleDark, wallet, onConnect, onDisconnect, onLogoClick }: HeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: "var(--header-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        background: "var(--surface-veil)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: scrolled ? "0 1px 1px rgba(0,0,0,0.03), 0 8px 20px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow var(--duration-slow) var(--ease-standard)",
      }}
    >
      <button
        onClick={onLogoClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          fontWeight: "var(--weight-semibold)" as any,
          color: "var(--text-primary)",
          letterSpacing: "var(--tracking-tight)",
          background: "transparent",
          border: "none",
          cursor: onLogoClick ? "pointer" : "default",
          padding: 0,
        }}
      >
        <Icon name="shield-check" size={20} color="var(--text-primary)" />
        TrueBatch
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="sun" size={15} color="var(--text-secondary)" />
          <Switch checked={darkMode} onChange={onToggleDark} />
          <Icon name="moon" size={15} color="var(--text-secondary)" />
        </div>
        <WalletButton connected={!!wallet} address={wallet} onConnect={onConnect} onDisconnect={onDisconnect} />
      </div>
    </header>
  );
}
