"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import Modal from "@/components/Modal";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Inbox,
  AlertCircle,
  Save,
  Loader2,
  Shield,
  User,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function ManagementUserPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Modals
  const [detailModalUser, setDetailModalUser] = useState<any | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any | null>(null);
  const [editRoleUser, setEditRoleUser] = useState<any | null>(null);

  // Edit role form
  const [selectedRole, setSelectedRole] = useState("user");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setError("Token tidak ditemukan. Silakan login kembali.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setUsers(data);
      } else {
        setError(data.message || "Gagal mengambil data user.");
        setUsers([]);
      }
    } catch {
      setError("Gagal menghubungi server backend.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Open Edit Role Modal
  function openEditRoleModal(user: any) {
    setEditRoleUser(user);
    setSelectedRole(user.role || "user");
    setEditError("");
  }

  // Handle Edit Role Submit
  async function handleEditRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRoleUser) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setEditError("Anda harus login kembali.");
      return;
    }

    setEditSubmitting(true);
    setEditError("");

    try {
      const response = await fetch(`${API_URL}/api/users/${editRoleUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: selectedRole })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal memperbarui role.");
      }

      setSuccess(`Role user "${editRoleUser.nama}" berhasil diubah menjadi "${selectedRole}".`);
      setEditRoleUser(null);
      setTimeout(() => setSuccess(""), 3000);
      void loadUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setEditSubmitting(false);
    }
  }

  // Handle Delete User
  async function handleDeleteUser(userId: number | string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Anda harus login kembali.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus user.");
      }

      setSuccess("User berhasil dihapus.");
      setTimeout(() => setSuccess(""), 3000);
      void loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setDeleteConfirmUser(null);
    }
  }

  // Frontend local filter for search & role
  const filteredUsers = users.filter((user) => {
    const name = (user.nama || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = name.includes(q) || email.includes(q);

    const matchesRole =
      roleFilter === "All" ||
      (roleFilter === "Admin" && user.role === "admin") ||
      (roleFilter === "User" && user.role === "user");

    return matchesSearch && matchesRole;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola role dan data pengguna yang terdaftar di sistem Concertix.
            </p>
          </div>
        </div>

        {/* Banners */}
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
              placeholder="Cari user berdasarkan nama atau email..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-[#111844] focus:ring-1 focus:ring-[#111844] transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs sm:text-sm bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#111844] transition"
            >
              <option value="All">Semua Role</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3.5 px-6">User</th>
                  <th className="text-left py-3.5 px-4">Email</th>
                  <th className="text-left py-3.5 px-4">Role</th>
                  <th className="text-left py-3.5 px-4">Tanggal Daftar</th>
                  <th className="text-right py-3.5 px-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filteredUsers.map((u, i) => {
                    const isAdmin = u.role === "admin";
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Nama */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                              isAdmin 
                                ? "bg-indigo-50 border-indigo-200 text-[#111844]"
                                : "bg-slate-100 border-slate-200 text-slate-600"
                            }`}>
                              {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 truncate max-w-[200px] text-sm group-hover:text-[#111844] transition-colors">
                                {u.nama}
                              </p>
                              <span className="text-slate-400 text-2xs sm:hidden block">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 text-slate-600">
                          {u.email}
                        </td>

                        {/* Role Badge */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isAdmin
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {u.role || "user"}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          }) : "—"}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDetailModalUser(u)}
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditRoleModal(u)}
                              className="p-2 rounded-xl text-slate-400 hover:text-[#111844] hover:bg-[#111844]/10 transition"
                              title="Edit Role"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmUser(u)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Hapus User"
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

            {filteredUsers.length === 0 && !loading && (
              <div className="py-16 text-center">
                <Inbox className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-semibold text-slate-700">Tidak ada user ditemukan</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter.</p>
              </div>
            )}

            {loading && (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-[#111844] animate-spin" />
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Memuat data user...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail User Modal ── */}
      <Modal isOpen={!!detailModalUser} onClose={() => setDetailModalUser(null)} title="Detail User" maxWidth="md">
        {detailModalUser && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                detailModalUser.role === "admin"
                  ? "bg-indigo-100 border-indigo-300 text-[#111844]"
                  : "bg-slate-200 border-slate-300 text-slate-600"
              }`}>
                {detailModalUser.role === "admin" ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-base">{detailModalUser.nama}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold mt-1 border ${
                  detailModalUser.role === "admin"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  {detailModalUser.role || "user"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 text-xs uppercase font-semibold">Email</p>
                <p className="font-bold text-slate-800 mt-1 truncate">{detailModalUser.email}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 text-xs uppercase font-semibold">Tanggal Daftar</p>
                <p className="font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  {detailModalUser.created_at ? new Date(detailModalUser.created_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  }) : "—"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  const targetUser = detailModalUser;
                  setDetailModalUser(null);
                  openEditRoleModal(targetUser);
                }}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#111844] bg-[#111844]/10 hover:bg-[#111844]/20 rounded-xl transition"
              >
                Edit Role
              </button>
              <button
                onClick={() => setDetailModalUser(null)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Role Modal ── */}
      <Modal isOpen={!!editRoleUser} onClose={() => setEditRoleUser(null)} title="Ubah Role User" maxWidth="sm">
        {editRoleUser && (
          <form onSubmit={handleEditRoleSubmit} className="space-y-4 text-xs sm:text-sm">
            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editError}
              </div>
            )}

            <div>
              <p className="text-slate-600">
                Pilih role baru untuk <strong className="text-slate-900">{editRoleUser.nama}</strong> ({editRoleUser.email}):
              </p>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-[#111844] focus:outline-none transition"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditRoleUser(null)}
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

      {/* ── Delete User Confirmation Modal ── */}
      <Modal isOpen={!!deleteConfirmUser} onClose={() => setDeleteConfirmUser(null)} title="Hapus User" maxWidth="sm">
        {deleteConfirmUser && (
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-slate-600">
              Apakah Anda yakin ingin menghapus user <strong className="text-slate-900">"{deleteConfirmUser.nama}"</strong> ({deleteConfirmUser.email})? Tindakan ini akan menghapus permanen data user dan tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser.id)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4" /> Hapus User
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
