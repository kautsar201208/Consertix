import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Platform } from 'react-native';

const API_URL = 'http://172.19.23.51:5000';

interface Order {
  id: number;
  judul: string;
  nama_kategori: string;
  jumlah_tiket: number;
  total_harga: number;
  status: string;
  created_at: string;
}

export default function OrdersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Gagal memuat pesanan');
      setOrders(await response.json());
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchOrders();
  }, []));

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
        showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.text + '10' }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.title, { color: colors.text }]}>Pesanan Saya</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {orders.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText style={{ color: colors.text + '80' }}>Belum ada pesanan.</ThemedText>
          </View>
        ) : orders.map((order) => (
          <View key={order.id} style={[styles.orderCard, { borderColor: colors.text + '22', backgroundColor: colors.background, borderWidth: 1.5 }]}>
            <ThemedText type="defaultSemiBold" style={[styles.eventTitle, { color: colors.text }]}>{order.judul}</ThemedText>
            <ThemedText style={{ color: colors.text + 'b0', fontSize: 13 }}>{order.nama_kategori} · {order.jumlah_tiket} tiket</ThemedText>
            <View style={styles.orderFooter}>
              <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>{formatPrice(order.total_harga)}</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: colors.text }]}>
                <ThemedText style={[styles.statusText, { color: colors.background }]}>
                  {order.status || 'Pending'}
                </ThemedText>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: Platform.OS === 'ios' ? 55 : 35 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: { width: 40 },
  title: { fontSize: 24, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 40 },
  orderCard: { borderRadius: 16, padding: 14, marginBottom: 12 },
  eventTitle: { fontSize: 16, marginBottom: 6 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
