"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import Modal from "@/components/Modal";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  AlertCircle,
  Save,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function DaftarEventPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [detailModalEvent, setDetailModalEvent] = useState<any | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<any | null>(null);

  // Edit Modal State
  const [editModalEvent, setEditModalEvent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    nama_artis: "",
    judul: "",
    deskripsi: "",
    tanggal: "",
    jam: "",
    lokasi: "",
    status: "aktif"
  });
  const [editPoster, setEditPoster] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => { void loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setEvents(data);
      else setEvents([]);
    } catch {
      setError("Gagal mengambil data event dari backend.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // Open Edit Modal & Populate Data
  function openEditModal(evt: any) {
    setEditModalEvent(evt);
    setEditForm({
      nama_artis: evt.nama_artis || "",
      judul: evt.judul || "",
      deskripsi: evt.deskripsi || "",
      tanggal: evt.tanggal ? String(evt.tanggal).slice(0, 10) : "",
      jam: evt.jam || "",
      lokasi: evt.lokasi || "",
      status: evt.status || "aktif"
    });
    setEditPoster(null);
    setEditImagePreview(evt.poster ? `${API_URL}/uploads/posters/${evt.poster}` : null);
    setEditError("");
  }

  // Handle Edit Submit
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editModalEvent) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setEditError("Anda harus login sebagai admin.");
      return;
    }

    setEditSubmitting(true);
    setEditError("");

    try {
      const formData = new FormData();
      formData.append("nama_artis", editForm.nama_artis);
      formData.append("judul", editForm.judul);
      formData.append("deskripsi", editForm.deskripsi);
      formData.append("tanggal", editForm.tanggal);
      formData.append("jam", editForm.jam);
      formData.append("lokasi", editForm.lokasi);
      formData.append("status", editForm.status);
      if (editPoster) {
        formData.append("poster", editPoster);
      }

      const response = await fetch(`${API_URL}/api/events/${editModalEvent.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal memperbarui event.");
      }

      setEvents((prev) =>
        prev.map((e) =>
          e.id === editModalEvent.id
            ? {
                ...e,
                ...editForm,
                poster: editPoster ? data.poster || e.poster : e.poster
              }
            : e
        )
      );

      setSuccess(`Event "${editForm.judul}" berhasil diperbarui!`);
      setEditModalEvent(null);
      setTimeout(() => setSuccess(""), 3000);
      void loadEvents();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteEvent(eventId: number | string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      if (token) {
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Gagal menghapus event");
        }
      }
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSuccess("Event berhasil dihapus.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setTimeout(() => setError(""), 3000);
    } finally {
      setDeleteConfirmEvent(null);
    }
  }

  const filteredEvents = events.filter((evt) => {
    const title = (evt.judul || "").toLowerCase();
    const artist = (evt.nama_artis || "").toLowerCase();
    const loc = (evt.lokasi || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = title.includes(q) || artist.includes(q) || loc.includes(q);

    const statusVal = (evt.status || "aktif").toLowerCase();
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && (statusVal === "aktif" || statusVal === "active")) ||
      (statusFilter === "Draft" && (statusVal === "draft" || statusVal === "nonaktif"));

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminShell>
      <div className="space-y-6">

        {/* Page header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Events</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Kelola seluruh event dan pertunjukan dari database Anda.</p>
          </div>
          <Link href="/Dashboard/TambahEvent">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#111844] hover:bg-[#0a0f2b] rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah Event
            </motion.button>
          </Link>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {success}
          </div>
        )}

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari event, artis, lokasi..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-[#111844] focus:ring-1 focus:ring-[#111844] transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs sm:text-sm bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#111844] transition"
            >
              <option value="All">Semua Status</option>
              <option value="Active">Aktif</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Data table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3.5 px-6">Event</th>
                  <th className="text-left py-3.5 px-4">Tanggal & Jam</th>
                  <th className="text-left py-3.5 px-4">Lokasi</th>
                  <th className="text-left py-3.5 px-4">Status</th>
                  <th className="text-right py-3.5 px-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filteredEvents.map((evt, i) => {
                    const isAktif = ["aktif", "active"].includes((evt.status || "").toLowerCase());
                    return (
                      <motion.tr
                        key={evt.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Event name + artis */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            {evt.poster ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                                <Image
                                  src={`${API_URL}/uploads/posters/${evt.poster}`}
                                  alt={`Poster ${evt.judul || "event"}`}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg border border-dashed border-slate-200 bg-slate-50 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate max-w-[200px] text-sm group-hover:text-[#111844] transition-colors">
                                {evt.judul}
                              </p>
                              <p className="text-slate-500 text-xs mt-0.5">{evt.nama_artis || "—"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Date & time */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            {evt.tanggal || "—"}
                          </div>
                          {evt.jam && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                              <Clock className="w-3.5 h-3.5" /> {evt.jam}
                            </div>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{evt.lokasi || "—"}</span>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isAktif
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {isAktif ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {evt.status || "aktif"}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDetailModalEvent(evt)}
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                             <Link
                              href={`/Dashboard/EditEvent/${evt.id}`}
                              className="p-2 rounded-xl text-slate-400 hover:text-[#111844] hover:bg-[#111844]/10 transition inline-block"
                              title="Edit Event"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteConfirmEvent(evt)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Hapus Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredEvents.length === 0 && !loading && (
              <div className="py-16 text-center">
                <Inbox className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-semibold text-slate-700">Belum ada event</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Tambah event baru untuk mulai berjualan tiket.</p>
                <Link href="/Dashboard/TambahEvent">
                  <button className="mt-4 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#111844] hover:bg-[#0a0f2b] rounded-xl transition shadow-xs">
                    + Tambah Event Pertama
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Event Modal ── */}
      <Modal isOpen={!!editModalEvent} onClose={() => setEditModalEvent(null)} title="Edit Event" maxWidth="lg">
        {editModalEvent && (
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs sm:text-sm">
            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Nama Artis / Guest Star</label>
                <input
                  type="text"
                  value={editForm.nama_artis}
                  onChange={(e) => setEditForm({ ...editForm, nama_artis: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-[#111844] focus:outline-none transition"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Judul Event</label>
                <input
                  type="text"
                  value={editForm.judul}
                  onChange={(e) => setEditForm({ ...editForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-[#111844] focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Deskripsi</label>
              <textarea
                rows={3}
                value={editForm.deskripsi}
                onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-[#111844] focus:outline-none transition resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Tanggal</label>
                <input
                  type="date"
                  value={editForm.tanggal}
                  onChange={(e) => setEditForm({ ...editForm, tanggal: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-[#111844] focus:outline-none transition"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Jam</label>
                <input
                  type="time"
                  value={editForm.jam}
                  onChange={(e) => setEditForm({ ...editForm, jam: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-[#111844] focus:outline-none transition"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-[#111844] focus:outline-none transition"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-aktif / Draft</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Lokasi Venue</label>
              <input
                type="text"
                value={editForm.lokasi}
                onChange={(e) => setEditForm({ ...editForm, lokasi: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-[#111844] focus:outline-none transition"
                required
              />
            </div>

            {/* Poster Input */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Ganti Poster (opsional)</label>
              <div className="flex items-center gap-3">
                {editImagePreview && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    <Image src={editImagePreview} alt="Preview" fill className="object-cover" unoptimized />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditPoster(file);
                      setEditImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#111844]/10 file:text-[#111844] hover:file:bg-[#111844]/20"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalEvent(null)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#111844] hover:bg-[#0a0f2b] disabled:opacity-60 rounded-xl transition flex items-center gap-2 shadow-xs"
              >
                {editSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Event Modal */}
      <Modal isOpen={!!detailModalEvent} onClose={() => setDetailModalEvent(null)} title="Detail Event" maxWidth="md">
        {detailModalEvent && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs uppercase font-bold text-[#111844] mb-1">{detailModalEvent.nama_artis}</p>
              <h2 className="text-base font-bold text-slate-900">{detailModalEvent.judul}</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">{detailModalEvent.deskripsi || "Tidak ada deskripsi."}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 text-xs uppercase font-semibold">Tanggal & Jam</p>
                <p className="font-bold text-slate-800 mt-1 text-xs sm:text-sm">{detailModalEvent.tanggal} {detailModalEvent.jam ? `• ${detailModalEvent.jam}` : ""}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 text-xs uppercase font-semibold">Lokasi</p>
                <p className="font-bold text-slate-800 mt-1 text-xs sm:text-sm">{detailModalEvent.lokasi}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Link
                href={`/Dashboard/EditEvent/${detailModalEvent.id}`}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#111844] bg-[#111844]/10 hover:bg-[#111844]/20 rounded-xl transition inline-block text-center"
              >
                Edit Event
              </Link>
              <button onClick={() => setDetailModalEvent(null)} className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmEvent} onClose={() => setDeleteConfirmEvent(null)} title="Hapus Event" maxWidth="sm">
        {deleteConfirmEvent && (
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-slate-600">
              Hapus <strong className="text-slate-900">"{deleteConfirmEvent.judul}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2.5 pt-1">
              <button onClick={() => setDeleteConfirmEvent(null)} className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                Batal
              </button>
              <button
                onClick={() => handleDeleteEvent(deleteConfirmEvent.id)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
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
