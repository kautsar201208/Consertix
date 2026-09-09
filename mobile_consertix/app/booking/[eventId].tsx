import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

const API_URL = 'http://172.19.23.51:5000';

interface TicketCategory {
  id: number;
  nama_kategori: string;
  harga: number;
  stok: number;
}

export default function BookingScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/ticket-categories/event/${eventId}`);
        if (!response.ok) throw new Error('Gagal memuat kategori tiket');
        const data = await response.json();
        setCategories(data);
        setSelectedCategory(data[0] ?? null);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Gagal memuat tiket');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [eventId]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);

  const handleSubmit = async () => {
    if (!selectedCategory) return;

    try {
      setSubmitting(true);
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticket_category_id: selectedCategory.id,
          jumlah_tiket: quantity,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Pesanan gagal dibuat');

      Alert.alert('Berhasil', 'Pesanan berhasil dibuat', [
        { text: 'Lihat Pesanan', onPress: () => router.replace('/orders') },
      ]);
    } catch (error) {
      Alert.alert('Pemesanan Gagal', error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.text + '10' }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ color: colors.text }}>Pesan Tiket</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Pilih Kategori Tiket</ThemedText>
        {categories.length === 0 ? (
          <ThemedText>Belum ada tiket tersedia untuk event ini.</ThemedText>
        ) : (
          categories.map((category) => {
            const selected = selectedCategory?.id === category.id;
            const unavailable = category.stok < 1;
            return (
              <TouchableOpacity
                key={category.id}
                disabled={unavailable}
                onPress={() => {
                  setSelectedCategory(category);
                  setQuantity(1);
                }}
                style={[
                  styles.category,
                  { borderColor: selected ? colors.text : colors.text + '22', borderWidth: 1.5, opacity: unavailable ? 0.45 : 1 },
                ]}>
                <View>
                  <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>{category.nama_kategori}</ThemedText>
                  <ThemedText style={{ color: colors.text + 'b0' }}>{formatPrice(category.harga)}</ThemedText>
                </View>
                <ThemedText style={{ color: colors.text }}>{unavailable ? 'Habis' : `${category.stok} tersisa`}</ThemedText>
              </TouchableOpacity>
            );
          })
        )}

        {selectedCategory && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Jumlah Tiket</ThemedText>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={[styles.quantityButton, { borderColor: colors.text }]}
                disabled={quantity <= 1}
                onPress={() => setQuantity((value) => value - 1)}>
                <ThemedText style={[styles.quantityText, { color: colors.text }]}>−</ThemedText>
              </TouchableOpacity>
              <ThemedText style={[styles.quantityValue, { color: colors.text }]}>{quantity}</ThemedText>
              <TouchableOpacity
                style={[styles.quantityButton, { borderColor: colors.text }]}
                disabled={quantity >= selectedCategory.stok}
                onPress={() => setQuantity((value) => value + 1)}>
                <ThemedText style={[styles.quantityText, { color: colors.text }]}>+</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={[styles.totalRow, { borderTopColor: colors.text + '22' }]}>
              <ThemedText style={{ color: colors.text }}>Total Pembayaran</ThemedText>
              <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                {formatPrice(selectedCategory.harga * quantity)}
              </ThemedText>
            </View>
            <TouchableOpacity
              disabled={submitting}
              onPress={handleSubmit}
              style={[styles.submitButton, { backgroundColor: colors.text, opacity: submitting ? 0.7 : 1 }]}>
              {submitting ? <ActivityIndicator color={colors.background} /> : <ThemedText style={[styles.submitText, { color: colors.background }]}>Buat Pesanan</ThemedText>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingTop: Platform.OS === 'ios' ? 55 : 35 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: { width: 40 },
  sectionTitle: { marginBottom: 12, marginTop: 8 },
  category: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginVertical: 12 },
  quantityButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#d8d8d8', alignItems: 'center', justifyContent: 'center' },
  quantityText: { fontSize: 24 },
  quantityValue: { fontSize: 20, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e1e1e1', marginTop: 20, paddingTop: 18, flexDirection: 'row', justifyContent: 'space-between' },
  submitButton: { minHeight: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
