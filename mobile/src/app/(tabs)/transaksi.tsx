import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { storage } from '@/utils/storage';

interface OrderItem {
  id: number;
  user_id: number;
  ticket_category_id: number;
  jumlah_tiket: number;
  total_harga: number;
  status: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  id_number?: string;
  nama_kategori?: string;
  harga_kategori?: number;
  judul?: string;
  lokasi?: string;
  tanggal?: string;
  jam?: string;
  poster?: string | null;
}

type OrderFilter = 'all' | 'success' | 'pending' | 'cancelled';
type DateFilter = 'all' | '30days' | '7days';

const getOrderState = (status?: string): Exclude<OrderFilter, 'all'> => {
  const normalizedStatus = status?.toLowerCase();
  if (!normalizedStatus || ['paid', 'success', 'verified', 'settlement'].includes(normalizedStatus)) {
    return 'success';
  }
  if (['cancelled', 'canceled', 'rejected', 'expired', 'expire', 'deny'].includes(normalizedStatus)) {
    return 'cancelled';
  }
  return 'pending';
};

export default function RiwayatTransaksiScreen() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const searchInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isLoggedIn) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      const token = await storage.getItem('token');
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat pesanan:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders(true);
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
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

  const formatRupiah = (val: number) => {
    return 'Rp' + Number(val || 0).toLocaleString('id-ID');
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return dateStr;
      const date = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const time = d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${date}, ${time} WIB`;
    } catch {
      return dateStr;
    }
  };

  const handleOpenTicket = (order: OrderItem) => {
    const buyerName =
      `${order.first_name || ''} ${order.last_name || ''}`.trim() ||
      user?.nama ||
      'Pengunjung';

    router.push({
      pathname: '/checkout/success' as any,
      params: {
        orderId: String(order.id),
        eventTitle: order.judul || 'Konser Musik',
        eventDate: order.tanggal || '',
        eventLocation: order.lokasi || '',
        poster: order.poster || '',
        ticketName: order.nama_kategori || 'Tiket Konser',
        ticketPrice: String(order.harga_kategori || Math.round(order.total_harga / (order.jumlah_tiket || 1))),
        quantity: String(order.jumlah_tiket || 1),
        namaLengkap: buyerName,
        email: order.email || user?.email || '',
        phone: order.phone || '',
        idNumber: order.id_number || '',
        paymentMethod: 'QRIS',
        totalAmount: String(order.total_harga),
      },
    });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOrders = orders
    .filter((order) => {
      if (activeFilter !== 'all' && getOrderState(order.status) !== activeFilter) return false;

      if (normalizedQuery) {
        const searchableText = [
          order.id,
          order.judul,
          order.nama_kategori,
          order.lokasi,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(normalizedQuery)) return false;
      }

      if (dateFilter !== 'all') {
        const createdAt = new Date(order.created_at).getTime();
        const dayLimit = dateFilter === '7days' ? 7 : 30;
        if (!Number.isFinite(createdAt) || Date.now() - createdAt > dayLimit * 24 * 60 * 60 * 1000) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sortNewestFirst ? bTime - aTime : aTime - bTime;
    });

  const statusCounts = {
    all: orders.length,
    success: orders.filter((order) => getOrderState(order.status) === 'success').length,
    pending: orders.filter((order) => getOrderState(order.status) === 'pending').length,
    cancelled: orders.filter((order) => getOrderState(order.status) === 'cancelled').length,
  };
  const dateFilterLabel =
    dateFilter === '7days' ? '7 Hari Terakhir' : dateFilter === '30days' ? '30 Hari Terakhir' : 'Semua Waktu';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>Riwayat Transaksi</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            accessibilityLabel="Cari transaksi"
            onPress={() => searchInputRef.current?.focus()}
          >
            <Ionicons name="search" size={21} color="#434655" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            accessibilityLabel="Filter transaksi"
            onPress={() => setShowFilterSheet(true)}
          >
            <Ionicons name="options-outline" size={21} color="#434655" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBadge}
            accessibilityLabel="Buka akun"
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={19} color="#737686" />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari event atau nomor transaksi..."
            placeholderTextColor="#737686"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              accessibilityLabel="Hapus pencarian"
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={18} color="#737686" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {([
            { key: 'all', label: 'Semua', count: statusCounts.all },
            { key: 'success', label: 'Berhasil', count: statusCounts.success },
            { key: 'pending', label: 'Menunggu Pembayaran', count: statusCounts.pending },
            { key: 'cancelled', label: 'Dibatalkan', count: statusCounts.cancelled },
          ] as const).map((filter) => {
            const selected = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, selected && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text style={[styles.filterText, selected && styles.filterTextActive]}>
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.secondaryFilters}>
          <TouchableOpacity
            style={styles.controlChip}
            onPress={() => setShowFilterSheet(true)}
          >
            <Ionicons name="calendar-outline" size={15} color="#004AC6" />
            <Text style={styles.controlChipText}>{dateFilterLabel}</Text>
            <Ionicons name="chevron-down" size={13} color="#737686" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlChip}
            onPress={() => setSortNewestFirst((current) => !current)}
          >
            <Ionicons name="swap-vertical" size={15} color="#004AC6" />
            <Text style={styles.controlChipText}>
              {sortNewestFirst ? 'Terbaru' : 'Terlama'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.resultCount}>
            {filteredOrders.length} dari {orders.length}
          </Text>
        </View>
      </View>

      {/* Content */}
      {!isLoggedIn ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="lock-closed-outline" size={38} color="#004AC6" />
          </View>
          <Text style={styles.emptyTitle}>Silakan Masuk Terlebih Dahulu</Text>
          <Text style={styles.emptySub}>
            Masuk ke akun Anda untuk melihat daftar pesanan tiket konser yang telah Anda beli.
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')} activeOpacity={0.85}>
            <Text style={styles.loginBtnText}>Masuk ke Akun</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#004AC6" />
          <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="ticket-outline" size={38} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
          <Text style={styles.emptySub}>
            {orders.length === 0
              ? 'Anda belum pernah memesan tiket konser. Jelajahi konser seru dan pesan tiket favoritmu sekarang!'
              : 'Tidak ada transaksi yang cocok dengan pencarian atau filter ini.'}
          </Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
            <Ionicons name="flame" size={16} color="#FFFFFF" />
            <Text style={styles.exploreBtnText}>Jelajahi Konser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#004AC6" />
          }
          renderItem={({ item }) => {
            const posterUri = getPosterUri(item.poster);
            const orderState = getOrderState(item.status);
            const statusLabel =
              orderState === 'success'
                ? 'Berhasil'
                : orderState === 'cancelled'
                  ? 'Dibatalkan'
                  : 'Menunggu';

            return (
              <View
                style={[
                  styles.orderCard,
                  orderState === 'cancelled' && styles.orderCardCancelled,
                ]}
              >
                {orderState === 'pending' && <View style={styles.pendingAccent} />}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderDetails}>
                    <View style={styles.orderDateLine}>
                      <Ionicons name="calendar-outline" size={14} color="#004AC6" />
                      <Text style={styles.orderDateText}>
                        {formatDateTime(item.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.orderNumberText}>#{item.id}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      orderState === 'success'
                        ? styles.statusBadgeSuccess
                        : orderState === 'cancelled'
                          ? styles.statusBadgeCancelled
                          : styles.statusBadgePending,
                    ]}
                  >
                    <Ionicons
                      name={
                        orderState === 'success'
                          ? 'checkmark-circle'
                          : orderState === 'cancelled'
                            ? 'close-circle'
                            : 'time'
                      }
                      size={12}
                      color={
                        orderState === 'success'
                          ? '#005C45'
                          : orderState === 'cancelled'
                            ? '#93000A'
                            : '#8A4B00'
                      }
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        orderState === 'success'
                          ? styles.statusTextSuccess
                          : orderState === 'cancelled'
                            ? styles.statusTextCancelled
                            : styles.statusTextPending,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Body Event Info */}
                <View style={styles.cardBody}>
                  <View style={styles.posterContainer}>
                    {posterUri ? (
                      <Image source={{ uri: posterUri }} style={styles.posterImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.posterPlaceholder}>
                        <Ionicons name="musical-notes" size={24} color="#004AC6" />
                      </View>
                    )}
                  </View>

                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {item.judul || 'Konser Musik'}
                    </Text>

                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={12} color="#64748B" />
                      <Text style={styles.infoRowText} numberOfLines={1}>
                        {item.tanggal || 'Jadwal Menyusul'}
                        {item.jam ? ` • ${item.jam}` : ''}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={12} color="#64748B" />
                      <Text style={styles.infoRowText} numberOfLines={1}>
                        {item.lokasi || 'Venue Jakarta'}
                      </Text>
                    </View>

                    <View style={styles.ticketPill}>
                      <Ionicons name="ticket" size={12} color="#004AC6" />
                      <Text style={styles.ticketPillText}>
                        {item.jumlah_tiket}x {item.nama_kategori || 'Kategori Tiket'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Footer Total & Button */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total Pembayaran</Text>
                    <Text style={styles.totalValue}>{formatRupiah(item.total_harga)}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.viewTicketBtn}
                    onPress={() => handleOpenTicket(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="qr-code-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.viewTicketBtnText}>Lihat E-Tiket</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
      <Modal
        visible={showFilterSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Tutup filter"
            onPress={() => setShowFilterSheet(false)}
          />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeading}>
              <Text style={styles.sheetTitle}>Filter Transaksi</Text>
              <TouchableOpacity
                accessibilityLabel="Tutup filter"
                onPress={() => setShowFilterSheet(false)}
              >
                <Ionicons name="close" size={22} color="#434655" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSectionTitle}>Rentang waktu</Text>
            {([
              { key: 'all', label: 'Semua Waktu' },
              { key: '30days', label: '30 Hari Terakhir' },
              { key: '7days', label: '7 Hari Terakhir' },
            ] as const).map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.sheetOption}
                onPress={() => setDateFilter(option.key)}
              >
                <Text style={styles.sheetOptionText}>{option.label}</Text>
                <Ionicons
                  name={dateFilter === option.key ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={dateFilter === option.key ? '#004AC6' : '#737686'}
                />
              </TouchableOpacity>
            ))}

            <Text style={[styles.sheetSectionTitle, styles.sortSectionTitle]}>Urutan</Text>
            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={[styles.sortOption, sortNewestFirst && styles.sortOptionActive]}
                onPress={() => setSortNewestFirst(true)}
              >
                <Text style={[styles.sortOptionText, sortNewestFirst && styles.sortOptionTextActive]}>
                  Terbaru
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortOption, !sortNewestFirst && styles.sortOptionActive]}
                onPress={() => setSortNewestFirst(false)}
              >
                <Text style={[styles.sortOptionText, !sortNewestFirst && styles.sortOptionTextActive]}>
                  Terlama
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilterSheet(false)}
            >
              <Text style={styles.applyFiltersText}>Terapkan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FAF8FF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#004AC6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#131B2E',
    letterSpacing: -0.2,
  },
  controls: {
    backgroundColor: '#FAF8FF',
    paddingBottom: 10,
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 2,
  },
  searchBar: {
    height: 44,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 24,
    backgroundColor: '#F2F3FF',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 12,
    color: '#131B2E',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F2F3FF',
  },
  filterChipActive: {
    backgroundColor: '#004AC6',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#434655',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  secondaryFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 7,
    gap: 8,
  },
  controlChip: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEDFF',
  },
  controlChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#131B2E',
  },
  resultCount: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    color: '#434655',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 140,
    gap: 14,
  },
  orderCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAEDFF',
  },
  orderCardCancelled: {
    opacity: 0.88,
  },
  pendingAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#D22348',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3FF',
  },
  cardHeaderDetails: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  orderDateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  orderNumberText: {
    fontSize: 10,
    color: '#737686',
    fontFamily: 'monospace',
  },
  orderDateText: {
    flex: 1,
    fontSize: 10,
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FFdad6',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextSuccess: {
    color: '#065F46',
  },
  statusTextPending: {
    color: '#92400E',
  },
  statusTextCancelled: {
    color: '#93000A',
  },
  cardBody: {
    flexDirection: 'row',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3FF',
  },
  posterContainer: {
    width: 80,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F2F3FF',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DBE1FF',
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#131B2E',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  infoRowText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  ticketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#F2F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  ticketPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004AC6',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#004AC6',
    marginTop: 1,
  },
  viewTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#004AC6',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    shadowColor: '#004AC6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  viewTicketBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F2F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#131B2E',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: '#004AC6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#004AC6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(19, 27, 46, 0.32)',
  },
  filterSheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C3C6D7',
    marginBottom: 16,
  },
  sheetHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#131B2E',
  },
  sheetSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#434655',
    marginBottom: 6,
  },
  sheetOption: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3FF',
  },
  sheetOptionText: {
    fontSize: 13,
    color: '#131B2E',
  },
  sortSectionTitle: {
    marginTop: 16,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#F2F3FF',
  },
  sortOptionActive: {
    backgroundColor: '#DBE1FF',
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434655',
  },
  sortOptionTextActive: {
    color: '#004AC6',
  },
  applyFiltersButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: '#2563EB',
  },
  applyFiltersText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
