"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("user");
        if (u) setAdminUser(JSON.parse(u));
      } catch {}
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.replace("/Login");
  };

  const adminName = adminUser?.nama || "Dimas Arya";
  const adminRole = adminUser?.role || "Super Admin";
  const adminInitials = adminName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
      {/* SISI KIRI: HAMBURGER MOBILE & SEARCH BAR */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        {/* Tombol Hamburger (Mobile only) */}
        <button
          onClick={onMobileMenuToggle}
          className="w-10 h-10 rounded-xl bg-[#111844] text-white flex items-center justify-center lg:hidden shrink-0 shadow-sm"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar Membulat Sejajar */}
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari event, transaksi, tiket..."
            className="w-full bg-slate-50 text-slate-800 text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-full border border-slate-200/90 focus:outline-none focus:bg-white focus:border-[#111844] focus:ring-2 focus:ring-[#111844]/10 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* SISI KANAN: TOMBOL NOTIFIKASI & LOGO PROFIL ADMIN */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Tombol Notifikasi */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#111844] border border-slate-200 flex items-center justify-center transition-colors"
            title="Notifikasi"
            aria-label="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white" />
          </button>

          {/* Dropdown Notifikasi */}
          <AnimatePresence>
            {showNotifMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 text-xs sm:text-sm"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <p className="font-bold text-slate-900">Notifikasi</p>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <div className="space-y-2.5">
                  <Link
                    href="/Dashboard/Transaksi"
                    onClick={() => setShowNotifMenu(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Pembayaran Baru Masuk</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Transaksi tiket berhasil dikonfirmasi</p>
                    </div>
                  </Link>
                  <Link
                    href="/Dashboard/DaftarEvent"
                    onClick={() => setShowNotifMenu(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      🎪
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Event Tayang Aktif</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tiket siap dipesan audiens publik</p>
                    </div>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tombol & Logo Profil Admin */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 sm:gap-3 bg-white pl-2 sm:pl-2.5 pr-2 sm:pr-3 py-1.5 rounded-full border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors"
            aria-label="Menu Profil Admin"
          >
            {/* Logo/Avatar Bulat Profil */}
            <div className="w-9 h-9 rounded-full bg-[#111844] text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-slate-100 shrink-0">
              {adminInitials}
            </div>

            {/* Nama & Role Admin */}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#111844] leading-tight truncate max-w-[120px]">
                {adminName}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold capitalize tracking-wide">
                {adminRole}
              </p>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu Profil Admin */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs sm:text-sm"
              >
                {/* Header Profil Dropdown */}
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <p className="font-bold text-slate-900 leading-tight">{adminName}</p>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-blue-600" /> {adminRole}
                  </span>
                </div>

                {/* Menu Navigasi Profil */}
                <Link
                  href="/Dashboard/ManagementUser"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-[#111844] hover:bg-slate-50 transition"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Manajemen Akun</span>
                </Link>

                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-[#111844] hover:bg-slate-50 transition"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>Lihat Portal Publik</span>
                </Link>

                {/* Tombol Logout */}
                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-semibold">Keluar Akun</span>
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
