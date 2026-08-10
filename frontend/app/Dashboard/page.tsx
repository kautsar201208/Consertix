"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";

interface User {
  id: number;
  nama: string;
  email: string;
  role: string;
}

interface DashboardStats {
  totalUser: number;
  totalEvent: number;
  totalKategori: number;
  totalOrder: number;
  totalPayment: number;
  totalPendapatan: number;
}

interface EventItem {
  id: number;
  judul: string;
  nama_artis: string;
  tanggal: string;
  jam: string;
  lokasi: string;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    void loadDashboard();
  }, []);

  async function loadDashboard() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Token login belum tersedia. Silakan login kembali.");
      setLoading(false);
      return;
    }

    try {
      const [statsResponse, eventsResponse] = await Promise.all([
        fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/api/events`),
      ]);

      const statsData = await statsResponse.json();
      const eventsData = await eventsResponse.json();

      if (!statsResponse.ok) {
        throw new Error(statsData.message || "Gagal mengambil data dashboard");
      }

      if (!eventsResponse.ok) {
        throw new Error("Gagal mengambil daftar event");
      }

      setStats(statsData);
      setEvents(Array.isArray(eventsData) ? eventsData.slice(0, 5) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(value: string | null | undefined) {
    if (!value) {
      return "-";
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 rounded-3xl bg-slate-900 p-4 shadow-2xl shadow-slate-950/40">
        <Sidebar userName={user?.nama} userEmail={user?.email} />

        <section className="flex-1 rounded-2xl bg-slate-950 p-4 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-cyan-300">Dashboard Admin</p>
              <h2 className="text-2xl font-bold sm:text-3xl">{user?.nama ?? "Pengguna"}</h2>
              <p className="mt-1 text-sm text-slate-400">Ringkasan event, transaksi, dan tiket hari ini.</p>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Total Event</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "-" : stats?.totalEvent ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Kategori Tiket</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "-" : stats?.totalKategori ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Transaksi</p>
              <p className="mt-2 text-2xl font-bold">{loading ? "-" : stats?.totalOrder ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Pendapatan</p>
              <p className="mt-2 text-xl font-bold">{loading ? "-" : formatRupiah(stats?.totalPendapatan ?? 0)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Event Terbaru</h3>
              <span className="text-sm text-slate-400">5 data</span>
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
                Memuat data...
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
                Belum ada event yang tersedia.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{event.judul}</p>
                        <p className="text-sm text-slate-400">{event.nama_artis}</p>
                      </div>
                      <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                        {event.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
                      <span>{formatDate(event.tanggal)}</span>
                      <span>{event.jam}</span>
                      <span>{event.lokasi}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
