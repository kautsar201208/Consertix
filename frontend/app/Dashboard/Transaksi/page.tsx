"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";

interface User {
  id: number;
  nama: string;
  email: string;
  role: string;
}

interface Payment {
  id: number;
  order_id: number;
  bukti_pembayaran: string;
  status: string;
  nama: string;
  judul: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function TransaksiPage() {
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Token login belum tersedia.");
      setLoading(false);
      return;
    }

    async function fetchPayments() {
      try {
        const response = await fetch(`${API_URL}/api/payments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Gagal mengambil data transaksi");
        }

        setPayments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 rounded-3xl bg-slate-900 p-4 shadow-2xl shadow-slate-950/40">
        <Sidebar userName={user?.nama} userEmail={user?.email} />

        <section className="flex-1 rounded-2xl bg-slate-950 p-6">
          <p className="text-sm text-cyan-300">Transaksi</p>
          <h1 className="mt-2 text-3xl font-bold">Daftar Transaksi</h1>

          {error ? (
            <div className="mt-6 rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-2xl bg-slate-800 p-6 text-slate-300">
              Memuat data transaksi...
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-700 text-slate-200">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Bukti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                          Belum ada data transaksi.
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.id} className="border-t border-slate-700">
                          <td className="px-4 py-3">#{payment.id}</td>
                          <td className="px-4 py-3">{payment.nama}</td>
                          <td className="px-4 py-3">{payment.judul}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200">
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`${API_URL}/uploads/payments/${payment.bukti_pembayaran}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 underline"
                            >
                              Lihat bukti
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
