import React from "react";
import {
  ShieldCheck,
  Sun,
  Moon,
  Search,
  Wallet,
  ChevronDown,
  X,
  Check,
  Copy,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Factory,
  FlaskConical,
  Truck,
  PackageCheck,
  Plus,
  Link2,
  PenLine,
  Send,
  Lock,
  ListTree,
  Flag,
  FileText,
  RefreshCw,
  Circle,
  type LucideIcon,
} from "lucide-react";

const registry: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  sun: Sun,
  moon: Moon,
  search: Search,
  wallet: Wallet,
  "chevron-down": ChevronDown,
  x: X,
  check: Check,
  copy: Copy,
  "alert-triangle": AlertTriangle,
  "alert-circle": AlertCircle,
  "check-circle-2": CheckCircle2,
  clock: Clock,
  factory: Factory,
  "flask-conical": FlaskConical,
  truck: Truck,
  "package-check": PackageCheck,
  plus: Plus,
  "link-2": Link2,
  "pen-line": PenLine,
  send: Send,
  lock: Lock,
  "list-tree": ListTree,
  flag: Flag,
  "file-text": FileText,
  "refresh-cw": RefreshCw,
  circle: Circle,
};

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Icon — thin wrapper around lucide-react, matching the design system's Icon API (name/size/color/strokeWidth). */
export function Icon({ name, size = 20, color, strokeWidth = 2, className, style }: IconProps) {
  const LucideComponent = registry[name] || Circle;
  return (
    <LucideComponent
      size={size}
      color={color || "currentColor"}
      strokeWidth={strokeWidth}
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    />
  );
}
