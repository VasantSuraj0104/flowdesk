"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBolt,
  IconDashboard,
  IconHistory,
  IconPlug,
  IconSettings,
  IconUsers,
} from "./icons";
import { ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const MENU: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <IconDashboard size={18} /> },
  { label: "Automations", href: "/automations", icon: <IconBolt size={18} /> },
  { label: "Run history", href: "/history", icon: <IconHistory size={18} /> },
  { label: "Connections", href: "/connections", icon: <IconPlug size={18} /> },
];

const ACCOUNT: NavItem[] = [
  { label: "Settings", href: "/settings", icon: <IconSettings size={18} /> },
  { label: "Team", href: "/settings/team", icon: <IconUsers size={18} /> },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-surface2 text-text"
          : "text-text-muted hover:text-text hover:bg-surface2/60"
      }`}
    >
      <span className={active ? "text-white" : ""}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="hidden md:flex w-[200px] shrink-0 bg-sidebar border-r border-border flex-col p-4">
      <div className="flex items-center gap-2.5 px-2.5 pb-4">
        <span className="w-6 h-6 rounded-[7px] bg-white text-ink flex items-center justify-center shrink-0">
          <IconBolt size={15} />
        </span>
        <span className="font-display text-[15px] font-medium">flowdesk</span>
      </div>

      <div className="text-[11px] tracking-[0.8px] text-text-muted px-2.5 pb-2">
        MENU
      </div>
      <nav className="flex flex-col gap-0.5">
        {MENU.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="text-[11px] tracking-[0.8px] text-text-muted px-2.5 pt-4 pb-2">
        ACCOUNT
      </div>
      <nav className="flex flex-col gap-0.5">
        {ACCOUNT.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 p-2.5 border-t border-border">
        <span className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-medium shrink-0">
          AR
        </span>
        <div className="min-w-0">
          <div className="text-[13px] truncate">Arjun R.</div>
          <div className="text-[11px] text-text-muted">Pro plan</div>
        </div>
      </div>
    </aside>
  );
}
