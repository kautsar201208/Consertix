"use client";

import { useEffect, useState, useMemo } from "react";
import AdminShell from "@/components/AdminShell";
import Modal from "@/components/Modal";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Inbox,
  AlertCircle,
  Save,
  Loader2,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Ticket,
  FileEdit,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type TabFilter = "Semua" | "Aktif" | "Draft" | "Selesai";

// Default template events matching exact mockup
const DEFAULT_EVENTS = [
  {
    id: 1,
    judul: "Festival Musik Bali 2026",
    nama_artis: "Nusantara Live Entertainment",
    kategori: "Festival Musik",
    tanggal: "2026-03-14",
    tanggal_display: "14 - 16 Mar 2026",
    jam: "16:00 WITA",
    lokasi: "GWK Cultural Park, Badung, Bali",
    kuota: 15000,
    tiket_terjual: 6800,
    harga_min: 450000,
    harga_max: 1850000,
    status: "aktif",
    poster_url:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
    deskripsi:
      "Festival musik tahunan terbesar di Bali menghadirkan jajaran musisi lokal dan internasional dengan latar spektakuler patung GWK.",
  },
  {
    id: 2,
    judul: "Tribute Coldplay",
    nama_artis: "Soundwave Productions",
    kategori: "Konser Musik",
    tanggal: "2025-11-18",
    tanggal_display: "18 Nov 2025",
    jam: "19:30 WIB",
    lokasi: "Balai Sarbini, Jakarta Selatan",
    kuota: 1200,
    tiket_terjual: 1150,
    harga_min: 350000,
    harga_max: 950000,
    status: "aktif",
    poster_url:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80",
    deskripsi:
      "Konser megah persembahan tribute band terbaik Coldplay dengan visual laser dan wristband bercahaya memukau.",
  },
  {
    id: 3,
    judul: "Pameran Seni Indonesia",
    nama_artis: "Yayasan Seni Kontemporer",
    kategori: "Seni & Budaya",
    tanggal: "2025-12-02",
    tanggal_display: "02 - 10 Des 2025",
    jam: "10:00 WIB",
    lokasi: "Galeri Nasional Indonesia, Jakpus",
    kuota: 5000,
    tiket_terjual: 2400,
    harga_min: 50000,
    harga_max: 120000,
    status: "aktif",
    poster_url:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=500&auto=format&fit=crop&q=80",
    deskripsi:
      "Pameran instalasi seni dan lukisan modern kontemporer kurasi maestro seni rupa tanah air.",
  },
  {
    id: 4,
    judul: "Startup Summit 2026",
    nama_artis: "Venture Spark Collective",
    kategori: "Bisnis & Teknologi",
    tanggal: "2026-05-05",
    tanggal_display: "05 Mei 2026",
    jam: "09:00 WIB",
    lokasi: "JCC Senayan Hall A, Jakarta",
    kuota: 2000,
    tiket_terjual: 1800,
    harga_min: 750000,
    harga_max: 2500000,
    status: "aktif",
    poster_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=80",
    deskripsi:
      "Konferensi teknologi & investasi startup nomor satu di Asia Tenggara yang menghubungkan pendiri dan investor global.",
  },
  {
    id: 5,
    judul: "Stand Up Comedy Night",
    nama_artis: "Tertawa Bersama Management",
    kategori: "Komedi",
    tanggal: "2026-04-28",
    tanggal_display: "28 Apr 2026",
    jam: "20:00 WIB",
    lokasi: "Balai Kartini, Jakarta Selatan",
    kuota: 500,
    tiket_terjual: 65,
    harga_min: 150000,
    harga_max: 350000,
    status: "draft",
    poster_url:
      "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=500&auto=format&fit=crop&q=80",
    deskripsi:
      "Malam spesial stand-up comedy intim bersama para komika papan atas Indonesia.",
  },
  {
    id: 6,
    judul: "Festival Kuliner Nusantara",
    nama_artis: "Rasa Nusantara Media",
    kategori: "Kuliner",
    tanggal: "2025-10-10",
    tanggal_display: "10 - 12 Okt 2025",
    jam: "11:00 WIB",
    lokasi: "Lapangan Banteng, Jakarta Pusat",
    kuota: 12500,
    tiket_terjual: 12500,
    harga_min: 350000,
    harga_max: 85000,
    status: "selesai",
    poster_url:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80",
    deskripsi:
      "Pesta kuliner legendaris dan jajanan autentik dari 38 provinsi di Indonesia.",
  },
];

