"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login gagal");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess(`Login berhasil. Selamat datang, ${data.user.nama || "Admin"}!`);
      setEmail("");
      setPassword("");

      setTimeout(() => {
        router.push("/Dashboard");
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 font-sans">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200/80 lg:grid-cols-2">
        <section className="hidden bg-[#111844] p-10 lg:flex lg:flex-col lg:justify-between text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight">Concertix</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
              Event Management &amp; Ticketing Executive Portal
            </h1>
            <p className="mt-4 text-sm text-indigo-100/90 leading-relaxed">
              Kelola konser, pantau penjualan tiket, lacak pendapatan harian, dan proses pesanan pelanggan — semua dalam satu platform executive.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 text-xs backdrop-blur border border-white/10 text-indigo-100">
            Gunakan kredensial admin Anda untuk mengakses dashboard manajemen event.
          </div>
        </section>

        <section className="p-6 sm:p-10 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-sm">
            <p className="mb-1.5 text-xs font-bold text-[#111844] uppercase tracking-wider">Welcome back</p>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Sign In</h2>
            <p className="mt-1.5 text-xs text-slate-500">
              Silakan masukkan kredensial Anda untuk mengakses panel manajemen.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@concertix.io"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#111844] focus:ring-1 focus:ring-[#111844]"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#111844] focus:ring-1 focus:ring-[#111844]"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#111844] hover:bg-[#0a0f2b] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Masuk ke Dashboard"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Belum punya akun admin?{" "}
              <Link href="/Register" className="font-semibold text-[#111844] hover:underline">
                Daftar di sini
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
