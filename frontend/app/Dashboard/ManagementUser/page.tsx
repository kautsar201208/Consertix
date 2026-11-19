"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import Modal from "@/components/Modal";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  Inbox,
  Loader2,
  LockKeyhole,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

interface UserRecord {
  id: number | string;
  nama: string;
  email: string;
  role?: string;
  created_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function ManagementUserPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [detailModalUser, setDetailModalUser] = useState<UserRecord | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserRecord | null>(null);
  const [editRoleUser, setEditRoleUser] = useState<UserRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState("user");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [addForm, setAddForm] = useState({ nama: "", email: "", password: "" });

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
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setUsers(data);
      } else {
        setError(data.message || "Gagal mengambil data pengguna.");
        setUsers([]);
      }
    } catch {
      setError("Gagal menghubungi server backend.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  function openEditRoleModal(user: UserRecord) {
    setEditRoleUser(user);
    setSelectedRole(user.role || "user");
    setEditError("");
  }

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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal memperbarui role.");

      setSuccess(`Role "${editRoleUser.nama}" berhasil diubah menjadi "${selectedRole}".`);
      setEditRoleUser(null);
      void loadUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddSubmitting(true);
    setAddError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menambahkan pengguna.");

      setSuccess(`Pengguna "${addForm.nama}" berhasil ditambahkan.`);
      setAddModalOpen(false);
      setAddForm({ nama: "", email: "", password: "" });
      void loadUsers();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleDeleteUser(userId: number | string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Anda harus login kembali.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menghapus pengguna.");

      setSuccess("Pengguna berhasil dihapus.");
      setDeleteConfirmUser(null);
      void loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = users.filter((user) => {
      const matchesSearch =
        !query ||
        user.nama?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && user.role === "admin") ||
        (roleFilter === "user" && user.role !== "admin");
      const matchesStatus = statusFilter === "all" || statusFilter === "active";
      return matchesSearch && matchesRole && matchesStatus;
    });

    return [...result].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
    });
  }, [users, searchQuery, roleFilter, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * perPage, safePage * perPage);

  const adminCount = users.filter((user) => user.role === "admin").length;
  const userCount = users.length - adminCount;
  const thisMonthCount = users.filter((user) => {
    if (!user.created_at) return false;
    const date = new Date(user.created_at);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  function formatDate(value?: string) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function exportUsers() {
    const header = ["Nama", "Email", "Role", "Tanggal Bergabung"];
    const rows = filteredUsers.map((user) => [
      user.nama,
      user.email,
      user.role || "user",
      formatDate(user.created_at),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pengguna-concertix.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <div className="flex flex-col w-full gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Kelola Pengguna</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs font-medium text-slate-500">Manajemen Pengguna &amp; Member</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111844] tracking-tight">Kelola User</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Pantau akun penonton, kelola hak akses, dan perbarui data pengguna Concertix.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={exportUsers}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Download className="h-[18px] w-[18px] text-slate-500" />
              Ekspor Data
            </button>
            <button
              type="button"
              onClick={() => {
                setAddError("");
                setAddModalOpen(true);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#111844] px-5 text-xs font-bold text-white shadow-md transition hover:bg-[#0a0f2b] active:scale-[0.98]"
            >
              <UserPlus className="h-[18px] w-[18px]" />
              Tambah User Baru
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {success}
            <button type="button" onClick={() => setSuccess("")} className="ml-auto text-xs font-bold">Tutup</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Pengguna",
              value: users.length.toLocaleString("id-ID"),
              icon: Users,
              color: "text-blue-600 bg-blue-50",
              note: "Seluruh akun terdaftar",
            },
            {
              label: "Pengguna Baru",
              value: thisMonthCount.toLocaleString("id-ID"),
              icon: UserPlus,
              color: "text-indigo-600 bg-indigo-50",
              note: "Bergabung bulan ini",
            },
            {
              label: "Pengguna Biasa",
              value: userCount.toLocaleString("id-ID"),
              icon: CheckCircle2,
              color: "text-violet-600 bg-violet-50",
              note: "Dengan role user",
            },
            {
              label: "Akun Administrator",
              value: adminCount.toLocaleString("id-ID"),
              icon: ShieldCheck,
              color: "text-emerald-600 bg-emerald-50",
              note: "Dengan hak akses admin",
            },
          ].map((metric) => (
            <div key={metric.label} className="rounded-[22px] border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{metric.label}</span>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900">{metric.value}</div>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.color}`}>
                  <metric.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{metric.note}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5 rounded-[26px] border border-slate-200/70 bg-white p-5 shadow-sm lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-slate-100 p-1.5">
              {[
                ["all", `Semua (${users.length})`],
                ["admin", `Admin (${adminCount})`],
                ["user", `User (${userCount})`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRoleFilter(value)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                    roleFilter === value
                      ? "bg-[#111844] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-full sm:min-w-72 sm:flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-full border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
              </select>
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="h-10 appearance-none rounded-full border border-slate-200 bg-slate-50 pl-4 pr-9 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="-mx-5 overflow-x-auto lg:-mx-6">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  <th className="py-3.5 pl-6 pr-4 lg:pl-6">Pengguna</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Tanggal Bergabung</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="py-3.5 pl-4 pr-6 text-right lg:pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user) => {
                  const isAdmin = user.role === "admin";
                  return (
                    <tr key={user.id} className="group transition-colors hover:bg-slate-50/70">
                      <td className="py-4 pl-6 pr-4 lg:pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                            {getInitials(user.nama)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600">{user.nama}</p>
                            <p className="mt-0.5 text-[10px] font-bold text-slate-400">CTX-{String(user.id).padStart(5, "0")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-700">{user.email}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                          {isAdmin ? "Administrator" : "User"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      </td>
                      <td className="py-4 pl-4 pr-6 text-right lg:pr-6">
                        <div className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => setDetailModalUser(user)} title="Lihat Profil" className="rounded-full p-2 text-blue-600 transition hover:bg-blue-50">
                            <Eye className="h-[17px] w-[17px]" />
                          </button>
                          <button type="button" onClick={() => openEditRoleModal(user)} title="Edit Role" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100">
                            <Edit className="h-[17px] w-[17px]" />
                          </button>
                          <button type="button" onClick={() => setDeleteConfirmUser(user)} title="Hapus Akun" className="rounded-full p-2 text-rose-500 transition hover:bg-rose-50">
                            <Trash2 className="h-[17px] w-[17px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {paginatedUsers.length === 0 && !loading && (
              <div className="py-16 text-center">
                <Inbox className="mx-auto mb-2 h-9 w-9 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Tidak ada pengguna ditemukan</p>
                <p className="mt-1 text-xs text-slate-400">Coba ubah kata kunci atau filter pencarian.</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center gap-2 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-xs font-medium text-slate-500">Memuat data pengguna...</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                Menampilkan <strong className="text-slate-800">{filteredUsers.length === 0 ? 0 : (safePage - 1) * perPage + 1}-{Math.min(safePage * perPage, filteredUsers.length)}</strong> dari <strong className="text-slate-800">{filteredUsers.length}</strong> pengguna
              </span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="h-8 rounded-full border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold text-slate-700"
              >
                <option value={10}>10 per halaman</option>
                <option value={25}>25 per halaman</option>
                <option value={50}>50 per halaman</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1} className="flex h-9 items-center gap-1 rounded-full px-3 text-xs font-bold text-slate-500 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setPage(number)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${safePage === number ? "bg-[#111844] text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {number}
                </button>
              ))}
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage === totalPages} className="flex h-9 items-center gap-1 rounded-full px-3 text-xs font-bold text-slate-500 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Tambah Pengguna Baru" maxWidth="sm">
        <form onSubmit={handleAddUser} className="space-y-4">
          {addError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4" /> {addError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Nama Lengkap</label>
            <input required value={addForm.nama} onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Email</label>
            <input required type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <input required type="password" minLength={6} value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => setAddModalOpen(false)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600">Batal</button>
            <button type="submit" disabled={addSubmitting} className="flex items-center gap-2 rounded-xl bg-[#111844] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              {addSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Tambah User
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailModalUser} onClose={() => setDetailModalUser(null)} title="Detail Pengguna" maxWidth="md">
        {detailModalUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-extrabold text-indigo-700">{getInitials(detailModalUser.nama)}</div>
              <div>
                <p className="font-bold text-slate-900">{detailModalUser.nama}</p>
                <p className="mt-1 text-xs text-slate-500">{detailModalUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3.5">
                <p className="text-[10px] font-bold uppercase text-slate-400">Role</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{detailModalUser.role === "admin" ? "Administrator" : "User"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3.5">
                <p className="text-[10px] font-bold uppercase text-slate-400">Tanggal Bergabung</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-800"><CalendarDays className="h-4 w-4 text-slate-400" />{formatDate(detailModalUser.created_at)}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setDetailModalUser(null)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600">Tutup</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!editRoleUser} onClose={() => setEditRoleUser(null)} title="Ubah Role Pengguna" maxWidth="sm">
        {editRoleUser && (
          <form onSubmit={handleEditRoleSubmit} className="space-y-4">
            {editError && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle className="h-4 w-4" />{editError}</div>}
            <p className="text-sm text-slate-600">Pilih role baru untuk <strong className="text-slate-900">{editRoleUser.nama}</strong>.</p>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setEditRoleUser(null)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600">Batal</button>
              <button type="submit" disabled={editSubmitting} className="flex items-center gap-2 rounded-xl bg-[#111844] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Simpan
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!deleteConfirmUser} onClose={() => setDeleteConfirmUser(null)} title="Hapus Pengguna" maxWidth="sm">
        {deleteConfirmUser && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <LockKeyhole className="h-5 w-5 shrink-0" />
              <p>Apakah Anda yakin ingin menghapus <strong>{deleteConfirmUser.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteConfirmUser(null)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600">Batal</button>
              <button type="button" onClick={() => void handleDeleteUser(deleteConfirmUser.id)} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white">
                <Trash2 className="h-4 w-4" />Hapus
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
