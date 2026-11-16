import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

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
}

const CATEGORIES = ['Semua', 'Festival', 'Pop', 'Rock', 'Jazz', 'Indie'];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [events, setEvents] = useState<EventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      if (!res.ok) {
        throw new Error('Gagal memuat event');
      }
      const data = await res.json();
      const list: EventItem[] = Array.isArray(data) ? data : data.data || [];
      setEvents(list);
      applyFilter(searchQuery, selectedCategory, list);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const applyFilter = (query: string, category: string, list: EventItem[]) => {
    let result = list;

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) =>
          e.judul.toLowerCase().includes(q) ||
          e.nama_artis.toLowerCase().includes(q) ||
          e.lokasi.toLowerCase().includes(q)
      );
    }

    if (category !== 'Semua') {
      result = result.filter(
        (e) =>
          e.judul.toLowerCase().includes(category.toLowerCase()) ||
          e.deskripsi.toLowerCase().includes(category.toLowerCase())
      );
    }

    setFilteredEvents(result);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilter(text, selectedCategory, events);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    applyFilter(searchQuery, category, events);
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
    Alert.alert(
      event.judul,
      `Artis: ${event.nama_artis}\nTanggal: ${event.tanggal} ${event.jam || ''}\nLokasi: ${event.lokasi}\n\n${event.deskripsi}`,
      [
        { text: 'Tutup', style: 'cancel' },
        {
          text: 'Pesan Tiket',
          onPress: () => {
            if (!isLoggedIn) {
              Alert.alert('Perhatian', 'Silakan masuk terlebih dahulu untuk memesan tiket.', [
                { text: 'Nanti', style: 'cancel' },
                { text: 'Masuk', onPress: () => router.push('/login') },
              ]);
            } else {
              Alert.alert('Tiket Dipilih', `Event "${event.judul}" siap dipesan!`);
            }
          },
        },
      ]
    );
  };

  const getPosterUri = (poster: string | null) => {
    if (!poster) return null;
    if (poster.startsWith('http')) return poster;
    return `${API_URL}/uploads/${poster}`;
  };

  const featuredEvent = events.length > 0 ? events[0] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.brandRow}>
          <View style={[styles.brandIcon, { backgroundColor: colors.tint }]}>
            <Ionicons name="musical-notes" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.appName, { color: colors.text }]}>Concertix</Text>
            <Text style={[styles.userGreeting, { color: colors.textSecondary }]}>
              {isLoggedIn && user ? `Halo, ${user.nama} 👋` : 'Temukan konser favoritmu'}
            </Text>
          </View>
        </View>

        {isLoggedIn ? (
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.backgroundElement }]}
            onPress={handleLogoutConfirm}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={[styles.authButtonText, { color: colors.error }]}>Keluar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.authButtonPrimary, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/login')}
          >
            <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
            <Text style={styles.authButtonTextPrimary}>Masuk</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Search Input */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="search-outline" size={20} color={colors.placeholder} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Cari konser, artis, atau lokasi..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearSearch}>
                  <Ionicons name="close-circle" size={18} color={colors.placeholder} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Category Chips */}
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => handleCategorySelect(cat)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? colors.tint : colors.backgroundElement,
                        borderColor: isSelected ? colors.tint : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Featured Event Card (if no search query) */}
            {!searchQuery && featuredEvent ? (
              <TouchableOpacity
                style={[styles.featuredCard, { backgroundColor: colors.tint }]}
                onPress={() => handleEventPress(featuredEvent)}
                activeOpacity={0.9}
              >
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>FEATURED EVENT ⚡</Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {featuredEvent.judul}
                </Text>
                <Text style={styles.featuredArtist}>
                  {featuredEvent.nama_artis}
                </Text>
                <View style={styles.featuredMetaRow}>
                  <View style={styles.featuredMetaItem}>
                    <Ionicons name="calendar-outline" size={14} color="#CBD5E1" />
                    <Text style={styles.featuredMetaText}>
                      {featuredEvent.tanggal} {featuredEvent.jam ? `• ${featuredEvent.jam}` : ''}
                    </Text>
                  </View>
                  <View style={styles.featuredMetaItem}>
                    <Ionicons name="location-outline" size={14} color="#CBD5E1" />
                    <Text style={styles.featuredMetaText} numberOfLines={1}>
                      {featuredEvent.lokasi}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : null}

            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {searchQuery ? `Hasil Pencarian (${filteredEvents.length})` : 'Daftar Konser Tersedia'}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const posterUri = getPosterUri(item.poster);
          return (
            <TouchableOpacity
              style={[
                styles.eventCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleEventPress(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardImageContainer}>
                {posterUri ? (
                  <Image source={{ uri: posterUri }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardPlaceholder, { backgroundColor: colors.backgroundElement }]}>
                    <Ionicons name="musical-note" size={32} color={colors.placeholder} />
                  </View>
                )}
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {item.status === 'aktif' ? 'TERSEDIA' : 'SEGERA'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={[styles.cardArtist, { color: colors.accent }]} numberOfLines={1}>
                  {item.nama_artis}
                </Text>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.judul}
                </Text>

                <View style={styles.cardInfoRow}>
                  <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.cardInfoText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.tanggal}
                  </Text>
                </View>

                <View style={styles.cardInfoRow}>
                  <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.cardInfoText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.lokasi}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Memuat daftar konser...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={54} color={colors.placeholder} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Belum ada konser ditemukan
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery
                  ? 'Coba kata kunci pencarian yang lain'
                  : 'Event konser akan segera ditambahkan'}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.tint }]}
                onPress={fetchEvents}
              >
                <Text style={styles.retryButtonText}>Muat Ulang</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userGreeting: {
    fontSize: 12,
    fontWeight: '500',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  authButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  authButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  authButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 10,
  },
  clearSearch: {
    padding: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  featuredArtist: {
    color: '#93C5FD',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuredMetaRow: {
    gap: 6,
  },
  featuredMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredMetaText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eventCard: {
    width: cardWidth,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageContainer: {
    width: '100%',
    height: 125,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
  },
  cardBody: {
    padding: 12,
  },
  cardArtist: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 8,
    minHeight: 36,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  cardInfoText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

