"use client";

import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import StatCard from "@/components/StatCard";
import RevenueChart from "@/components/RevenueChart";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  DollarSign,
  Ticket,
  TrendingUp,
  CalendarDays,
  BarChart3,
  Filter,
  Calendar,
  FileSpreadsheet,
  FileText,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_REVENUE_7_DAYS } from "@/lib/mockData";

export default function LaporanPage() {
  const [dateRange, setDateRange] = useState("Bulan Ini");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const handleExport = (type: "PDF" | "Excel") => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(`Laporan_${dateRange.replace(" ", "_")}.${type.toLowerCase()}`);
      setTimeout(() => setExportSuccess(null), 4000);
    }, 1200);
  };

  return (
    <AdminShell>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau kinerja penjualan tiket dan pendapatan event.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              disabled={isExporting}
              onClick={() => handleExport("PDF")}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition shadow-sm"
            >
              <FileText className="w-4 h-4 text-rose-500" /> Export PDF
            </button>
            <button
              disabled={isExporting}
              onClick={() => handleExport("Excel")}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExporting ? "Mengunduh..." : "Export Excel"}
            </button>
          </div>
        </div>

        {/* Export Toast */}
        <AnimatePresence>
          {exportSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Laporan berhasil diunduh: <strong>{exportSuccess}</strong></span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-xs sm:text-sm bg-slate-50 text-slate-700 py-2 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 transition"
            >
              <option>Minggu Ini</option>
              <option>Bulan Ini</option>
              <option>30 Hari Terakhir</option>
              <option>Kuartal Ini</option>
              <option>Tahun 2026</option>
            </select>
          </div>
          <span className="text-xs sm:text-sm text-slate-500 ml-auto font-mono">
            Periode aktif: <strong className="text-indigo-600 font-bold">{dateRange}</strong>
          </span>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Pendapatan" value={formatCurrency(0)} change="+0%" isPositive={true} icon={DollarSign} color="emerald" delay={0.05} subtitle="dari backend" />
          <StatCard title="Tiket Terjual" value="0" change="+0%" isPositive={true} icon={Ticket} color="indigo" delay={0.1} subtitle="dari backend" />
          <StatCard title="Rata-rata Order" value={formatCurrency(0)} change="+0%" isPositive={true} icon={TrendingUp} color="violet" delay={0.15} subtitle="per transaksi" />
          <StatCard title="Event Aktif" value="0" change="+0%" isPositive={true} icon={CalendarDays} color="amber" delay={0.2} subtitle="dari backend" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />

          {/* Bar chart placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
          >
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Pendapatan per Event</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Terhubung saat data tersedia dari backend</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center text-slate-400 text-xs sm:text-sm border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="text-center space-y-1.5">
                <BarChart3 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-medium">Data event diperlukan dari backend</p>
                <p className="text-xs text-slate-400">Tambahkan event agar grafik muncul</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Trend Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center gap-2.5">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Tren Penjualan Harian</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3.5 px-6">Tanggal</th>
                  <th className="text-left py-3.5 px-4">Pendapatan</th>
                  <th className="text-left py-3.5 px-4">Tiket Terjual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_REVENUE_7_DAYS.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-700">{row.date}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">{formatCurrency(row.revenue)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatNumber(row.tickets)} tiket</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AdminShell>
  );
}
