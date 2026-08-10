"use client";

import Sidebar from "@/components/Sidebar";
import { FormEvent, useEffect, useState } from "react";

interface User {
  id: number;
  nama: string;
  email: string;
  role: string;
}

interface TicketCategoryInput {
  nama_kategori: string;
  harga: string;
  stok: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function TambahEventPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    nama_artis: "",
    judul: "",
    deskripsi: "",
    tanggal: "",
    jam: "",
    lokasi: "",
    status: "aktif",
  });
  const [poster, setPoster] = useState<File | null>(null);
  const [ticketCategories, setTicketCategories] = useState<TicketCategoryInput[]>([
    { nama_kategori: "", harga: "", stok: "" },
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  function updateTicketCategory(index: number, field: keyof TicketCategoryInput, value: string) {
    setTicketCategories((current) =>
      current.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, [field]: value } : category
      )
    );
  }

  function addTicketCategory() {
    setTicketCategories((current) => [...current, { nama_kategori: "", harga: "", stok: "" }]);
  }

  function removeTicketCategory(index: number) {
    setTicketCategories((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, categoryIndex) => categoryIndex !== index);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Token login belum tersedia. Silakan login kembali.");
      return;
    }

    const validTicketCategories = ticketCategories
      .map((category) => ({
        nama_kategori: category.nama_kategori.trim(),
        harga: category.harga.trim(),
        stok: category.stok.trim(),
      }))
      .filter((category) => category.nama_kategori && category.harga && category.stok);

    if (validTicketCategories.length === 0) {
      setError("Minimal satu kategori tiket harus diisi lengkap.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const body = new FormData();
      body.append("nama_artis", form.nama_artis);
      body.append("judul", form.judul);
      body.append("deskripsi", form.deskripsi);
      body.append("tanggal", form.tanggal);
      body.append("jam", form.jam);
      body.append("lokasi", form.lokasi);
      body.append("status", form.status);
      body.append("ticket_categories", JSON.stringify(validTicketCategories));

      if (poster) {
        body.append("poster", poster);
      }

      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menambahkan event");
      }

      setSuccess(data.message || "Event berhasil ditambahkan");
      setForm({
        nama_artis: "",
        judul: "",
        deskripsi: "",
        tanggal: "",
        jam: "",
        lokasi: "",
        status: "aktif",
      });
      setPoster(null);
      setTicketCategories([{ nama_kategori: "", harga: "", stok: "" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 rounded-3xl bg-slate-900 p-4 shadow-2xl shadow-slate-950/40">
        <Sidebar userName={user?.nama} userEmail={user?.email} />

        <section className="flex-1 rounded-2xl bg-slate-950 p-6">
          <p className="text-sm text-cyan-300">Tambah Event</p>
          <h1 className="mt-2 text-3xl font-bold">Form Tambah Event</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-slate-800 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="nama_artis" className="mb-2 block text-sm font-medium text-slate-200">
                  Nama Artis
                </label>
                <input
                  id="nama_artis"
                  type="text"
                  value={form.nama_artis}
                  onChange={(event) => setForm({ ...form, nama_artis: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="judul" className="mb-2 block text-sm font-medium text-slate-200">
                  Judul Event
                </label>
                <input
                  id="judul"
                  type="text"
                  value={form.judul}
                  onChange={(event) => setForm({ ...form, judul: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="deskripsi" className="mb-2 block text-sm font-medium text-slate-200">
                  Deskripsi
                </label>
                <textarea
                  id="deskripsi"
                  rows={4}
                  value={form.deskripsi}
                  onChange={(event) => setForm({ ...form, deskripsi: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="tanggal" className="mb-2 block text-sm font-medium text-slate-200">
                  Tanggal
                </label>
                <input
                  id="tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={(event) => setForm({ ...form, tanggal: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="jam" className="mb-2 block text-sm font-medium text-slate-200">
                  Jam
                </label>
                <input
                  id="jam"
                  type="time"
                  value={form.jam}
                  onChange={(event) => setForm({ ...form, jam: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="lokasi" className="mb-2 block text-sm font-medium text-slate-200">
                  Lokasi
                </label>
                <input
                  id="lokasi"
                  type="text"
                  value={form.lokasi}
                  onChange={(event) => setForm({ ...form, lokasi: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-200">
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-200">
                    Kategori Tiket
                  </label>
                  <button
                    type="button"
                    onClick={addTicketCategory}
                    className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                  >
                    + Tambah Kategori
                  </button>
                </div>

                <div className="space-y-3">
                  {ticketCategories.map((category, index) => (
                    <div
                      key={`${category.nama_kategori}-${index}`}
                      className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 md:grid-cols-[1.4fr_0.8fr_0.6fr_auto]"
                    >
                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                          Nama Kategori
                        </label>
                        <input
                          type="text"
                          value={category.nama_kategori}
                          onChange={(event) => updateTicketCategory(index, "nama_kategori", event.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                          placeholder="Contoh: Reguler"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                          Harga
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={category.harga}
                          onChange={(event) => updateTicketCategory(index, "harga", event.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                          placeholder="50000"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                          Stok
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={category.stok}
                          onChange={(event) => updateTicketCategory(index, "stok", event.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                          placeholder="100"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeTicketCategory(index)}
                        disabled={ticketCategories.length === 1}
                        className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Anda bisa menambahkan beberapa kategori tiket sekaligus, misalnya Reguler dan VIP.
                </p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="poster" className="mb-2 block text-sm font-medium text-slate-200">
                  Poster Event
                </label>
                <input
                  id="poster"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setPoster(event.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Menyimpan..." : "Simpan Event"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
