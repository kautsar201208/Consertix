"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

interface AdminShellProps {
  children: React.ReactNode;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function AdminShell({ children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;

    if (!token) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
      router.replace("/Login");
      return;
    }

    // Jika sudah ada sesi admin valid di localStorage, langsung authorize agar saat refresh TIDAK mental ke Login
    let isCachedAdmin = false;
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        const role = String(savedUser?.role ?? "").trim().toLowerCase();
        if (["admin", "administrator", "superadmin"].includes(role)) {
          isCachedAdmin = true;
          setAuthorized(true);
        }
      } catch {
        // Abaikan parse error, verifikasi API akan tetap berjalan
      }
    }

    const verifyAdminAccess = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Hanya redirect ke login jika token benar-benar tidak valid / expired dari server
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/Login");
          return;
        }

        if (response.ok) {
          const user = await response.json();
          const role = String(user?.role ?? "").trim().toLowerCase();
          if (!["admin", "administrator", "superadmin"].includes(role)) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/Login");
            return;
          }

          localStorage.setItem("user", JSON.stringify(user));
          setAuthorized(true);
        }
      } catch {
        // Jika jaringan sedang lambat atau offline, tetap pertahankan akses jika sesi lokal valid
        if (!isCachedAdmin) {
          setAuthError("Tidak dapat memverifikasi akses admin. Pastikan backend berjalan.");
        }
      }
    };

    void verifyAdminAccess();
  }, [router]);

  if (!authorized) {
    return authError ? (
      <main className="flex min-h-screen items-center justify-center p-6 text-center bg-[#f3f5f9]">
        <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 px-4 py-3 rounded-2xl border border-rose-200">
          {authError}
        </p>
      </main>
    ) : null;
  }

  return (
    <div className="min-h-screen flex bg-[#f3f5f9] font-sans selection:bg-[#111844] selection:text-white">
      {/* Full-height Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#f3f5f9]">
        {/* Top Navbar sejajar horizontal dengan Logo Concertix di Sidebar */}
        <Navbar onMobileMenuToggle={() => setMobileOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full bg-[#f3f5f9]">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
