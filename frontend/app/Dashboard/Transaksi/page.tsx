"use client";

import { useEffect, useState, useMemo } from "react";
import AdminShell from "@/components/AdminShell";
import Modal from "@/components/Modal";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Receipt,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Inbox,
  ExternalLink,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Ticket,
  DollarSign,
  TrendingUp,
  Download,
  ChevronRight,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface TicketCategory {
  id: number | string;
  event_id: number | string;
  nama_kategori: string;
  harga: number;
  stok?: number;
}

interface EventSummary {
  id: number | string;
  judul: string;
  deskripsi?: string;
  tanggal?: string;
  jam?: string;
  lokasi?: string;
  poster?: string | null;
  status?: string;
  total_orders: number;
  total_tickets_sold: number;
  total_revenue: number;
  buyers_count: number;
  categories?: TicketCategory[];
}

interface BuyerOrder {
  id: number | string;
  order_id?: number | string;
  event_id?: number | string;
  judul?: string;
  nama: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  id_number?: string;
  date_birth?: string;
  nama_kategori?: string;
  jumlah_tiket: number;
  total_harga: number;
  status: string;
  created_at: string;
  bukti_pembayaran?: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function TransaksiPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedTransaction, setSelectedTransaction] = useState<BuyerOrder | null>(null);

  // Helper Poster URL
  const getPosterUrl = (poster?: string | null) => {
    if (!poster) return null;
    if (poster.startsWith("http") || poster.startsWith("data:")) return poster;
    return `${API_URL}/uploads/posters/${poster}`;
  };

  // 1. Fetch Daftar Event dan Ringkasan Transaksi
  const fetchEventsSummary = async () => {
    setLoadingEvents(true);
    setError("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      // Coba ambil dari endpoint backend admin events-summary
      let dataLoaded = false;
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/orders/admin/events-summary`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setEvents(data);
              dataLoaded = true;
            }
          }
        } catch {
          // Fallback ke cara gabungan jika endpoint belum siap
        }
      }

      // Fallback: Ambil data events dan payments/orders manual
      if (!dataLoaded) {
        const eventsRes = await fetch(`${API_URL}/api/events`);
        const rawEvents = eventsRes.ok ? await eventsRes.json() : [];

        let rawOrders: any[] = [];
        if (token) {
          try {
            const ordRes = await fetch(`${API_URL}/api/orders/admin/all`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (ordRes.ok) rawOrders = await ordRes.json();
          } catch {
            rawOrders = [];
          }
        }

        const formatted = (Array.isArray(rawEvents) ? rawEvents : []).map((ev: any) => {
          const eventOrders = rawOrders.filter(
            (o: any) => String(o.event_id) === String(ev.id) || String(o.judul) === String(ev.judul)
          );
          const totalTickets = eventOrders.reduce((acc, curr) => acc + Number(curr.jumlah_tiket || 1), 0);
          const totalRev = eventOrders.reduce((acc, curr) => acc + Number(curr.total_harga || 0), 0);

          return {
            id: ev.id,
            judul: ev.judul || "Event Konser",
            deskripsi: ev.deskripsi,
            tanggal: ev.tanggal,
            jam: ev.jam,
            lokasi: ev.lokasi,
            poster: ev.poster,
            status: ev.status || "aktif",
            total_orders: eventOrders.length,
            total_tickets_sold: totalTickets,
            total_revenue: totalRev,
            buyers_count: eventOrders.length,
            categories: ev.ticket_categories || []
          };
        });

        setEvents(formatted);
      }
    } catch (err: any) {
      console.error("Gagal memuat transaksi per event:", err);
      setError("Gagal memuat data transaksi dari server.");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEventsSummary();
  }, []);

  // 2. Fetch Pembeli untuk Event Terpilih
  const handleSelectEvent = async (event: EventSummary) => {
    setSelectedEvent(event);
    setSearchQuery("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setLoadingOrders(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      let ordersData: BuyerOrder[] = [];
      if (token) {
        const res = await fetch(`${API_URL}/api/orders/admin/all?event_id=${event.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            ordersData = data;
          }
        }
      }

      // Jika data order masih kosong dari backend, sediakan fallback interaktif agar admin dapat melihat format buyer
      if (ordersData.length === 0 && event.total_orders === 0) {
        // Biarkan kosong agar menampilkan status belum ada pembeli
        setOrders([]);
      } else {
        setOrders(ordersData);
      }
    } catch (err) {
      console.error("Gagal mengambil data pembeli:", err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Filter Event di Tampilan Depan
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (ev.judul || "").toLowerCase().includes(q) ||
        (ev.lokasi || "").toLowerCase().includes(q) ||
        (ev.tanggal || "").toLowerCase().includes(q);

      const status = (ev.status || "aktif").toLowerCase();
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Aktif" && status === "aktif") ||
        (statusFilter === "Selesai" && ["selesai", "inactive", "nonaktif"].includes(status));

      return matchesSearch && matchesStatus;
    });
  }, [events, searchQuery, statusFilter]);

  // Filter Pembeli di Tampilan Detail Event
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const q = searchQuery.toLowerCase();
      const idStr = String(ord.id || ord.order_id || "").toLowerCase();
      const nameStr = (ord.nama || "").toLowerCase();
      const emailStr = (ord.email || "").toLowerCase();
      const phoneStr = (ord.phone || "").toLowerCase();
      const nikStr = (ord.id_number || "").toLowerCase();
      const matchesSearch =
        idStr.includes(q) ||
        nameStr.includes(q) ||
        emailStr.includes(q) ||
        phoneStr.includes(q) ||
        nikStr.includes(q);

      const catStr = (ord.nama_kategori || "").toLowerCase();
      const matchesCategory =
        categoryFilter === "All" || catStr === categoryFilter.toLowerCase();

      const st = (ord.status || "").toLowerCase();
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Paid" && ["paid", "berhasil", "sukses", "lunas"].includes(st)) ||
        (statusFilter === "Pending" && ["pending", "menunggu"].includes(st));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [orders, searchQuery, categoryFilter, statusFilter]);

  // Statistik Keseluruhan
  const overallStats = useMemo(() => {
    const totalEvents = events.length;
    const totalSold = events.reduce((acc, curr) => acc + curr.total_tickets_sold, 0);
    const totalRev = events.reduce((acc, curr) => acc + curr.total_revenue, 0);
    const totalOrders = events.reduce((acc, curr) => acc + curr.total_orders, 0);
    return { totalEvents, totalSold, totalRev, totalOrders };
  }, [events]);

  // Ekspor CSV Sederhana
  const handleExportCSV = () => {
    if (!selectedEvent || filteredOrders.length === 0) return;

    const headers = ["ID Order", "Nama Pembeli", "NIK", "Email", "WhatsApp", "Kategori Tiket", "Jumlah", "Total Harga", "Status", "Tanggal"];
    const rows = filteredOrders.map((o) => [
      `#${o.id || o.order_id}`,
      `"${o.nama}"`,
      `'${o.id_number || "-"}'`,
      o.email,
      `'${o.phone}'`,
      `"${o.nama_kategori || "Reguler"}"`,
      o.jumlah_tiket,
      o.total_harga,
      o.status,
      o.created_at?.slice(0, 19) || "-"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Pembeli_${selectedEvent.judul.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminShell>
      <div className="space-y-6">

        {/* ============================================================== */}
        {/* TAMPILAN 1: DAFTAR EVENT TRANSAKSI (DEFAULT VIEW)             */}
        {/* ============================================================== */}
        {!selectedEvent && (
          <div className="space-y-6">
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Manajemen Transaksi & Penjualan
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pilih event konser di bawah untuk melihat rincian pembeli tiket dan audit transaksi.
                </p>
              </div>

              <button
                onClick={fetchEventsSummary}
                disabled={loadingEvents}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition shadow-sm self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${loadingEvents ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
                Segarkan Data
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Event</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5">{formatNumber(overallStats.totalEvents)}</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiket Terjual</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5">{formatNumber(overallStats.totalSold)} <span className="text-xs font-normal text-slate-400">tiket</span></p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Omset</p>
                  <p className="text-base sm:text-xl font-extrabold text-emerald-600 mt-0.5 truncate">{formatCurrency(overallStats.totalRev)}</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Transaksi</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5">{formatNumber(overallStats.totalOrders)} <span className="text-xs font-normal text-slate-400">order</span></p>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul konser, nama artis, atau lokasi..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs sm:text-sm bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition shadow-sm"
                >
                  <option value="All">Semua Status Event</option>
                  <option value="Aktif">Event Aktif</option>
                  <option value="Selesai">Event Selesai</option>
                </select>
              </div>
            </div>

            {/* Event Cards Grid */}
            {loadingEvents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <div key={k} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Event tidak ditemukan</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEvents.map((ev, index) => {
                  const posterSrc = getPosterUrl(ev.poster);
                  const isFinished = ["selesai", "inactive", "nonaktif"].includes((ev.status || "").toLowerCase());

                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => handleSelectEvent(ev)}
                      className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden flex flex-col cursor-pointer"
                    >
                      {/* Image Thumbnail Banner */}
                      <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                        {posterSrc ? (
                          <Image
                            src={posterSrc}
                            alt={ev.judul}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900/90">
                            <Ticket className="w-10 h-10 mb-1 opacity-40" />
                            <span className="text-xs">No Poster</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                            isFinished
                              ? "bg-slate-800/80 text-slate-200 border border-slate-700"
                              : "bg-emerald-500/90 text-white"
                          }`}>
                            {isFinished ? "Selesai" : "Aktif"}
                          </span>
                        </div>

                        {/* Title & Info on Poster */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h3 className="font-bold text-base line-clamp-1 group-hover:text-indigo-200 transition-colors">
                            {ev.judul}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
                            <span className="truncate">{ev.lokasi || "Lokasi belum ditentukan"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Sales Metrics */}
                      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tiket Terjual</span>
                            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                              {formatNumber(ev.total_tickets_sold)} <span className="text-[11px] font-normal text-slate-500">tiket</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pembeli</span>
                            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                              {formatNumber(ev.buyers_count)} <span className="text-[11px] font-normal text-slate-500">orang</span>
                            </span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-200/60 mt-1 flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pendapatan:</span>
                            <span className="text-xs sm:text-sm font-extrabold text-indigo-700 font-mono">
                              {formatCurrency(ev.total_revenue)}
                            </span>
                          </div>
                        </div>

                        {/* Click CTA Button */}
                        <div className="flex items-center justify-between pt-1 text-indigo-600 font-semibold text-xs sm:text-sm group-hover:text-indigo-700">
                          <span>Lihat Daftar Pembeli ({ev.total_orders})</span>
                          <div className="w-7 h-7 rounded-full bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAMPILAN 2: DAFTAR PEMBELI EVENT TERPILIH (DRILL-DOWN VIEW)    */}
        {/* ============================================================== */}
        {selectedEvent && (
          <div className="space-y-6">
            {/* Top Navigation Back */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedEvent(null)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600" />
                Kembali ke Semua Event
              </button>

              <button
                onClick={handleExportCSV}
                disabled={filteredOrders.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm transition shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Ekspor Data Pembeli (CSV)
              </button>
            </div>

            {/* Event Summary Banner Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm overflow-hidden flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-sm border border-slate-200">
                  {getPosterUrl(selectedEvent.poster) ? (
                    <Image
                      src={getPosterUrl(selectedEvent.poster)!}
                      alt={selectedEvent.judul}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Ticket className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[11px] mb-1.5 border border-indigo-200">
                    <Sparkles className="w-3 h-3 text-indigo-600" /> Event Terpilih
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    {selectedEvent.judul}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {selectedEvent.tanggal || "Tanggal Konser"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedEvent.lokasi || "Lokasi Venue"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Badges */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tiket Terjual</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">{formatNumber(selectedEvent.total_tickets_sold)}</span>
                </div>
                <div className="text-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Pembeli</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">{formatNumber(selectedEvent.total_orders)}</span>
                </div>
                <div className="text-center px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">Total Omset</span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono">{formatCurrency(selectedEvent.total_revenue)}</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar untuk Pembeli */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pembeli, email, nomor WhatsApp, NIK, ID..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs sm:text-sm bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition shadow-sm"
                >
                  <option value="All">Semua Status Bayar</option>
                  <option value="Paid">Lunas / Berhasil</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Table Pembeli */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-100 bg-slate-50/70">
                      <th className="text-left py-3.5 px-5">ID Order</th>
                      <th className="text-left py-3.5 px-4">Nama Pembeli</th>
                      <th className="text-left py-3.5 px-4">Kontak (Email / WA)</th>
                      <th className="text-left py-3.5 px-4">Kategori & Qty</th>
                      <th className="text-left py-3.5 px-4">Total Bayar</th>
                      <th className="text-left py-3.5 px-4">Status</th>
                      <th className="text-left py-3.5 px-4">Waktu Transaksi</th>
                      <th className="text-right py-3.5 px-5">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {filteredOrders.map((ord, i) => {
                        const isPaid = ["paid", "berhasil", "sukses", "lunas"].includes((ord.status || "").toLowerCase());
                        const buyerName = ord.nama || `${ord.first_name || ""} ${ord.last_name || ""}`.trim() || "Pembeli";
                        const initials = buyerName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();

                        const waClean = (ord.phone || "").replace(/\D/g, "");
                        const waLink = waClean.startsWith("0") ? `62${waClean.slice(1)}` : waClean;

                        return (
                          <motion.tr
                            key={ord.id || ord.order_id || i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="hover:bg-indigo-50/30 transition-colors"
                          >
                            {/* ID Order */}
                            <td className="py-4 px-5 font-mono font-bold text-indigo-700">
                              #{ord.id || ord.order_id}
                            </td>

                            {/* Nama Pembeli */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                                  {initials || "U"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 leading-snug truncate">{buyerName}</p>
                                  <p className="text-[11px] text-slate-400 font-mono">NIK: {ord.id_number || "—"}</p>
                                </div>
                              </div>
                            </td>

                            {/* Kontak (Email / WA) */}
                            <td className="py-4 px-4 text-slate-600">
                              <div className="flex flex-col gap-0.5">
                                <span className="flex items-center gap-1.5 truncate max-w-[200px] text-xs">
                                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {ord.email || "—"}
                                </span>
                                {ord.phone && (
                                  <a
                                    href={`https://wa.me/${waLink}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold transition"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                    {ord.phone}
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Kategori Tiket */}
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                                {ord.jumlah_tiket}x {ord.nama_kategori || "Reguler"}
                              </span>
                            </td>

                            {/* Total Bayar */}
                            <td className="py-4 px-4 font-mono font-extrabold text-slate-900 text-xs sm:text-sm">
                              {formatCurrency(ord.total_harga || 0)}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {isPaid ? "Lunas" : "Pending"}
                              </span>
                            </td>

                            {/* Tanggal */}
                            <td className="py-4 px-4 text-slate-500 font-mono text-[11px] sm:text-xs">
                              {ord.created_at ? new Date(ord.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              }) : "—"}
                            </td>

                            {/* Aksi */}
                            <td className="py-4 px-5 text-right">
                              <button
                                onClick={() => setSelectedTransaction(ord)}
                                className="p-2 rounded-xl text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 transition"
                                title="Lihat Rincian Pembeli"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>

                {loadingOrders && (
                  <div className="py-16 text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Memuat data pembeli tiket...</p>
                  </div>
                )}

                {!loadingOrders && filteredOrders.length === 0 && (
                  <div className="py-16 text-center">
                    <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-base font-bold text-slate-700">Belum Ada Pembelian Tiket</p>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1">
                      Data pembeli akan otomatis muncul setelah penonton melakukan reservasi atau pembayaran tiket pada event ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL DETAIL RINCIAN PEMBELI & TRANSAKSI                      */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title={`Rincian Transaksi #${selectedTransaction?.id || selectedTransaction?.order_id || ""}`}
        maxWidth="lg"
      >
        {selectedTransaction && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Status Header */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Status Pembayaran</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                  Transaksi Terverifikasi
                </span>
              </div>
              <span className={`font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 border ${
                ["paid","berhasil","sukses","lunas"].includes((selectedTransaction.status||"").toLowerCase())
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedTransaction.status || "Lunas"}
              </span>
            </div>

            {/* Buyer Identity Grid */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Informasi Pemesan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Nama Lengkap</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedTransaction.nama || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nomor Identitas (NIK)</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{selectedTransaction.id_number || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email Konfirmasi</span>
                  <span className="font-semibold text-slate-800">{selectedTransaction.email || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nomor WhatsApp</span>
                  <span className="font-semibold text-slate-800">{selectedTransaction.phone || "—"}</span>
                </div>
              </div>
            </div>

            {/* Ticket & Event Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <Ticket className="w-4 h-4 text-indigo-600" /> Rincian Tiket Konser
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Kategori Tiket</span>
                  <span className="font-bold text-indigo-700 text-sm">{selectedTransaction.nama_kategori || "Reguler"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Jumlah Tiket</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedTransaction.jumlah_tiket} Tiket</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Waktu Pemesanan</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {selectedTransaction.created_at ? new Date(selectedTransaction.created_at).toLocaleString("id-ID") : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Tagihan</span>
                  <span className="font-extrabold text-emerald-700 text-base font-mono">
                    {formatCurrency(selectedTransaction.total_harga || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bukti Pembayaran jika ada */}
            {selectedTransaction.bukti_pembayaran && (
              <a
                href={`${API_URL}/uploads/payments/${selectedTransaction.bukti_pembayaran}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-xs sm:text-sm shadow-sm"
              >
                <ExternalLink className="w-4 h-4" /> Buka Lampiran Bukti Transfer
              </a>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              {selectedTransaction.phone ? (
                <a
                  href={`https://wa.me/${selectedTransaction.phone.replace(/\D/g, "").replace(/^0/, "62")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl transition border border-emerald-200"
                >
                  <Phone className="w-4 h-4" /> Hubungi via WhatsApp
                </a>
              ) : <div />}

              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
