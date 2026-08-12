"use client";

import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Upload,
  MapPin,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Send,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TicketCategoryInput {
  nama_kategori: string;
  harga: string;
  stok: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function TambahEventPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nama_artis: "",
    judul: "",
    deskripsi: "",
    tanggal: "",
    jam: "",
    lokasi: "",
    status: "aktif"
  });

  const [ticketCategories, setTicketCategories] = useState<TicketCategoryInput[]>([
    { nama_kategori: "Reguler", harga: "", stok: "" }
  ]);

  const [poster, setPoster] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoster(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addTicketCategory = () => {
    setTicketCategories((prev) => [...prev, { nama_kategori: "", harga: "", stok: "" }]);
  };

  const removeTicketCategory = (index: number) => {
    if (ticketCategories.length === 1) return;
    setTicketCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTicketCategory = (
    index: number,
    field: keyof TicketCategoryInput,
    value: string
  ) => {
    setTicketCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.nama_artis.trim()) newErrors.nama_artis = "Nama artis wajib diisi.";
    if (!form.judul.trim()) newErrors.judul = "Judul event wajib diisi.";
    if (!form.deskripsi.trim()) newErrors.deskripsi = "Deskripsi wajib diisi.";
    if (!form.tanggal) newErrors.tanggal = "Tanggal wajib diisi.";
    if (!form.jam) newErrors.jam = "Jam wajib diisi.";
    if (!form.lokasi.trim()) newErrors.lokasi = "Lokasi wajib diisi.";

    ticketCategories.forEach((cat, i) => {
      if (!cat.nama_kategori.trim())
        newErrors[`cat_name_${i}`] = "Nama kategori wajib.";
      if (!cat.harga || Number(cat.harga) <= 0)
        newErrors[`cat_price_${i}`] = "Harga harus > 0.";
      if (!cat.stok || Number(cat.stok) <= 0)
        newErrors[`cat_stock_${i}`] = "Stok minimal 1.";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    setSuccess("");

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setErrors({ api: "Anda harus login sebagai admin untuk menambah event." });
      setLoading(false);
      return;
    }

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
        JSON.stringify(
          ticketCategories.map((cat) => ({
            nama_kategori: cat.nama_kategori.trim(),
            harga: Number(cat.harga),
            stok: Number(cat.stok)
          }))
        )
      );
      if (poster) {
        formData.append("poster", poster);
      }

      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan event ke server.");
      }

      setSuccess("Event dan kategori tiket berhasil ditambahkan!");
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
    `w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-800 rounded-xl border ${
      errors[field]
        ? "border-rose-400 ring-1 ring-rose-300"
        : "border-slate-200 focus:border-[#111844] focus:ring-1 focus:ring-[#111844]"
    } focus:outline-none transition`;

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/Dashboard/DaftarEvent">
            <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition shadow-xs">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tambah Event Baru</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Isi detail event, jadwal, kategori tiket, dan poster.
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
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {success} Mengarahkan ke Daftar Event...
            </motion.div>
          )}
        </AnimatePresence>

        {errors.api && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errors.api}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Informasi Event & Artis */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">
              Informasi Event & Artis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
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
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.nama_artis}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
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
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.judul}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                Deskripsi <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Tuliskan deskripsi lengkap event, syarat masuk, peraturan venue, dll..."
                className={`${inputClass("deskripsi")} resize-none`}
              />
              {errors.deskripsi && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.deskripsi}
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Jadwal & Lokasi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">
              Jadwal & Lokasi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className={inputClass("tanggal")}
                />
                {errors.tanggal && (
                  <p className="text-xs text-rose-500">{errors.tanggal}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Jam Mulai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.jam}
                  onChange={(e) => setForm({ ...form, jam: e.target.value })}
                  className={inputClass("jam")}
                />
                {errors.jam && (
                  <p className="text-xs text-rose-500">{errors.jam}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
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

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                Lokasi Venue <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  placeholder="Istora Senayan, Jakarta Pusat"
                  className={`${inputClass("lokasi")} pl-10`}
                />
              </div>
              {errors.lokasi && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.lokasi}
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Kategori Tiket */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kategori Tiket
              </h3>
              <button
                type="button"
                onClick={addTicketCategory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111844] bg-[#111844]/10 hover:bg-[#111844]/20 rounded-xl transition"
              >
                <Plus className="w-4 h-4" /> Tambah Kategori
              </button>
            </div>

            <div className="space-y-3.5">
              {ticketCategories.map((cat, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-3 items-end p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="col-span-5 space-y-1">
                    <label className="block text-xs font-semibold text-slate-500">
                      Nama Kategori
                    </label>
                    <input
                      type="text"
                      value={cat.nama_kategori}
                      onChange={(e) =>
                        updateTicketCategory(i, "nama_kategori", e.target.value)
                      }
                      placeholder="Reguler / VIP / VVIP"
                      className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-white rounded-xl border ${
                        errors[`cat_name_${i}`]
                          ? "border-rose-400"
                          : "border-slate-200 focus:border-[#111844]"
                      } focus:outline-none transition`}
                    />
                    {errors[`cat_name_${i}`] && (
                      <p className="text-xs text-rose-500">
                        {errors[`cat_name_${i}`]}
                      </p>
                    )}
                  </div>

                  <div className="col-span-4 space-y-1">
                    <label className="block text-xs font-semibold text-slate-500">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cat.harga}
                      onChange={(e) =>
                        updateTicketCategory(i, "harga", e.target.value)
                      }
                      placeholder="750000"
                      className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-white rounded-xl border font-mono ${
                        errors[`cat_price_${i}`]
                          ? "border-rose-400"
                          : "border-slate-200 focus:border-[#111844]"
                      } focus:outline-none transition`}
                    />
                    {errors[`cat_price_${i}`] && (
                      <p className="text-xs text-rose-500">
                        {errors[`cat_price_${i}`]}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-semibold text-slate-500">
                      Stok
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={cat.stok}
                      onChange={(e) =>
                        updateTicketCategory(i, "stok", e.target.value)
                      }
                      placeholder="500"
                      className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-white rounded-xl border font-mono ${
                        errors[`cat_stock_${i}`]
                          ? "border-rose-400"
                          : "border-slate-200 focus:border-[#111844]"
                      } focus:outline-none transition`}
                    />
                    {errors[`cat_stock_${i}`] && (
                      <p className="text-xs text-rose-500">
                        {errors[`cat_stock_${i}`]}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1 flex justify-center pb-0.5">
                    <button
                      type="button"
                      onClick={() => removeTicketCategory(i)}
                      disabled={ticketCategories.length === 1}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Hapus kategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Upload Poster */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">
              Poster Event <span className="text-slate-300 font-normal normal-case">(opsional)</span>
            </h3>

            <div className="relative border-2 border-dashed border-slate-200 hover:border-[#111844] rounded-2xl p-6 text-center bg-slate-50/60 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200">
                  <Image src={imagePreview} alt="Preview Poster" fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setPoster(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 text-slate-700 rounded-lg shadow z-20 hover:bg-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-3">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    Klik untuk upload poster
                  </p>
                  <p className="text-xs text-slate-400">
                    Mendukung PNG, JPG, WEBP — maks 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-2 pb-10">
            <Link href="/Dashboard/DaftarEvent">
              <button
                type="button"
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition shadow-xs"
              >
                Batal
              </button>
            </Link>

            <motion.button
              type="submit"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#111844] hover:bg-[#0a0f2b] disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-xs transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Simpan Event
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
