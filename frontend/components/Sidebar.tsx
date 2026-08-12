"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Receipt,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const navItems = [
  {
    label: "Dashboard",
    href: "/Dashboard",
    icon: LayoutDashboard,
    hasBadge: false
  },
  {
    label: "Events",
    href: "/Dashboard/DaftarEvent",
    icon: CalendarDays,
    hasBadge: true
  },
  {
    label: "Add Event",
    href: "/Dashboard/TambahEvent",
    icon: PlusCircle,
    hasBadge: false
  },
  {
    label: "Transactions",
    href: "/Dashboard/Transaksi",
    icon: Receipt,
    hasBadge: true
  },
  {
    label: "Analytics",
    href: "/Dashboard/Laporan",
    icon: BarChart3,
    hasBadge: false
  },
  {
    label: "Users",
    href: "/Dashboard/ManagementUser",
    icon: Users,
    hasBadge: false
  }
];

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ nama?: string; email?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  const isItemActive = (item: (typeof navItems)[0]) => {
    if (pathname === item.href) return true;
    if (item.href === "/Dashboard/DaftarEvent" && (pathname.startsWith("/Dashboard/DaftarEvent") || pathname.startsWith("/Dashboard/EditEvent"))) {
      return true;
    }
    if (item.href === "/Dashboard" && (pathname === "/Dashboard" || pathname === "/")) return true;
    return false;
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/Login");
  };

  const userName = user?.nama || "Alex Rivera";
  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AR";

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container — Navy #111844 background */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 84 : 260,
          x: mobileOpen ? 0 : undefined
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#111844] text-white border-r border-[#0a0f2b] shadow-md transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className={`relative flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"} h-16 border-b border-white/10`}>
          <Link href="/Dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-white text-[#111844] shadow-xs">
              <svg viewBox="0 0 24 24" className="w-5.5 h-5.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17 6.5C15.5 4.5 12.5 3.5 10 3.5C5.3 3.5 1.5 7.3 1.5 12C1.5 16.7 5.3 20.5 10 20.5C12.5 20.5 15.5 19.5 17 17.5"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="14.5" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col whitespace-nowrap"
                >
                  <span className="font-extrabold text-xl tracking-tight text-white">
                    Concertix
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Toggle Button for Desktop - Floating on the right edge */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-white text-[#111844] hover:bg-slate-100 shadow-sm border border-slate-200/80 transition-all absolute -right-3.5 top-4.5 z-50 hover:scale-105 active:scale-95 cursor-pointer"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-5 px-3.5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center h-11 px-3.5 rounded-xl group transition-colors overflow-hidden ${
                  active
                    ? "bg-white text-[#111844] font-bold shadow-xs"
                    : "text-indigo-100 hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="relative z-10 flex items-center justify-center shrink-0 w-6 h-6">
                  <Icon className={`w-5 h-5 ${active ? "text-[#111844]" : "text-indigo-200 group-hover:text-white"}`} />
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="relative z-10 ml-3.5 text-sm font-semibold whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Notification dot badge */}
                {item.hasBadge && (
                  <span className={`ml-auto w-2 h-2 rounded-full shrink-0 ${active ? "bg-rose-500" : "bg-rose-400"}`} />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Footer Profile */}
        <div className="p-3.5 border-t border-white/10 bg-[#0a0f2b]/60">
          <div className={`flex items-center justify-between ${collapsed ? "justify-center" : "px-2 py-1"}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white text-[#111844] font-bold text-sm shadow-xs">
                {userInitials}
              </div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col min-w-0 overflow-hidden"
                  >
                    <span className="text-sm font-bold text-white truncate">
                      {userName}
                    </span>
                    <span className="text-xs text-indigo-200 truncate">Event Director</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-indigo-200 hover:text-white hover:bg-rose-500/20 transition shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
