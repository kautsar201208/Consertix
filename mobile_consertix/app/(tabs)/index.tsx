import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://172.19.23.51:5000';
const { width } = Dimensions.get('window');
const cardWidth = (width - 16 * 3) / 2; // pixel-perfect column sizing

interface Event {
  id: number;
  judul: string;
  nama_artis: string;
  deskripsi: string;
  tanggal: string;
  jam: string;
  lokasi: string;
  poster: string;
}

interface Order {
  id: number;
  judul: string;
  nama_kategori: string;
  jumlah_tiket: number;
  total_harga: number;
  status: string;
  created_at: string;
}

export default function HomeScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Load data whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      fetchLatestOrder();
    }, [])
  );

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      const eventData = data.data || data;
      setEvents(eventData);
      // If there's an ongoing search, filter accordingly, else show all
      if (searchQuery.trim() !== '') {
        filterList(searchQuery, eventData);
      } else {
        setFilteredEvents(eventData);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLatestOrder = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        setLatestOrder(null);
        return;
      }
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // Assuming the backend returns newest first, or we can sort them
          setLatestOrder(data[0]);
        } else {
          setLatestOrder(null);
        }
      }
    } catch (error) {
      console.error('Error fetching latest order:', error);
      setLatestOrder(null);
    }
  };

  const filterList = (query: string, allEvents: Event[]) => {
    if (query.trim() === '') {
      setFilteredEvents(allEvents);
    } else {
      const filtered = allEvents.filter(
        (event) =>
          event.judul.toLowerCase().includes(query.toLowerCase()) ||
          event.nama_artis.toLowerCase().includes(query.toLowerCase()) ||
          event.lokasi.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterList(query, events);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
    fetchLatestOrder();
  };

  const renderFeaturedCard = () => {
    if (events.length === 0) return null;
    const featuredEvent = events[0];
    const posterUrl = featuredEvent.poster
      ? `${API_URL}/uploads/posters/${featuredEvent.poster}`
      : 'https://via.placeholder.com/300x200?text=No+Image';

    return (
      <TouchableOpacity
        style={[styles.featuredCard, { backgroundColor: colors.text }]}
        onPress={() => router.push(`/event/${featuredEvent.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.featuredLeft}>
          <View style={[styles.featuredBadge, { backgroundColor: colors.background }]}>
            <ThemedText style={[styles.featuredBadgeText, { color: colors.text }]}>
              FEATURED EVENT ⚡
            </ThemedText>
          </View>
          <ThemedText style={[styles.featuredTitle, { color: colors.background }]} numberOfLines={2}>
            {featuredEvent.judul}
          </ThemedText>
          <ThemedText style={[styles.featuredSubtitle, { color: colors.background + 'b0' }]} numberOfLines={1}>
            {featuredEvent.nama_artis}
          </ThemedText>
          <View style={styles.featuredFooter}>
            <ThemedText style={[styles.featuredPromoText, { color: colors.background }]}>
              Diskon Spesial ➔
            </ThemedText>
          </View>
        </View>
        <View style={styles.featuredRight}>
          <Image source={{ uri: posterUrl }} style={styles.featuredImage} resizeMode="cover" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderMyTicketsSection = () => {
    return (
      <View style={styles.myTicketsContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Tiket Saya 🎟️</ThemedText>
          <TouchableOpacity onPress={() => router.push('/orders')}>
            <ThemedText style={[styles.seeAllText, { color: colors.text + '80' }]}>
              Lihat Semua
            </ThemedText>
          </TouchableOpacity>
        </View>

        {latestOrder ? (
          <TouchableOpacity
            style={[styles.ticketCard, { backgroundColor: colors.text }]}
            onPress={() => router.push('/orders')}
            activeOpacity={0.9}
          >
            <View style={styles.ticketContent}>
              <View style={[styles.ticketIconContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="musical-note" size={22} color={colors.text} />
              </View>
              <View style={styles.ticketInfo}>
                <ThemedText style={[styles.ticketTitle, { color: colors.background }]} numberOfLines={1}>
                  {latestOrder.judul}
                </ThemedText>
                <View style={styles.ticketProgressWrapper}>
                  {/* Visual timeline/progress element matching course card design in mockup */}
                  <View style={styles.ticketProgressBarBg}>
                    <View style={[styles.ticketProgressBarFill, { backgroundColor: colors.background }]} />
                  </View>
                  <ThemedText style={[styles.ticketProgressText, { color: colors.background + 'b0' }]}>
                    {latestOrder.jumlah_tiket} Tiket · {latestOrder.nama_kategori}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={[styles.ticketStatusBadge, { backgroundColor: colors.background }]}>
              <ThemedText style={[styles.ticketStatusText, { color: colors.text }]}>
                READY
              </ThemedText>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ticketCardEmpty, { borderColor: colors.text }]}
            onPress={() => {
              // Smooth feedback or scroll
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.text} style={{ marginBottom: 6 }} />
            <ThemedText style={[styles.ticketEmptyText, { color: colors.text }]}>
              Belum ada pesanan tiket aktif.
            </ThemedText>
            <ThemedText style={[styles.ticketEmptySubtext, { color: colors.text + '80' }]}>
              Temukan konser terpopuler di bawah ini!
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeaderAndFeatured = () => {
    const isSearching = searchQuery.trim() !== '';

    return (
      <View style={styles.headerWrapper}>
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Avatar Circle Container */}
            <View style={[styles.avatarContainer, { backgroundColor: colors.text }]}>
              <Ionicons name="person" size={20} color={colors.background} />
            </View>
            <View style={styles.greetingContainer}>
              <ThemedText style={[styles.greetingLabel, { color: colors.text + '80' }]}>Hello,</ThemedText>
              <ThemedText style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {user?.nama || 'Guest'} 😎
              </ThemedText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.text + '10' }]}
              onPress={() => {
                setShowSearchBar(!showSearchBar);
                if (showSearchBar) {
                  handleSearch('');
                }
              }}
            >
              <Ionicons name={showSearchBar ? "close" : "search"} size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.text + '10' }]}
              onPress={() => router.push('/explore')}
            >
              <Ionicons name="options-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Search Bar */}
        {showSearchBar && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchWrapper, { borderColor: colors.text }]}>
              <Ionicons name="search" size={18} color={colors.text} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Cari event, artis, lokasi..."
                placeholderTextColor={colors.text + '60'}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearSearchButton}>
                  <Ionicons name="close-circle" size={18} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Banner + Tickets sections (only show if not searching) */}
        {!isSearching && (
          <>
            {renderFeaturedCard()}
            {renderMyTicketsSection()}
          </>
        )}

        {/* All Events Header */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            {isSearching ? 'Hasil Pencarian ✨' : 'Semua Event ✨'}
          </ThemedText>
          {!isSearching && (
            <TouchableOpacity style={styles.filterDropdown}>
              <ThemedText style={[styles.filterDropdownText, { color: colors.text }]}>
                Populer <Ionicons name="chevron-down" size={12} color={colors.text} />
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const EventGridCard = ({ event }: { event: Event }) => {
    const posterUrl = event.poster
      ? `${API_URL}/uploads/posters/${event.poster}`
      : 'https://via.placeholder.com/300x200?text=No+Image';

    // Mock ratings matching mockup (e.g. 5.0, 4.9)
    const mockRating = (4.5 + (event.id % 6) * 0.1).toFixed(1);

    return (
      <TouchableOpacity
        style={[
          styles.gridCard,
          {
            backgroundColor: colors.background,
            borderColor: colors.text,
          },
        ]}
        onPress={() => router.push(`/event/${event.id}`)}
        activeOpacity={0.9}
      >
        {/* Floating circular icon badge at top left similar to Ai/Figma icon in mockup */}
        <View style={[styles.gridBadge, { backgroundColor: colors.text }]}>
          <Ionicons name="musical-notes" size={12} color={colors.background} />
        </View>

        {/* Event Poster Area */}
        <View style={styles.gridImageContainer}>
          <Image source={{ uri: posterUrl }} style={styles.gridImage} resizeMode="cover" />
        </View>

        {/* Text details */}
        <View style={styles.gridContent}>
          <ThemedText style={[styles.gridTitle, { color: colors.text }]} numberOfLines={1}>
            {event.judul}
          </ThemedText>
          <ThemedText style={[styles.gridArtist, { color: colors.text + '80' }]} numberOfLines={1}>
            {event.nama_artis}
          </ThemedText>
          
          <View style={styles.gridFooter}>
            <View style={styles.gridRatingContainer}>
              <Ionicons name="star" size={11} color={colors.text} style={{ marginRight: 2 }} />
              <ThemedText style={[styles.gridRatingText, { color: colors.text }]}>
                {mockRating}
              </ThemedText>
            </View>
            <ThemedText style={[styles.gridDetailText, { color: colors.text }]} numberOfLines={1}>
              📍 {event.lokasi.split(',')[0]}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={colors.text + '40'} style={{ marginBottom: 12 }} />
        <ThemedText style={[styles.emptyText, { color: colors.text }]}>
          {searchQuery ? 'Event tidak ditemukan' : 'Belum ada event saat ini'}
        </ThemedText>
      </View>
    );
  };

  if (loading && events.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => <EventGridCard event={item} />}
        ListHeaderComponent={renderHeaderAndFeatured}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
            colors={[colors.text]}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  featuredCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  featuredLeft: {
    flex: 1,
    paddingRight: 12,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 26,
  },
  featuredSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  featuredFooter: {
    marginTop: 'auto',
  },
  featuredPromoText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  featuredRight: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  myTicketsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ticketCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  ticketContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  ticketProgressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketProgressBarBg: {
    width: 50,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
    overflow: 'hidden',
  },
  ticketProgressBarFill: {
    width: '80%',
    height: '100%',
    borderRadius: 2.5,
  },
  ticketProgressText: {
    fontSize: 11,
  },
  ticketStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 12,
  },
  ticketStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  ticketCardEmpty: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketEmptyText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2,
  },
  ticketEmptySubtext: {
    fontSize: 11,
    textAlign: 'center',
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterDropdownText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 95, // Leave enough space for absolute floating tab bar
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: cardWidth,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 12,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  gridBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    width: 26,
    height: 26,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  gridImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  gridContent: {
    paddingHorizontal: 2,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  gridArtist: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridRatingText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  gridDetailText: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
