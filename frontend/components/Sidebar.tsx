"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X, Menu } from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const navItems = [
  {
    label: "Dashboard",
    href: "/Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6h-4v6H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Daftar Event",
    href: "/Dashboard/DaftarEvent",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Tambah Event",
    href: "/Dashboard/TambahEvent",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Transaksi Tiket",
    href: "/Dashboard/Transaksi",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Pengguna & Member",
    href: "/Dashboard/ManagementUser",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M12 7a4 4 0 11-8 0 4 4 0 018 0zM20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Laporan & Analytics",
    href: "/Dashboard/Laporan",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // State collapse internal yang diingat di localStorage
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("concertix_sidebar_collapsed");
      if (saved !== null) {
        setInternalCollapsed(saved === "true");
      }
    }
  }, []);

  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;
  const isExpanded = !isCollapsed || mobileOpen;

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setInternalCollapsed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("concertix_sidebar_collapsed", String(next));
    }
    if (setCollapsed) {
      setCollapsed(next);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.replace("/Login");
  };

  const isItemActive = (href: string) => {
    if (href === "/Dashboard") {
      return pathname === "/Dashboard" || pathname === "/";
    }
    if (href === "/Dashboard/DaftarEvent") {
      return pathname.startsWith("/Dashboard/DaftarEvent") || pathname.startsWith("/Dashboard/EditEvent");
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Spacer agar konten tidak bergeser atau tertutup (animasi sinkron dengan sidebar) */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          isExpanded ? "w-64" : "w-20"
        }`}
      />

      {/* Modern Curved Active Sidebar - Full Height Navy #111844 */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen bg-[#111844] flex flex-col justify-between py-6 transition-all duration-300 ease-in-out ${
          isExpanded ? "w-64" : "w-20"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* BAGIAN ATAS: LOGO BRAND ATAU TOMBOL GARIS 3 UNTUK BUKA/TUTUP */}
        <div className="flex flex-col w-full">
          {!isExpanded ? (
            /* Saat Menutup: Logo berubah menjadi ikon garis 3 untuk membuka sidebar */
            <div className="flex justify-center items-center w-full pb-4">
              <button
                onClick={toggleCollapse}
                className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shadow-sm group"
                title="Buka Sidebar"
                aria-label="Buka Sidebar"
              >
                <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            /* Saat Dibuka: Muncul logo Concertix dan garis tiga ada di ujung kanan logo */
            <div className="flex items-center justify-between w-full px-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 text-white flex items-center justify-center font-black text-lg shadow-sm border border-white/10">
                  C
                </div>
                <span className="font-extrabold text-white text-lg tracking-tight">
                  Concertix
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Tombol Garis Tiga di ujung logo Concertix untuk menutup sidebar (Desktop) */}
                <button
                  onClick={toggleCollapse}
                  className="hidden lg:flex w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors group"
                  title="Tutup Sidebar"
                  aria-label="Tutup Sidebar"
                >
                  <Menu className="w-4 h-4 group-hover:scale-105 transition-transform" />
                </button>

                {/* Tombol Close silang di Mobile */}
                {mobileOpen && (
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center lg:hidden"
                    aria-label="Tutup Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* DAFTAR MENU DENGAN EFEK CURVED ACTIVE TAB (INVERTED BORDER RADIUS) */}
          <nav className="flex flex-col space-y-2 w-full mt-2">
            {navItems.map((item) => {
              const active = isItemActive(item.href);

              return (
                <div key={item.href} className="relative w-full">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center transition-colors duration-200 group ${
                      active
                        ? "w-[calc(100%-0.75rem+2px)] ml-auto bg-[#f3f5f9] rounded-l-full font-bold text-[#111844] z-10 -mr-[2px]"
                        : "w-[calc(100%-0.75rem)] ml-auto text-slate-300 hover:text-white hover:bg-white/10 rounded-l-2xl"
                    } ${
                      isExpanded
                        ? active
                          ? "h-14 pl-2 pr-4 gap-3.5"
                          : "h-12 pl-2 pr-4 gap-3.5"
                        : active
                        ? "h-14 justify-start pl-2"
                        : "h-12 justify-start pl-2"
                    }`}
                    title={!isExpanded ? item.label : undefined}
                  >
                    {/* Active Circular Button Icon (Konsisten di posisi horizontal yang sama) */}
                    {active ? (
                      <div className="w-11 h-11 rounded-full bg-[#111844] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(17,24,68,0.28)] shrink-0 transition-transform group-hover:scale-105">
                        {item.icon}
                      </div>
                    ) : (
                      <div className="w-11 h-11 flex items-center justify-center shrink-0">
                        <span className="transition-transform group-hover:scale-110 group-hover:text-white text-slate-300">
                          {item.icon}
                        </span>
                      </div>
                    )}

                    {/* Label Menu (Expanded) */}
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className={`text-sm tracking-tight truncate flex-1 ${
                          active
                            ? "font-extrabold text-[#111844]"
                            : "font-semibold text-slate-300 group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </motion.span>
                    )}

                    {/* LENGKUNGAN ATAS (DEEP SMOOTH INVERTED CONCAVE CURVE) */}
                    {active && (
                      <span
                        className="absolute -top-7 -right-[2px] w-7 h-7 pointer-events-none overflow-hidden"
                        aria-hidden="true"
                      >
                        <svg
                          className="w-full h-full text-[#f3f5f9]"
                          viewBox="0 0 28 28"
                          fill="currentColor"
                        >
                          <path d="M 28 0 C 28 15.465, 15.465 28, 0 28 L 28 28 Z" />
                        </svg>
                      </span>
                    )}

                    {/* LENGKUNGAN BAWAH (DEEP SMOOTH INVERTED CONCAVE CURVE) */}
                    {active && (
                      <span
                        className="absolute -bottom-7 -right-[2px] w-7 h-7 pointer-events-none overflow-hidden"
                        aria-hidden="true"
                      >
                        <svg
                          className="w-full h-full text-[#f3f5f9]"
                          viewBox="0 0 28 28"
                          fill="currentColor"
                        >
                          <path d="M 0 0 C 15.465 0, 28 12.535, 28 28 L 28 0 Z" />
                        </svg>
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* BAGIAN BAWAH: HANYA TOMBOL LOGOUT (PROFIL SUDAH DIPINDAHKAN KE NAVBAR) */}
        <div className="flex flex-col w-full px-2 pt-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`flex items-center transition-all duration-200 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-2xl group ${
              isExpanded
                ? "w-full h-11 px-3 gap-3"
                : "w-11 h-11 justify-center mx-auto"
            }`}
            title="Keluar / Logout"
            aria-label="Keluar / Logout"
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="font-semibold text-xs tracking-tight text-rose-300 group-hover:text-rose-100"
              >
                Keluar
              </motion.span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
