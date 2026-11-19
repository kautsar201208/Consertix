import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config/api';
import { openGoogleMaps } from '@/utils/maps';

const { width } = Dimensions.get('window');
const cardWidth = (width - 44) / 2;

export interface EventItem {
  id: number;
  judul: string;
  nama_artis: string;
  deskripsi: string;
  tanggal: string;
  jam: string;
  lokasi: string;
  poster: string | null;
  status: string;
  jam_selesai?: string;
  open_gate?: string;
}

const FALLBACK_EVENTS: EventItem[] = [
  {
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
  },
  {
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
  },
  {
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
  },
];

const CATEGORIES = [
  { id: 'Semua', label: 'Semua', icon: 'grid-outline' },
  { id: 'Konser', label: 'Konser', icon: 'musical-notes-outline' },
  { id: 'Festival', label: 'Festival', icon: 'sparkles-outline' },
  { id: 'Pop', label: 'Pop', icon: 'mic-outline' },
  { id: 'Rock', label: 'Rock', icon: 'flame-outline' },
  { id: 'Jazz', label: 'Jazz', icon: 'radio-outline' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [favorites, setFavorites] = useState<number[]>([]);

  const applyFilter = useCallback((query: string, category: string, list: EventItem[]) => {
    let result = Array.isArray(list) ? list : [];

    if (query && query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) =>
          (e?.judul || '').toLowerCase().includes(q) ||
          (e?.nama_artis || '').toLowerCase().includes(q) ||
          (e?.lokasi || '').toLowerCase().includes(q)
      );
    }

    if (category && category !== 'Semua') {
      result = result.filter(
        (e) =>
          (e?.judul || '').toLowerCase().includes(category.toLowerCase()) ||
          (e?.deskripsi || '').toLowerCase().includes(category.toLowerCase())
      );
    }

    setFilteredEvents(result);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${API_URL}/api/events`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error('Gagal memuat event dari backend');
      }
      const data = await res.json();
      const list: EventItem[] = Array.isArray(data) && data.length > 0 ? data : (data.data || []);
      
      if (list.length > 0) {
        setEvents(list);
        applyFilter(searchQuery, selectedCategory, list);
      } else {
        setEvents(FALLBACK_EVENTS);
        applyFilter(searchQuery, selectedCategory, FALLBACK_EVENTS);
      }
    } catch (err) {
      console.warn('Backend tidak dapat dihubungi atau timeout, memuat data fallback event:', err);
      setEvents(FALLBACK_EVENTS);
      applyFilter(searchQuery, selectedCategory, FALLBACK_EVENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, applyFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilter(text, selectedCategory, events);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    applyFilter(searchQuery, category, events);
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLogoutConfirm = () => {
    Alert.alert('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Alert.alert('Logout', 'Anda telah berhasil keluar.');
        },
      },
    ]);
  };

  const handleEventPress = (event: EventItem) => {
    router.push({
      pathname: '/event/[id]',
      params: { id: String(event.id) },
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

  const trendingEvents = filteredEvents.slice(0, 4);
  const nearbyEvents = filteredEvents.slice(4);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandBadge}>
            <Ionicons name="musical-notes" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>Concertix</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => Alert.alert('Notifikasi', 'Tidak ada notifikasi baru saat ini.')}
          >
            <Ionicons name="notifications-outline" size={20} color="#1E293B" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          {isLoggedIn ? (
            <TouchableOpacity style={styles.userProfileBtn} onPress={handleLogoutConfirm}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginPillBtn} onPress={() => router.push('/login')}>
              <Text style={styles.loginPillText}>Masuk</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Top Location Bar */}
        <View style={styles.locationBar}>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => Alert.alert('Pilih Kota', 'Fitur filter kota akan segera tersedia.')}
          >
            <Ionicons name="location" size={18} color="#2563EB" />
            <View>
              <Text style={styles.locationLabel}>LOKASI ANDA</Text>
              <View style={styles.locationCityRow}>
                <Text style={styles.locationCity}>Jakarta</Text>
                <Ionicons name="chevron-down" size={14} color="#64748B" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.greetingContainer}>
            <Text style={styles.greetingSubtext} numberOfLines={1}>
              {isLoggedIn && user ? `Halo, ${user.nama} 👋` : 'Cari tiket konser seru!'}
            </Text>
          </View>
        </View>

        {/* Hero Banner: Rasakan Setiap Momen */}
        <View style={styles.heroBannerContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop',
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroGradientOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="flame" size={14} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>Paling Populer</Text>
            </View>
            <Text style={styles.heroTitle}>Rasakan Setiap Momen</Text>
            <Text style={styles.heroSubtitle}>
              Konser • Musik • Festival • Hiburan Seru
            </Text>
          </View>
        </View>

        {/* Search Bar with Circular Filter Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari event, artis, atau tempat..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => Alert.alert('Filter', 'Gunakan kategori di bawah untuk memfilter.')}
          >
            <Ionicons name="options-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategorySelect(cat.id)}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={15}
                  color={isSelected ? '#FFFFFF' : '#475569'}
                />
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Memuat event konser...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Event tidak ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Tidak ada hasil untuk kata kunci tersebut'
                : 'Belum ada konser yang tersedia'}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchEvents}>
              <Text style={styles.retryBtnText}>Muat Ulang</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Section: Sedang Tren */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Sedang Tren</Text>
                <View style={styles.pulsingDot} />
              </View>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {/* 2-Column Grid */}
            <View style={styles.gridContainer}>
              {trendingEvents.map((item) => {
                const posterUri = getPosterUri(item.poster);
                const isFav = favorites.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridCard}
                    activeOpacity={0.9}
                    onPress={() => handleEventPress(item)}
                  >
                    <View style={styles.gridCardImageWrapper}>
                      {posterUri ? (
                        <Image source={{ uri: posterUri }} style={styles.gridCardImage} />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Ionicons name="musical-notes" size={32} color="#94A3B8" />
                        </View>
                      )}
                      <View style={styles.gridImageOverlay} />

                      {/* Date Badge */}
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateBadgeText}>{item.tanggal}</Text>
                      </View>

                      {/* Favorite Button */}
                      <TouchableOpacity
                        style={styles.favBadgeBtn}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          toggleFavorite(item.id);
                        }}
                      >
                        <Ionicons
                          name={isFav ? 'heart' : 'heart-outline'}
                          size={15}
                          color={isFav ? '#E11D48' : '#334155'}
                        />
                      </TouchableOpacity>

                      {/* Location at bottom of photo */}
                      <TouchableOpacity
                        style={styles.photoLocationRow}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          openGoogleMaps(item.lokasi);
                        }}
                      >
                        <Ionicons name="location-sharp" size={12} color="#93C5FD" />
                        <Text style={styles.photoLocationText} numberOfLines={1}>
                          {item.lokasi}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Card Body */}
                    <View style={styles.gridCardBody}>
                      <Text style={styles.gridCardTitle} numberOfLines={1}>
                        {item.judul}
                      </Text>
                      <Text style={styles.gridCardArtist} numberOfLines={1}>
                        {item.nama_artis}
                      </Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.pricePrefix}>Mulai dari</Text>
                        <Text style={styles.priceValue}>
                          {item.status === 'aktif' ? 'Tersedia' : 'Segera'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Promo Banner: Kalender Event Indonesia */}
            <View style={styles.promoBanner}>
              <View style={styles.promoGlow} />
              <View style={styles.promoContent}>
                <View style={styles.promoTagRow}>
                  <Ionicons name="calendar" size={14} color="#2563EB" />
                  <Text style={styles.promoTagText}>EDISI 2026</Text>
                </View>
                <Text style={styles.promoTitle}>Kalender Event Indonesia</Text>
                <Text style={styles.promoDesc}>
                  Jelajahi jadwal festival & konser spektakuler sepanjang tahun ini.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.promoButton}
                onPress={() =>
                  Alert.alert(
                    'Kalender Event',
                    'Nantikan pembaruan kalender konser terlengkap tahun 2026!'
                  )
                }
              >
                <Text style={styles.promoButtonText}>Lihat</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Section: Event di Dekatmu (jika ada lebih dari 4 event) */}
            {nearbyEvents.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <Text style={styles.sectionTitle}>Event di Dekatmu</Text>
                  <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.seeAllText}>Lihat Semua</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.horizontalList}>
                  {nearbyEvents.map((item) => {
                    const posterUri = getPosterUri(item.poster);
                    const isFav = favorites.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.hCard}
                        activeOpacity={0.88}
                        onPress={() => handleEventPress(item)}
                      >
                        <View style={styles.hCardImageWrapper}>
                          {posterUri ? (
                            <Image source={{ uri: posterUri }} style={styles.hCardImage} />
                          ) : (
                            <View style={styles.placeholderImage}>
                              <Ionicons name="musical-notes" size={24} color="#94A3B8" />
                            </View>
                          )}
                          <View style={styles.hCardDateBadge}>
                            <Text style={styles.hCardDateText}>{item.tanggal}</Text>
                          </View>
                        </View>

                        <View style={styles.hCardBody}>
                          <View style={styles.hCardHeaderRow}>
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>Konser</Text>
                            </View>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation?.();
                                toggleFavorite(item.id);
                              }}
                            >
                              <Ionicons
                                name={isFav ? 'heart' : 'heart-outline'}
                                size={18}
                                color={isFav ? '#E11D48' : '#94A3B8'}
                              />
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.hCardTitle} numberOfLines={1}>
                            {item.judul}
                          </Text>

                          <TouchableOpacity
                            style={styles.hCardLocationRow}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              openGoogleMaps(item.lokasi);
                            }}
                          >
                            <Ionicons name="location-outline" size={13} color="#2563EB" />
                            <Text style={styles.hCardLocationText} numberOfLines={1}>
                              {item.lokasi}
                            </Text>
                          </TouchableOpacity>

                          <Text style={styles.hCardPrice}>
                            {item.status === 'aktif' ? 'Tiket Tersedia' : 'Segera Hadir'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#004AC6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#004AC6',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D22348',
  },
  userProfileBtn: {
    borderRadius: 18,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#004AC6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#004AC6',
    borderRadius: 20,
  },
  loginPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  locationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F3FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  locationCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationCity: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  greetingSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  heroBannerContainer: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.55)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(75, 65, 225, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  heroSubtitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    height: 46,
    borderRadius: 24,
    backgroundColor: '#F2F3FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#131B2E',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EAEDFF',
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434655',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#131B2E',
    letterSpacing: -0.3,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D22348',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    width: cardWidth,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  gridCardImageWrapper: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
  },
  gridImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.25)',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#131B2E',
  },
  favBadgeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoLocationRow: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  photoLocationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
  },
  gridCardBody: {
    padding: 10,
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
    marginBottom: 2,
  },
  gridCardArtist: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  priceContainer: {
    marginTop: 2,
  },
  pricePrefix: {
    fontSize: 9,
    color: '#64748B',
  },
  priceValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  promoBanner: {
    backgroundColor: '#E2E7FF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 8,
  },
  promoGlow: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DBE1FF',
    opacity: 0.7,
  },
  promoContent: {
    flex: 1,
  },
  promoTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  promoTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#131B2E',
    marginBottom: 3,
  },
  promoDesc: {
    fontSize: 11,
    color: '#434655',
    lineHeight: 15,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  horizontalList: {
    gap: 10,
  },
  hCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  hCardImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  hCardImage: {
    width: '100%',
    height: '100%',
  },
  hCardDateBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hCardDateText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#131B2E',
  },
  hCardBody: {
    flex: 1,
  },
  hCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#EAEDFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#434655',
  },
  hCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
    marginBottom: 4,
  },
  hCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  hCardLocationText: {
    fontSize: 11,
    color: '#2563EB',
    textDecorationLine: 'underline',
    fontWeight: '600',
    flex: 1,
  },
  hCardPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#131B2E',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
