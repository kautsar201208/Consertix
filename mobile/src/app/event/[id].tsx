import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config/api';
import { openGoogleMaps } from '@/utils/maps';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

interface TicketCategory {
  id: number;
  nama_kategori: string;
  harga: number;
  stok: number;
}

interface EventDetail {
  id: number;
  judul: string;
  nama_artis: string;
  deskripsi: string;
  syarat_ketentuan?: string;
  tanggal: string;
  jam: string;
  jam_selesai?: string;
  open_gate?: string;
  lokasi: string;
  poster: string | null;
  status: string;
  ticket_categories?: TicketCategory[];
}

const FALLBACK_EVENTS: Record<string, EventDetail> = {
  '1': {
    id: 1,
    judul: 'Soundfest Jakarta 2026',
    nama_artis: 'Sheila on 7, Tulus, Raisa',
    deskripsi: 'Festival musik multi-genre terbesar tahun ini di Stadion Madya GBK!',
    tanggal: '2026-03-20',
    jam: '19:00 WIB',
    lokasi: 'Stadion Madya GBK, Jakarta Pusat',
    poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    status: 'aktif',
    open_gate: '15:00 WIB',
    jam_selesai: '23:30 WIB',
    ticket_categories: [
      { id: 101, nama_kategori: 'Presale 1 - 3 Day Pass', harga: 450000, stok: 1500 },
      { id: 102, nama_kategori: 'Regular Festival (Standing)', harga: 750000, stok: 5000 },
      { id: 103, nama_kategori: 'VIP Experience Lounge', harga: 1500000, stok: 500 },
    ],
  },
  '2': {
    id: 2,
    judul: 'Java Jazz Festival 2026',
    nama_artis: "Maliq & D'Essentials, Kahitna",
    deskripsi: 'Kembali hadir merayakan festival musik jazz paling megah se-Asia Tenggara!',
    tanggal: '2026-03-14',
    jam: '16:00 WIB',
    lokasi: 'JIExpo Kemayoran, Jakarta Pusat',
    poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    status: 'aktif',
    open_gate: '14:00 WIB',
    jam_selesai: '23:00 WIB',
    ticket_categories: [
      { id: 201, nama_kategori: 'Daily Pass - Day 1', harga: 600000, stok: 3000 },
      { id: 202, nama_kategori: '3-Day Full Pass', harga: 1400000, stok: 2000 },
      { id: 203, nama_kategori: 'VIP Special Show', harga: 2200000, stok: 400 },
    ],
  },
  '3': {
    id: 3,
    judul: 'Sheila on 7 - Tunggu Aku di Jakarta',
    nama_artis: 'Sheila on 7',
    deskripsi: 'Tur konser solo megah nostalgia bersama Sheila Gank seluruh Indonesia.',
    tanggal: '2026-04-05',
    jam: '20:00 WIB',
    lokasi: 'Beach City International Stadium, Ancol',
    poster: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=80',
    status: 'aktif',
    open_gate: '17:00 WIB',
    jam_selesai: '23:00 WIB',
    ticket_categories: [
      { id: 301, nama_kategori: 'Festival Standing', harga: 400000, stok: 4000 },
      { id: 302, nama_kategori: 'Seated Tribune A', harga: 650000, stok: 2500 },
      { id: 303, nama_kategori: 'VIP Center Front', harga: 1200000, stok: 800 },
    ],
  },
};

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoggedIn } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ticketCounts, setTicketCounts] = useState<Record<number, number>>({});

  const fetchDetail = useCallback(async (isSilent = false) => {
    if (!id) return;
    try {
      if (!isSilent) setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${API_URL}/api/events/${id}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error('Event tidak ditemukan');
      }
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      console.warn('Gagal memuat event detail dari API, memuat fallback:', err);
      const fallback = FALLBACK_EVENTS[String(id)] || FALLBACK_EVENTS['1'];
      setEvent(fallback);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail(true);
    }, [fetchDetail])
  );

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Beli tiket konser ${event.judul} (${event.nama_artis}) di Concertix!\nLokasi: ${event.lokasi}\nTanggal: ${event.tanggal}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const adjustTicket = (categoryId: number, delta: number, maxStok: number) => {
    setTicketCounts((prev) => {
      const current = prev[categoryId] || 0;
      const next = current + delta;
      if (next < 0) return { ...prev, [categoryId]: 0 };
      if (next > Math.min(4, maxStok)) {
        Alert.alert('Batas Tiket', 'Maksimal 4 tiket per kategori.');
        return prev;
      }
      return { ...prev, [categoryId]: next };
    });
  };

  const getPosterUri = (poster: string | null) => {
    if (!poster) return null;
    if (poster.startsWith('http')) return poster;
    const cleanPoster = poster.startsWith('/') ? poster.slice(1) : poster;
    if (cleanPoster.startsWith('uploads/')) {
      return `${API_URL}/${cleanPoster}`;
    }
    return `${API_URL}/uploads/posters/${cleanPoster}`;
  };

  const totalTicketsSelected = Object.values(ticketCounts).reduce((acc, curr) => acc + curr, 0);

  const calculateTotalPrice = () => {
    if (!event?.ticket_categories) return 0;
    return event.ticket_categories.reduce((total, cat) => {
      const qty = ticketCounts[cat.id] || 0;
      return total + qty * cat.harga;
    }, 0);
  };

  const getMinPrice = () => {
    if (!event?.ticket_categories || event.ticket_categories.length === 0) return null;
    const prices = event.ticket_categories.map((c) => c.harga).filter((p) => p > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  };

  const handleBooking = () => {
    if (!isLoggedIn) {
      Alert.alert('Perhatian', 'Silakan masuk ke akun Anda untuk memesan tiket.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Masuk', onPress: () => router.push('/login') },
      ]);
      return;
    }

    if (totalTicketsSelected === 0) {
      Alert.alert('Pilih Tiket', 'Silakan pilih minimal 1 tiket sebelum melanjutkan pemesanan.');
      return;
    }

    // Ambil kategori tiket pertama yang dipilih
    const selectedCategory = event?.ticket_categories?.find(
      (cat) => (ticketCounts[cat.id] || 0) > 0
    );

    const qty = selectedCategory ? ticketCounts[selectedCategory.id] : totalTicketsSelected;

    router.push({
      pathname: '/checkout' as any,
      params: {
        eventId: String(event?.id),
        categoryId: String(selectedCategory?.id || ''),
        ticketName: selectedCategory?.nama_kategori || 'Tiket Konser',
        ticketPrice: String(selectedCategory?.harga || 0),
        quantity: String(qty),
        eventTitle: event?.judul || '',
        eventDate: event?.tanggal || '',
        eventLocation: event?.lokasi || '',
        poster: event?.poster || '',
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004AC6" />
        <Text style={styles.loadingText}>Memuat detail event...</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#D22348" />
        <Text style={styles.notFoundTitle}>Event Tidak Ditemukan</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const posterUri = getPosterUri(event.poster);
  const minPrice = getMinPrice();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerCircleBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#131B2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detail Event
        </Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerCircleBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#131B2E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#D22348' : '#131B2E'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Hero Banner Visual */}
        <View style={styles.heroBanner}>
          {posterUri ? (
            <Image source={{ uri: posterUri }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="musical-notes" size={60} color="#94A3B8" />
            </View>
          )}
          <View style={styles.heroOverlay} />

          {/* Top Badges */}
          <View style={styles.heroTopBadges}>
            <View style={styles.glassBadge}>
              <Ionicons name="sparkles" size={12} color="#004AC6" />
              <Text style={styles.glassBadgeText}>Musik • Festival</Text>
            </View>
            <View style={styles.glassBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.glassBadgeText}>
                {event.status === 'aktif' ? 'Tersedia' : 'Segera'}
              </Text>
            </View>
          </View>

          {/* Bottom Metas */}
          <View style={styles.heroBottomMetas}>
            <View style={styles.heroMetaPill}>
              <Ionicons name="flame" size={13} color="#FFB2B7" />
              <Text style={styles.heroMetaText}>Trending di Concertix</Text>
            </View>
            <View style={styles.heroMetaPill}>
              <Ionicons name="eye-outline" size={13} color="#FFFFFF" />
              <Text style={styles.heroMetaText}>1.2k melihat</Text>
            </View>
          </View>
        </View>

        {/* 3. Event Title & Organizer Info */}
        <View style={styles.sectionTitleBlock}>
          <View style={styles.badgeRow}>
            <View style={styles.specialBadge}>
              <Text style={styles.specialBadgeText}>EDISI SPESIAL</Text>
            </View>
            <Text style={styles.genreText}>• Konser Musik Terpilih</Text>
          </View>
          <Text style={styles.mainTitle}>{event.judul}</Text>
        </View>

        {/* Organizer Profile Card */}
        <View style={styles.organizerCard}>
          <View style={styles.organizerAvatar}>
            <Ionicons name="pulse" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.organizerInfo}>
            <View style={styles.organizerNameRow}>
              <Text style={styles.organizerName}>Soundwave Live Ent.</Text>
              <Ionicons name="checkmark-circle" size={15} color="#004AC6" />
            </View>
            <Text style={styles.organizerRole}>Official Promoter & Event Organizer</Text>
          </View>
          <TouchableOpacity
            style={styles.followBtn}
            onPress={() => Alert.alert('Info', 'Anda telah mengikuti promotor ini.')}
          >
            <Text style={styles.followBtnText}>Ikuti</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Info Cards (Date & Location with Google Maps button) */}
        <View style={styles.quickInfoList}>
          {/* Date & Time */}
          <View style={styles.infoCard}>
            <View style={[styles.infoIconBox, { backgroundColor: '#DBE1FF' }]}>
              <Ionicons name="calendar" size={20} color="#004AC6" />
            </View>
            <View style={styles.infoContent}>
              <View style={styles.infoHeaderRow}>
                <Text style={styles.infoLabel}>WAKTU & TANGGAL</Text>
              </View>
              <Text style={styles.infoValue}>{event.tanggal}</Text>
              <Text style={styles.infoSubvalue}>
                {event.jam}
                {event.jam_selesai ? ` - ${event.jam_selesai}` : ''}
                {event.open_gate ? ` (Open gate ${event.open_gate})` : ''}
              </Text>
            </View>
          </View>

          {/* Location & Maps Link */}
          <View style={styles.infoCard}>
            <View style={[styles.infoIconBox, { backgroundColor: '#EAEDFF' }]}>
              <Ionicons name="location" size={20} color="#004AC6" />
            </View>
            <View style={styles.infoContent}>
              <View style={styles.infoHeaderRow}>
                <Text style={styles.infoLabel}>LOKASI ACARA</Text>
                <TouchableOpacity
                  style={styles.mapLinkBtn}
                  onPress={() => openGoogleMaps(event.lokasi)}
                >
                  <Text style={styles.mapLinkText}>Buka Maps</Text>
                  <Ionicons name="navigate-outline" size={13} color="#004AC6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>
                {event.lokasi}
              </Text>
              <Text style={styles.infoSubvalue}>Klik 'Buka Maps' untuk navigasi rute</Text>
            </View>
          </View>
        </View>

        {/* 4. Line-up Penampil */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionHeading}>Line-up Penampil</Text>
              <Text style={styles.sectionSubheading}>Musisi & Artis Spesial</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artistScroll}>
            {/* Main Artist / Headliner */}
            <View style={styles.artistItem}>
              <View style={styles.artistAvatarWrapper}>
                <View style={styles.artistAvatarGradient}>
                  <View style={styles.artistAvatarPlaceholder}>
                    <Ionicons name="mic" size={26} color="#004AC6" />
                  </View>
                </View>
                <View style={styles.starBadge}>
                  <Ionicons name="star" size={10} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.artistName} numberOfLines={1}>
                {event.nama_artis}
              </Text>
              <Text style={styles.artistRole}>Headliner</Text>
            </View>

            {/* Guest Star Placeholders */}
            <View style={styles.artistItem}>
              <View style={styles.artistAvatarPlain}>
                <Ionicons name="musical-notes" size={22} color="#64748B" />
              </View>
              <Text style={styles.artistName}>Special Guest</Text>
              <Text style={styles.artistRole}>Opening Act</Text>
            </View>

            <View style={styles.artistItem}>
              <View style={styles.artistAvatarPlain}>
                <Ionicons name="headset" size={22} color="#64748B" />
              </View>
              <Text style={styles.artistName}>DJ Session</Text>
              <Text style={styles.artistRole}>Afterparty</Text>
            </View>
          </ScrollView>
        </View>

        {/* 5. Ticket Categories Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionHeading}>Pilihan Tiket</Text>
              <Text style={styles.sectionSubheading}>
                Pilih tiket sesuai kenyamanan menonton Anda
              </Text>
            </View>
            <View style={styles.guaranteeTag}>
              <Ionicons name="shield-checkmark" size={14} color="#004AC6" />
              <Text style={styles.guaranteeTagText}>100% Resmi</Text>
            </View>
          </View>

          {/* Ticket Category Cards */}
          {!event.ticket_categories || event.ticket_categories.length === 0 ? (
            <View style={styles.emptyTicketCard}>
              <Text style={styles.emptyTicketText}>Kategori tiket belum ditentukan.</Text>
            </View>
          ) : (
            <View style={styles.ticketList}>
              {event.ticket_categories.map((ticket) => {
                const isSoldOut = ticket.stok <= 0;
                const count = ticketCounts[ticket.id] || 0;
                return (
                  <View
                    key={ticket.id}
                    style={[styles.ticketCard, isSoldOut && styles.ticketCardSoldOut]}
                  >
                    <View style={styles.ticketTopRow}>
                      <View style={styles.ticketNameGroup}>
                        <View style={styles.ticketBadgeRow}>
                          <Text style={styles.ticketTitle}>{ticket.nama_kategori}</Text>
                          <View
                            style={[
                              styles.ticketStatusBadge,
                              isSoldOut ? styles.badgeSoldOut : styles.badgeAvailable,
                            ]}
                          >
                            <Text
                              style={[
                                styles.ticketStatusText,
                                isSoldOut ? styles.textSoldOut : styles.textAvailable,
                              ]}
                            >
                              {isSoldOut ? 'Habis' : `Sisa ${ticket.stok}`}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.ticketDesc}>
                          Akses area tiket {ticket.nama_kategori} & fasilitas panggung
                        </Text>
                      </View>
                      <View style={styles.ticketPriceCol}>
                        <Text style={styles.ticketPrice}>
                          Rp{Number(ticket.harga).toLocaleString('id-ID')}
                        </Text>
                      </View>
                    </View>

                    {/* Ticket Perks */}
                    <View style={styles.ticketPerksList}>
                      <View style={styles.perkItem}>
                        <Ionicons name="checkmark-circle" size={14} color="#004AC6" />
                        <Text style={styles.perkText}>E-Ticket digital langsung di aplikasi</Text>
                      </View>
                      <View style={styles.perkItem}>
                        <Ionicons name="checkmark-circle" size={14} color="#004AC6" />
                        <Text style={styles.perkText}>Jalur masuk antrean resmi</Text>
                      </View>
                    </View>

                    {/* Stepper Counter */}
                    <View style={styles.ticketBottomRow}>
                      <Text style={styles.ticketNotice}>Maksimal 4 tiket/transaksi</Text>
                      {isSoldOut ? (
                        <View style={styles.btnSoldOut}>
                          <Text style={styles.btnSoldOutText}>Terjual Habis</Text>
                        </View>
                      ) : (
                        <View style={styles.counterRow}>
                          <TouchableOpacity
                            style={styles.counterBtnMinus}
                            onPress={() => adjustTicket(ticket.id, -1, ticket.stok)}
                          >
                            <Ionicons name="remove" size={14} color="#131B2E" />
                          </TouchableOpacity>
                          <Text style={styles.counterVal}>{count}</Text>
                          <TouchableOpacity
                            style={styles.counterBtnPlus}
                            onPress={() => adjustTicket(ticket.id, 1, ticket.stok)}
                          >
                            <Ionicons name="add" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 6. Event Description & Highlights */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Deskripsi Acara</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{event.deskripsi}</Text>

            {/* Highlights Grid */}
            <View style={styles.highlightsGrid}>
              <View style={styles.highlightPill}>
                <Ionicons name="people" size={18} color="#004AC6" />
                <View>
                  <Text style={styles.highlightLabel}>Usia Minimal</Text>
                  <Text style={styles.highlightVal}>Semua Umur / KTP</Text>
                </View>
              </View>
              <View style={styles.highlightPill}>
                <Ionicons name="fast-food" size={18} color="#004AC6" />
                <View>
                  <Text style={styles.highlightLabel}>Area Kuliner</Text>
                  <Text style={styles.highlightVal}>Food & Drinks Stand</Text>
                </View>
              </View>
            </View>

            {/* Wristband Exchange Info */}
            <View style={styles.guideBox}>
              <View style={styles.guideHeader}>
                <Ionicons name="ticket" size={16} color="#004AC6" />
                <Text style={styles.guideTitle}>Panduan Penukaran Wristband</Text>
              </View>
              <Text style={styles.guideText}>
                Tunjukkan barcode E-Ticket di aplikasi Concertix pada saat masuk ke venue konser.
              </Text>
            </View>
          </View>
        </View>

        {/* 7. Venue & Map Navigation Card */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Lokasi & Akses Venue</Text>
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={() => openGoogleMaps(event.lokasi)}
            >
              <Text style={styles.directionsText}>Petunjuk Arah</Text>
              <Ionicons name="navigate" size={13} color="#004AC6" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.mapSnapshotCard}
            activeOpacity={0.9}
            onPress={() => openGoogleMaps(event.lokasi)}
          >
            <View style={styles.mapMockBanner}>
              <View style={styles.mapFloatingPin}>
                <Ionicons name="location" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.mapPinCaption}>{event.lokasi}</Text>
            </View>

            <View style={styles.mapFooter}>
              <Ionicons name="map-outline" size={16} color="#004AC6" />
              <Text style={styles.mapFooterText}>
                Klik untuk membuka titik lokasi di aplikasi Google Maps
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 8. Trust Badges */}
        <View style={styles.trustBadgesRow}>
          <View style={styles.trustItem}>
            <Ionicons name="checkmark-circle-outline" size={15} color="#004AC6" />
            <Text style={styles.trustText}>Garansi 100% Valid</Text>
          </View>
          <Text style={styles.trustDot}>•</Text>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed-outline" size={15} color="#004AC6" />
            <Text style={styles.trustText}>Pembayaran Aman</Text>
          </View>
          <Text style={styles.trustDot}>•</Text>
          <View style={styles.trustItem}>
            <Ionicons name="headset-outline" size={15} color="#004AC6" />
            <Text style={styles.trustText}>CS 24/7</Text>
          </View>
        </View>
      </ScrollView>

      {/* 9. Bottom Sticky Purchase Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>
            {totalTicketsSelected > 0 ? 'Total Pembayaran' : 'Total Harga'}
          </Text>
          <Text style={styles.bottomPriceValue}>
            {totalTicketsSelected > 0
              ? `Rp${calculateTotalPrice().toLocaleString('id-ID')}`
              : 'Rp0'}
          </Text>
        </View>
        <TouchableOpacity style={styles.buyNowBtn} activeOpacity={0.9} onPress={handleBooking}>
          <Text style={styles.buyNowText}>
            {totalTicketsSelected > 0
              ? `Beli Sekarang (${totalTicketsSelected})`
              : 'Pilih Tiket'}
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  notFoundTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
    marginTop: 12,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#004AC6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#131B2E',
    maxWidth: width - 150,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  heroBanner: {
    width: '100%',
    height: 210,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 6,
    backgroundColor: '#DAE2FD',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.45)',
  },
  heroTopBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  glassBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004AC6',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#004AC6',
  },
  heroBottomMetas: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(19, 27, 46, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  heroMetaText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionTitleBlock: {
    marginTop: 16,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  specialBadge: {
    backgroundColor: '#DBE1FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  specialBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00174B',
  },
  genreText: {
    fontSize: 11,
    color: '#434655',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#131B2E',
    lineHeight: 28,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3FF',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    marginBottom: 14,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  organizerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  organizerRole: {
    fontSize: 10,
    color: '#434655',
  },
  followBtn: {
    backgroundColor: '#DAE2FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004AC6',
  },
  quickInfoList: {
    gap: 10,
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#434655',
    letterSpacing: 0.5,
  },
  mapLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mapLinkText: {
    fontSize: 11,
    color: '#004AC6',
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
    marginTop: 2,
  },
  infoSubvalue: {
    fontSize: 11,
    color: '#434655',
  },
  sectionBlock: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#131B2E',
  },
  sectionSubheading: {
    fontSize: 11,
    color: '#434655',
  },
  guaranteeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guaranteeTagText: {
    fontSize: 11,
    color: '#004AC6',
    fontWeight: '700',
  },
  artistScroll: {
    paddingTop: 4,
  },
  artistItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 76,
  },
  artistAvatarWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
  },
  artistAvatarGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563EB',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#DBE1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistAvatarPlain: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAEDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  starBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 3,
  },
  artistName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#131B2E',
    marginTop: 6,
    textAlign: 'center',
  },
  artistRole: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  emptyTicketCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTicketText: {
    fontSize: 12,
    color: '#64748B',
  },
  ticketList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  ticketCardSoldOut: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    opacity: 0.65,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketNameGroup: {
    flex: 1,
    marginRight: 10,
  },
  ticketBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#131B2E',
  },
  ticketStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeAvailable: {
    backgroundColor: '#DBE1FF',
  },
  badgeSoldOut: {
    backgroundColor: '#FFDAD6',
  },
  ticketStatusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  textAvailable: {
    color: '#00174B',
  },
  textSoldOut: {
    color: '#93000A',
  },
  ticketDesc: {
    fontSize: 10,
    color: '#434655',
  },
  ticketPriceCol: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#004AC6',
  },
  ticketPerksList: {
    gap: 4,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#F2F3FF',
    marginBottom: 8,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perkText: {
    fontSize: 10,
    color: '#434655',
  },
  ticketBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#F2F3FF',
  },
  ticketNotice: {
    fontSize: 10,
    color: '#64748B',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F3FF',
    padding: 3,
    borderRadius: 20,
  },
  counterBtnMinus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnPlus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
    minWidth: 14,
    textAlign: 'center',
  },
  btnSoldOut: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#EAEDFF',
    borderRadius: 12,
  },
  btnSoldOutText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: '#131B2E',
    lineHeight: 20,
  },
  highlightsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  highlightPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F3FF',
    padding: 10,
    borderRadius: 12,
  },
  highlightLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#131B2E',
  },
  highlightVal: {
    fontSize: 9,
    color: '#434655',
  },
  guideBox: {
    backgroundColor: '#F2F3FF',
    borderRadius: 12,
    padding: 12,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guideTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004AC6',
  },
  guideText: {
    fontSize: 11,
    color: '#434655',
    lineHeight: 16,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directionsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004AC6',
  },
  mapSnapshotCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  mapMockBanner: {
    height: 120,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapFloatingPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#004AC6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  mapPinCaption: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  mapFooterText: {
    fontSize: 11,
    color: '#434655',
    fontWeight: '500',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 10,
    color: '#434655',
    fontWeight: '500',
  },
  trustDot: {
    color: '#C3C6D7',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderColor: '#F2F3FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  bottomPriceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#004AC6',
  },
  buyNowBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  buyNowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
