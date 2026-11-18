"use client";

import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Ticket,
  User,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface ScanResult {
  valid: boolean;
  message: string;
  ticket_code: string;
  order_id: string | number;
  event: string;
  kategori: string;
  pemegang: string;
  nik: string;
  status: string;
  scanned_at: string;
}

export default function ScanTiketPage() {
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [cameraAvailable, setCameraAvailable] = useState(true);

  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      setErrorMessage("");
      const { Html5Qrcode } = await import("html5-qrcode");

      const element = document.getElementById("qr-reader");
      if (!element) return;

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      setIsScanning(true);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText: string) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          await handleProcessScan(decodedText);
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 2500);
        },
        () => {
          // Frame callback - no error logging needed
        }
      );
    } catch (err: any) {
      console.error("Gagal memulai kamera:", err);
      setIsScanning(false);
      setCameraAvailable(false);
      setErrorMessage(
        "Kamera tidak dapat diakses atau izin kamera ditolak. Anda tetap bisa memasukkan Kode Tiket secara manual di bawah."
      );
    }
  }

  async function stopCamera() {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch (err) {
      console.error("Gagal mematikan kamera:", err);
    } finally {
      setIsScanning(false);
      scannerRef.current = null;
    }
  }

  async function handleProcessScan(rawQrText: string) {
    if (!rawQrText.trim()) return;

    setScanLoading(true);
    setErrorMessage("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(`${API_URL}/api/orders/scan-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_data: rawQrText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScanResult(null);
        throw new Error(data.message || "Gagal memverifikasi tiket");
      }

      setScanResult(data);
      setScanHistory((prev) => [data, ...prev.slice(0, 9)]);
    } catch (err: any) {
      console.error("Scan Error:", err);
      setErrorMessage(err.message || "Gagal membaca data tiket");
    } finally {
      setScanLoading(false);
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessScan(manualCode.trim());
    setManualCode("");
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Gate Check-In Scanner
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111844] tracking-tight">
              Scan & Validasi Tiket Konser
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Arahkan kamera ke QR Code e-tiket penonton di aplikasi mobile atau masukkan kode tiket secara manual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isScanning ? (
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" /> Buka Kamera Scanner
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <CameraOff className="w-4 h-4" /> Matikan Kamera
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <p className="font-bold">Verifikasi Tiket Gagal</p>
                <p className="mt-0.5 text-rose-600">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage("")}
                className="text-xs font-semibold hover:underline"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Kamera Scanner & Input Manual (7 Kolom) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Box Kamera Scanner */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_12px_36px_-6px_rgba(17,24,68,0.06)] p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                      Lensa Pemindai QR Code
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isScanning ? "Kamera aktif • Mengarahkan fokus..." : "Kamera sedang standby"}
                    </p>
                  </div>
                </div>

                {isScanning && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Scan
                  </span>
                )}
              </div>

              {/* Viewport Scanner */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 min-h-[300px] flex items-center justify-center">
                <div id="qr-reader" className="w-full"></div>

                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-xs">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white mb-3">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-white font-bold text-sm sm:text-base">
                      Kamera Belum Diaktifkan
                    </p>
                    <p className="text-slate-400 text-xs max-w-xs mt-1">
                      Klik tombol di bawah ini untuk mengaktifkan pemindai gate tiket.
                    </p>
                    <button
                      onClick={startCamera}
                      className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md"
                    >
                      Mulai Pindai Kamera
                    </button>
                  </div>
                )}

                {scanLoading && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                    <p className="text-xs font-bold">Memverifikasi ke Database...</p>
                  </div>
                )}
              </div>

              {/* Input Manual Kode */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <form onSubmit={handleManualSubmit}>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Atau Masukkan Kode Tiket / NIK Manual:
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Contoh: CTX-VVI-11 atau tempel teks QR..."
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!manualCode.trim() || scanLoading}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-[#111844] disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm shrink-0"
                    >
                      Validasi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Hasil Validasi Tiket & Riwayat Scan (5 Kolom) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Status Card Tiket */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_12px_36px_-6px_rgba(17,24,68,0.06)] p-6">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-4 flex items-center justify-between">
                <span>Hasil Validasi Gate</span>
                {scanResult && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md">
                    Terverifikasi
                  </span>
                )}
              </h3>

              {scanResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  {/* Badge Hasil Sukses */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-extrabold text-emerald-800">
                      TIKET BERHASIL MASUK
                    </h4>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {scanResult.message}
                    </p>
                  </div>

                  {/* Detail Kartu Tiket */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 font-sans">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Event Konser
                      </span>
                      <p className="font-extrabold text-slate-900 text-sm">
                        {scanResult.event}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Kategori
                        </span>
                        <p className="font-bold text-indigo-600 text-xs">
                          {scanResult.kategori}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Kode Tiket
                        </span>
                        <p className="font-bold text-slate-800 text-xs font-mono">
                          {scanResult.ticket_code}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Nama Pemegang
                        </span>
                        <p className="font-semibold text-slate-800 text-xs">
                          {scanResult.pemegang}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          No. Identitas (NIK)
                        </span>
                        <p className="font-semibold text-slate-800 text-xs font-mono">
                          {scanResult.nik}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setScanResult(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                    >
                      Pindai Tiket Berikutnya &rarr;
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                  <Ticket className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">
                    Belum Ada Tiket yang Dipindai
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Silakan scan QR code dari mobile e-tiket pengunjung untuk melihat validitas tiket.
                  </p>
                </div>
              )}
            </div>

            {/* Riwayat Scan Sesi Ini */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_12px_36px_-6px_rgba(17,24,68,0.06)] p-6">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
                <span>Riwayat Check-In (Sesi Ini)</span>
                <span className="text-xs text-slate-400 font-normal">
                  {scanHistory.length} tiket
                </span>
              </h3>

              {scanHistory.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Riwayat pemindaian tiket gate akan muncul di sini.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {scanHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{item.pemegang}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.ticket_code} • {item.kategori}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        Masuk
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
