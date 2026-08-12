"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import StatCard from "@/components/StatCard";
import RevenueChart from "@/components/RevenueChart";
import Modal from "@/components/Modal";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  CalendarDays,
  Receipt,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Inbox,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface DashboardStats {
  totalUser?: number;
  totalEvent?: number;
  totalKategori?: number;
  totalOrder?: number;
  totalPayment?: number;
  totalPendapatan?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function DashboardPage() {
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      try {
        const [statsResponse, eventsResponse, paymentsResponse] = await Promise.all([
          token
            ? fetch(`${API_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve(null),
          fetch(`${API_URL}/api/events`),
          token
            ? fetch(`${API_URL}/api/payments`, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve(null)
        ]);

        if (statsResponse && statsResponse.ok) {
          setStats(await statsResponse.json());
        }
        if (eventsResponse && eventsResponse.ok) {
          const d = await eventsResponse.json();
          if (Array.isArray(d)) setEvents(d);
        }
        if (paymentsResponse && paymentsResponse.ok) {
          const d = await paymentsResponse.json();
          if (Array.isArray(d)) setPayments(d);
        }
      } catch {
        setError("Tidak dapat terhubung ke backend. Pastikan server berjalan.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const totalEventCount = stats?.totalEvent ?? events.length;
  const totalOrderCount = stats?.totalOrder ?? payments.length;
  const totalRevenueVal = stats?.totalPendapatan ?? 0;
  const recentEvents = events.slice(0, 4);
  const recentPayments = payments.slice(0, 8);

  return (
    <AdminShell>
      <div className="space-y-6">

        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Total Events"
            value={loading ? "—" : String(totalEventCount)}
            change="+0%"
            isPositive={true}
            icon={CalendarDays}
            color="navy"
            delay={0.05}
            subtitle="events listed"
          />
          <StatCard
            title="New Orders"
            value={loading ? "—" : formatNumber(totalOrderCount)}
            change="+0%"
            isPositive={true}
            icon={Receipt}
            color="navy"
            delay={0.1}
            subtitle="ticket purchases"
          />
          <StatCard
            title="Total Revenue"
            value={loading ? "—" : formatCurrency(totalRevenueVal)}
            change="+0%"
            isPositive={true}
            icon={DollarSign}
            color="emerald"
            delay={0.15}
            subtitle="gross ticket sales"
          />
        </div>

        {/* Main Two-Column Grid: Recent Events Table + Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Recent Event Listings Table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-[#111844]" />
                <h3 className="text-base font-bold text-slate-900">Recent Event Listings</h3>
              </div>
              <Link
                href="/Dashboard/DaftarEvent"
                className="text-xs sm:text-sm text-[#111844] hover:underline font-semibold flex items-center gap-1 transition"
              >
                View All <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-3.5 px-6">Event</th>
                    <th className="text-left py-3.5 px-4">Tanggal</th>
                    <th className="text-left py-3.5 px-4">Lokasi</th>
                    <th className="text-left py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {recentEvents.map((evt, i) => {
                      const isAktif = (evt.status || "aktif").toLowerCase() === "aktif" || (evt.status || "").toLowerCase() === "active";
                      return (
                        <motion.tr
                          key={evt.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-800 truncate max-w-[200px] text-sm">{evt.judul}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{evt.nama_artis}</p>
                          </td>
                          <td className="py-4 px-4 text-slate-600 whitespace-nowrap text-xs sm:text-sm">{evt.tanggal}</td>
                          <td className="py-4 px-4 text-slate-600 truncate max-w-[140px] text-xs sm:text-sm">{evt.lokasi}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isAktif
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {isAktif ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                              {evt.status || "aktif"}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>

              {recentEvents.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <Inbox className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Belum ada data event.</p>
                  <Link href="/Dashboard/TambahEvent">
                    <button className="mt-3 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#111844] hover:bg-[#0a0f2b] rounded-xl transition shadow-xs">
                      + Tambah Event
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right side: Performance Chart + Recent Orders */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <RevenueChart />

            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#111844]" />
                  <h3 className="text-base font-bold text-slate-900">Recent Orders</h3>
                </div>
                <Link
                  href="/Dashboard/Transaksi"
                  className="text-xs sm:text-sm text-[#111844] hover:underline font-semibold flex items-center gap-1 transition"
                >
                  View All <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="divide-y divide-slate-50">
                {recentPayments.slice(0, 5).map((trx) => {
                  const isPaid = ["paid", "berhasil", "sukses"].includes((trx.status || "").toLowerCase());
                  return (
                    <div
                      key={trx.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTransaction(trx)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#111844]/10 text-[#111844] font-bold text-xs flex items-center justify-center shrink-0 border border-[#111844]/20">
                          {(trx.nama || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{trx.nama || "Pembeli"}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{trx.judul || "Event"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                          isPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {trx.status || "Paid"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{trx.created_at?.slice(0, 10) || "-"}</span>
                      </div>
                    </div>
                  );
                })}

                {recentPayments.length === 0 && !loading && (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <Inbox className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    Belum ada transaksi.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title={`Detail Transaksi #${selectedTransaction?.id || selectedTransaction?.order_id || ""}`}
        maxWidth="md"
      >
        {selectedTransaction && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-xs">Pembeli</p>
                <p className="font-bold text-slate-900 mt-1">{selectedTransaction.nama || "Pembeli"}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-xs">Event</p>
                <p className="font-bold text-[#111844] mt-1">{selectedTransaction.judul || "Event"}</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Status Pembayaran</span>
              <span className={`font-bold px-2.5 py-1 rounded-md text-xs ${
                ["paid","berhasil","sukses"].includes((selectedTransaction.status||"").toLowerCase())
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {selectedTransaction.status || "Paid"}
              </span>
            </div>
            {selectedTransaction.bukti_pembayaran && (
              <a
                href={`${API_URL}/uploads/payments/${selectedTransaction.bukti_pembayaran}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#111844] hover:bg-[#0a0f2b] text-white font-semibold rounded-xl transition text-sm shadow-xs"
              >
                <ExternalLink className="w-4 h-4" /> Lihat Bukti Pembayaran
              </a>
            )}
            <div className="flex justify-end pt-2">
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
