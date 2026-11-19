"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import AdminShell from "@/components/AdminShell";
import Image from "next/image";
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
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Printer,
  Download,
  AlertTriangle,
  Flame,
  CheckCheck,
  Video,
  KeyRound,
  Layers,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Ban,
  Activity,
  Sliders,
  ChevronDown,
  Building2,
  MapPin,
  Compass,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface EventItem {
  id: string | number;
  judul: string;
  poster?: string | null;
  tanggal?: string;
  jam?: string;
  open_gate?: string;
  lokasi?: string;
  status?: string;
  kategori?: string;
  total_tiket?: number;
  sudah_masuk?: number;
  gates?: string[];
}

interface ScanResult {
  valid: boolean;
  message: string;
  ticket_code: string;
  order_id?: string | number;
  event: string;
  event_id?: string | number;
  kategori: string;
  pemegang: string;
  nik?: string;
  zona?: string;
  status: string;
  scanned_at: string;
  gate?: string;
  already_used?: boolean;
  wrong_event?: boolean;
  reason?: string;
}

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: "ev-1",
    judul: "Soundfest Jakarta 2026",
    poster: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    tanggal: "2026-03-20",
    jam: "19:00 WIB",
    open_gate: "15:00 WIB",
    lokasi: "Stadion Madya GBK, Jakarta Pusat",
    status: "aktif",
    kategori: "Festival Musik",
    total_tiket: 14500,
    sudah_masuk: 9840,
    gates: ["Main Gate A (Utara)", "VIP North Gate", "Gate B (Selatan)"]
  },
  {
    id: "ev-2",
    judul: "Java Jazz Festival 2026",
    poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    tanggal: "2026-03-14",
    jam: "16:00 WIB",
    open_gate: "14:00 WIB",
    lokasi: "JIExpo Kemayoran, Jakarta Pusat",
    status: "aktif",
    kategori: "Festival Musik Internasional",
    total_tiket: 20000,
    sudah_masuk: 12450,
    gates: ["Gate 1 Hall D (Utama)", "Gate 2 Hall A (VIP & Media)", "Gate 3 Hall B"]
  },
  {
    id: "ev-3",
    judul: "Sheila on 7 - Tunggu Aku di Jakarta",
    poster: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=80",
    tanggal: "2026-04-05",
    jam: "20:00 WIB",
    open_gate: "17:00 WIB",
    lokasi: "Beach City International Stadium, Ancol",
    status: "aktif",
    kategori: "Konser Musik Tunggal",
    total_tiket: 18000,
    sudah_masuk: 5320,
    gates: ["Gate Barat (Reguler)", "Gate Timur (VIP Lounge)"]
  }
];

