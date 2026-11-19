import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
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

export default function RiwayatTransaksiScreen() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'success' | 'pending'>('all');

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
    if (poster.startsWith('http')) return poster;
    const cleanPoster = poster.startsWith('/') ? poster.slice(1) : poster;
    if (cleanPoster.startsWith('uploads/')) {
      return `${API_URL}/${cleanPoster}`;
    }
    return `${API_URL}/uploads/posters/${cleanPoster}`;
  };

  const formatRupiah = (val: number) => {
    return 'Rp' + Number(val || 0).toLocaleString('id-ID');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
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

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'all') return true;
    const isSuccess = !o.status || o.status.toLowerCase() === 'paid' || o.status.toLowerCase() === 'success' || o.status.toLowerCase() === 'verified';
    if (activeFilter === 'success') return isSuccess;
    if (activeFilter === 'pending') return !isSuccess;
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandBadge}>
            <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>Riwayat Transaksi</Text>
            <Text style={styles.brandSub}>Tiket & riwayat pemesanan Anda</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={18} color="#004AC6" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            Semua ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'success' && styles.filterChipActive]}
          onPress={() => setActiveFilter('success')}
        >
          <Ionicons
            name="checkmark-circle"
            size={13}
            color={activeFilter === 'success' ? '#FFFFFF' : '#10B981'}
          />
          <Text style={[styles.filterText, activeFilter === 'success' && styles.filterTextActive]}>
            Berhasil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'pending' && styles.filterChipActive]}
          onPress={() => setActiveFilter('pending')}
        >
          <Ionicons
            name="time-outline"
            size={13}
            color={activeFilter === 'pending' ? '#FFFFFF' : '#F59E0B'}
          />
          <Text style={[styles.filterText, activeFilter === 'pending' && styles.filterTextActive]}>
            Menunggu
          </Text>
        </TouchableOpacity>
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
            {activeFilter === 'all'
              ? 'Anda belum pernah memesan tiket konser. Jelajahi konser seru dan pesan tiket favoritmu sekarang!'
              : 'Tidak ada transaksi dengan status ini.'}
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
            const isSuccess =
              !item.status ||
              item.status.toLowerCase() === 'paid' ||
              item.status.toLowerCase() === 'success' ||
              item.status.toLowerCase() === 'verified';

            return (
              <View style={styles.orderCard}>
                {/* Header Card */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons name="receipt-outline" size={14} color="#64748B" />
                    <Text style={styles.orderNumberText}>ORDER #{item.id}</Text>
                    <Text style={styles.dateDot}>•</Text>
                    <Text style={styles.orderDateText}>{formatDate(item.created_at)}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isSuccess ? styles.statusBadgeSuccess : styles.statusBadgePending,
                    ]}
                  >
                    <Ionicons
                      name={isSuccess ? 'checkmark-circle' : 'time'}
                      size={12}
                      color={isSuccess ? '#065F46' : '#92400E'}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isSuccess ? styles.statusTextSuccess : styles.statusTextPending,
                      ]}
                    >
                      {isSuccess ? 'Lunas' : item.status || 'Pending'}
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
    paddingVertical: 14,
    backgroundColor: '#FAF8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3FF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#004AC6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#131B2E',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAEDFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3FF',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#131B2E',
    fontFamily: 'monospace',
  },
  dateDot: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  orderDateText: {
    fontSize: 11,
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
  cardBody: {
    flexDirection: 'row',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3FF',
  },
  posterContainer: {
    width: 72,
    height: 86,
    borderRadius: 12,
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
});
