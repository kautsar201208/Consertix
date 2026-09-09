import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Apakah Anda yakin ingin logout?', [
      {
        text: 'Batal',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
            router.replace('/login');
          } catch (error) {
            Alert.alert('Error', 'Gagal logout');
          } finally {
            setLoggingOut(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={{ color: colors.text }}>Profil</ThemedText>
      </View>

      {/* Profile Card */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.background, borderColor: colors.text, borderWidth: 1.5 },
        ]}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.text,
              borderColor: colors.text,
            },
          ]}>
          <ThemedText style={[styles.avatarText, { color: colors.background }]}>
            {user?.nama?.charAt(0).toUpperCase() || 'U'}
          </ThemedText>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <ThemedText type="defaultSemiBold" style={[styles.userName, { color: colors.text }]}>
            {user?.nama || 'User'}
          </ThemedText>
          <ThemedText style={[styles.userEmail, { color: colors.text + '80' }]}>
            {user?.email || 'email@example.com'}
          </ThemedText>
          <View style={styles.roleContainer}>
            <ThemedText style={[styles.role, { color: colors.text }]}>
              {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={[
            styles.menuItem,
            { backgroundColor: colors.background, borderColor: colors.text, borderWidth: 1.5 },
          ]}
          onPress={() => router.push('/orders')}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="receipt-outline" size={20} color={colors.text} style={{ marginRight: 12 }} />
            <ThemedText style={[styles.menuItemText, { color: colors.text }]}>Pesanan Saya</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            { backgroundColor: colors.background, borderColor: colors.text, borderWidth: 1.5 },
          ]}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="heart-outline" size={20} color={colors.text} style={{ marginRight: 12 }} />
            <ThemedText style={[styles.menuItemText, { color: colors.text }]}>Wishlist</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            { backgroundColor: colors.background, borderColor: colors.text, borderWidth: 1.5 },
          ]}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="settings-outline" size={20} color={colors.text} style={{ marginRight: 12 }} />
            <ThemedText style={[styles.menuItemText, { color: colors.text }]}>Pengaturan</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            { backgroundColor: colors.background, borderColor: colors.text, borderWidth: 1.5 },
          ]}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="help-circle-outline" size={20} color={colors.text} style={{ marginRight: 12 }} />
            <ThemedText style={[styles.menuItemText, { color: colors.text }]}>Bantuan</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[
          styles.logoutButton,
          {
            backgroundColor: colors.text,
            opacity: loggingOut ? 0.7 : 1,
          },
        ]}
        onPress={handleLogout}
        disabled={loggingOut}>
        <ThemedText style={[styles.logoutButtonText, { color: colors.background }]}>
          {loggingOut ? 'Loading...' : 'Logout'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleContainer: {
    alignSelf: 'flex-start',
  },
  role: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    marginBottom: 30,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