export default function ScanTiketPage() {
  // Event Selection States
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedGate, setSelectedGate] = useState<string>("Main Gate A (Utara)");
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Scanner & Processing States
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Settings Toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [preventDuplicate, setPreventDuplicate] = useState(true);

  // History & Filter States
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "success" | "failed">("all");
  const [lastValidation, setLastValidation] = useState<ScanResult | null>(null);

  // Real-time Metrics counters (dynamic based on selected event)
  const [totalCapacity, setTotalCapacity] = useState(14500);
  const [checkedInCount, setCheckedInCount] = useState(9840);
  const [failedCount, setFailedCount] = useState(12);

  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  // Fetch list of events from backend
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadingEvents(true);
        const res = await fetch(`${API_URL}/api/events`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted: EventItem[] = data.map((ev: any) => {
              let posterUrl: string | null = null;
              if (ev.poster) {
                if (ev.poster.startsWith("http://") || ev.poster.startsWith("https://")) {
                  posterUrl = ev.poster;
                } else if (ev.poster.startsWith("/uploads/")) {
                  posterUrl = `${API_URL}${ev.poster}`;
                } else {
                  posterUrl = `${API_URL}/uploads/posters/${ev.poster.replace(/^\//, "")}`;
                }
              }

              return {
                id: ev.id,
                judul: ev.judul,
                poster: posterUrl,
                tanggal: ev.tanggal,
                jam: ev.jam,
                open_gate: ev.open_gate || "15:00 WIB",
                lokasi: ev.lokasi,
                status: ev.status || "aktif",
                kategori: ev.kategori || "Konser Musik",
                total_tiket: 10000,
                sudah_masuk: 4200,
                gates: ["Pintu Gate A (Utama)", "Pintu Gate B (VIP)", "Pintu Gate C"]
              };
            });
            setEvents(formatted);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil event dari server, memakai data fallback:", err);
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, []);

  // Set initial event data & fetch real gate stats from backend
  const handleSelectEvent = async (ev: EventItem) => {
    setSelectedEvent(ev);
    setSelectedGate(ev.gates?.[0] || "Pintu Gate A (Utama)");
    setTotalCapacity(ev.total_tiket || 1000);
    setCheckedInCount(0);
    setFailedCount(0);
    setLastValidation(null);
    setErrorMessage("");
    setScanHistory([]);

    try {
      const res = await fetch(`${API_URL}/api/orders/gate-stats?event_id=${ev.id}`);
      if (res.ok) {
        const stats = await res.json();
        if (stats.total_capacity) setTotalCapacity(stats.total_capacity);
        if (typeof stats.checked_in_count === "number") setCheckedInCount(stats.checked_in_count);
        if (Array.isArray(stats.history) && stats.history.length > 0) {
          setScanHistory(stats.history);
        }
      }
    } catch (e) {
      console.warn("Menggunakan kapasitas default event:", e);
    }
  };

  const handleBackToSelectEvent = async () => {
    await stopCamera();
    setSelectedEvent(null);
  };

  // Audio Beep synthesis via Web Audio API
  const playSound = (type: "success" | "error") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch {
      // Audio playback suppressed or unsupported
    }
  };

  // Stop camera on unmount
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

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }

      element.innerHTML = "";

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      setIsScanning(true);

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: facingMode },
        config,
        async (decodedText: string) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          try {
            await handleProcessScan(decodedText);
          } finally {
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 2500);
          }
        },
        () => {
          // Frame callback
        }
      );
    } catch (err: any) {
      console.error("Gagal memulai kamera:", err);
      setIsScanning(false);
      setErrorMessage(
        "Kamera tidak dapat diakses atau izin kamera ditolak. Anda tetap dapat memasukkan Kode Booking manual di bawah."
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

  const toggleFacingMode = async () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (isScanning) {
      await stopCamera();
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  };

  const toggleFlashlight = async () => {
    setFlashlightOn((prev) => !prev);
  };

  // Core Ticket Verification Processing with Event Matching Check
  async function handleProcessScan(rawQrText: string) {
    if (!rawQrText.trim()) return;
    if (!selectedEvent) {
      setErrorMessage("Silakan pilih event terlebih dahulu sebelum memindai tiket.");
      return;
    }

    setScanLoading(true);
    setErrorMessage("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(`${API_URL}/api/orders/scan-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          qr_data: rawQrText,
          event_id: selectedEvent.id,
          event_title: selectedEvent.judul,
          prevent_duplicate: preventDuplicate
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const failedItem: ScanResult = {
          valid: false,
          already_used: data.already_used || false,
          wrong_event: data.wrong_event || false,
          message: data.message || "Verifikasi Tiket Gagal / Ditolak",
          ticket_code: data.ticket_code || rawQrText.slice(0, 18).toUpperCase(),
          event: data.event || selectedEvent.judul,
          event_id: selectedEvent.id,
          kategori: data.kategori || "Reguler",
          pemegang: data.pemegang || "Pengunjung",
          nik: data.nik || "-",
          zona: selectedGate,
          status: data.already_used ? "REJECTED" : data.wrong_event ? "WRONG-EVENT" : "FAILED",
          scanned_at: new Date().toISOString(),
          gate: selectedGate,
          reason: data.message
        };

        playSound("error");
        setLastValidation(failedItem);
        setScanHistory((prev) => [failedItem, ...prev.slice(0, 19)]);
        setFailedCount((c) => c + 1);
        throw new Error(data.message || "Tiket tidak valid");
      }

      // Success Item
      const successItem: ScanResult = {
        valid: true,
        message: data.message || "TIKET VALID & BERHASIL CHECK-IN",
        ticket_code: data.ticket_code || rawQrText.trim().toUpperCase(),
        order_id: data.order_id,
        event: data.event || selectedEvent.judul,
        event_id: selectedEvent.id,
        kategori: data.kategori || "VIP Experience",
        pemegang: data.pemegang || "Pengunjung Terdaftar",
        nik: data.nik || "3172048819200001",
        zona: "Row VIP - 04",
        status: "CHECKED-IN",
        scanned_at: data.scanned_at || new Date().toISOString(),
        gate: selectedGate
      };

      playSound("success");
      setLastValidation(successItem);
      setScanHistory((prev) => [successItem, ...prev.slice(0, 19)]);
      setCheckedInCount((c) => c + 1);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memproses tiket");
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

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setManualCode(text.trim());
      } else {
        setManualCode("CTX-SF25-88314");
      }
    } catch {
      setManualCode("CTX-SF25-88314");
    }
  };

  // Reset / Bersihkan memory scan di backend
  const handleResetScanned = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/scan-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setScanHistory([]);
        setLastValidation(null);
        setFailedCount(0);
        setErrorMessage("");
        alert("Riwayat scan berhasil dibersihkan! Anda dapat memindai tiket kembali.");
      }
    } catch (e) {
      console.error("Gagal reset status scan:", e);
    }
  };

  // Export scan log as CSV
  const handleExportCSV = () => {
    if (scanHistory.length === 0) return;
    const headers = ["Waktu", "Kode Tiket", "Event", "Nama Pengunjung", "Kategori", "Status", "Pintu Gate", "Keterangan"];
    const rows = scanHistory.map((item) => [
      item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString("id-ID") : "-",
      `"${item.ticket_code}"`,
      `"${item.event}"`,
      `"${item.pemegang}"`,
      `"${item.kategori}"`,
      item.valid ? "BERHASIL" : "GAGAL/DITOLAK",
      `"${item.gate || selectedGate}"`,
      `"${item.reason || item.message || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scan-log-${selectedEvent?.judul || "gate"}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Pass Receipt
  const handlePrintReceipt = (item: ScanResult) => {
    const printWindow = window.open("", "_blank", "width=420,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Bukti Gate Pass - ${item.ticket_code}</title>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 24px; text-align: center; color: #111844; margin: 0; }
            .badge { display: inline-block; background: #ecfdf5; color: #047857; padding: 6px 14px; border-radius: 9999px; font-weight: bold; font-size: 11px; margin-bottom: 12px; letter-spacing: 0.05em; }
            .card { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; }
            .title { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
            .subtitle { font-size: 12px; color: #64748b; margin-bottom: 16px; }
            .details { text-align: left; font-size: 13px; line-height: 1.8; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            .footer { margin-top: 20px; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">CONCERTIX ACCESS PASS</div>
            <div class="title">TIKET VALID CHECK-IN</div>
            <div class="subtitle">${item.event}</div>
            <div class="details">
              <div><strong>Kode Tiket:</strong> ${item.ticket_code}</div>
              <div><strong>Pengunjung:</strong> ${item.pemegang}</div>
              <div><strong>Kategori:</strong> ${item.kategori}</div>
              <div><strong>Zona / Kursi:</strong> ${item.zona || "General Admission"}</div>
              <div><strong>Waktu Masuk:</strong> ${new Date(item.scanned_at).toLocaleString("id-ID")}</div>
              <div><strong>Pintu Akses:</strong> ${item.gate || selectedGate}</div>
            </div>
            <div class="footer">Simpan lembar ini sebagai tanda akses resmi di dalam area venue konser.</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Filtered Events for Selection Screen
  const filteredEvents = useMemo(() => {
    if (!eventSearchQuery.trim()) return events;
    const q = eventSearchQuery.toLowerCase();
    return events.filter(
      (ev) =>
        ev.judul.toLowerCase().includes(q) ||
        (ev.lokasi && ev.lokasi.toLowerCase().includes(q)) ||
        (ev.kategori && ev.kategori.toLowerCase().includes(q))
    );
  }, [events, eventSearchQuery]);

  // Filtered History List
  const filteredHistory = useMemo(() => {
    if (activeFilter === "success") return scanHistory.filter((i) => i.valid);
    if (activeFilter === "failed") return scanHistory.filter((i) => !i.valid);
    return scanHistory;
  }, [scanHistory, activeFilter]);

  const remainingCount = Math.max(0, totalCapacity - checkedInCount);
  const checkedInPercent = totalCapacity > 0 ? ((checkedInCount / totalCapacity) * 100).toFixed(1) : "0";
  const remainingPercent = totalCapacity > 0 ? ((remainingCount / totalCapacity) * 100).toFixed(1) : "0";

  // =========================================================================
  // VIEW 1: PILIH EVENT TERLEBIH DAHULU (SELECTION SCREEN)
  // =========================================================================
  if (!selectedEvent) {
    return (
      <AdminShell>
        <div className="flex flex-col w-full pb-16 space-y-7">
          {/* Top Title & Step Description */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">
                  LANGKAH 1 DARI 2
                </span>
                <span className="text-slate-300 text-xs">•</span>
                <span className="text-xs text-slate-500 font-medium">Pemilihan Acara Konser</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111844] tracking-tight">
                Pilih Event untuk Memulai Scan Tiket
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Silakan pilih event konser yang sedang berlangsung di gate. Tiket yang dipindai akan divalidasi secara otomatis agar <strong>wajib sesuai</strong> dengan event yang Anda pilih.
              </p>
            </div>

            {/* Event Search Bar */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={eventSearchQuery}
                onChange={(e) => setEventSearchQuery(e.target.value)}
                placeholder="Cari nama event konser..."
                className="w-full h-11 pl-10 pr-4 rounded-full bg-white text-slate-900 text-xs border border-slate-200/90 focus:outline-none focus:border-[#111844] focus:ring-1 focus:ring-[#111844] shadow-xs transition"
              />
            </div>
          </div>

          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <motion.div
                key={ev.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl p-5 shadow-xs hover:shadow-md border border-slate-200/80 flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Poster Thumbnail */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-900 mb-4 border border-slate-100">
                    {ev.poster ? (
                      <img
                        src={ev.poster}
                        alt={ev.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                        <Ticket className="w-8 h-8 text-slate-400" />
                        <span className="text-xs font-semibold">Poster Acara</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-blue-600 text-[10px] font-bold shadow-xs">
                        {ev.kategori || "Konser Musik"}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        {ev.tanggal
                          ? new Date(ev.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "Jadwal Segera"}
                      </span>
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Siap Scan Gate
                      </span>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <h3 className="text-base font-extrabold text-[#111844] tracking-tight line-clamp-1 mb-2">
                    {ev.judul}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{ev.lokasi || "Lokasi Venue Utama"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Open Gate: <strong>{ev.open_gate || "15:00 WIB"}</strong> • Mulai: {ev.jam || "19:00 WIB"}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Estimasi Kapasitas</span>
                    <span className="font-bold text-[#111844]">
                      {ev.total_tiket?.toLocaleString("id-ID") || "10.000"} Tiket
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectEvent(ev)}
                    className="w-full py-2.5 px-4 bg-[#111844] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 group-hover:bg-blue-600"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Pilih Event &amp; Buka Scanner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Tidak Menemukan Event</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Tidak ada event konser yang cocok dengan kata kunci &quot;{eventSearchQuery}&quot;. Silakan periksa kembali kata pencarian.
              </p>
            </div>
          )}
        </div>
      </AdminShell>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE SCANNER VIEW (EVENT SELECTED)
  // =========================================================================
  return (
    <AdminShell>
      {/* Laser Scanning Animation Style */}
      <style>{`
        @keyframes laserMove {
          0% { top: 6%; opacity: 0.8; }
          50% { top: 90%; opacity: 1; }
          100% { top: 6%; opacity: 0.8; }
        }
        .scanner-laser-bar {
          animation: laserMove 2.4s ease-in-out infinite;
        }
        #qr-reader {
          border: none !important;
          background: transparent !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem;
        }
        #qr-reader__scan_region {
          background: transparent !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
      `}</style>

      <div className="flex flex-col w-full pb-16 space-y-6">
        {/* Top Active Event Banner Bar */}
        <div className="bg-white rounded-2xl md:rounded-[24px] p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Event Poster Pill */}
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 shadow-xs">
              {selectedEvent.poster ? (
                <img
                  src={selectedEvent.poster}
                  alt={selectedEvent.judul}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <Ticket className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  Event Aktif di Gate
                </span>
                <span className="text-slate-300 text-xs">•</span>
                <span className="text-xs text-slate-500 font-medium truncate">
                  {selectedEvent.lokasi}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#111844] tracking-tight truncate">
                {selectedEvent.judul}
              </h1>
            </div>
          </div>

          {/* Action: Switch Gate & Change Event Button */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Gate Selector */}
            <div className="relative bg-slate-50 border border-slate-200 rounded-full flex items-center pr-3 pl-2.5 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              <select
                value={selectedGate}
                onChange={(e) => setSelectedGate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 pr-5 focus:outline-none cursor-pointer appearance-none text-xs"
              >
                {selectedEvent.gates?.map((gateName) => (
                  <option key={gateName} value={gateName}>
                    {gateName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5" />
            </div>

            {/* Reset Scanned Memory Button */}
            <button
              type="button"
              onClick={handleResetScanned}
              title="Bersihkan riwayat scan di gate agar tiket dapat diuji ulang"
              className="px-3 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200/60 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Scan</span>
            </button>

            {/* Change Event Button */}
            <button
              type="button"
              onClick={handleBackToSelectEvent}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ganti Event</span>
            </button>
          </div>
        </div>

        {/* KPI / Real-time Metrics Banner (4 Cards Bento) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Tiket Event (Filter: Semua) */}
          <div
            onClick={() => setActiveFilter("all")}
            role="button"
            tabIndex={0}
            className={`bg-white rounded-2xl p-5 shadow-xs border cursor-pointer transition-all hover:shadow-md select-none group relative overflow-hidden ${
              activeFilter === "all"
                ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20"
                : "border-slate-200/80 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Total Tiket Event
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <Ticket className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl lg:text-3xl font-extrabold text-[#111844] tracking-tight">
                {totalCapacity.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Kapasitas Gate
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeFilter === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {activeFilter === "all" ? "Filter Aktif" : "Klik Filter"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Sudah Masuk (Filter: Berhasil) */}
          <div
            onClick={() => setActiveFilter("success")}
            role="button"
            tabIndex={0}
            className={`bg-white rounded-2xl p-5 shadow-xs border cursor-pointer transition-all hover:shadow-md select-none group relative overflow-hidden ${
              activeFilter === "success"
                ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
                : "border-slate-200/80 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-emerald-700 tracking-wider">
                Sudah Masuk (Checked-in)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {checkedInCount.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  {checkedInPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(checkedInPercent)))}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                <span>Tiket terverifikasi</span>
                <span className={`font-bold px-1.5 py-0.2 rounded ${activeFilter === "success" ? "bg-emerald-600 text-white" : "text-emerald-700"}`}>
                  {activeFilter === "success" ? "Filter Aktif" : "Klik Filter"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Belum Masuk */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Belum Masuk
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {remainingCount.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                  {remainingPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(remainingPercent)))}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                <span>Sisa kuota gate</span>
                <span className="font-medium text-slate-500">Standby</span>
              </div>
            </div>
          </div>

          {/* Card 4: Percobaan Gagal / Duplikat (Filter: Gagal) */}
          <div
            onClick={() => setActiveFilter("failed")}
            role="button"
            tabIndex={0}
            className={`bg-white rounded-2xl p-5 shadow-xs border cursor-pointer transition-all hover:shadow-md select-none group relative overflow-hidden ${
              activeFilter === "failed"
                ? "border-rose-600 ring-2 ring-rose-600/20 bg-rose-50/20"
                : "border-slate-200/80 hover:border-rose-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-rose-600 tracking-wider">
                Percobaan Gagal / Ditolak
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold text-rose-600 tracking-tight">
                  {failedCount}
                </span>
                <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                  Ditolak
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-rose-600">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  Beda Event / Duplikat
                </span>
                <span className={`font-bold px-1.5 py-0.2 rounded ${activeFilter === "failed" ? "bg-rose-600 text-white" : "text-rose-600"}`}>
                  {activeFilter === "failed" ? "Filter Aktif" : "Klik Filter"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert Message (If any) */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <p className="font-bold">Verifikasi Tiket Gagal</p>
                <p className="mt-0.5 text-rose-600">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 underline"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid: 2 Columns Balanced */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* LEFT COLUMN: Live Camera Scanner & Validation Box (7 Kolom) */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            {/* Interactive Camera Card */}
            <div className="bg-white rounded-2xl md:rounded-[28px] p-6 shadow-xs border border-slate-200/80 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Scanner Kamera Gate Aktif
                    </h2>
                    <p className="text-xs text-slate-400">
                      Target Event: <strong className="text-blue-600">{selectedEvent.judul}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Siap Scan
                  </span>

                  {!isScanning ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3.5 py-1.5 bg-[#111844] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" /> Buka Kamera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    >
                      <CameraOff className="w-3.5 h-3.5" /> Matikan
                    </button>
                  )}
                </div>
              </div>

              {/* Camera Viewfinder Viewport */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center select-none shadow-inner border border-slate-800">
                {/* HTML5 QR Code Mount Element */}
                <div id="qr-reader" className="w-full h-full relative z-0"></div>

                {/* Subtle Camera Background Mesh / Ambient when camera is off */}
                {!isScanning && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/80 z-10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-3 border border-white/15">
                      <Camera className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-white font-bold text-base">Lensa Pemindai Standby</p>
                    <p className="text-slate-400 text-xs max-w-xs mt-1">
                      Klik tombol di bawah untuk mengaktifkan kamera scanner khusus event <strong>{selectedEvent.judul}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Aktifkan Scanner Kamera</span>
                    </button>
                  </div>
                )}

                {/* Crosshairs Focus Target & Neon Laser when Scanning */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-4">
                    <div className="relative w-64 h-64 flex flex-col items-center justify-between p-2">
                      {/* Animated Neon Laser Bar */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] scanner-laser-bar" />

                      {/* Top Left Corner */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl"></div>
                      {/* Top Right Corner */}
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl"></div>
                      {/* Bottom Left Corner */}
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl"></div>
                      {/* Bottom Right Corner */}
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl"></div>

                      {/* Subtle Center Crosshair */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-40">
                        <Sparkles className="w-8 h-8 text-cyan-200" />
                      </div>

                      <div className="w-full text-center mt-auto pb-2 z-20">
                        <span className="bg-black/70 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold border border-white/10 tracking-wide inline-flex items-center gap-1.5 shadow-md">
                          <QrCode className="w-3.5 h-3.5 text-cyan-300" />
                          Arahkan QR Code ke dalam kotak bidik
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Camera Stream Controls Overlay Bottom */}
                <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 text-white text-xs border border-white/10">
                    <Video className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Kamera Gate {facingMode === "environment" ? "Belakang" : "Depan"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleFlashlight}
                      className={`w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center transition-colors border border-white/10 ${
                        flashlightOn ? "bg-amber-500 text-white" : "bg-black/60 text-white hover:bg-black/80"
                      }`}
                      title="Lampu Kilat / Flash"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/10"
                      title="Ganti Input Kamera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Processing Overlay */}
                {scanLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-30">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-2" />
                    <p className="text-xs font-bold">Memverifikasi ke Database Concertix...</p>
                  </div>
                )}
              </div>

              {/* Manual Code Verification Alternative */}
              <div className="mt-5 pt-4 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    Input Manual Booking ID / Tiket
                  </span>
                  <span className="text-[11px] text-slate-400">Verifikasi khusus {selectedEvent.judul}</span>
                </div>

                <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Contoh: CTX-SF25-99812"
                      className="w-full h-11 pl-10 pr-24 rounded-full bg-white text-slate-900 text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 focus:outline-none focus:border-[#111844] focus:ring-1 focus:ring-[#111844] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-full text-[10px] font-bold transition"
                    >
                      PASTE
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!manualCode.trim() || scanLoading}
                    className="h-11 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md active:scale-95 transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Validasi Kode</span>
                  </button>
                </form>
              </div>

              {/* Live Validation Feedback Card (SUCCESS, WRONG EVENT, OR REJECTED STATE) */}
              {lastValidation ? (
                <div
                  className={`mt-5 p-5 rounded-2xl flex flex-col gap-4 border transition-all ${
                    lastValidation.valid
                      ? "bg-emerald-500/10 border-emerald-200 text-emerald-950"
                      : lastValidation.wrong_event
                      ? "bg-amber-500/10 border-amber-200 text-amber-950"
                      : "bg-rose-500/10 border-rose-200 text-rose-950"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md ${
                          lastValidation.valid
                            ? "bg-emerald-600 shadow-emerald-600/30"
                            : lastValidation.wrong_event
                            ? "bg-amber-500 shadow-amber-500/30"
                            : "bg-rose-600 shadow-rose-600/30"
                        }`}
                      >
                        {lastValidation.valid ? (
                          <CheckCircle2 className="w-7 h-7" />
                        ) : lastValidation.wrong_event ? (
                          <AlertTriangle className="w-7 h-7" />
                        ) : (
                          <XCircle className="w-7 h-7" />
                        )}
                      </div>
                      <div>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-extrabold ${
                            lastValidation.valid
                              ? "text-emerald-800"
                              : lastValidation.wrong_event
                              ? "text-amber-800"
                              : "text-rose-800"
                          }`}
                        >
                          HASIL VALIDASI TERAKHIR
                        </span>
                        <h3 className="text-base font-extrabold">
                          {lastValidation.valid
                            ? "TIKET VALID & BERHASIL CHECK-IN"
                            : lastValidation.wrong_event
                            ? "TIKET TIDAK SESUAI DENGAN EVENT INI!"
                            : "TIKET DITOLAK / TIDAK VALID"}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`text-white text-[11px] px-3 py-1 rounded-full font-bold shadow-xs ${
                        lastValidation.valid
                          ? "bg-emerald-600"
                          : lastValidation.wrong_event
                          ? "bg-amber-600"
                          : "bg-rose-600"
                      }`}
                    >
                      {lastValidation.valid
                        ? `SUKSES • ${lastValidation.gate || "GATE"}`
                        : lastValidation.wrong_event
                        ? "BEDA EVENT"
                        : "GAGAL • DITOLAK"}
                    </span>
                  </div>

                  {/* Customer & Ticket Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Nama Pengunjung
                      </span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate">
                        {lastValidation.pemegang}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Event Tiket Ini
                      </span>
                      <span className="text-xs font-bold text-blue-600 block mt-0.5 truncate">
                        {lastValidation.event}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Kategori Tiket
                      </span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate">
                        {lastValidation.kategori}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Waktu Masuk
                      </span>
                      <span className="text-xs font-bold text-slate-600 block mt-0.5">
                        {new Date(lastValidation.scanned_at).toLocaleTimeString("id-ID")} WIB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <ShieldCheck
                        className={`w-4 h-4 ${
                          lastValidation.valid
                            ? "text-emerald-600"
                            : lastValidation.wrong_event
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}
                      />
                      <span>
                        ID Tiket: <strong className="font-bold font-mono">{lastValidation.ticket_code}</strong>{" "}
                        ({lastValidation.valid ? "1x Entry Granted" : lastValidation.reason || "Akses Ditolak"})
                      </span>
                    </div>

                    {lastValidation.valid && (
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(lastValidation)}
                        className="text-emerald-800 hover:text-emerald-950 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Bukti Masuk</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <Ticket className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">Menunggu Pemindaian Tiket</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hasil pengecekan tiket untuk <strong>{selectedEvent.judul}</strong> akan tampil di sini.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Gate Hardware Settings Card */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-blue-600" />
                Konfigurasi Perangkat Gate &amp; Otomatisasi
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                {/* Switch 1: Suara Beep */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer border border-slate-200/60">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    Suara Beep
                  </span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                  />
                </label>

                {/* Switch 2: Auto Check-in */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer border border-slate-200/60">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    Auto Check-in
                  </span>
                  <input
                    type="checkbox"
                    checked={autoCheckin}
                    onChange={(e) => setAutoCheckin(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                  />
                </label>

                {/* Switch 3: Cegah Duplikat */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer border border-slate-200/60">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-rose-600" />
                    Cegah Duplikat
                  </span>
                  <input
                    type="checkbox"
                    checked={preventDuplicate}
                    onChange={(e) => setPreventDuplicate(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-time Check-in Log & Live Feed (5 Kolom) */}
          <div className="lg:col-span-6 flex flex-col space-y-5">
            <div className="bg-white rounded-2xl md:rounded-[28px] p-6 shadow-xs border border-slate-200/80 flex flex-col">
              {/* Feed Card Header with Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Riwayat Validasi Terakhir
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aktivitas arus masuk di {selectedGate} ({selectedEvent.judul})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Filter Pills */}
                  <div className="flex bg-slate-100 p-1 rounded-full text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveFilter("all")}
                      className={`px-3 py-1 rounded-full font-bold transition ${
                        activeFilter === "all"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter("success")}
                      className={`px-3 py-1 rounded-full font-bold transition ${
                        activeFilter === "success"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Berhasil
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter("failed")}
                      className={`px-3 py-1 rounded-full font-bold transition ${
                        activeFilter === "failed"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Gagal
                    </button>
                  </div>

                  {/* Export Button */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition"
                    title="Ekspor Log Hari Ini (.CSV)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Real-time Feed List */}
              <div className="flex flex-col space-y-3 mt-4 max-h-[500px] overflow-y-auto pr-1">
                {filteredHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Ticket className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Tidak Ada Log Sesuai Filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Silakan pilih filter lain atau lakukan pemindaian tiket baru.
                    </p>
                  </div>
                ) : (
                  filteredHistory.map((item, idx) => {
                    if (item.valid) {
                      return (
                        <div
                          key={`${item.ticket_code}-${idx}`}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/60 transition"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {item.pemegang}
                                </span>
                                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                                  {item.kategori}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-slate-600">
                                  {item.ticket_code}
                                </span>
                                <span>•</span>
                                <span>{new Date(item.scanned_at).toLocaleTimeString("id-ID")} WIB</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              Berhasil Masuk
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (item.status === "WRONG-EVENT") {
                      return (
                        <div
                          key={`${item.ticket_code}-${idx}`}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/80 hover:bg-amber-100/60 border border-amber-200/70 transition"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-amber-950 truncate">
                                  {item.pemegang}
                                </span>
                                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full shrink-0">
                                  Beda Event
                                </span>
                              </div>
                              <div className="text-[11px] text-amber-800 flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold">{item.ticket_code}</span>
                                <span>•</span>
                                <span>{new Date(item.scanned_at).toLocaleTimeString("id-ID")} WIB</span>
                                <span>•</span>
                                <span className="font-semibold text-amber-900">{item.reason || `Event: ${item.event}`}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-white px-2.5 py-1 rounded-full shadow-xs border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Event Tidak Cocok
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // Duplicated / Rejected
                    return (
                      <div
                        key={`${item.ticket_code}-${idx}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/80 hover:bg-rose-100/60 border border-rose-200/70 transition"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                            <XCircle className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-rose-950 truncate">
                                {item.pemegang}
                              </span>
                              <span className="text-[10px] bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded-full shrink-0">
                                {item.kategori}
                              </span>
                            </div>
                            <div className="text-[11px] text-rose-700 flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold">{item.ticket_code}</span>
                              <span>•</span>
                              <span>{new Date(item.scanned_at).toLocaleTimeString("id-ID")} WIB</span>
                              <span>•</span>
                              <span>{item.reason || "Tiket Pernah Di-scan"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-white px-2.5 py-1 rounded-full shadow-xs border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            Tiket Sudah Digunakan!
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Hourly Peak Flow Sparkline / Rate Visualization Mini Component */}
              <div className="mt-5 pt-4 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Kecepatan &amp; Aktivitas Gate
                  </span>
                  <span className="text-xs text-blue-600 font-bold">
                    {scanHistory.length > 0
                      ? `${scanHistory.length} Tiket Dipindai • Gate Lancar`
                      : "Menunggu Arus Masuk"}
                  </span>
                </div>

                {/* Dynamic SVG / HTML Sparkline of Flow */}
                <div className="w-full h-12 flex items-end gap-1.5 pt-2">
                  {[20, 35, 55, 80, 95, 70, scanHistory.length > 0 ? Math.min(100, scanHistory.length * 20) : 15].map(
                    (height, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t transition-all duration-300 ${
                          idx === 6
                            ? "bg-blue-600 shadow-xs"
                            : height > 70
                            ? "bg-blue-400 hover:bg-blue-600"
                            : "bg-blue-200 hover:bg-blue-400"
                        }`}
                        style={{ height: `${height}%` }}
                        title={`Sesi scan ke-${idx + 1}`}
                      />
                    )
                  )}
                </div>

                <div className="flex justify-between text-slate-400 text-[10px] pt-1">
                  <span>Awal Gate Dibuka</span>
                  <span className="text-blue-600 font-bold">
                    {checkedInCount > 0 ? `${checkedInCount} Pengunjung Masuk` : "Standby"}
                  </span>
                  <span>Waktu Sekarang</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
