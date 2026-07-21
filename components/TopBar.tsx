"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconSearch,
  IconBell,
  IconPlus,
  IconDashboard,
  IconBolt,
  IconHistory,
  IconSettings,
} from "./icons";
import { Button } from "./Button";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="h-[54px] shrink-0 border-b border-border flex items-center gap-3 px-4 md:px-[18px]">
      <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-[7px] flex-1 min-w-0 max-w-[280px]">
        <IconSearch size={15} className="text-text-muted shrink-0" />
        <span className="text-[13px] text-text-muted truncate">
          Search automations
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <ThemeToggle />
        <Button variant="icon" aria-label="Notifications">
          <IconBell size={16} />
        </Button>
        <Button variant="primary" className="hidden sm:inline-flex">
          <IconPlus size={15} />
          New automation
        </Button>
        <Button
          variant="primary"
          className="sm:hidden !w-[38px] !px-0"
          aria-label="New automation"
        >
          <IconPlus size={16} />
        </Button>
      </div>
    </header>
  );
}

// Thumb-friendly bottom nav shown only on mobile, where the sidebar is hidden.
const MOBILE_NAV = [
  { href: "/", label: "Home", icon: IconDashboard },
  { href: "/automations", label: "Tools", icon: IconBolt },
  { href: "/history", label: "Runs", icon: IconHistory },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="md:hidden shrink-0 border-t border-border bg-sidebar flex items-center justify-around py-2">
      {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 text-[11px] px-3 ${
              active ? "text-white" : "text-text-muted"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
