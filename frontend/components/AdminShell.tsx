"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

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
        <Navbar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />

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
