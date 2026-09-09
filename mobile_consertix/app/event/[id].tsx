import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { PersonalInfoModal } from '@/components/PersonalInfoModal';

const API_URL = 'http://172.19.23.51:5000';

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

interface TicketCategory {
  id: number;
  nama_kategori: string;
  harga: number;
  stok: number;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/ticket-categories/event/${id}`);
        if (!response.ok) throw new Error('Gagal memuat kategori tiket');
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0]);
          setQuantity(1);
        }
      } catch (error) {
        console.error('Error fetching ticket categories:', error);
      }
    };

    fetchCategories();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/events/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }

      const data = await response.json();
      setEvent(data.data || data);
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Gagal memuat detail event');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);

  const handleBooking = () => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'Silakan login terlebih dahulu');
      router.push('/login');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Info', 'Belum ada kategori tiket untuk event ini');
      return;
    }

    setIsPersonalInfoModalOpen(true);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </ThemedView>
    );
  }

  if (!event) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <ThemedText>Event tidak ditemukan</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const posterUrl = event.poster
    ? `${API_URL}/uploads/posters/${event.poster}`
    : 'https://via.placeholder.com/600x400?text=No+Image';

  const totalPrice = selectedCategory ? Number(selectedCategory.harga) * quantity : 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.text + '08' }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={[styles.headerTitle, { color: colors.text }]}>
          Event Details
        </ThemedText>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            onPress={() => Alert.alert('Share', 'Bagikan event ini ke teman-temanmu!')}
            style={[styles.iconButton, { backgroundColor: colors.text + '08' }]}
          >
            <Ionicons name="paper-plane-outline" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsBookmarked(!isBookmarked)}
            style={[styles.iconButton, { backgroundColor: colors.text + '08' }]}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Poster */}
        <View style={styles.posterWrapper}>
          <Image source={{ uri: posterUrl }} style={styles.posterImage} />
        </View>

        {/* Event Title & Description */}
        <View style={styles.detailsContainer}>
          <ThemedText style={[styles.eventTitle, { color: colors.text }]}>
            {event.judul}
          </ThemedText>
          <ThemedText style={[styles.eventDescription, { color: colors.text + '90' }]}>
            {event.deskripsi}
          </ThemedText>

          {/* Date & Time Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Ionicons name="calendar-outline" size={18} color={colors.text + '80'} style={styles.metaIcon} />
              <ThemedText style={[styles.metaText, { color: colors.text + 'D0' }]}>
                {event.tanggal} {event.jam ? `• ${event.jam}` : ''}
              </ThemedText>
            </View>

            {/* Attendees Stack Pill */}
            <View style={styles.attendeesContainer}>
              <View style={styles.avatarStack}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
                  style={[styles.avatar, { zIndex: 3 }]}
                />
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }}
                  style={[styles.avatar, { zIndex: 2, marginLeft: -8 }]}
                />
                <View style={[styles.avatarMore, { zIndex: 1, marginLeft: -8 }]}>
                  <ThemedText style={styles.avatarMoreText}>+5</ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.goingText, { color: colors.text }]}>8 Going</ThemedText>
            </View>
          </View>

          {/* Location Row */}
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={18} color={colors.text + '80'} style={styles.metaIcon} />
            <ThemedText style={[styles.locationLink, { color: colors.text + 'D0' }]} numberOfLines={1}>
              {event.lokasi}
            </ThemedText>
          </View>

          {/* Host Card */}
          <View style={[styles.hostCard, { backgroundColor: colors.text + '06' }]}>
            <View style={styles.hostInfo}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
                }}
                style={styles.hostAvatar}
              />
              <View>
                <ThemedText style={[styles.hostName, { color: colors.text }]}>
                  {event.nama_artis || 'Organizer'}
                </ThemedText>
                <ThemedText style={[styles.hostRole, { color: colors.text + '70' }]}>
                  Host
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.messageButton, { backgroundColor: colors.text }]}
              onPress={() => Alert.alert('Message', `Kirim pesan ke ${event.nama_artis || 'Host'}`)}
            >
              <ThemedText style={[styles.messageText, { color: colors.background }]}>
                Message
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Ticket Categories List */}
          <View style={styles.ticketSection}>
            {categories.length === 0 ? (
              <ThemedText style={{ color: colors.text + '70', marginTop: 8 }}>
                Belum ada kategori tiket tersedia.
              </ThemedText>
            ) : (
              categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                const catQuantity = isSelected ? quantity : 0;
                const unavailable = cat.stok < 1;

                return (
                  <View
                    key={cat.id}
                    style={[
                      styles.ticketCard,
                      {
                        backgroundColor: colors.text + '05',
                        borderColor: isSelected ? colors.text + '40' : colors.text + '10',
                        opacity: unavailable ? 0.5 : 1,
                      },
                    ]}
                  >
                    <View style={styles.ticketCardLeft}>
                      <ThemedText style={[styles.ticketCategoryName, { color: colors.text + '80' }]}>
                        {cat.nama_kategori}
                      </ThemedText>
                      <ThemedText style={[styles.ticketPrice, { color: colors.text }]}>
                        {formatPrice(Number(cat.harga))}
                      </ThemedText>
                    </View>

                    <View style={styles.counterRow}>
                      <TouchableOpacity
                        style={[
                          styles.counterButton,
                          { borderColor: colors.text + '30' },
                        ]}
                        disabled={unavailable || catQuantity <= 0}
                        onPress={() => {
                          if (isSelected) {
                            if (quantity > 1) {
                              setQuantity((q) => q - 1);
                            } else {
                              setQuantity(0);
                            }
                          }
                        }}
                      >
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>

                      <ThemedText style={[styles.counterValue, { color: colors.text }]}>
                        {catQuantity}
                      </ThemedText>

                      <TouchableOpacity
                        style={[
                          styles.counterButton,
                          { borderColor: colors.text + '30' },
                        ]}
                        disabled={unavailable || catQuantity >= cat.stok}
                        onPress={() => {
                          if (!isSelected) {
                            setSelectedCategory(cat);
                            setQuantity(1);
                          } else {
                            setQuantity((q) => q + 1);
                          }
                        }}
                      >
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.text + '10',
          },
        ]}
      >
        <View style={styles.bottomPriceContainer}>
          <ThemedText style={[styles.bottomPriceText, { color: colors.text }]}>
            {formatPrice(totalPrice)}
          </ThemedText>
          <ThemedText style={[styles.bottomPriceLabel, { color: colors.text + '70' }]}>
            Total Amount
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[
            styles.buyButton,
            {
              backgroundColor: colors.text,
              opacity: !selectedCategory || quantity <= 0 ? 0.6 : 1,
            },
          ]}
          disabled={!selectedCategory || quantity <= 0}
          onPress={handleBooking}
        >
          <ThemedText style={[styles.buyButtonText, { color: colors.background }]}>
            Buy ticket
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Personal Info Modal Sheet */}
      {selectedCategory && (
        <PersonalInfoModal
          visible={isPersonalInfoModalOpen}
          onClose={() => setIsPersonalInfoModalOpen(false)}
          ticketCategoryId={selectedCategory.id}
          quantity={quantity > 0 ? quantity : 1}
          onSuccess={() => router.replace('/orders')}
        />
      )}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerRightIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  posterWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  posterImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  detailsContainer: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaIcon: {
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarMore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarMoreText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  goingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationLink: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ddd',
  },
  hostName: {
    fontSize: 15,
    fontWeight: '700',
  },
  hostRole: {
    fontSize: 12,
    marginTop: 2,
  },
  messageButton: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ticketSection: {
    marginTop: 8,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  ticketCardLeft: {
    flex: 1,
  },
  ticketCategoryName: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  ticketPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 14,
    minWidth: 16,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomPriceContainer: {
    flexDirection: 'column',
  },
  bottomPriceText: {
    fontSize: 22,
    fontWeight: '700',
  },
  bottomPriceLabel: {
    fontSize: 12,
    marginTop: 1,
  },
  buyButton: {
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
