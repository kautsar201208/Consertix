import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config/api';
import { openGoogleMaps } from '@/utils/maps';

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    eventTitle?: string;
    eventDate?: string;
    eventLocation?: string;
    poster?: string;
    ticketName?: string;
    ticketPrice?: string;
    quantity?: string;
    namaLengkap?: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    paymentMethod?: string;
    totalAmount?: string;
  }>();

  const ticketCount = Math.max(1, parseInt(params.quantity || '1', 10));
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const orderId = params.orderId || `${Math.floor(100000 + Math.random() * 900000)}`;
  const orderTag = `#CTX-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${orderId.slice(-5)}`;
  const total = parseInt(params.totalAmount || '0', 10);
  const unitPrice = parseInt(params.ticketPrice || '0', 10);
  const subtotal = unitPrice * ticketCount;

  const formatRupiah = (val: number) => {
    return 'Rp' + val.toLocaleString('id-ID');
  };

  const getPosterUri = (poster: string | null | undefined) => {
    if (!poster) return null;
    if (poster.startsWith('http')) return poster;
    return `${API_URL}/uploads/${poster}`;
  };

  const posterUri = getPosterUri(params.poster);

  const tickets = Array.from({ length: ticketCount }).map((_, index) => {
    const isFirst = index === 0;
    const catName = params.ticketName || 'Festival - Presale 1';
    const catCode = (params.ticketName || 'FST').substring(0, 3).toUpperCase();
    const guestName = isFirst ? (params.namaLengkap || 'Dimas Arya Pratama') : `Pengunjung ${index + 1}`;
    const code = `CTX-${catCode}-${orderId.slice(-4)}${index + 1}`;
    const gate = isFirst ? 'Gate Barat / Zone B' : 'Gate Timur / Zone B';
    const area = isFirst ? 'Free Standing (Zone B)' : 'Free Standing (Zone B)';
    const idNum = isFirst ? (params.idNumber || '3171025809980004') : `317102580998000${index + 4}`;

    return {
      id: index,
      title: `Tiket ${index + 1} (${catName.split(' ')[0]})`,
      category: catName,
      gate,
      area,
      holderName: guestName,
      code,
      idNum,
    };
  });

  const activeTicket = tickets[selectedTicketIndex] || tickets[0];

  const handleDownloadPdf = () => {
    Alert.alert(
      'Unduh E-Tiket PDF',
      `E-Tiket resmi (${activeTicket.code}) berhasil diunduh. Bukti juga telah dikirim ke email ${params.email || 'Anda'}.`
    );
  };

  const handleSaveToWallet = () => {
    Alert.alert(
      'Simpan ke Wallet',
      `Tiket ${activeTicket.code} berhasil ditambahkan ke Apple Wallet / Google Wallet Anda.`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#131B2E" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>E-Tiket Terbit</Text>
          <Text style={styles.headerSubtitle}>Langkah 3 dari 3</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.safePill}>
            <Ionicons name="shield-checkmark" size={14} color="#004AC6" />
            <Text style={styles.safePillText}>Aman</Text>
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
        {/* 2. Stepper Progress */}
        <View style={styles.stepperCard}>
          <View style={styles.stepperRow}>
            {/* Background line */}
            <View style={styles.stepperLineBackground}>
              <View style={styles.stepperLineActive} />
            </View>

            {/* Step 1: Checked */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCompleted]}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabelActive}>1. Data Diri</Text>
            </View>

            {/* Step 2: Checked */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCompleted]}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabelActive}>2. Bayar</Text>
            </View>

            {/* Step 3: Active Checked */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepSuccess]}>
                <Ionicons name="ticket" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabelActive}>3. E-Tiket</Text>
            </View>
          </View>

          <View style={styles.stepperPillContainer}>
            <View style={styles.stepperPill}>
              <Text style={styles.stepperPillText}>
                LANGKAH 3 DARI 3 • TRANSAKSI BERHASIL
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Celebration Header & Success Badge */}
        <View style={styles.celebrationSection}>
          <View style={styles.badgeWrapper}>
            <View style={styles.mainSuccessBadge}>
              <Ionicons name="checkmark-circle" size={40} color="#004AC6" />
            </View>
            <View style={styles.celebrationMiniBadge}>
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>PEMBAYARAN BERHASIL!</Text>
          </View>

          <Text style={styles.celebrationTitle}>Tiketmu Sudah Siap!</Text>
          <Text style={styles.celebrationDesc}>
            E-tiket resmi dan bukti pembayaran otomatis dikirimkan ke{' '}
            <Text style={styles.boldText}>{params.email || 'dimas.arya@email.com'}</Text> serta WhatsApp terdaftar.
          </Text>

          {/* Micro Transaction Quick Pills */}
          <View style={styles.quickPillsRow}>
            <View style={styles.quickPill}>
              <Ionicons name="pricetag-outline" size={12} color="#004AC6" />
              <Text style={styles.quickPillText}>{orderTag}</Text>
            </View>

            <View style={styles.quickPill}>
              <Ionicons name="time-outline" size={12} color="#004AC6" />
              <Text style={styles.quickPillText}>
                {params.eventDate ? params.eventDate.split('•')[0].trim() : 'Hari Ini'}
              </Text>
            </View>

            <View style={styles.quickPill}>
              <Ionicons name="qr-code-outline" size={12} color="#004AC6" />
              <Text style={[styles.quickPillText, styles.quickPillHighlight]}>
                {(params.paymentMethod || 'QRIS').toUpperCase()} (Lunas)
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Ticket Selector Tabs (jika beli > 1 tiket atau single ticket switch) */}
        {tickets.length > 1 && (
          <View style={styles.ticketSelectorSection}>
            <View style={styles.ticketSelectorHeader}>
              <Text style={styles.ticketSelectorTitle}>
                Daftar Tiket ({tickets.length} Tiket)
              </Text>
              <Text style={styles.ticketSelectorHint}>Pilih Tiket</Text>
            </View>

            <View style={styles.ticketTabsContainer}>
              {tickets.map((t, idx) => {
                const isActive = idx === selectedTicketIndex;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.ticketTabBtn,
                      isActive && styles.ticketTabBtnActive,
                    ]}
                    onPress={() => setSelectedTicketIndex(idx)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isActive ? 'ticket' : 'ticket-outline'}
                      size={15}
                      color={isActive ? '#FFFFFF' : '#434655'}
                    />
                    <Text
                      style={[
                        styles.ticketTabBtnText,
                        isActive && styles.ticketTabBtnTextActive,
                      ]}
                    >
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 5. Interactive Boarding Pass Card */}
        <View style={styles.boardingPassCard}>
          {/* Visual Event Banner */}
          <View style={styles.bannerContainer}>
            {posterUri ? (
              <Image source={{ uri: posterUri }} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Ionicons name="musical-notes" size={40} color="#DAE2FD" />
              </View>
            )}
            <View style={styles.bannerOverlay} />

            {/* Top Left Music Festival Pill */}
            <View style={styles.bannerTopLeftPill}>
              <Ionicons name="musical-notes" size={12} color="#004AC6" />
              <Text style={styles.bannerTopLeftText}>CONCERTIX PASS</Text>
            </View>

            {/* Top Right Lunas Badge */}
            <View style={styles.bannerTopRightBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
              <Text style={styles.bannerTopRightText}>LUNAS</Text>
            </View>

            {/* Event Title & Location at bottom */}
            <View style={styles.bannerBottomInfo}>
              <Text style={styles.bannerEventTitle} numberOfLines={1}>
                {params.eventTitle || 'Soundfest Jakarta 2025: Waves of Euphoria'}
              </Text>
              <View style={styles.bannerLocationRow}>
                <Ionicons name="location-outline" size={13} color="#EAEDFF" />
                <Text style={styles.bannerLocationText} numberOfLines={1}>
                  {params.eventLocation || 'Stadion Madya GBK Senayan, Jakarta'}
                </Text>
              </View>
            </View>
          </View>

          {/* Ticket Information Grid */}
          <View style={styles.passGrid}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>KATEGORI TIKET</Text>
              <Text style={styles.gridValuePrimary} numberOfLines={1}>
                {activeTicket.category}
              </Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>PINTU MASUK</Text>
              <Text style={styles.gridValue} numberOfLines={1}>
                {activeTicket.gate}
              </Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>WAKTU KONSER</Text>
              <Text style={styles.gridValue} numberOfLines={1}>
                {params.eventDate || 'Jum, 24 Okt • 16:00 WIB'}
              </Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>NAMA PEMEGANG</Text>
              <Text style={styles.gridValue} numberOfLines={1}>
                {activeTicket.holderName}
              </Text>
            </View>

            {/* NIK & Area full-width box */}
            <View style={styles.gridFullBox}>
              <View style={styles.gridFullLeft}>
                <Text style={styles.gridLabel}>NOMOR IDENTITAS (NIK)</Text>
                <Text style={styles.gridValueBold}>{activeTicket.idNum}</Text>
              </View>
              <View style={styles.gridFullRight}>
                <Text style={styles.gridLabel}>NO. KURSI / AREA</Text>
                <Text style={styles.gridValuePrimary}>{activeTicket.area}</Text>
              </View>
            </View>
          </View>

          {/* Perforated Cut-Out Divider */}
          <View style={styles.perforationRow}>
            <View style={styles.cutoutLeft} />
            <View style={styles.perforatedLine} />
            <View style={styles.cutoutRight} />
          </View>

          {/* QR Code & Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrCard}>
              <Ionicons name="qr-code" size={160} color="#131B2E" />
              <View style={styles.qrCenterLogo}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.qrCodeText}>KODE: {activeTicket.code}</Text>

            <View style={styles.qrHintRow}>
              <Ionicons name="phone-portrait-outline" size={13} color="#004AC6" />
              <Text style={styles.qrHintText}>
                Tunjukkan QR Code ini di scanner gate masuk
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Quick Action Buttons (Unduh PDF & Simpan ke Wallet) */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDownloadPdf}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={18} color="#004AC6" />
            <Text style={styles.actionBtnText}>Unduh PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleSaveToWallet}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet-outline" size={18} color="#4B41E1" />
            <Text style={styles.actionBtnText}>Simpan ke Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* 7. Venue & Wristband Exchange Guide */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <Ionicons name="information-circle" size={22} color="#004AC6" />
            <Text style={styles.guideTitle}>Panduan Penukaran Wristband</Text>
          </View>
          <Text style={styles.guideSub}>
            Pastikan membaca syarat masuk demi kenyamanan bersama saat konser:
          </Text>

          <View style={styles.guideList}>
            <View style={styles.guideItem}>
              <View style={styles.guideNumCircle}>
                <Text style={styles.guideNumText}>1</Text>
              </View>
              <Text style={styles.guideItemText}>
                Bawa identitas asli (KTP/SIM/Paspor) yang cocok dengan nama e-tiket saat penukaran gelang.
              </Text>
            </View>

            <View style={styles.guideItem}>
              <View style={styles.guideNumCircle}>
                <Text style={styles.guideNumText}>2</Text>
              </View>
              <Text style={styles.guideItemText}>
                Booth penukaran dibuka <Text style={styles.boldText}>H-2 hingga hari konser</Text> pukul 10:00 – 20:00 WIB di venue.
              </Text>
            </View>

            <View style={styles.guideItem}>
              <View style={styles.guideNumCircle}>
                <Text style={styles.guideNumText}>3</Text>
              </View>
              <Text style={styles.guideItemText}>
                Screenshot QR diperbolehkan asalkan kontras jelas dan layar tidak retak atau redup.
              </Text>
            </View>
          </View>

          {/* Location Thumbnail Preview */}
          <View style={styles.venueLocationBox}>
            <View style={styles.venueThumb}>
              <Ionicons name="map-outline" size={28} color="#004AC6" />
            </View>
            <View style={styles.venueInfo}>
              <Text style={styles.venueName} numberOfLines={1}>
                {params.eventLocation || 'Stadion Madya GBK Senayan'}
              </Text>
              <Text style={styles.venueAddress} numberOfLines={1}>
                Jl. Pintu Satu Senayan, Gelora, Jakarta Pusat
              </Text>
              <TouchableOpacity
                style={styles.venueMapsBtn}
                onPress={() =>
                  openGoogleMaps(params.eventLocation || 'Gelora Bung Karno, Jakarta')
                }
                activeOpacity={0.7}
              >
                <Ionicons name="navigate-outline" size={13} color="#004AC6" />
                <Text style={styles.venueMapsBtnText}>Buka Peta Rute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 8. Payment Summary Collapsible */}
        <View style={styles.summaryCard}>
          <TouchableOpacity
            style={styles.summaryHeader}
            onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.summaryHeaderLeft}>
              <Ionicons name="receipt-outline" size={20} color="#004AC6" />
              <View>
                <Text style={styles.summaryTitle}>Rincian Pembayaran</Text>
                <Text style={styles.summarySubTitle}>
                  Status: Lunas ({(params.paymentMethod || 'QRIS').toUpperCase()})
                </Text>
              </View>
            </View>

            <View style={styles.summaryHeaderRight}>
              <Text style={styles.summaryTotalPrice}>
                {total > 0 ? formatRupiah(total) : formatRupiah(subtotal)}
              </Text>
              <Ionicons
                name={isSummaryExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#434655"
              />
            </View>
          </TouchableOpacity>

          {isSummaryExpanded && (
            <View style={styles.summaryBody}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>
                  {ticketCount}x {params.ticketName || 'Festival - Presale 1'}
                </Text>
                <Text style={styles.summaryRowVal}>{formatRupiah(subtotal)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Proteksi Pembatalan Konser</Text>
                <Text style={styles.summaryRowVal}>Rp30.000</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Biaya Layanan Aplikasi</Text>
                <Text style={styles.summaryRowVal}>Rp10.000</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryDiscountLabel}>Diskon Promo (FESTIVALSERU)</Text>
                <Text style={styles.summaryDiscountVal}>-Rp50.000</Text>
              </View>

              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total Akhir</Text>
                <Text style={styles.summaryTotalAmount}>
                  {total > 0 ? formatRupiah(total) : formatRupiah(subtotal)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 9. Sticky Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={18} color="#131B2E" />
          <Text style={styles.homeBtnText}>Beranda</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.myTicketsBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Ionicons name="ticket-outline" size={18} color="#FFFFFF" />
          <Text style={styles.myTicketsBtnText}>Tiket Saya</Text>
        </TouchableOpacity>
      </View>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FAF8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDFF',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#004AC6',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F2F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  safePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004AC6',
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
    paddingBottom: 36,
    gap: 16,
  },
  /* Stepper */
  stepperCard: {
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
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: 12,
  },
  stepperLineBackground: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 16,
    height: 3,
    backgroundColor: '#DAE2FD',
    zIndex: 0,
  },
  stepperLineActive: {
    width: '100%',
    height: '100%',
    backgroundColor: '#004AC6',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
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
  stepSuccess: {
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: '#DBE1FF',
  },
  stepLabelActive: {
    fontSize: 11,
    color: '#004AC6',
    fontWeight: '700',
  },
  stepperPillContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  stepperPill: {
    backgroundColor: '#F2F3FF',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  stepperPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004AC6',
    letterSpacing: 0.6,
  },
  /* Celebration Header */
  celebrationSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  mainSuccessBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#004AC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  celebrationMiniBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusPill: {
    backgroundColor: '#DBE1FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00174B',
    letterSpacing: 0.6,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#131B2E',
    marginBottom: 4,
  },
  celebrationDesc: {
    fontSize: 12,
    color: '#434655',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: '700',
    color: '#131B2E',
  },
  quickPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEDFF',
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickPillText: {
    fontSize: 11,
    color: '#434655',
    fontWeight: '500',
  },
  quickPillHighlight: {
    color: '#004AC6',
    fontWeight: '700',
  },
  /* Ticket Selector Tabs */
  ticketSelectorSection: {
    gap: 6,
  },
  ticketSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketSelectorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  ticketSelectorHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#004AC6',
  },
  ticketTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEDFF',
    padding: 4,
    borderRadius: 24,
    gap: 6,
  },
  ticketTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ticketTabBtnActive: {
    backgroundColor: '#004AC6',
    shadowColor: '#004AC6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434655',
  },
  ticketTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  /* Boarding Pass Card */
  boardingPassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAEDFF',
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  bannerContainer: {
    position: 'relative',
    height: 144,
    width: '100%',
    backgroundColor: '#1E293B',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#283044',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.5)',
  },
  bannerTopLeftPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bannerTopLeftText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004AC6',
  },
  bannerTopRightBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bannerTopRightText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerBottomInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  bannerEventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  bannerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  bannerLocationText: {
    fontSize: 11,
    color: '#EAEDFF',
    fontWeight: '500',
  },
  /* Grid Pass */
  passGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  gridCol: {
    width: '47%',
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737686',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  gridValuePrimary: {
    fontSize: 13,
    fontWeight: '800',
    color: '#004AC6',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  gridFullBox: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F2F3FF',
    padding: 10,
    borderRadius: 10,
  },
  gridFullLeft: {
    flex: 1,
  },
  gridFullRight: {
    alignItems: 'flex-end',
  },
  gridValueBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#131B2E',
  },
  /* Perforation */
  perforationRow: {
    position: 'relative',
    height: 20,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cutoutLeft: {
    position: 'absolute',
    left: -10,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FAF8FF',
    zIndex: 2,
  },
  cutoutRight: {
    position: 'absolute',
    right: -10,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FAF8FF',
    zIndex: 2,
  },
  perforatedLine: {
    borderWidth: 1,
    borderColor: '#C3C6D7',
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },
  /* QR Section */
  qrSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  qrCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 14,
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAEDFF',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCenterLogo: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#004AC6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  qrCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#434655',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  qrHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  qrHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#004AC6',
  },
  /* Actions Row */
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEDFF',
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  /* Guide Card */
  guideCard: {
    backgroundColor: '#F2F3FF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#004AC6',
  },
  guideSub: {
    fontSize: 12,
    color: '#434655',
    lineHeight: 16,
  },
  guideList: {
    gap: 8,
    marginTop: 2,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  guideNumCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  guideNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004AC6',
  },
  guideItemText: {
    flex: 1,
    fontSize: 12,
    color: '#131B2E',
    lineHeight: 18,
  },
  venueLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#EAEDFF',
  },
  venueThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#EAEDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
  },
  venueAddress: {
    fontSize: 11,
    color: '#434655',
    marginTop: 1,
  },
  venueMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  venueMapsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004AC6',
  },
  /* Summary Collapsible */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEDFF',
    overflow: 'hidden',
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  summarySubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#004AC6',
    marginTop: 1,
  },
  summaryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTotalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#131B2E',
  },
  summaryBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F2F3FF',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowLabel: {
    fontSize: 12,
    color: '#434655',
  },
  summaryRowVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#131B2E',
  },
  summaryDiscountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AD0033',
  },
  summaryDiscountVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#AD0033',
  },
  summaryTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EAEDFF',
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
  },
  summaryTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#004AC6',
  },
  /* Bottom Bar */
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEDFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
  },
  homeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F3FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  homeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  myTicketsBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#004AC6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#004AC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  myTicketsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
