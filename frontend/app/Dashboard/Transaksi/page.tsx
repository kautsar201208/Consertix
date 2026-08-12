"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import Modal from "@/components/Modal";
import {
  Receipt,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Inbox,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function TransaksiPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      try {
        if (token) {
          const response = await fetch(`${API_URL}/api/payments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) { setPayments(data); return; }
          }
        }
        setPayments([]);
      } catch {
        setError("Gagal memuat data transaksi dari server.");
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((trx) => {
    const idStr = String(trx.id || trx.order_id || "");
    const nameStr = (trx.nama || "").toLowerCase();
    const eventStr = (trx.judul || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = idStr.includes(q) || nameStr.includes(q) || eventStr.includes(q);

    const statusStr = (trx.status || "").toLowerCase();
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Paid" && ["paid", "berhasil", "sukses"].includes(statusStr)) ||
      (statusFilter === "Pending" && ["pending", "menunggu"].includes(statusStr)) ||
      (statusFilter === "Failed" && ["failed", "gagal"].includes(statusStr));

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminShell>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit status pembayaran tiket dan riwayat order pelanggan.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, ID transaksi, event..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs sm:text-sm bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 transition"
            >
              <option value="All">Semua Status</option>
              <option value="Paid">Paid / Berhasil</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed / Gagal</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3.5 px-6">ID Transaksi</th>
                  <th className="text-left py-3.5 px-4">Nama Pembeli</th>
                  <th className="text-left py-3.5 px-4">Event</th>
                  <th className="text-left py-3.5 px-4">Status</th>
                  <th className="text-left py-3.5 px-4">Tanggal</th>
                  <th className="text-left py-3.5 px-4">Bukti</th>
                  <th className="text-right py-3.5 px-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filteredPayments.map((trx, i) => {
                    const isPaid = ["paid", "berhasil", "sukses"].includes((trx.status || "").toLowerCase());
                    const isPending = ["pending", "menunggu"].includes((trx.status || "").toLowerCase());
                    return (
                      <motion.tr
                        key={trx.id || trx.order_id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                          #{trx.id || trx.order_id}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {trx.nama || "Pembeli"}
                        </td>
                        <td className="py-4 px-4 text-slate-600 max-w-[200px] truncate">
                          {trx.judul || "Event"}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isPending
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {isPaid && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isPending && <AlertCircle className="w-3.5 h-3.5" />}
                            {trx.status || "Paid"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-mono text-xs sm:text-sm">
                          {trx.created_at?.slice(0, 10) || "—"}
                        </td>
                        <td className="py-4 px-4">
                          {trx.bukti_pembayaran ? (
                            <a
                              href={`${API_URL}/uploads/payments/${trx.bukti_pembayaran}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 transition text-xs sm:text-sm"
                            >
                              Lihat <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedTransaction(trx)}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 transition"
                            title="Lihat Rincian"
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

            {filteredPayments.length === 0 && !loading && (
              <div className="py-16 text-center">
                <Inbox className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-semibold text-slate-700">Belum ada transaksi</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Data transaksi akan muncul setelah pelanggan melakukan pembelian.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title={`Detail Transaksi #${selectedTransaction?.id || selectedTransaction?.order_id || ""}`}
        maxWidth="md"
      >
        {selectedTransaction && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Status</span>
              <span className={`font-bold px-2.5 py-1 rounded-md text-xs ${
                ["paid","berhasil","sukses"].includes((selectedTransaction.status||"").toLowerCase())
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {selectedTransaction.status || "Paid"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-xs">Pembeli</p>
                <p className="font-bold text-slate-900 mt-1 text-xs sm:text-sm">{selectedTransaction.nama || "Pembeli"}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-xs">Event</p>
                <p className="font-bold text-indigo-700 mt-1 text-xs sm:text-sm">{selectedTransaction.judul || "Event"}</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-slate-400 font-semibold uppercase text-xs">Tanggal Order</p>
              <p className="font-semibold text-slate-800 mt-1 font-mono text-xs sm:text-sm">{selectedTransaction.created_at || "—"}</p>
            </div>
            {selectedTransaction.bukti_pembayaran && (
              <a
                href={`${API_URL}/uploads/payments/${selectedTransaction.bukti_pembayaran}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-xs sm:text-sm shadow-sm"
              >
                <ExternalLink className="w-4 h-4" /> Buka Bukti Pembayaran
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
