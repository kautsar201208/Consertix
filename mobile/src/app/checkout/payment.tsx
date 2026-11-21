import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config/api';
import { storage } from '@/utils/storage';
import * as WebBrowser from 'expo-web-browser';

// Safe WebView wrapper (fallback gracefully if native package is not linked)
let RNativeWebView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RNativeWebView = require('react-native-webview')?.WebView || null;
} catch {
  RNativeWebView = null;
}

const SafeWebView = (props: any) => {
  if (RNativeWebView) {
    return <RNativeWebView {...props} />;
  }

  return (
    <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
      <Ionicons name="card-outline" size={54} color="#004AC6" style={{ marginBottom: 16 }} />
      <Text style={{ fontSize: 16, fontWeight: '800', color: '#131B2E', marginBottom: 8, textAlign: 'center' }}>
        Lanjutkan Pembayaran Midtrans
      </Text>
      <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
        Klik tombol di bawah untuk membuka gerbang pembayaran Midtrans Snap di jendela aman.
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (props.source?.uri) {
            WebBrowser.openBrowserAsync(props.source.uri);
          }
        }}
        style={{
          backgroundColor: '#004AC6',
          paddingHorizontal: 22,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          shadowColor: '#004AC6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Ionicons name="open-outline" size={18} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Buka Portal Midtrans</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    eventId?: string;
    categoryId?: string;
    ticketName?: string;
    ticketPrice?: string;
    quantity?: string;
    eventTitle?: string;
    eventDate?: string;
    eventLocation?: string;
    poster?: string;
    namaLengkap?: string;
    idNumber?: string;
    email?: string;
    phone?: string;
    dateBirth?: string;
  }>();

  // 1. Timer Countdown (14 menit 59 detik = 899 detik)
  const [secondsLeft, setSecondsLeft] = useState(14 * 60 + 59);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          Alert.alert(
            'Waktu Pembayaran Habis',
            'Sesi pembayaran telah kedaluwarsa. Silakan ulangi pemesanan Anda.',
            [{ text: 'OK', onPress: () => router.push('/(tabs)') }]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 2. State Pilihan Metode Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<
    'qris' | 'gopay' | 'bca_va' | 'mandiri_va' | 'cc'
  >('qris');
  const [showAllMethods, setShowAllMethods] = useState(false);

  // 3. State Data Pengunjung Sama
  const [sameVisitor, setSameVisitor] = useState(true);

  // 4. State Voucher & Proteksi
  const [appliedVoucher, setAppliedVoucher] = useState<'FESTIVALSERU' | null>('FESTIVALSERU');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [withProtection, setWithProtection] = useState(true);

  // 5. Loading proses bayar & State Modal Midtrans
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapUrl, setSnapUrl] = useState<string | null>(null);
  const [showSnapModal, setShowSnapModal] = useState(false);
  const [pendingOrderParams, setPendingOrderParams] = useState<any>(null);
  const [midtransOrderId, setMidtransOrderId] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const handleSimulateSandboxPayment = async () => {
    if (!midtransOrderId) return;
    try {
      const token = await storage.getItem('token');
      const res = await fetch(`${API_URL}/api/payments/simulate-sandbox-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ midtrans_order_id: midtransOrderId }),
      });
      if (res.ok) {
        setPaymentConfirmed(true);
        setTimeout(() => {
          setShowSnapModal(false);
          if (pendingOrderParams) {
            router.replace({
              pathname: '/checkout/success' as any,
              params: pendingOrderParams,
            });
          }
        }, 1200);
      }
    } catch (e) {
      console.warn('Simulasi error:', e);
    }
  };

  // Polling status pembayaran Midtrans setiap 4 detik selagi modal terbuka
  useEffect(() => {
    if (!showSnapModal || !midtransOrderId || paymentConfirmed) return;

    setIsPolling(true);
    let isMounted = true;

    const pollStatus = async () => {
      try {
        const token = await storage.getItem('token');
        const res = await fetch(
          `${API_URL}/api/payments/midtrans-status/${encodeURIComponent(midtransOrderId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data = await res.json();

        if (isMounted && data?.is_paid) {
          setPaymentConfirmed(true);
          setIsPolling(false);
        }
      } catch (_) {
        // silent
      }
    };

    const interval = setInterval(pollStatus, 3500);
    pollStatus(); // jalankan langsung sekali

    return () => {
      isMounted = false;
      setIsPolling(false);
      clearInterval(interval);
    };
  }, [showSnapModal, midtransOrderId, paymentConfirmed]);

  // Otomatis navigasi ke e-tiket begitu pembayaran terkonfirmasi (settlement)
  useEffect(() => {
    if (paymentConfirmed && pendingOrderParams) {
      const timer = setTimeout(() => {
        setShowSnapModal(false);
        router.replace({
          pathname: '/checkout/success' as any,
          params: pendingOrderParams,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [paymentConfirmed, pendingOrderParams]);

  // Kalkulasi Harga
  const ticketCount = parseInt(params.quantity || '1', 10);
  const unitPrice = parseInt(params.ticketPrice || '0', 10);
  const subtotal = unitPrice * ticketCount;
  const voucherDiscount = appliedVoucher ? 50000 : 0;
  const serviceFee = 10000;
  const protectionFee = withProtection ? 30000 : 0;
  const tax = Math.round(subtotal * 0.1);
  const totalBill = Math.max(0, subtotal - voucherDiscount + serviceFee + protectionFee + tax);

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'bca_va':
        return 'BCA Virtual Account';
      case 'mandiri_va':
        return 'Bank Mandiri Virtual Account';
      case 'gopay':
        return 'GoPay / GoPay Later';
      case 'cc':
        return 'Kartu Kredit / Debit';
      case 'qris':
      default:
        return 'QRIS Instant';
    }
  };

  const getModalSubtitle = () => {
    switch (paymentMethod) {
      case 'bca_va':
        return 'Salin Nomor BCA Virtual Account';
      case 'mandiri_va':
        return 'Salin Kode & Nomor Mandiri VA';
      case 'gopay':
        return 'Buka Aplikasi GoPay untuk Membayar';
      case 'cc':
        return 'Masukkan Data Kartu Kredit / Debit';
      case 'qris':
      default:
        return 'Scan QR Code QRIS';
    }
  };

  const handleApplyVoucher = () => {
    const code = voucherCodeInput.trim().toUpperCase();
    if (code === 'FESTIVALSERU' || code === 'CONCERTIX') {
      setAppliedVoucher('FESTIVALSERU');
      Alert.alert('Berhasil', `Voucher ${code} berhasil diterapkan! Potongan Rp50.000.`);
    } else {
      Alert.alert('Kode Tidak Valid', 'Kode voucher tidak ditemukan atau masa berlaku telah habis.');
    }
    setVoucherCodeInput('');
  };

  const handlePayNow = async () => {
    try {
      setIsProcessing(true);

      const token = await storage.getItem('token');
      const nameParts = (params.namaLengkap || 'Guest').trim().split(' ');
      const firstName = nameParts[0] || 'Pemesan';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // 1. Request API buatPesanan di backend
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticket_category_id: parseInt(params.categoryId || '1', 10),
          jumlah_tiket: ticketCount,
          first_name: firstName,
          last_name: lastName,
          email: params.email || 'customer@concertix.com',
          phone: params.phone || '081234567890',
          id_number: params.idNumber || '3171000000000001',
          date_birth: params.dateBirth || '1998-09-18',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal memproses pesanan');
      }

      // Sukses membuat pesanan di database
      const orderId = data?.order_id
        ? String(data.order_id)
        : String(Math.floor(100000 + Math.random() * 900000));

      const orderParams = {
        orderId,
        eventTitle: params.eventTitle,
        eventDate: params.eventDate,
        eventLocation: params.eventLocation,
        poster: params.poster,
        ticketName: params.ticketName,
        ticketPrice: params.ticketPrice,
        quantity: String(ticketCount),
        namaLengkap: params.namaLengkap,
        email: params.email,
        phone: params.phone,
        idNumber: params.idNumber,
        paymentMethod: getPaymentMethodLabel(),
        totalAmount: String(totalBill),
      };

      setPendingOrderParams(orderParams);

      // 2. Minta Snap Token / URL Pembayaran dari Midtrans
      const midtransRes = await fetch(`${API_URL}/api/payments/midtrans-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: totalBill,
          item_name: `${ticketCount}x ${params.ticketName || 'Tiket'} - ${params.eventTitle || 'Konser'}`,
          customer_name: params.namaLengkap || 'Pengunjung',
          customer_email: params.email || 'customer@concertix.id',
          customer_phone: params.phone || '081234567890',
          payment_method: paymentMethod,
        }),
      });

      if (!midtransRes.ok) {
        const errData = await midtransRes.json();
        throw new Error(errData.message || 'Gagal menyiapkan halaman pembayaran Midtrans');
      }

      const midtransData = await midtransRes.json();
      if (midtransData?.redirect_url) {
        // Tampilkan halaman pembayaran Midtrans (QRIS/VA) di modal in-app WebView
        setSnapUrl(midtransData.redirect_url);
        setMidtransOrderId(midtransData.order_id || null);
        setPaymentConfirmed(false);
        setShowSnapModal(true);
      } else {
        throw new Error('URL pembayaran Midtrans tidak ditemukan');
      }
    } catch (err: any) {
      console.error('Payment Error:', err);
      Alert.alert(
        'Gagal Memproses Pesanan',
        err.message || 'Terjadi kesalahan saat memproses pembayaran. Pastikan backend aktif.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getPosterUri = (poster: string | null | undefined) => {
    if (!poster) return null;
    const normalizedPoster = poster.replace(/\.avif$/i, '.jpg');
    if (normalizedPoster.startsWith('http')) return normalizedPoster;
    const cleanPoster = normalizedPoster.startsWith('/') ? normalizedPoster.slice(1) : normalizedPoster;
    if (cleanPoster.startsWith('uploads/')) {
      return `${API_URL}/${cleanPoster}`;
    }
    return `${API_URL}/uploads/posters/${cleanPoster}`;
  };

  const posterUri = getPosterUri(params.poster);

  const maskIdNumber = (idStr?: string) => {
    if (!idStr) return '317102******0004';
    if (idStr.length <= 8) return idStr;
    return idStr.substring(0, 6) + '******' + idStr.substring(idStr.length - 4);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#131B2E" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Pembayaran Tiket</Text>
            <View style={styles.encryptionRow}>
              <Ionicons name="lock-closed" size={11} color="#004AC6" />
              <Text style={styles.encryptionText}>ENKRIPSI 256-BIT</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.timerHeaderBadge}>
            <Ionicons name="timer-outline" size={14} color="#D22348" />
            <Text style={styles.timerHeaderText}>{formatTimer(secondsLeft)}</Text>
          </View>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Stepper Progress (Step 2 Active) */}
        <View style={styles.stepperCard}>
          <View style={styles.stepperTopInfo}>
            <Text style={styles.stepperSub}>LANGKAH 2 DARI 3 • PEMBAYARAN</Text>
            <Text style={styles.stepperPercent}>66% Selesai</Text>
          </View>
          <View style={styles.stepperRow}>
            {/* Background line */}
            <View style={styles.stepperBgLine} />
            {/* Active progress line from step 1 to 2 */}
            <View style={styles.stepperActiveLine} />

            {/* Step 1: Completed */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCompleted]}>
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepLabel, styles.stepLabelDone]}>1. Data Diri</Text>
            </View>

            {/* Step 2: Active */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepActive]}>
                <Ionicons name="card" size={15} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepLabel, styles.stepLabelActive]}>2. Bayar</Text>
            </View>

            {/* Step 3: Upcoming */}
            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Ionicons name="ticket-outline" size={15} color="#737686" />
              </View>
              <Text style={styles.stepLabel}>3. E-Tiket</Text>
            </View>
          </View>
        </View>

        {/* 3. Countdown Urgency Alert Banner */}
        <View style={styles.urgencyBanner}>
          <View style={styles.urgencyLeft}>
            <Ionicons name="timer" size={20} color="#D97706" />
            <View style={styles.urgencyTextBox}>
              <Text style={styles.urgencyTitle}>Selesaikan pembayaran dalam</Text>
              <Text style={styles.urgencySub}>Tiketmu diamankan sementara</Text>
            </View>
          </View>
          <View style={styles.urgencyPill}>
            <Text style={styles.urgencyPillText}>{formatTimer(secondsLeft)}</Text>
          </View>
        </View>

        {/* 4. Event Summary Card */}
        <View style={styles.eventCard}>
          <View style={styles.eventHeroImageContainer}>
            {posterUri ? (
              <Image source={{ uri: posterUri }} style={styles.eventHeroImage} resizeMode="cover" />
            ) : (
              <View style={styles.eventHeroPlaceholder}>
                <Ionicons name="musical-notes" size={36} color="#94A3B8" />
              </View>
            )}
            <View style={styles.eventHeroOverlay} />
            <View style={styles.eventCategoryBadge}>
              <Text style={styles.eventCategoryText}>Music Festival</Text>
            </View>
            <View style={styles.eventTitleBox}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {params.eventTitle || 'Soundfest Jakarta 2025'}
              </Text>
              <View style={styles.eventMetaRow}>
                <Ionicons name="calendar-outline" size={13} color="#EAEDFF" />
                <Text style={styles.eventMetaText} numberOfLines={1}>
                  {params.eventDate || 'Jumat, 24 Okt 2025'} • {params.eventLocation || 'Stadion GBK'}
                </Text>
              </View>
            </View>
          </View>

          {/* Ticket item rows */}
          <View style={styles.eventBody}>
            <View style={styles.ticketRowBox}>
              <View style={styles.ticketRowLeft}>
                <Text style={styles.ticketItemName}>
                  {ticketCount}x {params.ticketName || 'Festival - Presale 1'}
                </Text>
                <Text style={styles.ticketItemArea}>Standing Area (Zona A)</Text>
              </View>
              <Text style={styles.ticketItemPrice}>Rp{subtotal.toLocaleString('id-ID')}</Text>
            </View>

            <View style={styles.instantNotice}>
              <Ionicons name="checkmark-circle" size={16} color="#004AC6" />
              <Text style={styles.instantNoticeText}>
                E-Ticket instan otomatis masuk ke Email & Tab Tiket Saya
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Contact & Visitor Info (Data Pemesan) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleIconRow}>
              <Ionicons name="id-card-outline" size={20} color="#004AC6" />
              <Text style={styles.cardTitle}>Data Pemesan</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.editLink}>Ubah</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryUserBox}>
            <View style={styles.userRow}>
              <Text style={styles.userLabel}>Nama Lengkap</Text>
              <Text style={styles.userVal}>{params.namaLengkap || 'Dimas Arya Pratama'}</Text>
            </View>
            <View style={styles.userRow}>
              <Text style={styles.userLabel}>No. Identitas (KTP)</Text>
              <Text style={styles.userVal}>{maskIdNumber(params.idNumber)}</Text>
            </View>
            <View style={styles.userRow}>
              <Text style={styles.userLabel}>Email Konfirmasi</Text>
              <Text style={styles.userVal}>{params.email || 'dimas.arya@email.com'}</Text>
            </View>
            <View style={styles.userRow}>
              <Text style={styles.userLabel}>Nomor WhatsApp</Text>
              <Text style={styles.userVal}>
                {params.phone?.startsWith('+62') ? params.phone : `+62 ${params.phone || '812-3456-7890'}`}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.sameVisitorCheckboxRow}
            onPress={() => setSameVisitor(!sameVisitor)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkboxBox, sameVisitor && styles.checkboxBoxActive]}>
              {sameVisitor && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text style={styles.sameVisitorText}>Data pengunjung sama dengan data pemesan</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Promo & Voucher Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleIconRow}>
              <Ionicons name="ticket-outline" size={20} color="#004AC6" />
              <Text style={styles.cardTitle}>Voucher Promo</Text>
            </View>
            {appliedVoucher ? (
              <Text style={styles.promoActiveText}>1 Promo Terpasang</Text>
            ) : null}
          </View>

          {/* Applied Promo Voucher Card */}
          {appliedVoucher ? (
            <View style={styles.voucherAppliedBox}>
              <View style={styles.voucherAppliedLeft}>
                <View style={styles.voucherCheckIcon}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.voucherTextCol}>
                  <View style={styles.voucherCodeRow}>
                    <Text style={styles.voucherCodeText}>FESTIVALSERU</Text>
                    <View style={styles.voucherSavingBadge}>
                      <Text style={styles.voucherSavingText}>Hemat Rp50rb</Text>
                    </View>
                  </View>
                  <Text style={styles.voucherDesc}>
                    Potongan tiket Soundfest 2025 berhasil digunakan
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setAppliedVoucher(null)}
                style={styles.voucherRemoveBtn}
              >
                <Text style={styles.voucherRemoveText}>Ganti</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Input Promo */}
          <View style={styles.voucherInputRow}>
            <TextInput
              style={styles.voucherTextInput}
              placeholder="Masukkan kode promo lain"
              placeholderTextColor="#737686"
              value={voucherCodeInput}
              onChangeText={setVoucherCodeInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.voucherApplyBtn}
              onPress={handleApplyVoucher}
              activeOpacity={0.8}
            >
              <Text style={styles.voucherApplyBtnText}>Terapkan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. Payment Method Selection */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleIconRow}>
              <Ionicons name="card-outline" size={20} color="#004AC6" />
              <Text style={styles.cardTitle}>Metode Pembayaran</Text>
            </View>
            <View style={styles.safeTag}>
              <Ionicons name="shield-checkmark" size={13} color="#004AC6" />
              <Text style={styles.safeTagText}>Aman & Terenkripsi</Text>
            </View>
          </View>

          <View style={styles.methodsList}>
            {/* Option 1: QRIS Instant (Recommended) */}
            <TouchableOpacity
              style={[
                styles.methodOption,
                paymentMethod === 'qris' && styles.methodOptionActive,
              ]}
              onPress={() => setPaymentMethod('qris')}
              activeOpacity={0.85}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIconBox}>
                  <Image
                    source={require('@/assets/images/payments/qris.png')}
                    style={styles.methodLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.methodInfoCol}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>QRIS Instant</Text>
                    <View style={styles.recomBadge}>
                      <Text style={styles.recomBadgeText}>Rekomendasi</Text>
                    </View>
                  </View>
                  <Text style={styles.methodSub}>GoPay, OVO, Dana, BCA, ShopeePay</Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === 'qris' && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === 'qris' && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* Option 2: GoPay */}
            <TouchableOpacity
              style={[
                styles.methodOption,
                paymentMethod === 'gopay' && styles.methodOptionActive,
              ]}
              onPress={() => setPaymentMethod('gopay')}
              activeOpacity={0.85}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIconBox}>
                  <Image
                    source={require('@/assets/images/payments/gopay.png')}
                    style={styles.methodLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.methodInfoCol}>
                  <Text style={styles.methodTitle}>GoPay / GoPay Later</Text>
                  <Text style={styles.methodSub}>
                    Saldo aktif: <Text style={styles.boldText}>Rp850.000</Text>
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === 'gopay' && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === 'gopay' && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* Option 3: BCA Virtual Account */}
            <TouchableOpacity
              style={[
                styles.methodOption,
                paymentMethod === 'bca_va' && styles.methodOptionActive,
              ]}
              onPress={() => setPaymentMethod('bca_va')}
              activeOpacity={0.85}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIconBox}>
                  <Image
                    source={require('@/assets/images/payments/bca.png')}
                    style={styles.methodLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.methodInfoCol}>
                  <Text style={styles.methodTitle}>BCA Virtual Account</Text>
                  <Text style={styles.methodSub}>Verifikasi instan 24 jam tanpa bukti transfer</Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === 'bca_va' && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === 'bca_va' && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* Option 4: Bank Mandiri VA */}
            <TouchableOpacity
              style={[
                styles.methodOption,
                paymentMethod === 'mandiri_va' && styles.methodOptionActive,
              ]}
              onPress={() => setPaymentMethod('mandiri_va')}
              activeOpacity={0.85}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIconBox}>
                  <Image
                    source={require('@/assets/images/payments/mandiri.png')}
                    style={styles.methodLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.methodInfoCol}>
                  <Text style={styles.methodTitle}>Bank Mandiri Virtual Account</Text>
                  <Text style={styles.methodSub}>Konfirmasi pembayaran otomatis</Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === 'mandiri_va' && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === 'mandiri_va' && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* Option 5: Kartu Kredit / Debit */}
            <TouchableOpacity
              style={[
                styles.methodOption,
                paymentMethod === 'cc' && styles.methodOptionActive,
              ]}
              onPress={() => setPaymentMethod('cc')}
              activeOpacity={0.85}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIconBox}>
                  <Image
                    source={require('@/assets/images/payments/card.png')}
                    style={styles.methodLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.methodInfoCol}>
                  <Text style={styles.methodTitle}>Kartu Kredit / Debit Online</Text>
                  <Text style={styles.methodSub}>Visa, Mastercard, JCB (3D Secure)</Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === 'cc' && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === 'cc' && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.expandMethodsBtn}
            onPress={() => {
              setShowAllMethods(!showAllMethods);
              Alert.alert(
                'Metode Pembayaran Lengkap',
                'Metode pembayaran populer (QRIS, GoPay, BCA, Mandiri, dan Kartu Kredit) telah siap digunakan di atas.'
              );
            }}
          >
            <Text style={styles.expandMethodsText}>Lihat Semua 12 Metode Pembayaran</Text>
            <Ionicons
              name={showAllMethods ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#004AC6"
            />
          </TouchableOpacity>
        </View>

        {/* 8. Ticket Protection Add-on */}
        <View style={styles.protectionCard}>
          <View style={styles.protectionTop}>
            <View style={styles.protectionLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#4B41E1" />
              <View style={styles.protectionInfoCol}>
                <View style={styles.protectionTitleRow}>
                  <Text style={styles.protectionTitle}>Proteksi Pembatalan Acara</Text>
                  <View style={styles.refundBadge}>
                    <Text style={styles.refundBadgeText}>Refund 100%</Text>
                  </View>
                </View>
                <Text style={styles.protectionDesc}>
                  Kompensasi penuh jika berhalangan hadir akibat sakit darurat, kecelakaan, atau kendala transportasi.
                </Text>
              </View>
            </View>
            <Text style={styles.protectionPrice}>+Rp30.000</Text>
          </View>

          <View style={styles.protectionBottomRow}>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Syarat & Ketentuan Proteksi',
                  'Kompensasi 100% pengembalian dana tiket jika pembeli berhalangan hadir dengan bukti medis darurat atau pembatalan acara oleh promotor.'
                )
              }
            >
              <Text style={styles.tncLink}>Pelajari Syarat & Ketentuan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.protectionCheckRow}
              onPress={() => setWithProtection(!withProtection)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkboxBox,
                  styles.checkboxSecondary,
                  withProtection && styles.checkboxBoxActiveSecondary,
                ]}
              >
                {withProtection && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Sertakan Proteksi ({ticketCount} Tiket)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 9. Price Breakdown Details */}
        <View style={styles.card}>
          <View style={styles.titleIconRow}>
            <Ionicons name="receipt-outline" size={20} color="#004AC6" />
            <Text style={styles.cardTitle}>Rincian Pembayaran</Text>
          </View>

          <View style={styles.breakdownList}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal Tiket ({ticketCount} Tiket)</Text>
              <Text style={styles.breakdownVal}>Rp{subtotal.toLocaleString('id-ID')}</Text>
            </View>

            {appliedVoucher ? (
              <View style={styles.breakdownRow}>
                <View style={styles.discountLabelRow}>
                  <Ionicons name="pricetag" size={14} color="#059669" />
                  <Text style={styles.breakdownDiscountLabel}>
                    Diskon Voucher (FESTIVALSERU)
                  </Text>
                </View>
                <Text style={styles.breakdownDiscountVal}>-Rp50.000</Text>
              </View>
            ) : null}

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Biaya Layanan Aplikasi</Text>
              <Text style={styles.breakdownVal}>Rp{serviceFee.toLocaleString('id-ID')}</Text>
            </View>

            {withProtection ? (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Proteksi Konser ({ticketCount} Tiket)</Text>
                <Text style={styles.breakdownVal}>Rp{protectionFee.toLocaleString('id-ID')}</Text>
              </View>
            ) : null}

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Pajak Hiburan & Restitusi (10%)</Text>
              <Text style={styles.breakdownVal}>Rp{tax.toLocaleString('id-ID')}</Text>
            </View>

            <View style={styles.totalBox}>
              <View>
                <Text style={styles.totalBoxTitle}>Total Tagihan</Text>
                <Text style={styles.totalBoxSub}>Sudah termasuk pajak & asuransi</Text>
              </View>
              <Text style={styles.totalBoxAmount}>
                Rp{totalBill.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>

        {/* 10. Guarantee & Trust Strip */}
        <View style={styles.trustBadgesRow}>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={14} color="#004AC6" />
            <Text style={styles.trustText}>Enkripsi 256-bit</Text>
          </View>
          <Text style={styles.trustDot}>•</Text>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={14} color="#004AC6" />
            <Text style={styles.trustText}>Jaminan Tiket Asli</Text>
          </View>
          <Text style={styles.trustDot}>•</Text>
          <View style={styles.trustItem}>
            <Ionicons name="headset" size={14} color="#004AC6" />
            <Text style={styles.trustText}>Bantuan 24/7</Text>
          </View>
        </View>
      </ScrollView>

      {/* 11. Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomMainRow}>
          <View style={styles.bottomPriceCol}>
            <View style={styles.bottomPriceHeaderRow}>
              <Text style={styles.bottomPriceLabel}>Total Tagihan</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Rincian Tagihan',
                    `Subtotal: Rp${subtotal.toLocaleString('id-ID')}\nVoucher: -Rp${voucherDiscount.toLocaleString('id-ID')}\nBiaya Layanan: Rp${serviceFee.toLocaleString('id-ID')}\nProteksi: Rp${protectionFee.toLocaleString('id-ID')}\nPajak 10%: Rp${tax.toLocaleString('id-ID')}\nTotal: Rp${totalBill.toLocaleString('id-ID')}`
                  )
                }
              >
                <Ionicons name="information-circle-outline" size={14} color="#004AC6" />
              </TouchableOpacity>
            </View>
            <Text style={styles.bottomPriceValue}>
              Rp{totalBill.toLocaleString('id-ID')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.payBtn}
            activeOpacity={0.9}
            onPress={handlePayNow}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                <Text style={styles.payBtnText}>Bayar Sekarang</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.bottomDisclaimer}>
          Dengan bayar, kamu menyetujui S&K Pembelian Concertix
        </Text>
      </View>

      {/* 12. Modal Midtrans Snap Payment (QRIS / VA / E-Wallet) */}
      <Modal
        visible={showSnapModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (paymentConfirmed) return;
          Alert.alert(
            'Tutup Halaman Pembayaran?',
            'Pembayaran belum dikonfirmasi. Tutup halaman ini?',
            [
              { text: 'Lanjut Bayar', style: 'cancel' },
              {
                text: 'Tutup',
                style: 'destructive',
                onPress: () => setShowSnapModal(false),
              },
            ]
          );
        }}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          {/* Header Modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                if (paymentConfirmed) {
                  setShowSnapModal(false);
                  return;
                }
                Alert.alert(
                  'Tutup Pembayaran?',
                  'Pembayaran belum dikonfirmasi oleh sistem. Tutup?',
                  [
                    { text: 'Lanjut Bayar', style: 'cancel' },
                    {
                      text: 'Tutup',
                      style: 'destructive',
                      onPress: () => setShowSnapModal(false),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="close" size={22} color="#131B2E" />
            </TouchableOpacity>

            <View style={styles.modalHeaderCenter}>
              {paymentConfirmed ? (
                <>
                  <Text style={[styles.modalHeaderTitle, { color: '#059669' }]}>✓ Pembayaran Berhasil!</Text>
                  <Text style={styles.modalHeaderSubtitle}>Mengalihkan ke tiket...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.modalHeaderTitle}>{getPaymentMethodLabel()}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {isPolling && <ActivityIndicator size={10} color="#004AC6" />}
                    <Text style={styles.modalHeaderSubtitle}>
                      {isPolling ? 'Menunggu konfirmasi...' : getModalSubtitle()}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.modalDoneBtn, !paymentConfirmed && { backgroundColor: '#2563EB' }]}
              onPress={() => {
                if (!paymentConfirmed) {
                  Alert.alert(
                    'Mode Sandbox (Uji Coba)',
                    'Pembayaran uang riil (DANA/BCA asli) tidak masuk ke akun Sandbox Midtrans. Apakah Anda ingin mensimulasikan pembayaran Berhasil (Lunas) sekarang?',
                    [
                      { text: 'Tunggu Cek', style: 'cancel' },
                      {
                        text: 'Simulasi Bayar Lunas',
                        onPress: handleSimulateSandboxPayment,
                      },
                    ]
                  );
                  return;
                }
                setShowSnapModal(false);
                if (pendingOrderParams) {
                  router.replace({
                    pathname: '/checkout/success' as any,
                    params: pendingOrderParams,
                  });
                }
              }}
            >
              <Text style={styles.modalDoneBtnText}>
                {paymentConfirmed ? '✓ Lihat Tiket' : 'Simulasi Bayar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Paid Banner */}
          {paymentConfirmed && (
            <View style={styles.paidBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.paidBannerText}>Pembayaran berhasil dikonfirmasi! Tiket sedang disiapkan...</Text>
            </View>
          )}

          {/* WebView Midtrans Snap */}
          {snapUrl && !paymentConfirmed ? (
            <SafeWebView
              source={{ uri: snapUrl }}
              style={styles.webView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#004AC6" />
                  <Text style={styles.webViewLoadingText}>Memuat Halaman Pembayaran Midtrans...</Text>
                </View>
              )}
              onNavigationStateChange={(navState: any) => {
                const url = (navState.url || '').toLowerCase();
                // Deteksi URL finish/success dari callback Midtrans
                if (
                  url.includes('/finish') ||
                  url.includes('status_code=200') ||
                  url.includes('transaction_status=settlement') ||
                  url.includes('transaction_status=capture') ||
                  url.includes('concertix.app/payment/finish')
                ) {
                  setPaymentConfirmed(true);
                }
              }}
            />
          ) : null}

          {/* Loading confirmed state */}
          {paymentConfirmed && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.webViewLoading}
              onPress={() => {
                setShowSnapModal(false);
                if (pendingOrderParams) {
                  router.replace({
                    pathname: '/checkout/success' as any,
                    params: pendingOrderParams,
                  });
                }
              }}
            >
              <ActivityIndicator size="large" color="#059669" />
              <Text style={[styles.webViewLoadingText, { color: '#059669' }]}>
                Pembayaran dikonfirmasi! Menyiapkan tiket Anda...
              </Text>
              <Text style={{ fontSize: 12, color: '#004AC6', marginTop: 8, fontWeight: '700' }}>
                Ketuk di sini untuk langsung buka E-Tiket →
              </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
  },
  encryptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  encryptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#434655',
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E7FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timerHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#131B2E',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#004AC6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  /* Card Standard */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAEDFF',
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#131B2E',
  },
  /* Stepper */
  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAEDFF',
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepperTopInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepperSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004AC6',
    letterSpacing: 0.6,
  },
  stepperPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#737686',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: 10,
  },
  stepperBgLine: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 15,
    height: 2,
    backgroundColor: '#DAE2FD',
    zIndex: 0,
  },
  stepperActiveLine: {
    position: 'absolute',
    left: 24,
    width: '45%',
    top: 15,
    height: 2,
    backgroundColor: '#004AC6',
    zIndex: 1,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DAE2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: '#004AC6',
  },
  stepActive: {
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: '#DBE1FF',
  },
  stepLabel: {
    fontSize: 11,
    color: '#737686',
    fontWeight: '500',
  },
  stepLabelDone: {
    color: '#004AC6',
    fontWeight: '700',
  },
  stepLabelActive: {
    color: '#004AC6',
    fontWeight: '800',
  },
  /* Urgency Banner */
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  urgencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  urgencyTextBox: {
    flex: 1,
  },
  urgencyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350F',
  },
  urgencySub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 1,
  },
  urgencyPill: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urgencyPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#451A03',
  },
  /* Event Card */
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEDFF',
    overflow: 'hidden',
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  eventHeroImageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
    backgroundColor: '#1E293B',
  },
  eventHeroImage: {
    width: '100%',
    height: '100%',
  },
  eventHeroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DAE2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventHeroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.45)',
  },
  eventCategoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  eventCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  eventTitleBox: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  eventMetaText: {
    fontSize: 11,
    color: '#EAEDFF',
    fontWeight: '500',
  },
  eventBody: {
    padding: 14,
    gap: 10,
  },
  ticketRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F3FF',
    padding: 12,
    borderRadius: 10,
  },
  ticketRowLeft: {
    flex: 1,
  },
  ticketItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  ticketItemArea: {
    fontSize: 11,
    color: '#434655',
    marginTop: 2,
  },
  ticketItemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
  },
  instantNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  instantNoticeText: {
    fontSize: 11,
    color: '#434655',
    flex: 1,
  },
  /* Contact / Pemesan */
  editLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#004AC6',
  },
  summaryUserBox: {
    backgroundColor: '#F2F3FF',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 12,
    color: '#434655',
  },
  userVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#131B2E',
  },
  sameVisitorCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#737686',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxActive: {
    backgroundColor: '#004AC6',
    borderColor: '#004AC6',
  },
  checkboxSecondary: {
    borderColor: '#4B41E1',
  },
  checkboxBoxActiveSecondary: {
    backgroundColor: '#4B41E1',
    borderColor: '#4B41E1',
  },
  sameVisitorText: {
    fontSize: 12,
    color: '#131B2E',
    fontWeight: '500',
  },
  /* Voucher */
  promoActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004AC6',
  },
  voucherAppliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  voucherAppliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  voucherCheckIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherTextCol: {
    flex: 1,
  },
  voucherCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voucherCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 0.5,
  },
  voucherSavingBadge: {
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  voucherSavingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  voucherDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  voucherRemoveBtn: {
    paddingLeft: 8,
  },
  voucherRemoveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  voucherInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F2F3FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#131B2E',
    borderWidth: 1,
    borderColor: '#E2E7FF',
  },
  voucherApplyBtn: {
    backgroundColor: '#E2E7FF',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  /* Payment Methods */
  safeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  safeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#434655',
  },
  methodsList: {
    gap: 10,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F2F3FF',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  methodOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#004AC6',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  methodIconBox: {
    width: 44,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEDFF',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  methodLogoImage: {
    width: '100%',
    height: '100%',
  },
  methodInfoCol: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  recomBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  recomBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  methodSub: {
    fontSize: 11,
    color: '#434655',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: '#131B2E',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DAE2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    backgroundColor: '#004AC6',
  },
  expandMethodsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginTop: 4,
  },
  expandMethodsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004AC6',
  },
  /* Protection Card */
  protectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2DFFF',
    gap: 12,
    shadowColor: '#4B41E1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  protectionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  protectionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  protectionInfoCol: {
    flex: 1,
  },
  protectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  protectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
  },
  refundBadge: {
    backgroundColor: '#E2DFFF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  refundBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3323CC',
  },
  protectionDesc: {
    fontSize: 11,
    color: '#434655',
    lineHeight: 16,
    marginTop: 3,
  },
  protectionPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
  },
  protectionBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F2F3FF',
  },
  tncLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004AC6',
  },
  protectionCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#131B2E',
  },
  /* Price Breakdown */
  breakdownList: {
    gap: 10,
    paddingTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#434655',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#131B2E',
  },
  discountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownDiscountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  breakdownDiscountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F3FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  totalBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
  },
  totalBoxSub: {
    fontSize: 10,
    color: '#434655',
    marginTop: 1,
  },
  totalBoxAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004AC6',
  },
  /* Trust Badges */
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 11,
    color: '#434655',
    fontWeight: '500',
  },
  trustDot: {
    color: '#C3C6D7',
    fontSize: 12,
  },
  /* Sticky Bottom Bar */
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#EAEDFF',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomPriceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#434655',
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#131B2E',
    marginTop: 1,
  },
  payBtn: {
    backgroundColor: '#004AC6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
    shadowColor: '#004AC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  payBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomDisclaimer: {
    fontSize: 10,
    color: '#737686',
    textAlign: 'center',
    paddingBottom: 2,
  },
  /* Modal Midtrans WebView */
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDFF',
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderCenter: {
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#131B2E',
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#004AC6',
    fontWeight: '600',
    marginTop: 1,
  },
  modalDoneBtn: {
    backgroundColor: '#004AC6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  webViewLoadingText: {
    fontSize: 13,
    color: '#434655',
    fontWeight: '600',
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  paidBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});
