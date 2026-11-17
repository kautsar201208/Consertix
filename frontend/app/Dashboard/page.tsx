"use client";

import { useEffect, useState, useMemo } from "react";
import AdminShell from "@/components/AdminShell";
import Link from "next/link";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Search,
  ChevronDown,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Ticket,
  Users,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStats {
  totalUser?: number;
  totalEvent?: number;
  totalKategori?: number;
  totalOrder?: number;
  totalPayment?: number;
  totalPendapatan?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const MONTHS_DATA = [
  { name: "Jan", tickets: "820 Tiket", height: 80, rev: "Rp85 Jt", sold: 6540 },
  { name: "Feb", tickets: "950 Tiket", height: 95, rev: "Rp98 Jt", sold: 7210 },
  { name: "Mar", tickets: "1.100 Tiket", height: 70, rev: "Rp110 Jt", sold: 8350 },
  { name: "Apr", tickets: "1.250 Tiket", height: 35, rev: "Rp125 Jt", sold: 9178 },
  { name: "Mei", tickets: "1.050 Tiket", height: 85, rev: "Rp105 Jt", sold: 8100 },
  { name: "Jun", tickets: "1.300 Tiket", height: 50, rev: "Rp132 Jt", sold: 9600 },
  { name: "Jul", tickets: "920 Tiket", height: 90, rev: "Rp94 Jt", sold: 7400 },
  { name: "Agu", tickets: "1.180 Tiket", height: 60, rev: "Rp120 Jt", sold: 8900 },
  { name: "Sep", tickets: "1.080 Tiket", height: 75, rev: "Rp112 Jt", sold: 8400 },
  { name: "Okt", tickets: "1.220 Tiket", height: 55, rev: "Rp124 Jt", sold: 9050 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ nama?: string; role?: string } | null>(null);

  // Filter & tab states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(3); // April by default
  const [activeTab, setActiveTab] = useState<"transaksi" | "user">("transaksi");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          setAdminUser(JSON.parse(saved));
        } catch {}
      }
    }

    async function loadDashboard() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      try {
        const [statsRes, eventsRes, paymentsRes, ordersRes] = await Promise.all([
          token
            ? fetch(`${API_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve(null),
          fetch(`${API_URL}/api/events`),
          token
            ? fetch(`${API_URL}/api/payments`, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve(null),
          token
            ? fetch(`${API_URL}/api/orders/admin/all`, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve(null),
        ]);

        if (statsRes && statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (eventsRes && eventsRes.ok) {
          const d = await eventsRes.json();
          if (Array.isArray(d)) setEvents(d);
        }
        if (paymentsRes && paymentsRes.ok) {
          const d = await paymentsRes.json();
          if (Array.isArray(d)) setPayments(d);
        }
        if (ordersRes && ordersRes.ok) {
          const d = await ordersRes.json();
          if (Array.isArray(d)) setOrders(d);
        }
      } catch (err) {
        console.error("Dashboard data load notice:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const totalEventCount = stats?.totalEvent ?? (events.length || 24);
  const totalOrderCount = stats?.totalOrder ?? (orders.length || payments.length || 9178);
  const totalRevenueVal = stats?.totalPendapatan ?? 125000000;

  const currentMonthData = MONTHS_DATA[selectedMonthIdx] || MONTHS_DATA[3];

  // Activities list (either from real orders/payments or design sample)
  const activities = useMemo(() => {
    if (activeTab === "transaksi") {
      if (orders.length > 0) {
        return orders.slice(0, 5).map((ord, i) => {
          const name = ord.nama || `${ord.first_name || ""} ${ord.last_name || ""}`.trim() || "Pelanggan";
          const eventTitle = ord.judul || "Tiket Konser";
          const qty = ord.jumlah_tiket || 1;
          const times = ["2m lalu", "14m lalu", "38m lalu", "1j lalu", "2j lalu"];
          return {
            id: ord.id || i,
            name,
            action: `Beli ${qty} tiket ${eventTitle}`,
            time: times[i] || "Baru saja",
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=111844,1e2868`,
          };
        });
      }

      return [
        {
          id: 1,
          name: "Sarah Salsabila",
          action: "Beli 2 tiket Festival Musik Bali",
          time: "2m lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        },
        {
          id: 2,
          name: "Dimas Arya Pratama",
          action: "Beli 1 VIP Pit Soundfest 2025",
          time: "14m lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dimas",
        },
        {
          id: 3,
          name: "Alika Putri",
          action: "Beli 3 tiket Stand Up Comedy",
          time: "38m lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alika",
        },
        {
          id: 4,
          name: "Rian Pratama",
          action: "Beli 2 tiket Startup Summit",
          time: "1j lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rian",
        },
        {
          id: 5,
          name: "Nabila Zahra",
          action: "Beli 1 Presale Soundfest",
          time: "2j lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nabila",
        },
      ];
    } else {
      return [
        {
          id: 101,
          name: "Fauzan Syahrir",
          action: "Mendaftar akun member baru",
          time: "5m lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fauzan",
        },
        {
          id: 102,
          name: "Jessica Lauren",
          action: "Verifikasi email & nomor WhatsApp",
          time: "22m lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
        },
        {
          id: 103,
          name: "Budi Setiawan",
          action: "Mendaftar akun member baru",
          time: "45m lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
        },
        {
          id: 104,
          name: "Clara Angelica",
          action: "Update profil & foto member",
          time: "2j lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Clara",
        },
        {
          id: 105,
          name: "Kevin Sanjaya",
          action: "Mendaftar akun member baru",
          time: "3j lalu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin",
        },
      ];
    }
  }, [activeTab, orders]);

  // Quota Monitoring Cards (either from real events or design template)
  const quotaCards = useMemo(() => {
    if (events.length >= 3) {
      return events.slice(0, 3).map((ev, i) => {
        const title = ev.judul || "Konser Musik";
        const date = ev.tanggal || "Segera Hadir";
        const total = 2500;
        const sold = Math.min(total, (i + 1) * 650);
        const percent = Math.round((sold / total) * 100);
        const days = 10 + i * 8;
        const color = percent > 80 ? "rose" : percent > 40 ? "blue" : "amber";

        return {
          id: ev.id,
          title,
          date,
          badge: `${days} Hari lagi`,
          badgeColor: color,
          percent,
          sold: `${formatNumber(sold)} / ${formatNumber(total)} Tiket`,
        };
      });
    }

    return [
      {
        id: 1,
        title: "Festival Musik Bali 2026",
        date: "14 - 16 Mar 2026",
        badge: "12 Hari lagi",
        badgeColor: "blue",
        percent: 45,
        sold: "1.350 / 3.000 Tiket",
      },
      {
        id: 2,
        title: "Stand Up Comedy Night",
        date: "28 Apr 2026",
        badge: "28 Hari lagi",
        badgeColor: "amber",
        percent: 13,
        sold: "65 / 500 Tiket",
      },
      {
        id: 3,
        title: "Startup Summit 2026",
        date: "05 Mei 2026",
        badge: "3 Hari lagi (Hampir Habis)",
        badgeColor: "rose",
        percent: 90,
        sold: "1.800 / 2.000 Tiket",
      },
    ];
  }, [events]);

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 w-full">
        {/* GRID AREA: Dua Kolom (Area Konten Kiri 2/3 + Panel Kanan 1/3) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI (xl:col-span-8) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* BARIS ATAS: KARTU BESAR "Ringkasan Penjualan" + 2 KARTU KECIL */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* KARTU BESAR "Ringkasan Penjualan" (md:col-span-8) */}
              <div className="md:col-span-8 bg-white text-slate-800 rounded-[28px] p-6 lg:p-7 shadow-[0_12px_36px_-6px_rgba(17,24,68,0.06)] border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-5 z-10">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      Performa Tiket
                    </p>
                    <h2 className="text-xl font-bold text-[#111844]">Ringkasan Penjualan</h2>
                  </div>
                  <div className="relative">
                    <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold px-3.5 py-2 rounded-full text-[#111844] border border-slate-200/60 transition-colors">
                      <span>Bulanan</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Interactive SVG Chart */}
                <div className="relative w-full h-44 my-2 z-10">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 160">
                    <defs>
                      <linearGradient id="chartGradientLight" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGradBlue" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#111844" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                    <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="500" y1="30" y2="30" />
                    <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="500" y1="80" y2="80" />
                    <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="500" y1="130" y2="130" />
                    <path
                      d="M 15 130 Q 50 110, 85 95 T 155 70 T 225 35 T 295 85 T 365 50 T 435 90 T 485 60 L 485 155 L 15 155 Z"
                      fill="url(#chartGradientLight)"
                    />
                    <path
                      d="M 15 130 Q 50 110, 85 95 T 155 70 T 225 35 T 295 85 T 365 50 T 435 90 T 485 60"
                      fill="none"
                      stroke="url(#lineGradBlue)"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                    <circle cx="85" cy="95" fill="#3b82f6" opacity="0.7" r="3.5" />
                    <circle cx="155" cy="70" fill="#3b82f6" opacity="0.7" r="3.5" />
                    <circle cx="295" cy="85" fill="#3b82f6" opacity="0.7" r="3.5" />
                    <circle cx="365" cy="50" fill="#3b82f6" opacity="0.7" r="3.5" />
                    <circle cx="435" cy="90" fill="#3b82f6" opacity="0.7" r="3.5" />
                    <line stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1.5" x1="225" x2="225" y1="35" y2="155" />
                    <circle className="filter drop-shadow-[0_0_6px_rgba(17,24,68,0.3)]" cx="225" cy="35" fill="#111844" r="6" />
                    <circle cx="225" cy="35" fill="#ffffff" r="2.5" />
                  </svg>

                  {/* Active Tooltip Pill */}
                  <div className="absolute left-[45%] top-0 -translate-x-1/2 -translate-y-2 bg-[#111844] text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span>{currentMonthData.tickets}</span>
                  </div>
                </div>

                {/* Months Bar */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 pt-2 pb-4 border-b border-slate-100 z-10 overflow-x-auto">
                  {MONTHS_DATA.map((m, idx) => {
                    const isSelected = idx === selectedMonthIdx;
                    return (
                      <span
                        key={m.name}
                        onClick={() => setSelectedMonthIdx(idx)}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "px-2.5 py-0.5 rounded-full bg-[#111844] text-white font-bold shadow-sm"
                            : "hover:text-[#111844]"
                        }`}
                      >
                        {m.name}
                      </span>
                    );
                  })}
                </div>

                {/* 3 Stats Bottom Row */}
                <div className="grid grid-cols-3 gap-2 pt-4 items-center z-10">
                  <div className="text-left">
                    <p className="text-[11px] text-slate-400 font-medium">Total Pendapatan</p>
                    <p className="text-base lg:text-lg font-bold text-[#111844] tracking-tight">
                      {totalRevenueVal > 0 ? formatCurrency(totalRevenueVal) : currentMonthData.rev}
                    </p>
                  </div>
                  <div className="bg-blue-50/80 border border-blue-100 rounded-2xl py-2 px-3 text-center shadow-sm">
                    <p className="text-[11px] text-blue-700 font-semibold">Tiket Terjual</p>
                    <p className="text-xl lg:text-2xl font-extrabold text-[#111844] tracking-tight">
                      {totalOrderCount > 0 ? formatNumber(totalOrderCount) : formatNumber(currentMonthData.sold)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 font-medium">Target Penjualan</p>
                    <p className="text-base lg:text-lg font-bold text-[#111844] tracking-tight">
                      9.200
                    </p>
                  </div>
                </div>
              </div>

              {/* DUA KARTU KECIL DI SEBELAH KANAN (md:col-span-4) */}
              <div className="md:col-span-4 flex flex-col gap-6 justify-between">
                {/* Kartu: "Event Aktif" */}
                <Link
                  href="/Dashboard/DaftarEvent"
                  className="bg-white rounded-[28px] p-6 shadow-[0_12px_36px_-6px_rgba(17,24,68,0.06)] border border-slate-100 flex flex-col justify-between h-full group hover:shadow-[0_20px_40px_-8px_rgba(17,24,68,0.12)] transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status Acara
                    </span>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-[#111844] group-hover:text-white transition-colors">
                      <Ticket className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Event Aktif</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className="text-3xl font-extrabold text-[#111844] tracking-tight">
                        {totalEventCount}
                      </h3>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        +3 minggu ini
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>8 Konser Musik</span>
                    <span>•</span>
                    <span>16 Festival/Show</span>
                  </div>
                </Link>

                {/* Kartu: "Pendapatan Bulan Ini" */}
                <Link
                  href="/Dashboard/Transaksi"
                  className="bg-white rounded-[28px] p-6 shadow-[0_12px_36px_-6px_rgba(17,24,68,0.06)] border border-slate-100 flex flex-col justify-between h-full group hover:shadow-[0_20px_40px_-8px_rgba(17,24,68,0.12)] transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Perputaran Kas
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-100">
                      Bulan Ini
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pendapatan Bulan Ini</p>
                    <div className="mt-1">
                      <h3 className="text-2xl lg:text-3xl font-extrabold text-[#111844] tracking-tight">
                        Rp48,6 Jt
                      </h3>
                      <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+18.4% vs bulan lalu</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Lihat laporan detail</span>
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 group-hover:bg-[#111844] group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* BARIS TIGA KARTU DI BAWAH (Monitoring Kuota Event) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#111844]">Monitoring Kuota Event</h3>
                <Link
                  href="/Dashboard/DaftarEvent"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Kelola Semua Event</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {quotaCards.map((card) => {
                  const isAmber = card.badgeColor === "amber";
                  const isRose = card.badgeColor === "rose";
                  const barColor = isRose ? "bg-emerald-500" : isAmber ? "bg-amber-500" : "bg-blue-600";
                  const badgeClass = isRose
                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                    : isAmber
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : "bg-slate-100 text-slate-600";

                  return (
                    <Link
                      key={card.id}
                      href={`/Dashboard/DaftarEvent`}
                      className="bg-white rounded-[24px] p-5 shadow-[0_12px_36px_-6px_rgba(17,24,68,0.06)] border border-slate-100 flex flex-col justify-between hover:shadow-[0_20px_40px_-8px_rgba(17,24,68,0.12)] transition-all group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#111844] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <Ticket className="w-5 h-5" />
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                            {card.badge}
                          </span>
                        </div>
                        <h4 className="font-bold text-[#111844] text-sm leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {card.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{card.date}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                          <span className="text-slate-500">Kuota Terjual</span>
                          <span className="text-[#111844] font-bold">{card.percent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${card.percent}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">{card.sold}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (xl:col-span-4) */}
          <div className="xl:col-span-4 bg-white rounded-[36px] p-6 lg:p-7 shadow-[0_12px_36px_-6px_rgba(17,24,68,0.06)] border border-slate-100 flex flex-col gap-6">
            {/* BAGIAN 1: AKTIVITAS TERBARU */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#111844]">Aktivitas Terbaru</h3>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>

              {/* Tab Switcher: "Transaksi" dan "User" */}
              <div className="flex p-1 bg-slate-100 rounded-2xl mb-4">
                <button
                  onClick={() => setActiveTab("transaksi")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center ${
                    activeTab === "transaksi"
                      ? "bg-[#111844] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Transaksi
                </button>
                <button
                  onClick={() => setActiveTab("user")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center ${
                    activeTab === "user"
                      ? "bg-[#111844] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  User
                </button>
              </div>

              {/* Daftar 5 Item Aktivitas */}
              <div className="flex flex-col divide-y divide-slate-100">
                {activities.map((act) => (
                  <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <img
                      src={act.avatar}
                      alt={act.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-blue-50 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#111844] truncate">{act.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{act.action}</p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* GARIS PEMISAH */}
            <div className="w-full h-[1px] bg-slate-100" />

            {/* BAGIAN 2: SEBARAN EVENT */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#111844]">Sebaran Event</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Distribusi venue di Indonesia</p>
                </div>
                <Link
                  href="/Dashboard/DaftarEvent"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5"
                >
                  <span>Lihat</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Minimalist Vector Map */}
              <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 shadow-inner group">
                <svg
                  className="w-full h-full object-cover opacity-80"
                  fill="none"
                  viewBox="0 0 400 160"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect fill="#e8edf5" height="160" width="400" />
                  <path
                    d="M-20 40 C 60 20, 100 80, 180 60 C 260 40, 320 90, 420 50 L 420 180 L -20 180 Z"
                    fill="#dce4f2"
                  />
                  <path d="M0 70 L 400 90" stroke="#ffffff" strokeWidth="3" />
                  <path d="M80 0 L 140 160" stroke="#ffffff" strokeWidth="2.5" />
                  <path d="M260 0 L 220 160" stroke="#ffffff" strokeWidth="2.5" />
                  <path d="M120 80 L 300 30" stroke="#ffffff" strokeWidth="1.8" />
                  <circle cx="140" cy="110" fill="#d1fae5" opacity="0.6" r="28" />
                  <circle cx="290" cy="65" fill="#d1fae5" opacity="0.6" r="22" />
                </svg>

                {/* Pin Navy 1: Jakarta */}
                <div className="absolute top-8 left-24 group-hover:scale-110 transition-transform cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-5 h-5 rounded-full bg-[#111844]/20 animate-ping"></span>
                    <div className="w-6 h-6 rounded-full bg-[#111844] text-white flex items-center justify-center shadow-md border-2 border-white">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          clipRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          fillRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Pin Navy 2: Bali */}
                <div className="absolute bottom-6 right-28 group-hover:scale-110 transition-transform cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-[#111844] text-white flex items-center justify-center shadow-md border-2 border-white">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        clipRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                {/* Pin Navy 3: Bandung */}
                <div className="absolute top-12 left-44 group-hover:scale-110 transition-transform cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-[#111844] text-white flex items-center justify-center shadow-md border border-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                  </div>
                </div>

                {/* Badge Keterangan Mini di Atas Peta */}
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-[#111844] shadow-sm flex items-center gap-1.5 border border-slate-200/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>18 Titik Kota Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
