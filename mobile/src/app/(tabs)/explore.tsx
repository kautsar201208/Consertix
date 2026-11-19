import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ExploreScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profil & Akun</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Informasi akun dan pengaturan aplikasi Concertix
          </Text>
        </View>

        {/* User Card */}
        {isLoggedIn && user ? (
          <View style={[styles.userCard, { backgroundColor: colors.tint }]}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.nama}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.guestCard,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="person-circle-outline" size={48} color={colors.placeholder} />
            <Text style={[styles.guestTitle, { color: colors.text }]}>
              Anda Masuk sebagai Tamu
            </Text>
            <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
              Masuk atau daftar untuk memesan tiket dan melihat riwayat transaksi.
            </Text>
            <View style={styles.guestButtonRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.primaryBtnText}>Masuk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={() => router.push('/register')}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Daftar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>AKTIVITAS & PESANAN</Text>

          <View style={[styles.menuContainer, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/transaksi' as any)}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="receipt-outline" size={22} color={colors.accent} />
                <Text style={[styles.menuText, { color: colors.text }]}>Riwayat Transaksi Tiket</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>PENGATURAN</Text>

          <View style={[styles.menuContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => Alert.alert('Tentang', 'Concertix Mobile App v1.0.0\nAplikasi Pemesanan Tiket Konser.')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
                <Text style={[styles.menuText, { color: colors.text }]}>Tentang Aplikasi</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => Alert.alert('Bantuan', 'Hubungi support kami di support@concertix.id')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="help-buoy-outline" size={22} color={colors.accent} />
                <Text style={[styles.menuText, { color: colors.text }]}>Pusat Bantuan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Syarat & Ketentuan', 'Syarat dan Ketentuan layanan pemesanan tiket Concertix 2026.')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="document-text-outline" size={22} color={colors.accent} />
                <Text style={[styles.menuText, { color: colors.text }]}>Syarat & Ketentuan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        {isLoggedIn ? (
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Keluar dari Akun</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  guestCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  guestSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 260,
  },
  guestButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuContainer: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

