"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function RegisterPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nama, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Register gagal");
      }

      setSuccess(data.message || "Register berhasil");
      setNama("");
      setEmail("");
      setPassword("");

      router.push("/Login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-50">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-slate-950/40 lg:grid-cols-2">
        <section className="hidden bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-400 p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur">
              Buat Akun Baru
            </p>
            <h1 className="text-4xl font-bold leading-tight">
              Daftar sekarang untuk mulai reservasi tiket event Anda.
            </h1>
            <p className="mt-4 max-w-md text-sm text-slate-100/90">
              Nikmati pengalaman cepat dan aman saat memilih event favorit Anda.
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 text-sm backdrop-blur">
            Sudah punya akun? Silakan masuk melalui halaman login.
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <p className="mb-2 text-sm font-medium text-fuchsia-300">Registrasi</p>
            <h2 className="text-3xl font-bold text-white">Buat akun</h2>
            <p className="mt-2 text-sm text-slate-400">
              Isi data berikut untuk membuat akun baru.
            </p>

            <form onSubmit={handleRegister} className="mt-8 space-y-4">
              <div>
                <label htmlFor="nama" className="mb-2 block text-sm font-medium text-slate-200">
                  Nama Lengkap
                </label>
                <input
                  id="nama"
                  type="text"
                  value={nama}
                  onChange={(event) => setNama(event.target.value)}
                  placeholder="Nama Anda"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="contoh@email.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-fuchsia-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Memproses..." : "Daftar"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-400">
              Sudah punya akun?{" "}
              <Link href="/Login" className="font-medium text-fuchsia-300 hover:text-fuchsia-200">
                Masuk di sini
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
