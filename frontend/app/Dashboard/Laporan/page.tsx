"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";

interface User {
  id: number;
  nama: string;
  email: string;
  role: string;
}

export default function LaporanPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 rounded-3xl bg-slate-900 p-4 shadow-2xl shadow-slate-950/40">
        <Sidebar userName={user?.nama} userEmail={user?.email} />

        <section className="flex-1 rounded-2xl bg-slate-950 p-6">
          <p className="text-sm text-cyan-300">Laporan</p>
          <h1 className="mt-2 text-3xl font-bold">Laporan Penjualan</h1>
          <div className="mt-6 rounded-2xl bg-slate-800 p-6">
            <p className="text-slate-300">
              Halaman ini siap dipakai untuk menampilkan laporan statistik.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
