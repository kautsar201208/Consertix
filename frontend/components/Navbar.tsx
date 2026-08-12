"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Bell,
  Search,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Info,
  LayoutGrid
} from "lucide-react";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
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

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setShowProfileMenu(false);
    router.push("/Login");
  };

  const userName = user?.nama || "Alex Rivera";
  const userEmail = user?.email || "alex.rivera@concertix.io";
  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AR";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-[#111844] text-white border-b border-[#0a0f2b] shadow-md">
      {/* Left section: Mobile Toggle & Page Title Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <LayoutGrid className="w-5 h-5 text-indigo-200" />
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Dashboard</h1>
        </div>
      </div>

      {/* Right Section: Pill Search Bar & Profile */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-indigo-200" />
          <input
            type="text"
            placeholder="Cari event, transaksi, venue..."
            className="w-60 sm:w-80 pl-10 pr-4 py-2 text-xs sm:text-sm bg-white/15 text-white placeholder-indigo-200 rounded-full border border-white/20 focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition-all"
          />
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-[#111844]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Notifikasi</h3>
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#111844] text-white">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[#111844] hover:underline font-semibold transition"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 flex gap-3 text-xs transition ${
                        n.unread ? "bg-indigo-50/50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === "sale" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                        {n.type === "warning" && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        {n.type === "system" && <Info className="w-4 h-4 text-[#111844]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between font-semibold text-slate-800 text-xs">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 rounded-full border border-white/20 hover:border-white/40 transition"
          >
            <div className="w-8 h-8 rounded-full bg-white text-[#111844] font-bold text-xs flex items-center justify-center shadow-xs">
              {userInitials}
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl z-50 py-2 text-xs"
              >
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="font-bold text-slate-900 text-sm">{userName}</p>
                  <p className="text-slate-400 text-xs truncate mt-0.5">{userEmail}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
