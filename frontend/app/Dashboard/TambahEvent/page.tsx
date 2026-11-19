"use client";

import { useState, useMemo } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Upload,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Sparkles,
  Ticket,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  ShieldCheck,
  Rocket,
  Image as ImageIcon,
  Flame,
  Star,
  Layers,
  Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface TicketTier {
  id: string;
  nama_kategori: string;
  badge: string;
  periode: string;
  harga: number | string;
  stok: number | string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function TambahEventPage() {
  const router = useRouter();

  // Basic Form States (Blank by default)
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState("");
  const [genre, setGenre] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  // Schedule States
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [openGate, setOpenGate] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");

  // Venue States
  const [venue, setVenue] = useState("");
  const [kota, setKota] = useState("");

  // Artists Chips State
  const [artists, setArtists] = useState<string[]>([]);
  const [newArtistInput, setNewArtistInput] = useState("");

  // Ticket Tiers State
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState({
    nama_kategori: "",
    badge: "Standar",
    periode: "",
    harga: "",
    stok: ""
  });

  // Poster Upload States
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>("");
  const [posterFileName, setPosterFileName] = useState("");
  const [posterFileSize, setPosterFileSize] = useState("");

  // Publication Settings
  const [publikasikanLangsung, setPublikasikanLangsung] = useState(true);
  const [sorotanBanner, setSorotanBanner] = useState(false);
  const [batasiTransaksi, setBatasiTransaksi] = useState(true);

  // Submission Status States
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");

  // Computed Metrics
  const totalKuota = useMemo(() => {
    return ticketTiers.reduce((acc, t) => acc + (Number(t.stok) || 0), 0);
  }, [ticketTiers]);

  const estimasiBruto = useMemo(() => {
    return ticketTiers.reduce((acc, t) => acc + (Number(t.harga) || 0) * (Number(t.stok) || 0), 0);
  }, [ticketTiers]);

  const minHarga = useMemo(() => {
    if (ticketTiers.length === 0) return 0;
    const prices = ticketTiers.map((t) => Number(t.harga) || 0).filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [ticketTiers]);

  // Artist handlers
  const handleAddArtist = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = newArtistInput.trim();
    if (trimmed && !artists.includes(trimmed)) {
      setArtists((prev) => [...prev, trimmed]);
      setNewArtistInput("");
    }
  };

  const handleRemoveArtist = (artistToRemove: string) => {
    setArtists((prev) => prev.filter((a) => a !== artistToRemove));
  };

  // Poster handler
  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
      setPosterFileName(file.name);
      setPosterFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB • Berkas dipilih`);
    }
  };

  // Tier modal handlers
  const openAddTierModal = () => {
    setEditingTierId(null);
    setTierForm({
      nama_kategori: "",
      badge: "Standar",
      periode: "Penjualan Dibuka",
      harga: "",
      stok: ""
    });
    setTierModalOpen(true);
  };

  const openEditTierModal = (tier: TicketTier) => {
    setEditingTierId(tier.id);
    setTierForm({
      nama_kategori: tier.nama_kategori,
      badge: tier.badge,
      periode: tier.periode,
      harga: String(tier.harga),
      stok: String(tier.stok)
    });
    setTierModalOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierForm.nama_kategori.trim()) return;

    if (editingTierId) {
      setTicketTiers((prev) =>
        prev.map((t) =>
          t.id === editingTierId
            ? {
                ...t,
                nama_kategori: tierForm.nama_kategori,
                badge: tierForm.badge,
                periode: tierForm.periode,
                harga: Number(tierForm.harga) || 0,
                stok: Number(tierForm.stok) || 0
              }
            : t
        )
      );
    } else {
      const newTier: TicketTier = {
        id: String(Date.now()),
        nama_kategori: tierForm.nama_kategori,
        badge: tierForm.badge,
        periode: tierForm.periode || "Penjualan Dibuka",
        harga: Number(tierForm.harga) || 0,
        stok: Number(tierForm.stok) || 0
      };
      setTicketTiers((prev) => [...prev, newTier]);
    }
    setTierModalOpen(false);
  };

  const handleDeleteTier = (id: string) => {
    setTicketTiers((prev) => prev.filter((t) => t.id !== id));
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!judul.trim()) errs.judul = "Nama event wajib diisi.";
    if (!kategori) errs.kategori = "Kategori acara wajib dipilih.";
    if (!venue.trim()) errs.venue = "Nama venue tempat wajib diisi.";
    if (!kota.trim()) errs.kota = "Kota pelaksanaan wajib diisi.";
    if (!tanggalMulai) errs.tanggalMulai = "Tanggal pelaksanaan wajib diisi.";
    if (ticketTiers.length === 0) errs.tiers = "Minimal 1 kategori tiket harus ditambahkan.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handlePublish = async (asDraft = false) => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    setSuccess("");

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const finalStatus = asDraft || !publikasikanLangsung ? "draft" : "aktif";
    const namaArtisUtama = artists.length > 0 ? artists.join(", ") : "Concertix Artist";
    const lokasiLengkap = `${venue}, ${kota}`;

    try {
      const formData = new FormData();
      formData.append("nama_artis", namaArtisUtama);
      formData.append("judul", judul.trim());
      formData.append("deskripsi", deskripsi.trim());
      formData.append("tanggal", tanggalMulai);
      formData.append("jam", jamSelesai || "19:00 WIB");
      formData.append("open_gate", openGate || "15:00 WIB");
      formData.append("jam_selesai", jamSelesai || "23:00 WIB");
      formData.append("lokasi", lokasiLengkap);
      formData.append("kategori", kategori);
      formData.append("status", finalStatus);
      formData.append(
        "ticket_categories",
        JSON.stringify(
          ticketTiers.map((t) => ({
            nama_kategori: t.nama_kategori.trim(),
            harga: Number(t.harga) || 0,
            stok: Number(t.stok) || 0
          }))
        )
      );

      if (posterFile) {
        formData.append("poster", posterFile);
      }

      if (token) {
        const res = await fetch(`${API_URL}/api/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Gagal menyimpan event ke backend.");
        }
      }

      setSuccess(
        asDraft
          ? "Event berhasil disimpan sebagai Draf!"
          : "Event dan tiket berhasil dipublikasikan!"
      );
      setTimeout(() => {
        router.push("/Dashboard/DaftarEvent");
      }, 1500);
    } catch (err) {
      setErrors({
        api: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan event."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-col w-full pb-20 space-y-6">
        {/* Top Breadcrumb & Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Kelola Event
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-xs text-blue-600 font-bold">Formulir Pendaftaran</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111844] tracking-tight">
              Tambah Event Baru
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Lengkapi formulir detail konser, tentukan kategori tiket, dan publikasikan acara ke penggemar.
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="bg-white px-5 py-3 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 self-start md:self-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20">
                1
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">
                  Langkah 1
                </span>
                <span className="text-xs font-bold text-slate-900">Informasi Dasar</span>
              </div>
            </div>
            <div className="w-8 h-0.5 bg-slate-200 rounded-full" />
            <div className="flex items-center gap-2.5 opacity-60">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                  Langkah 2
                </span>
                <span className="text-xs font-medium text-slate-700">Tiket &amp; Harga</span>
              </div>
            </div>
            <div className="w-8 h-0.5 bg-slate-200 rounded-full" />
            <div className="flex items-center gap-2.5 opacity-60">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                  Langkah 3
                </span>
                <span className="text-xs font-medium text-slate-700">Publikasi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Banners */}
        <AnimatePresence>
          {errors.api && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 shrink-0" /> {errors.api}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two Column Layout Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (Main Data Fields ~65%) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Card 1: Informasi Event */}
            <section className="bg-white rounded-[28px] p-6 lg:p-7 shadow-xs border border-slate-200/80 flex flex-col space-y-6">
              <div className="flex items-start justify-between pb-5 -mx-6 lg:-mx-7 -mt-6 lg:-mt-7 px-6 lg:px-7 pt-6 lg:pt-7 rounded-t-[28px] bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Informasi Event</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Masukkan rincian identitas visual, kategori, dan jadwal akurat konser
                    </p>
                  </div>
                </div>
                <span className="bg-blue-50 text-blue-700 text-[11px] uppercase px-3 py-1 rounded-full font-bold">
                  Wajib Diisi
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Nama Event */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    Nama Event <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Soundfest Jakarta 2026"
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:bg-white focus:border-[#111844] transition-all"
                  />
                  {errors.judul && (
                    <span className="text-xs text-rose-500 font-medium">{errors.judul}</span>
                  )}
                </div>

                {/* Kategori & Tagline Event */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      Kategori Acara <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={kategori}
                        onChange={(e) => setKategori(e.target.value)}
                        className="w-full h-12 px-4 pr-10 rounded-xl bg-slate-50 text-slate-900 text-sm appearance-none border border-slate-200 focus:outline-none focus:bg-white focus:border-[#111844] transition-all cursor-pointer"
                      >
                        <option value="">Pilih Kategori Acara</option>
                        <option value="Festival Musik">Festival Musik</option>
                        <option value="Konser Musik Tunggal">Konser Musik Tunggal</option>
                        <option value="Stand Up Comedy">Stand Up Comedy</option>
                        <option value="Pameran Seni & Budaya">Pameran Seni &amp; Budaya</option>
                        <option value="Konferensi & Expo">Konferensi &amp; Expo</option>
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                        ▼
                      </span>
                    </div>
                    {errors.kategori && (
                      <span className="text-xs text-rose-500 font-medium">{errors.kategori}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800">Genre Utama</label>
                    <div className="relative">
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full h-12 px-4 pr-10 rounded-xl bg-slate-50 text-slate-900 text-sm appearance-none border border-slate-200 focus:outline-none focus:bg-white focus:border-[#111844] transition-all cursor-pointer"
                      >
                        <option value="">Pilih Genre (Opsional)</option>
                        <option value="Pop & Indie Rock">Pop &amp; Indie Rock</option>
                        <option value="Jazz, Soul & RnB">Jazz, Soul &amp; RnB</option>
                        <option value="Electronic Dance Music (EDM)">Electronic Dance Music (EDM)</option>
                        <option value="Hip-Hop & R&B">Hip-Hop &amp; R&amp;B</option>
                        <option value="Rock & Metal">Rock &amp; Metal</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deskripsi Lengkap Acara */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Deskripsi Lengkap Acara
                    </label>
                    <span className="text-[11px] text-slate-400">Format teks didukung</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-2 border border-slate-200">
                    <div className="flex items-center gap-1 pb-2 px-1 text-slate-400 text-xs border-b border-slate-200/60 mb-2">
                      <span className="px-2 py-0.5 bg-white rounded font-bold text-slate-700 shadow-xs">
                        B
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded italic text-slate-700 shadow-xs">
                        I
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded underline text-slate-700 shadow-xs">
                        U
                      </span>
                      <div className="w-0.5 h-3.5 bg-slate-200 mx-1.5" />
                      <span className="text-[11px] text-slate-400 font-medium">
                        Daya tarik festival &amp; panduan penonton
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      placeholder="Tuliskan daya tarik festival, alur pertunjukan panggung, batasan usia, dan panduan keamanan..."
                      className="w-full p-3 rounded-xl bg-white text-slate-900 text-sm placeholder:text-slate-400 border border-slate-200/60 focus:outline-none focus:border-[#111844] resize-none transition"
                    />
                  </div>
                </div>

                {/* Jadwal Pelaksanaan (4 Fields Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      Tanggal Mulai <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={tanggalMulai}
                        onChange={(e) => setTanggalMulai(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 text-slate-800 text-xs sm:text-sm border border-slate-200 focus:outline-none focus:bg-white focus:border-[#111844] transition"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {errors.tanggalMulai && (
                      <span className="text-[11px] text-rose-500 font-medium">
                        {errors.tanggalMulai}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      Tanggal Selesai <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={tanggalSelesai}
                        onChange={(e) => setTanggalSelesai(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 text-slate-800 text-xs sm:text-sm border border-slate-200 focus:outline-none focus:bg-white focus:border-[#111844] transition"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800">Pintu Dibuka (Open Gate)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={openGate}
                        onChange={(e) => setOpenGate(e.target.value)}
                        placeholder="15:00 WIB"
                        className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 text-slate-800 text-xs sm:text-sm border border-slate-200 focus:outline-none focus:bg-white focus:border-[#111844] transition"
                      />
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800">Acara Berakhir</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={jamSelesai}
                        onChange={(e) => setJamSelesai(e.target.value)}
                        placeholder="23:30 WIB"
                        className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 text-slate-800 text-xs sm:text-sm border border-slate-200 focus:outline-none focus:bg-white focus:border-[#111844] transition"
                      />
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Venue & Lokasi Kota */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      Nama Venue / Tempat <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="Nama gedung, stadion atau hall"
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-200 focus:outline-none focus:bg-white focus:border-[#111844] transition"
                      />
                      <MapPin className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    {errors.venue && (
                      <span className="text-[11px] text-rose-500 font-medium">{errors.venue}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      Kota Pelaksanaan <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={kota}
                        onChange={(e) => setKota(e.target.value)}
                        placeholder="Kota pelaksanaan konser"
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-200 focus:outline-none focus:bg-white focus:border-[#111844] transition"
                      />
                      <Building2 className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    {errors.kota && (
                      <span className="text-[11px] text-rose-500 font-medium">{errors.kota}</span>
                    )}
                  </div>
                </div>

                {/* Pengisi Acara / Line-up Chips */}
                <div className="flex flex-col gap-2 pt-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Pengisi Acara / Line-up Artis Utama</span>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("artist-input-field");
                        el?.focus();
                      }}
                      className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline"
                    >
                      + Tambah Musisi Cepat
                    </button>
                  </label>
                  <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 min-h-[50px]">
                    {artists.length === 0 && !newArtistInput && (
                      <span className="text-xs text-slate-400 italic px-2">
                        Belum ada artis yang ditambahkan.
                      </span>
                    )}
                    {artists.map((artist) => {
                      const initials = artist
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div
                          key={artist}
                          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 bg-white rounded-full shadow-xs border border-slate-200/60"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                            {initials}
                          </div>
                          <span className="text-xs font-semibold text-slate-800">{artist}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveArtist(artist)}
                            className="text-slate-400 hover:text-rose-600 transition flex items-center"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Add Artist Input */}
                    <div className="flex items-center gap-1.5 pl-3 pr-2 py-1 text-slate-500 text-xs">
                      <Plus className="w-4 h-4 text-blue-600 shrink-0" />
                      <input
                        id="artist-input-field"
                        type="text"
                        value={newArtistInput}
                        onChange={(e) => setNewArtistInput(e.target.value)}
                        onKeyDown={handleAddArtist}
                        placeholder="Ketik & Enter..."
                        className="bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none w-32 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Card 2: Kategori Tiket */}
            <section className="bg-white rounded-[28px] p-6 lg:p-7 shadow-xs border border-slate-200/80 flex flex-col space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 -mx-6 lg:-mx-7 -mt-6 lg:-mt-7 px-6 lg:px-7 pt-6 lg:pt-7 rounded-t-[28px] bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Kategori Tiket</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atur tier tiket, batasan kuota penjualan, dan penetapan harga
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openAddTierModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Tier Tiket</span>
                </button>
              </div>

              {/* Ticket Rows List */}
              <div className="flex flex-col gap-3">
                {ticketTiers.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50/80 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Belum Ada Kategori Tiket</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
                      Silakan tambahkan kategori tiket seperti Presale, Festival, atau VIP beserta harga dan kuota penonton.
                    </p>
                    <button
                      type="button"
                      onClick={openAddTierModal}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Tier Tiket Pertama</span>
                    </button>
                  </div>
                ) : (
                  ticketTiers.map((tier) => {
                    const badgeColor =
                      tier.badge === "Hot Deal"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : tier.badge === "Eksklusif"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200";

                    return (
                      <div
                        key={tier.id}
                        className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Ticket className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">
                                {tier.nama_kategori}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}
                              >
                                {tier.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{tier.periode}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 pl-12 md:pl-0">
                          <div className="flex flex-col text-left md:text-right">
                            <span className="text-[10px] uppercase font-semibold text-slate-400">
                              Harga Tiket
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                              Rp {Number(tier.harga).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex flex-col text-left md:text-right">
                            <span className="text-[10px] uppercase font-semibold text-slate-400">
                              Alokasi Kuota
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {Number(tier.stok).toLocaleString("id-ID")}{" "}
                              <span className="font-normal text-xs text-slate-400">kursi</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditTierModal(tier)}
                              className="w-8 h-8 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition border border-transparent hover:border-slate-200"
                              title="Edit Tier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTier(tier.id)}
                              className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition"
                              title="Hapus Tier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {errors.tiers && (
                <span className="text-xs text-rose-500 font-medium">{errors.tiers}</span>
              )}

              {/* Ticket Metrics Summary Ribbon */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Kapasitas Maksimal
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      Total Kuota: {totalKuota.toLocaleString("id-ID")} Tiket
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Estimasi Bruto Penjualan
                  </span>
                  <p className="text-base font-extrabold text-blue-600">
                    Rp {estimasiBruto.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (Upload, Live Mock Preview & Visibility Settings ~35%) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Card: Upload Poster Event */}
            <section className="bg-white rounded-[28px] p-6 shadow-xs border border-slate-200/80 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Poster Event</h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  16:9 Rasio
                </span>
              </div>

              {/* Drag & Drop Zone */}
              <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center bg-slate-50/60 hover:bg-slate-100/70 transition cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 mb-1">
                  Tarik &amp; letakkan poster konser di sini
                </p>
                <p className="text-[11px] text-slate-400 mb-3">Format PNG, JPG atau WEBP (Maks 5 MB)</p>
                <span className="px-4 py-1.5 rounded-full bg-white text-blue-600 text-xs font-bold shadow-xs border border-slate-200 hover:shadow transition">
                  Pilih Berkas Lokal
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterSelect}
                  className="hidden"
                />
              </label>

              {/* Selected File Snapshot (Hanya tampil jika poster dipilih) */}
              {posterPreview && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-11 h-11 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                      <Image
                        src={posterPreview}
                        alt="Thumbnail Poster"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {posterFileName || "poster.png"}
                      </p>
                      <p className="text-[11px] text-slate-400">{posterFileSize}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPosterFile(null);
                      setPosterPreview("");
                      setPosterFileName("");
                      setPosterFileSize("");
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition shrink-0"
                    title="Hapus poster"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </section>

            {/* Card: Live App Preview Mock */}
            <section className="bg-white rounded-[28px] p-6 shadow-xs border border-slate-200/80 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Pratinjau Aplikasi
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Simulated Mobile Card */}
              <div className="rounded-2xl bg-slate-50 overflow-hidden shadow-xs border border-slate-200">
                <div className="relative h-44 w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
                  {posterPreview ? (
                    <>
                      <Image
                        src={posterPreview}
                        alt="Preview"
                        fill
                        className="object-cover opacity-90"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">
                        Pratinjau Poster Acara
                      </span>
                      <span className="text-[10px] text-slate-400 max-w-[200px]">
                        Unggah poster di atas untuk melihat tampilan kartu
                      </span>
                    </div>
                  )}

                  {kategori && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-blue-600 text-[10px] font-bold shadow-xs">
                        {kategori}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                    <span className="font-semibold uppercase tracking-wider bg-rose-600 px-2 py-0.5 rounded-full text-[10px]">
                      {ticketTiers.length > 0 ? "Tiket Tersedia" : "Draf Event"}
                    </span>
                    <span className="text-slate-200 font-medium">
                      {tanggalMulai && tanggalSelesai && tanggalMulai !== tanggalSelesai
                        ? "Multi-Hari"
                        : "1 Hari Acara"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {tanggalMulai
                        ? new Date(tanggalMulai).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        : "Pilih Tanggal Acara"}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {judul.trim() || "Judul Acara Konser"}
                  </h4>

                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {venue || kota
                        ? `${venue ? venue : ""}${venue && kota ? ", " : ""}${kota ? kota : ""}`
                        : "Lokasi Belum Ditentukan"}
                    </span>
                  </div>

                  <div className="pt-3 mt-1 flex items-center justify-between bg-slate-100/70 -mx-4 -mb-4 px-4 py-3 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Mulai dari</span>
                      <span className="text-sm font-bold text-blue-600">
                        {minHarga > 0 ? `Rp ${minHarga.toLocaleString("id-ID")}` : "Rp 0"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-xs opacity-90"
                    >
                      Beli Tiket
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Card: Visibilitas & Pengaturan Publikasi */}
            <section className="bg-white rounded-[28px] p-6 shadow-xs border border-slate-200/80 flex flex-col space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Pengaturan Publikasi</h3>

              <div className="flex flex-col gap-4 text-xs">
                {/* Toggle 1: Publikasikan Langsung */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">Publikasikan Langsung</span>
                    <span className="text-[11px] text-slate-400">
                      Event langsung aktif dan dapat dicari penonton
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={publikasikanLangsung}
                      onChange={(e) => setPublikasikanLangsung(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Toggle 2: Rekomendasi Slider Banner */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">Sorotan Banner Beranda</span>
                    <span className="text-[11px] text-slate-400">
                      Sematkan di carousel rekomendasi utama
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={sorotanBanner}
                      onChange={(e) => setSorotanBanner(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Toggle 3: Pembatasan Tiket per NIK */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">Batasi Transaksi Akun</span>
                    <span className="text-[11px] text-slate-400">
                      Maksimal 4 tiket per nomor KTP/Email terdaftar
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={batasiTransaksi}
                      onChange={(e) => setBatasiTransaksi(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Floating Action Dock */}
        <div className="sticky bottom-6 mt-8 bg-white/95 backdrop-blur-md p-4 px-6 rounded-2xl shadow-lg border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 z-30">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Formulir siap disimpan ke database Concertix</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePublish(true)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition disabled:opacity-50"
            >
              Simpan sebagai Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePublish(false)}
              className="w-full sm:w-auto px-8 py-2.5 rounded-full bg-[#111844] hover:bg-[#1a235c] text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 text-blue-400" />
                  <span>Publikasikan Event</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Tambah / Edit Tier Tiket */}
        <AnimatePresence>
          {tierModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTierId ? "Edit Tier Tiket" : "Tambah Tier Tiket Baru"}
                  </h3>
                  <button
                    onClick={() => setTierModalOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveTier} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Nama Tier / Kategori</label>
                    <select
                      required
                      value={tierForm.nama_kategori}
                      onChange={(e) =>
                        setTierForm({ ...tierForm, nama_kategori: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-[#111844]"
                    >
                      <option value="" disabled>
                        Pilih nama tier
                      </option>
                      <option value="VVIP">VVIP</option>
                      <option value="VIP">VIP</option>
                      <option value="Festival">Festival</option>
                      <option value="CAT 1">CAT 1</option>
                      <option value="CAT 2">CAT 2</option>
                      <option value="CAT 3">CAT 3</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Badge Label</label>
                      <select
                        value={tierForm.badge}
                        onChange={(e) => setTierForm({ ...tierForm, badge: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none"
                      >
                        <option>Standar</option>
                        <option>Hot Deal</option>
                        <option>Eksklusif</option>
                        <option>Early Bird</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Keterangan / Periode</label>
                      <input
                        type="text"
                        value={tierForm.periode}
                        onChange={(e) => setTierForm({ ...tierForm, periode: e.target.value })}
                        placeholder="Contoh: 01 Feb - 15 Feb"
                        className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-[#111844]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Harga Tiket (Rp)</label>
                      <input
                        type="number"
                        required
                        min="1000"
                        value={tierForm.harga}
                        onChange={(e) => setTierForm({ ...tierForm, harga: e.target.value })}
                        placeholder="500000"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-[#111844]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Alokasi Kuota Kursi</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={tierForm.stok}
                        onChange={(e) => setTierForm({ ...tierForm, stok: e.target.value })}
                        placeholder="1000"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-[#111844]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setTierModalOpen(false)}
                      className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      {editingTierId ? "Simpan Perubahan" : "Tambahkan Tier"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminShell>
  );
}
