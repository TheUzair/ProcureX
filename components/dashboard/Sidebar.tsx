"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Purchase Orders", href: "/purchase-orders", icon: DocumentTextIcon },
  { label: "Vendors", href: "/vendors", icon: UserGroupIcon },
  { label: "Products", href: "/products", icon: CubeIcon },
  { label: "Audit Logs", href: "/audit-logs", icon: ClipboardDocumentListIcon },
  { label: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-card/95 shadow-[1px_0_25px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all duration-300 ease-in-out dark:bg-card/90 dark:shadow-[1px_0_25px_rgba(0,0,0,0.2)] lg:relative lg:z-auto",
        collapsed ? "w-14" : "w-56",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="text-lg font-bold gradient-text">
            ProcureX
          </Link>
        )}
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="rounded-md p-1 hover:bg-muted lg:hidden"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        {/* Desktop collapse */}
        <button
          onClick={onToggle}
          className="hidden rounded-md p-1 hover:bg-muted lg:block"
        >
          <ChevronLeftIcon
            className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-primary/15 text-primary shadow-[0_0_20px_rgba(99,102,241,0.1)] dark:bg-primary/20"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
              )}
              <item.icon className={cn("h-5 w-5 shrink-0 transition-all duration-300 group-hover:scale-110", isActive && "ml-0.5 scale-110 drop-shadow-sm")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