function formatRupiah(n: number | string | undefined) {
  if (n === undefined || n === null || n === "") return "—";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function formatDate(d: string | undefined, fallback?: string) {
  if (fallback) return fallback;
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function getStatusBadge(status: string) {
  const s = (status || "aktif").toLowerCase();
  if (s === "aktif" || s === "active") {
    return {
      label: "Aktif",
      dot: "bg-emerald-500",
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    };
  }
  if (s === "selesai" || s === "done" || s === "completed") {
    return {
      label: "Selesai",
      dot: "bg-slate-400",
      cls: "bg-slate-100 text-slate-600 border border-slate-200",
    };
  }
  return {
    label: "Draft",
    dot: "bg-amber-500",
    cls: "bg-amber-50 text-amber-800 border border-amber-100",
  };
}

function QuotaBar({ sold, total }: { sold: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const isComplete = pct >= 90;
  const barColor = isComplete ? "bg-emerald-600" : pct > 30 ? "bg-[#2563eb]" : "bg-amber-500";
  const textColor = isComplete ? "text-emerald-700" : pct > 30 ? "text-[#2563eb]" : "text-amber-700";

  return (
    <div className="flex flex-col space-y-1.5 min-w-[150px]">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-800">
          {sold.toLocaleString("id-ID")} / {total.toLocaleString("id-ID")}
        </span>
        <span className={`font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function KelolaEventPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adminUser, setAdminUser] = useState<any | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Kategori");
  const [statusDropdown, setStatusDropdown] = useState("Semua Status");
  const [tabFilter, setTabFilter] = useState<TabFilter>("Semua");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Modals
  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [deleteModal, setDeleteModal] = useState<any | null>(null);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    nama_artis: "",
    judul: "",
    deskripsi: "",
    tanggal: "",
    jam: "",
    lokasi: "",
    status: "aktif",
  });
  const [editPoster, setEditPoster] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    // Load admin user info for header profile
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("user");
        if (u) setAdminUser(JSON.parse(u));
      } catch {}
    }
    void loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setEvents(data);
      } else {
        // Fallback to rich template events if API returns empty
        setEvents(DEFAULT_EVENTS);
      }
    } catch {
      // Offline fallback
      setEvents(DEFAULT_EVENTS);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(evt: any) {
    setEditModal(evt);
    setEditForm({
      nama_artis: evt.nama_artis || "",
      judul: evt.judul || "",
      deskripsi: evt.deskripsi || "",
      tanggal: evt.tanggal ? String(evt.tanggal).slice(0, 10) : "",
      jam: evt.jam || "",
      lokasi: evt.lokasi || "",
      status: evt.status || "aktif",
    });
    setEditPoster(null);
    setEditPreview(
      evt.poster
        ? `${API_URL}/uploads/posters/${evt.poster}`
        : evt.poster_url || null
    );
    setEditError("");
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    setEditSubmitting(true);
    setEditError("");
    try {
      if (token) {
        const fd = new FormData();
        Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
        if (editPoster) fd.append("poster", editPoster);
        const res = await fetch(`${API_URL}/api/events/${editModal.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal memperbarui event.");
      }

      setEvents((prev) =>
        prev.map((item) =>
          item.id === editModal.id
            ? {
                ...item,
                ...editForm,
                poster_url: editPreview || item.poster_url,
              }
            : item
        )
      );

      setSuccess(`Event "${editForm.judul}" berhasil diperbarui!`);
      setEditModal(null);
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: number | string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      if (token) {
        await fetch(`${API_URL}/api/events/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setSuccess("Event berhasil dihapus.");
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setTimeout(() => setError(""), 3500);
    } finally {
      setDeleteModal(null);
    }
  }

  // Filtered list
  const filtered = useMemo(() => {
    return events.filter((evt) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (evt.judul || "").toLowerCase().includes(q) ||
        (evt.nama_artis || "").toLowerCase().includes(q) ||
        (evt.lokasi || "").toLowerCase().includes(q) ||
        (evt.kategori || "").toLowerCase().includes(q);

      const s = (evt.status || "aktif").toLowerCase();
      const matchTab =
        tabFilter === "Semua" ||
        (tabFilter === "Aktif" && (s === "aktif" || s === "active")) ||
        (tabFilter === "Draft" && (s === "draft" || s === "nonaktif")) ||
        (tabFilter === "Selesai" && (s === "selesai" || s === "done" || s === "completed"));

      const matchStatusDropdown =
        statusDropdown === "Semua Status" ||
        (statusDropdown === "Aktif" && (s === "aktif" || s === "active")) ||
        (statusDropdown === "Draft" && (s === "draft" || s === "nonaktif")) ||
        (statusDropdown === "Selesai" && (s === "selesai" || s === "done" || s === "completed"));

      const matchCat =
        categoryFilter === "Semua Kategori" ||
        (evt.kategori || "").toLowerCase().includes(categoryFilter.toLowerCase());

      return matchSearch && matchTab && matchStatusDropdown && matchCat;
    });
  }, [events, searchQuery, tabFilter, statusDropdown, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const tabCounts = useMemo(() => {
    const aktif = events.filter((e) =>
      ["aktif", "active"].includes((e.status || "").toLowerCase())
    ).length;
    const draft = events.filter((e) =>
      ["draft", "nonaktif"].includes((e.status || "").toLowerCase())
    ).length;
    const selesai = events.filter((e) =>
      ["selesai", "done", "completed"].includes((e.status || "").toLowerCase())
    ).length;
    return { aktif, draft, selesai, semua: events.length };
  }, [events]);

  // Aggregate metrics
  const totalTicketsSold = useMemo(() => {
    return events.reduce((sum, e) => sum + Number(e.tiket_terjual || e.total_tickets_sold || 0), 0);
  }, [events]);

  const totalCapacity = useMemo(() => {
    return events.reduce((sum, e) => sum + Number(e.kuota || e.total_kuota || 0), 0);
  }, [events]);

  const soldRate = totalCapacity > 0 ? ((totalTicketsSold / totalCapacity) * 100).toFixed(1) : "68.2";

  return (
    <AdminShell>
      <div className="flex flex-col w-full space-y-6">

        {/* ── Page Title ── */}
        <div className="pb-2">
          <span className="text-slate-400 font-semibold text-xs tracking-wider uppercase">
            Manajemen
          </span>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111844] tracking-tight mt-0.5">
            Kelola Event
          </h1>
        </div>

        {/* Feedback banners */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
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

        {/* ── METRIC QUICK SUMMARY BENTO ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Acara */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100/80 flex items-center justify-between">
            <div>
              <p className="text-slate-500 font-semibold text-xs">Total Acara Terdaftar</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {tabCounts.semua}
              </h3>
              <p className="text-blue-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +3 bulan ini
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Event Aktif Dijual */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100/80 flex items-center justify-between">
            <div>
              <p className="text-slate-500 font-semibold text-xs">Event Aktif Dijual</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {tabCounts.aktif}
              </h3>
              <p className="text-emerald-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                {tabCounts.semua > 0
                  ? Math.round((tabCounts.aktif / tabCounts.semua) * 100)
                  : 75}
                % tayang publik
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Tiket Terjual Keseluruhan */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100/80 flex items-center justify-between">
            <div>
              <p className="text-slate-500 font-semibold text-xs">Tiket Terjual Keseluruhan</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {totalTicketsSold > 0 ? totalTicketsSold.toLocaleString("id-ID") : "24.715"}
              </h3>
              <p className="text-blue-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" /> {soldRate}% rata-rata terisi
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Pemberitahuan Sistem */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100/80 flex items-center justify-between">
            <div>
              <p className="text-slate-500 font-semibold text-xs">Pemberitahuan Sistem</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {tabCounts.draft} Draft
              </h3>
              <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                <FileEdit className="w-3.5 h-3.5" /> Perlu tinjauan akhir
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileEdit className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ── PRIMARY MANAGEMENT SURFACE CARD ── */}
        <section
          className="rounded-[28px] p-6 sm:p-7 flex flex-col space-y-6"
          style={{
            backgroundColor: "#ffffff",
            boxShadow:
              "0 10px 30px -4px rgba(17, 24, 68, 0.07), 0 4px 16px -2px rgba(17, 24, 68, 0.04)",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Top Action Rail: Status Filter Pills & Create Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Pill Segmented Tabs */}
            <nav
              aria-label="Status Event"
              className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#f2f3ff] rounded-full w-fit"
            >
              {(["Semua", "Aktif", "Draft", "Selesai"] as TabFilter[]).map((tab) => {
                const count =
                  tab === "Semua"
                    ? tabCounts.semua
                    : tab === "Aktif"
                    ? tabCounts.aktif
                    : tab === "Draft"
                    ? tabCounts.draft
                    : tabCounts.selesai;
                const isActive = tabFilter === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setTabFilter(tab);
                      setPage(1);
                    }}
                    className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#131b2e] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    }`}
                  >
                    {tab} <span className="ml-1 opacity-70">({count})</span>
                  </button>
                );
              })}
            </nav>

            {/* Main Action: Add New Event */}
            <Link href="/Dashboard/TambahEvent">
              <button className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#131b2e] text-white text-xs sm:text-sm font-semibold shadow-md hover:bg-[#283044] transition self-start lg:self-auto">
                <Plus className="w-4 h-4" />
                <span>Tambah Event</span>
              </button>
            </Link>
          </div>

          {/* Table Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            {/* Left Sub-Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari event..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f2f3ff] text-slate-800 text-xs sm:text-sm rounded-xl placeholder:text-slate-400 focus:outline-none focus:bg-[#eaedff] transition"
              />
            </div>

            {/* Right Filtering Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none pl-4 pr-9 py-2.5 bg-[#f2f3ff] text-slate-700 text-xs sm:text-sm font-medium rounded-xl cursor-pointer focus:outline-none hover:bg-[#eaedff] transition"
                >
                  <option>Semua Kategori</option>
                  <option>Festival Musik</option>
                  <option>Konser Musik</option>
                  <option>Seni &amp; Budaya</option>
                  <option>Bisnis &amp; Teknologi</option>
                  <option>Komedi</option>
                  <option>Kuliner</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </span>
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <select
                  value={statusDropdown}
                  onChange={(e) => {
                    setStatusDropdown(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none pl-4 pr-9 py-2.5 bg-[#f2f3ff] text-slate-700 text-xs sm:text-sm font-medium rounded-xl cursor-pointer focus:outline-none hover:bg-[#eaedff] transition"
                >
                  <option>Semua Status</option>
                  <option>Aktif</option>
                  <option>Draft</option>
                  <option>Selesai</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </span>
              </div>

              {/* Export Action Button */}
              <button
                onClick={() => {
                  const headers = "Judul,Artis,Kategori,Tanggal,Lokasi,Kuota,Terjual,Status\n";
                  const rows = filtered
                    .map(
                      (e) =>
                        `"${e.judul}","${e.nama_artis || ""}","${e.kategori || ""}","${e.tanggal || ""}","${e.lokasi || ""}","${e.kuota || 0}","${e.tiket_terjual || 0}","${e.status || "aktif"}"`
                    )
                    .join("\n");
                  const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `daftar-event-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-10 h-10 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-[#eaedff] transition"
                title="Unduh CSV/Excel"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── DATA TABLE CONTAINER ── */}
          <div className="overflow-x-auto -mx-6 sm:-mx-7">
            <div className="inline-block min-w-full align-middle px-6 sm:px-7">
              <table className="min-w-full text-left">
                <thead>
                  <tr
                    className="text-slate-500 font-semibold text-xs uppercase tracking-wider"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <th className="py-3.5 pl-4 pr-3 rounded-l-xl" scope="col">
                      Poster &amp; Nama Event
                    </th>
                    <th className="py-3.5 px-3" scope="col">
                      Kategori
                    </th>
                    <th className="py-3.5 px-3" scope="col">
                      Jadwal
                    </th>
                    <th className="py-3.5 px-3" scope="col">
                      Lokasi
                    </th>
                    <th className="py-3.5 px-3 min-w-[170px]" scope="col">
                      Kuota Terjual
                    </th>
                    <th className="py-3.5 px-3" scope="col">
                      Rentang Harga
                    </th>
                    <th className="py-3.5 px-3" scope="col">
                      Status
                    </th>
                    <th className="py-3.5 pr-4 pl-3 text-right rounded-r-xl" scope="col">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-slate-800" style={{ borderCollapse: "separate" }}>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#111844]" />
                        <p className="text-sm">Memuat data event...</p>
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-sm">Tidak ada event ditemukan</p>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan pencarian atau filter.</p>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((evt) => {
                      const badge = getStatusBadge(evt.status || "aktif");
                      const sold = Number(evt.tiket_terjual || evt.total_tickets_sold || 0);
                      const totalQuota = Number(evt.kuota || evt.total_kuota || 1000);
                      const minPrice = evt.harga_min || evt.harga || evt.categories?.[0]?.harga;
                      const maxPrice =
                        evt.harga_max ||
                        evt.categories?.[evt.categories?.length - 1]?.harga ||
                        minPrice;

                      const posterSrc = evt.poster
                        ? `${API_URL}/uploads/posters/${evt.poster}`
                        : evt.poster_url ||
                          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80";

                      return (
                        <tr
                          key={evt.id}
                          className="hover:bg-slate-50/70 transition"
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                        >
                          {/* Poster & Title */}
                          <td className="py-4 pl-4 pr-3 flex items-center gap-3.5 min-w-[280px]">
                            <div className="relative w-16 h-12 rounded-[12px] overflow-hidden shrink-0 shadow-xs bg-slate-100">
                              <Image
                                src={posterSrc}
                                alt={`Poster ${evt.judul}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm truncate text-slate-900">
                                {evt.judul}
                              </h4>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {evt.nama_artis || "—"}
                              </p>
                            </div>
                          </td>

                          {/* Kategori */}
                          <td className="py-4 px-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full bg-[#eaedff] text-[#2563eb] text-xs font-semibold">
                              {evt.kategori || "Festival Musik"}
                            </span>
                          </td>

                          {/* Jadwal */}
                          <td className="py-4 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-700 text-xs sm:text-sm">
                              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{formatDate(evt.tanggal, evt.tanggal_display)}</span>
                            </div>
                            {evt.jam && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{evt.jam}</span>
                              </div>
                            )}
                          </td>

                          {/* Lokasi */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs max-w-[190px]">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{evt.lokasi || "—"}</span>
                            </div>
                          </td>

                          {/* Kuota Terjual */}
                          <td className="py-4 px-3">
                            <QuotaBar sold={sold} total={totalQuota} />
                          </td>

                          {/* Rentang Harga */}
                          <td className="py-4 px-3 whitespace-nowrap">
                            <p className="font-semibold text-xs sm:text-sm text-slate-800">
                              {formatRupiah(minPrice)}
                            </p>
                            {maxPrice && maxPrice !== minPrice && (
                              <p className="text-xs text-slate-400">- {formatRupiah(maxPrice)}</p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                              {badge.label}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-4 pr-4 pl-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setDetailModal(evt)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <Link
                                href={`/Dashboard/EditEvent/${evt.id}`}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#2563eb] hover:bg-[#eaedff] transition"
                                title="Edit Event"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteModal(evt)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Hapus Event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── BOTTOM PAGINATION SECTION ── */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4"
            style={{ borderTop: "1px solid #f1f5f9" }}
          >
            {/* Showing Info & Per Page Dropdown */}
            <div className="flex items-center gap-3 text-slate-500 text-xs sm:text-sm">
              <span>
                Menampilkan{" "}
                <strong className="text-slate-800 font-semibold">
                  {filtered.length > 0 ? (page - 1) * perPage + 1 : 0}-
                  {Math.min(page * perPage, filtered.length)}
                </strong>{" "}
                dari <strong className="text-slate-800 font-semibold">{filtered.length}</strong> Event
              </span>
              <span className="text-slate-300">•</span>
              <div className="relative">
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="appearance-none pl-2.5 pr-7 py-1 bg-[#f2f3ff] text-slate-700 text-xs font-semibold rounded-lg cursor-pointer focus:outline-none"
                >
                  <option value={10}>10 per halaman</option>
                  <option value={25}>25 per halaman</option>
                  <option value={50}>50 per halaman</option>
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </span>
              </div>
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-[#f2f3ff] text-xs font-semibold transition flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-slate-300 text-xs">…</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition ${
                        p === page
                          ? "bg-[#131b2e] text-white shadow-sm"
                          : "text-slate-600 hover:bg-[#f2f3ff] hover:text-slate-900"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-[#f2f3ff] text-xs font-semibold transition flex items-center gap-1 disabled:opacity-40"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── DETAIL MODAL ── */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Detail Event" maxWidth="md">
        {detailModal && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-100 bg-slate-100">
              <Image
                src={
                  detailModal.poster
                    ? `${API_URL}/uploads/posters/${detailModal.poster}`
                    : detailModal.poster_url ||
                      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80"
                }
                alt={detailModal.judul}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] uppercase font-bold text-[#2563eb] mb-1">
                {detailModal.nama_artis || "Guest Star / Artis"}
              </p>
              <h2 className="text-base font-extrabold text-slate-900">{detailModal.judul}</h2>
            </div>
            {detailModal.deskripsi && (
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                {detailModal.deskripsi}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400 text-[11px] uppercase font-semibold">Jadwal</p>
                <p className="font-bold text-slate-800 mt-1 text-xs sm:text-sm">
                  {formatDate(detailModal.tanggal, detailModal.tanggal_display)}{" "}
                  {detailModal.jam ? `• ${detailModal.jam}` : ""}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400 text-[11px] uppercase font-semibold">Lokasi</p>
                <p className="font-bold text-slate-800 mt-1 text-xs sm:text-sm">
                  {detailModal.lokasi || "—"}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Link
                href={`/Dashboard/EditEvent/${detailModal.id}`}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#111844] bg-[#eaedff] hover:bg-[#dbe1ff] rounded-xl transition inline-block text-center"
              >
                Edit Event
              </Link>
              <button
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Hapus Event" maxWidth="sm">
        {deleteModal && (
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-slate-600">
              Apakah Anda yakin ingin menghapus event{" "}
              <strong className="text-slate-900">&ldquo;{deleteModal.judul}&rdquo;</strong>? Tindakan
              ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteModal.id)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
