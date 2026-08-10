"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";

interface User {
  id: number;
  nama: string;
  email: string;
  role: string;
}

interface EventItem {
  id: number;
  nama_artis: string;
  judul: string;
  deskripsi: string;
  tanggal: string;
  jam: string;
  lokasi: string;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function DaftarEventPage() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    void loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil daftar event");
      }

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(eventId: number) {
    const confirmed = window.confirm("Hapus event ini? Tindakan tidak dapat dibatalkan.");

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Token login belum tersedia. Silakan login kembali.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus event");
      }

      setSuccess(data.message || "Event berhasil dihapus");
      setEvents((current) => current.filter((item) => item.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  function formatDate(value?: string) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "-";

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

        <section className="flex-1 rounded-2xl bg-slate-950 p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-cyan-300">Daftar Event</p>
              <h1 className="text-3xl font-bold">Kelola Event</h1>
            </div>
            <p className="text-sm text-slate-400">Kelola semua event admin di sini.</p>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
              Memuat daftar event...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
              Belum ada event tersedia.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{item.nama_artis}</p>
                      <h2 className="text-xl font-semibold text-white">{item.judul}</h2>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${item.status === "aktif" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tanggal</p>
                      <p className="mt-1 text-sm text-slate-200">{formatDate(item.tanggal)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Jam</p>
                      <p className="mt-1 text-sm text-slate-200">{item.jam || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lokasi</p>
                      <p className="mt-1 text-sm text-slate-200">{item.lokasi}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-400">{item.deskripsi}</p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={`/Dashboard/EditEvent/${item.id}`}
                      className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
