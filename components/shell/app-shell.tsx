"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TriangleAlert,
  Server,
  LayoutGrid,
  Cpu,
  History,
  FileBarChart,
  Users,
  Menu,
  X,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Bell,
  Sun,
  Moon,
  LogOut,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, type Role, type SessionUser } from "@/lib/types";
import { useSSE } from "@/hooks/use-sse";
import { useRealtime, useAlarmCount } from "@/hooks/realtime-store";
import { useTheme } from "@/hooks/use-theme";
import { AlarmToaster } from "@/components/feedback/alarm-toaster";
import { AlarmSound } from "@/components/feedback/alarm-sound";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
  badge?: boolean;
}
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Monitor",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/alarms", label: "Alarms", icon: TriangleAlert, badge: true },
      { href: "/panels", label: "Panels", icon: Server },
      { href: "/zones", label: "Zones", icon: LayoutGrid },
      { href: "/devices", label: "Devices", icon: Cpu },
    ],
  },
  {
    group: "Review",
    items: [
      { href: "/events", label: "Event History", icon: History },
      { href: "/reports", label: "Reports", icon: FileBarChart, roles: ["administrator", "safety_officer"] },
    ],
  },
  {
    group: "Admin",
    items: [{ href: "/admin/users", label: "Users", icon: Users, roles: ["administrator"] }],
  },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  useSSE();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hydrateMute = useRealtime((s) => s.hydrateMute);

  useEffect(() => hydrateMute(), [hydrateMute]);
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="min-h-[100dvh]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-brand-fg"
      >
        Skip to content
      </a>

      {/* Sidebar (desktop) */}
      <Sidebar user={user} className="fixed inset-y-0 left-0 hidden w-60 lg:flex" />

      {/* Sidebar (mobile drawer) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden />
          <Sidebar user={user} className="absolute inset-y-0 left-0 flex w-60" onClose={() => setDrawerOpen(false)} />
        </div>
      )}

      <div className="lg:pl-60">
        <TopBar user={user} onMenu={() => setDrawerOpen(true)} />
        <ReconnectingBanner />
        <main id="main" className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
          {children}
        </main>
      </div>

      <AlarmToaster />
      <AlarmSound />
    </div>
  );
}

function Sidebar({ user, className, onClose }: { user: SessionUser; className?: string; onClose?: () => void }) {
  const pathname = usePathname();
  const count = useAlarmCount();
  return (
    <nav aria-label="Primary" className={cn("flex-col border-r border-border bg-surface", className)}>
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
        <span className="flex items-center gap-2 font-semibold text-fg">
          <Flame size={20} style={{ color: "var(--status-alarm-strong)" }} aria-hidden />
          Fire Alarm
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-surface-muted"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((section) => {
          const items = section.items.filter((i) => !i.roles || i.roles.includes(user.role));
          if (items.length === 0) return null;
          return (
            <div key={section.group} className="mb-5">
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{section.group}</p>
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium",
                          active
                            ? "bg-brand-subtle text-brand [box-shadow:inset_2px_0_0_var(--color-brand)]"
                            : "text-fg-muted hover:bg-surface-muted hover:text-fg",
                        )}
                      >
                        <Icon size={18} strokeWidth={1.75} aria-hidden />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && count > 0 && (
                          <span
                            className="tnum inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold"
                            style={{ backgroundColor: "var(--status-alarm-solid)", color: "var(--status-alarm-solid-fg)" }}
                          >
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function TopBar({ user, onMenu }: { user: SessionUser; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-6">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-surface-muted lg:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="flex-1" />
      <ConnectionPill />
      <MuteToggle />
      <NotificationBell />
      <ThemeToggle />
      <UserMenu user={user} />
    </header>
  );
}

function ConnectionPill() {
  const connection = useRealtime((s) => s.connection);
  const open = connection === "open";
  // Connection state stays visible at every breakpoint (Design System §11); on phones
  // it collapses to the icon alone, with the label kept for screen readers.
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs font-medium text-fg-muted sm:px-2.5"
      title={open ? "Live updates connected" : "Reconnecting to live updates"}
    >
      {open ? (
        <Wifi size={14} style={{ color: "var(--status-normal-icon)" }} aria-hidden />
      ) : (
        <WifiOff size={14} style={{ color: "var(--status-fault-icon)" }} aria-hidden />
      )}
      <span className="sr-only sm:not-sr-only">{open ? "Live" : "Reconnecting…"}</span>
    </span>
  );
}

function MuteToggle() {
  const muted = useRealtime((s) => s.muted);
  const toggleMute = useRealtime((s) => s.toggleMute);
  return (
    <button
      onClick={toggleMute}
      aria-pressed={muted}
      aria-label={muted ? "Unmute alarm sound" : "Mute alarm sound"}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg"
    >
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}

function NotificationBell() {
  const count = useAlarmCount();
  return (
    <Link
      href="/alarms"
      aria-label={`${count} active alarm${count === 1 ? "" : "s"}`}
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg"
    >
      <Bell size={18} />
      {count > 0 && (
        <span
          className="tnum absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{ backgroundColor: "var(--status-alarm-solid)", color: "var(--status-alarm-solid-fg)" }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function ThemeToggle() {
  const { pref, setTheme } = useTheme();
  const isDark = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark";
  return (
    <button
      onClick={() => setTheme(pref === "dark" || isDark ? "light" : "dark")}
      aria-label="Toggle color theme"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg"
    >
      <Sun size={18} className="hidden dark:block" />
      <Moon size={18} className="dark:hidden" />
    </button>
  );
}

function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-sm font-medium leading-tight text-fg">{user.username}</span>
          <span className="block text-xs leading-tight text-fg-subtle">{ROLE_LABEL[user.role]}</span>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-48 rounded-[var(--radius-lg)] border border-border bg-surface-elevated p-1 shadow-lg"
          >
            <div className="px-3 py-2 text-xs text-fg-subtle">
              Signed in as <span className="font-medium text-fg">{user.username}</span>
            </div>
            <button
              role="menuitem"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-fg hover:bg-surface-muted"
            >
              <LogOut size={16} aria-hidden /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ReconnectingBanner() {
  const connection = useRealtime((s) => s.connection);
  if (connection === "open") return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 border-b border-border px-4 py-2 text-sm md:px-6"
      style={{ backgroundColor: "var(--status-fault-bg)", color: "var(--status-fault-fg)" }}
    >
      <WifiOff size={15} aria-hidden />
      Reconnecting to live updates…
    </div>
  );
}
