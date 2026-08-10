"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [eventData, setEventData] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    if (eventId) {
      void loadEvent(eventId);
    }
  }, [params]);

  async function loadEvent(id: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/events/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal memuat data event");
      }

      setEventData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!eventData) return;

    const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    if (!eventId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token login belum tersedia. Silakan login kembali.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_artis: eventData.nama_artis,
          judul: eventData.judul,
          deskripsi: eventData.deskripsi,
          tanggal: eventData.tanggal,
          jam: eventData.jam,
          lokasi: eventData.lokasi,
          status: eventData.status,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah event");
      }

      setSuccess(data.message || "Event berhasil diubah");
      setTimeout(() => router.push("/Dashboard/DaftarEvent"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof EventItem, value: string) {
    setEventData((current) =>
      current ? { ...current, [field]: value } : current
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 rounded-3xl bg-slate-900 p-4 shadow-2xl shadow-slate-950/40">
        <Sidebar userName={user?.nama} userEmail={user?.email} />

        <section className="flex-1 rounded-2xl bg-slate-950 p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-cyan-300">Edit Event</p>
              <h1 className="text-3xl font-bold">Perbarui Event</h1>
            </div>
            <button
              type="button"
              onClick={() => router.push("/Dashboard/DaftarEvent")}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              Kembali
            </button>
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

          {loading || !eventData ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
              Memuat data event...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Nama Artis</label>
                  <input
                    type="text"
                    value={eventData.nama_artis}
                    onChange={(e) => updateField("nama_artis", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Judul Event</label>
                  <input
                    type="text"
                    value={eventData.judul}
                    onChange={(e) => updateField("judul", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-200">Deskripsi</label>
                  <textarea
                    rows={5}
                    value={eventData.deskripsi}
                    onChange={(e) => updateField("deskripsi", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Tanggal</label>
                  <input
                    type="date"
                    value={eventData.tanggal}
                    onChange={(e) => updateField("tanggal", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Jam</label>
                  <input
                    type="time"
                    value={eventData.jam}
                    onChange={(e) => updateField("jam", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Lokasi</label>
                  <input
                    type="text"
                    value={eventData.lokasi}
                    onChange={(e) => updateField("lokasi", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Status</label>
                  <select
                    value={eventData.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
