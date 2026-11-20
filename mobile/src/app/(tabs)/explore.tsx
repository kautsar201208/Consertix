import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { storage } from '@/utils/storage';

interface ProfileOrder {
  id: number;
  status?: string;
  jumlah_tiket?: number | string;
}

type ThemeColors = (typeof Colors)[keyof typeof Colors];
type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  colors: ThemeColors;
  onPress: () => void;
  isLast?: boolean;
}

function ProfileMenuRow({
  icon,
  title,
  subtitle,
  colors,
  onPress,
  isLast = false,
}: MenuRowProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <View style={styles.menuCopy}>
        <Text style={[styles.menuText, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.menuSubtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
      {!isLast ? (
        <View style={[styles.menuSeparator, { backgroundColor: colors.border }]} />
      ) : null}
    </TouchableOpacity>
  );
}

const isPaidOrder = (status?: string) =>
  Boolean(status && ['paid', 'success', 'verified', 'settlement'].includes(status.toLowerCase()));

export default function ExploreScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout, token } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [orders, setOrders] = useState<ProfileOrder[] | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) return;

      let isActive = true;
      const loadOrderSummary = async () => {
        setSummaryLoading(true);
        setSummaryError(false);

        try {
          const accessToken = token || (await storage.getItem('token'));
          if (!accessToken) {
            throw new Error('Sesi login tidak ditemukan. Silakan masuk kembali.');
          }

          const response = await fetch(`${API_URL}/api/orders`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Ringkasan pesanan gagal dimuat.');
          }
          if (!Array.isArray(data)) {
            throw new Error('Format data riwayat pesanan tidak valid.');
          }

          if (isActive) setOrders(data);
        } catch (error) {
          console.error('Gagal memuat ringkasan profil:', error);
          if (isActive) {
            setOrders(null);
            setSummaryError(true);
          }
        } finally {
          if (isActive) setSummaryLoading(false);
        }
      };

      void loadOrderSummary();
      return () => {
        isActive = false;
      };
    }, [isLoggedIn, token])
  );

  const handleLogout = () => {
    Alert.alert('Konfirmasi', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Alert.alert('Selesai', 'Anda telah keluar.');
        },
      },
    ]);
  };

  const totalTickets = orders?.reduce(
    (total, order) => total + Number(order.jumlah_tiket || 0),
    0
  );
  const paidOrders = orders?.filter((order) => isPaidOrder(order.status)).length;
  const stats = [
    { icon: 'receipt-outline' as const, label: 'Total Pesanan', value: orders?.length },
    { icon: 'ticket-outline' as const, label: 'Tiket Dipesan', value: totalTickets },
    { icon: 'checkmark-circle-outline' as const, label: 'Pesanan Lunas', value: paidOrders },
  ];
  const initials = user?.nama?.trim().charAt(0).toUpperCase() || 'C';
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Member';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profil</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Akun dan aktivitas Concertix Anda
          </Text>
        </View>

        {isLoggedIn && user ? (
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <View
              pointerEvents="none"
              style={[styles.profileGlow, { backgroundColor: colors.backgroundSelected }]}
            />
            <View style={styles.profileContent}>
              <View style={[styles.avatar, { backgroundColor: colors.backgroundSelected }]}>
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                  {initials}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.nameAndRole}>
                  <Text
                    style={[styles.userName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {user.nama}
                  </Text>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: colors.backgroundSelected },
                    ]}
                  >
                    <Ionicons name="person-outline" size={11} color={colors.accent} />
                    <Text style={[styles.roleText, { color: colors.accent }]}>
                      {roleLabel}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.userEmail, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.profileAction,
                    { backgroundColor: colors.backgroundSelected },
                  ]}
                  onPress={() => router.push('/(tabs)/transaksi' as any)}
                >
                  <Ionicons name="receipt-outline" size={15} color={colors.accent} />
                  <Text style={[styles.profileActionText, { color: colors.accent }]}>
                    Riwayat Pesanan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.guestCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.guestAvatar, { backgroundColor: colors.backgroundSelected }]}>
              <Ionicons name="person-outline" size={30} color={colors.accent} />
            </View>
            <Text style={[styles.guestTitle, { color: colors.text }]}>
              Masuk ke akun Concertix
            </Text>
            <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
              Masuk atau daftar untuk memesan tiket dan melihat aktivitas Anda.
            </Text>
            <View style={styles.guestButtonRow}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.primaryButtonText}>Masuk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => router.push('/register')}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  Daftar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLoggedIn ? (
          <>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View
                  key={stat.label}
                  style={[
                    styles.statCard,
                    { backgroundColor: colors.card },
                    index < stats.length - 1 && styles.statCardMargin,
                  ]}
                >
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: colors.backgroundSelected },
                    ]}
                  >
                    {summaryLoading ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <Ionicons name={stat.icon} size={18} color={colors.accent} />
                    )}
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {orders ? (stat.value ?? 0).toLocaleString('id-ID') : '—'}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
            {summaryError ? (
              <Text style={[styles.summaryError, { color: colors.error }]}>
                Ringkasan pesanan belum dapat dimuat.
              </Text>
            ) : null}
          </>
        ) : null}

        <View style={[styles.promoCard, { backgroundColor: colors.primary }]}>
          <View style={styles.promoGlow} />
          <View style={styles.promoContent}>
            <View style={styles.promoCopy}>
              <View style={styles.promoTag}>
                <Ionicons name="musical-notes" size={12} color="#FFFFFF" />
                <Text style={styles.promoTagText}>CONCERTIX</Text>
              </View>
              <Text style={styles.promoTitle}>Temukan konser berikutnya</Text>
              <Text style={styles.promoSubtitle}>
                Jelajahi event dan pilih pengalaman musik favorit Anda.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.promoButton}
              onPress={() => router.replace('/(tabs)' as any)}
            >
              <Text style={[styles.promoButtonText, { color: colors.primary }]}>
                Jelajahi
              </Text>
              <Ionicons name="arrow-forward" size={15} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            AKUN SAYA
          </Text>
          <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
            <ProfileMenuRow
              icon="receipt-outline"
              title="Riwayat Transaksi"
              subtitle="Status pesanan dan tiket Anda"
              colors={colors}
              onPress={() => router.push('/(tabs)/transaksi' as any)}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            AKTIVITAS EVENT
          </Text>
          <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
            <ProfileMenuRow
              icon="search-outline"
              title="Jelajahi Konser"
              subtitle="Temukan event yang akan datang"
              colors={colors}
              onPress={() => router.replace('/(tabs)' as any)}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PUSAT BANTUAN & KEBIJAKAN
          </Text>
          <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
            <ProfileMenuRow
              icon="information-circle-outline"
              title="Tentang Aplikasi"
              colors={colors}
              onPress={() =>
                Alert.alert(
                  'Tentang Concertix',
                  'Concertix adalah aplikasi pemesanan tiket konser.'
                )
              }
            />
            <ProfileMenuRow
              icon="help-buoy-outline"
              title="Pusat Bantuan"
              subtitle="Hubungi support@concertix.id"
              colors={colors}
              onPress={() =>
                Alert.alert('Bantuan', 'Hubungi support kami di support@concertix.id')
              }
            />
            <ProfileMenuRow
              icon="document-text-outline"
              title="Syarat & Ketentuan"
              colors={colors}
              onPress={() =>
                Alert.alert(
                  'Syarat & Ketentuan',
                  'Syarat dan Ketentuan layanan pemesanan tiket Concertix.'
                )
              }
              isLast
            />
          </View>
        </View>

        {isLoggedIn ? (
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: `${colors.error}15`,
                borderColor: `${colors.error}30`,
              },
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>
              Keluar Akun
            </Text>
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Concertix · Untuk para pencinta musik
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 150,
    gap: 18,
  },
  header: {
    marginBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  profileCard: {
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  profileGlow: {
    position: 'absolute',
    top: -46,
    right: -35,
    width: 128,
    height: 128,
    borderRadius: 64,
    opacity: 0.45,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameAndRole: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  userName: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 4,
  },
  profileAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 10,
  },
  profileActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  guestCard: {
    alignItems: 'center',
    padding: 22,
    borderWidth: 1,
    borderRadius: 16,
  },
  guestAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  guestSubtitle: {
    maxWidth: 280,
    marginTop: 5,
    marginBottom: 16,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  guestButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    minWidth: 100,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButton: {
    minWidth: 100,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  statCardMargin: {
    marginRight: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 9,
    textAlign: 'center',
  },
  summaryError: {
    marginTop: -10,
    fontSize: 11,
  },
  promoCard: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 118,
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  promoGlow: {
    position: 'absolute',
    right: -30,
    bottom: -48,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoCopy: {
    flex: 1,
    minWidth: 0,
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  promoTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  promoSubtitle: {
    color: '#DBEAFE',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  promoButtonText: {
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    gap: 7,
  },
  sectionTitle: {
    paddingHorizontal: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  menuContainer: {
    overflow: 'hidden',
    borderRadius: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  menuItem: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 11,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCopy: {
    flex: 1,
    minWidth: 0,
  },
  menuText: {
    fontSize: 13,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  menuSeparator: {
    position: 'absolute',
    right: 14,
    bottom: 0,
    left: 60,
    height: StyleSheet.hairlineWidth,
  },
  logoutButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerText: {
    marginTop: -6,
    fontSize: 10,
    textAlign: 'center',
  },
});
