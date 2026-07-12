import React from "react";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";

export interface NavbarProps {
  wallet?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const links = ["Product", "How it works"];

/** Navbar — fixed glass pill nav for the marketing landing page. Inverts to a frosted light pill once scrolled. */
export function Navbar({ wallet, onConnect, onDisconnect }: NavbarProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const inkColor = scrolled ? "var(--ink)" : "#F5F5F7";
  const mutedColor = scrolled ? "var(--ink-70)" : "rgba(245,245,247,0.72)";
  const mutedHover = scrolled ? "var(--ink)" : "#F5F5F7";

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        padding: scrolled ? "14px 32px" : "22px 32px",
        transition: "padding var(--duration-slow) var(--ease-standard)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "var(--container-max)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderRadius: "var(--radius-pill)",
          background: scrolled ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.0)",
          backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "blur(0px)",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(160%)" : "blur(0px)",
          boxShadow: scrolled ? "0 1px 1px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.10)" : "none",
          transition:
            "background var(--duration-slow) var(--ease-standard), box-shadow var(--duration-slow) var(--ease-standard), backdrop-filter var(--duration-slow) var(--ease-standard)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-md)",
            fontWeight: "var(--weight-semibold)" as any,
            color: inkColor,
            letterSpacing: "var(--tracking-tight)",
            transition: "color var(--duration-slow) var(--ease-standard)",
          }}
        >
          <Icon name="shield-check" size={19} color={inkColor} />
          TrueBatch
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 30 }}>
          {links.map((l) => (
            <a
              key={l}
              href={"#" + l.toLowerCase().replace(/\s+/g, "-")}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)" as any,
                color: mutedColor,
                textDecoration: "none",
                transition: "color var(--duration-base) var(--ease-standard)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = mutedHover)}
              onMouseLeave={(e) => (e.currentTarget.style.color = mutedColor)}
            >
              {l}
            </a>
          ))}
        </nav>

        <Button
          variant="primary"
          size="sm"
          icon={<Icon name={wallet ? "shield-check" : "wallet"} size={14} color={scrolled ? "#fff" : "#1D1D1F"} />}
          onClick={wallet ? onDisconnect : onConnect}
          style={scrolled ? {} : { background: "#F5F5F7", color: "#1D1D1F" }}
        >
          {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet"}
        </Button>
      </div>
    </header>
  );
}
