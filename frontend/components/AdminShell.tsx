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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.removeItem("user");
      router.replace("/Login");
      return;
    }

    const verifyAdminAccess = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/Login");
          return;
        }

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
      } catch {
        setAuthError("Tidak dapat memverifikasi akses admin. Pastikan backend berjalan.");
      }
    };

    void verifyAdminAccess();
  }, [router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("concertix_theme");
    const shouldUseDark = savedTheme === "dark";
    setDarkMode(shouldUseDark);
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("concertix_theme", next ? "dark" : "light");
      document.documentElement.dataset.theme = next ? "dark" : "light";
      return next;
    });
  };

  if (!authorized) {
    return authError ? (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <p role="alert" className="text-sm text-rose-700">
          {authError}
        </p>
      </main>
    ) : null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "lg:ml-[80px]" : "lg:ml-[250px]"
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          darkMode={darkMode}
          onThemeToggle={toggleTheme}
        />

        {/* Page Content with Framer Motion Route Transition */}
        <main className="flex-1 p-5 sm:p-6 max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-slate-200/80 text-xs text-slate-400 text-center flex flex-col sm:flex-row items-center justify-between gap-2 bg-white">
          <p>© 2026 Concertix Management Portal. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-indigo-600 cursor-pointer">Documentation</span>
            <span>•</span>
            <span className="hover:text-indigo-600 cursor-pointer">Support</span>
            <span>•</span>
            <span className="hover:text-indigo-600 cursor-pointer">API System</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
