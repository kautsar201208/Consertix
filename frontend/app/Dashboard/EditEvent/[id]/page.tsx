"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  ArrowLeft,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
  X,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";

interface TicketCategory {
  id?: number;
  nama_kategori: string;
  harga: string;
  stok: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;

  const [form, setForm] = useState({
    nama_artis: "",
    judul: "",
    deskripsi: "",
    tanggal: "",
    jam: "",
    lokasi: "",
    status: "aktif"
  });
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([]);

  const [poster, setPoster] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingPoster, setExistingPoster] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [fetchError, setFetchError] = useState("");

  // Load existing event data
  useEffect(() => {
    if (!eventId) return;

    async function fetchEvent() {
      setFetchLoading(true);
      setFetchError("");
      try {
        const res = await fetch(`${API_URL}/api/events/${eventId}`);
        if (!res.ok) throw new Error("Event tidak ditemukan.");
        const data = await res.json();

        setForm({
          nama_artis: data.nama_artis || "",
          judul: data.judul || "",
          deskripsi: data.deskripsi || "",
          tanggal: data.tanggal ? data.tanggal.slice(0, 10) : "",
          jam: data.jam || "",
          lokasi: data.lokasi || "",
          status: data.status || "aktif"
        });

        setTicketCategories(
          Array.isArray(data.ticket_categories)
            ? data.ticket_categories.map((category: { id?: number; nama_kategori?: string; harga?: number; stok?: number }) => ({
                id: category.id,
                nama_kategori: category.nama_kategori || "",
                harga: String(category.harga ?? ""),
                stok: String(category.stok ?? "")
              }))
            : []
        );

        if (data.poster) {
          setExistingPoster(data.poster);
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Gagal memuat data event.");
      } finally {
        setFetchLoading(false);
      }
    }

    void fetchEvent();
  }, [eventId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoster(file);
      setImagePreview(URL.createObjectURL(file));
      setExistingPoster(null);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.nama_artis.trim()) newErrors.nama_artis = "Nama artis wajib diisi.";
    if (!form.judul.trim()) newErrors.judul = "Judul event wajib diisi.";
    if (!form.deskripsi.trim()) newErrors.deskripsi = "Deskripsi wajib diisi.";
    if (!form.tanggal) newErrors.tanggal = "Tanggal wajib diisi.";
    if (!form.jam) newErrors.jam = "Jam wajib diisi.";
    if (!form.lokasi.trim()) newErrors.lokasi = "Lokasi wajib diisi.";
    ticketCategories.forEach((category, index) => {
      if (!category.nama_kategori.trim()) newErrors[`category_name_${index}`] = "Nama kategori wajib diisi.";
      if (!category.harga || Number(category.harga) <= 0) newErrors[`category_price_${index}`] = "Harga harus lebih dari 0.";
      if (!category.stok || Number(category.stok) <= 0) newErrors[`category_stock_${index}`] = "Stok minimal 1.";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setErrors({ api: "Anda harus login sebagai admin." });
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("nama_artis", form.nama_artis);
      formData.append("judul", form.judul);
      formData.append("deskripsi", form.deskripsi);
      formData.append("tanggal", form.tanggal);
      formData.append("jam", form.jam);
      formData.append("lokasi", form.lokasi);
      formData.append("status", form.status);
      formData.append(
        "ticket_categories",
        JSON.stringify(ticketCategories.map((category) => ({
          id: category.id,
          nama_kategori: category.nama_kategori.trim(),
          harga: Number(category.harga),
          stok: Number(category.stok)
        })))
      );
      if (poster) {
        formData.append("poster", poster);
      }

      const res = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
          // Don't set Content-Type for FormData
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui event.");
      }

      setSuccess("Event berhasil diperbarui!");
      setTimeout(() => {
        router.push("/Dashboard/DaftarEvent");
      }, 1500);
    } catch (err) {
      setErrors({
        api: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan."
      });
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full px-3.5 py-2.5 text-sm bg-white text-slate-800 rounded-xl border ${
      errors[field]
        ? "border-rose-400 ring-1 ring-rose-300"
        : "border-slate-200 focus:border-[#111844] focus:ring-1 focus:ring-[#111844]"
    } focus:outline-none transition`;

  // Loading skeleton
  if (fetchLoading) {
    return (
      <AdminShell>
        <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200" />
            <div>
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-100 rounded mt-1.5" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="h-4 w-40 bg-slate-100 rounded" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-9 bg-slate-100 rounded-lg" />
                <div className="h-9 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-20 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </AdminShell>
    );
  }

  // Fetch error state
  if (fetchError) {
    return (
      <AdminShell>
        <div className="max-w-3xl mx-auto">
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Gagal Memuat Event</h3>
            <p className="text-xs text-slate-500">{fetchError}</p>
            <Link href="/Dashboard/DaftarEvent">
              <button className="px-4 py-2.5 text-sm font-semibold text-white bg-[#111844] hover:bg-[#0a0f2b] rounded-xl transition">
                Kembali ke Daftar Event
              </button>
            </Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/Dashboard/DaftarEvent">
            <button className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Event</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Perbarui informasi event <span className="font-semibold text-[#111844]">{form.judul}</span>
            </p>
          </div>
        </div>

        {/* Toast banners */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success} Mengarahkan ke Daftar Event...
            </motion.div>
          )}
        </AnimatePresence>

        {errors.api && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errors.api}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Info Event & Artis */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Informasi Event & Artis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Artis / Guest Star <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama_artis}
                  onChange={(e) => setForm({ ...form, nama_artis: e.target.value })}
                  placeholder="Coldiac / Sheila On 7"
                  className={inputClass("nama_artis")}
                />
                {errors.nama_artis && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.nama_artis}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Judul Event <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  placeholder="Concertix Tour 2026"
                  className={inputClass("judul")}
                />
                {errors.judul && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.judul}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Deskripsi <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Tuliskan deskripsi lengkap event..."
                className={`${inputClass("deskripsi")} resize-none`}
              />
              {errors.deskripsi && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.deskripsi}
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Jadwal & Lokasi */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Jadwal & Lokasi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className={inputClass("tanggal")}
                />
                {errors.tanggal && (
                  <p className="text-[11px] text-rose-500">{errors.tanggal}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Jam Mulai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.jam}
                  onChange={(e) => setForm({ ...form, jam: e.target.value })}
                  className={inputClass("jam")}
                />
                {errors.jam && (
                  <p className="text-[11px] text-rose-500">{errors.jam}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Status Event
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputClass("status")}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-aktif / Draft</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Lokasi Venue <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  placeholder="Istora Senayan, Jakarta Pusat"
                  className={`${inputClass("lokasi")} pl-9`}
                />
              </div>
              {errors.lokasi && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.lokasi}
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Ticket Categories */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Kategori Tiket
            </h3>
            {ticketCategories.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada kategori tiket untuk event ini.</p>
            ) : (
              <div className="space-y-3">
                {ticketCategories.map((category, index) => (
                  <div key={category.id || index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Nama Kategori</label>
                      <input
                        value={category.nama_kategori}
                        onChange={(e) => setTicketCategories((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, nama_kategori: e.target.value } : item))}
                        className={inputClass(`category_name_${index}`)}
                      />
                      {errors[`category_name_${index}`] && <p className="text-[11px] text-rose-500">{errors[`category_name_${index}`]}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Harga (Rp)</label>
                      <input
                        type="number"
                        min="1"
                        value={category.harga}
                        onChange={(e) => setTicketCategories((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, harga: e.target.value } : item))}
                        className={inputClass(`category_price_${index}`)}
                      />
                      {errors[`category_price_${index}`] && <p className="text-[11px] text-rose-500">{errors[`category_price_${index}`]}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Stok</label>
                      <input
                        type="number"
                        min="1"
                        value={category.stok}
                        onChange={(e) => setTicketCategories((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, stok: e.target.value } : item))}
                        className={inputClass(`category_stock_${index}`)}
                      />
                      {errors[`category_stock_${index}`] && <p className="text-[11px] text-rose-500">{errors[`category_stock_${index}`]}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Poster */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Poster Event{" "}
              <span className="text-slate-300 font-normal normal-case">
                (kosongkan jika tidak ingin mengubah)
              </span>
            </h3>

            {/* Show existing poster */}
            {existingPoster && !imagePreview && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500">Poster saat ini:</p>
                <div className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-200">
                  <Image
                    src={`${API_URL}/uploads/events/${existingPoster}`}
                    alt="Poster Event"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setExistingPoster(null)}
                  />
                  <button
                    type="button"
                    onClick={() => setExistingPoster(null)}
                    className="absolute top-2 right-2 p-1 bg-white/90 text-slate-700 rounded-lg shadow z-10 hover:bg-white transition"
                    title="Hapus poster"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload new poster */}
            <div className="relative border-2 border-dashed border-slate-200 hover:border-[#111844] rounded-xl p-5 text-center bg-slate-50/60 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {imagePreview ? (
                <div className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-200">
                  <Image src={imagePreview} alt="Preview Poster Baru" fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setPoster(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white/90 text-slate-700 rounded-lg shadow z-20 hover:bg-white transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 py-2">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    {existingPoster ? "Klik untuk ganti poster" : "Klik untuk upload poster baru"}
                  </p>
                  <p className="text-[11px] text-slate-400">PNG, JPG, atau WEBP</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-1 pb-8">
            <Link href="/Dashboard/DaftarEvent">
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition shadow-xs"
              >
                Batal
              </button>
            </Link>

            <motion.button
              type="submit"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#111844] hover:bg-[#0a0f2b] disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-xs transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
