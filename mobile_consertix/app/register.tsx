import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { register, loading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Harap isi semua field');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    try {
      await register(name, email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Pendaftaran Gagal', error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.titleText}>
            Concertix
          </ThemedText>
          <ThemedText style={[styles.subtitleText, { color: colors.icon }]}>
            Buat akun baru
          </ThemedText>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Nama Lengkap</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.text + '33',
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Masukkan nama lengkap Anda"
              placeholderTextColor={colors.text + '60'}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.text + '33',
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Masukkan email Anda"
              placeholderTextColor={colors.text + '60'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <View
              style={[
                styles.passwordContainer,
                {
                  borderColor: colors.text + '33',
                  backgroundColor: colors.background,
                },
              ]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={colors.text + '60'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Konfirmasi Password</ThemedText>
            <View
              style={[
                styles.passwordContainer,
                {
                  borderColor: colors.text + '33',
                  backgroundColor: colors.background,
                },
              ]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Konfirmasi password Anda"
                placeholderTextColor={colors.text + '60'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                style={styles.eyeIcon}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <ThemedText style={[styles.registerButtonText, { color: colors.background }]}>Daftar</ThemedText>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <ThemedText style={{ color: colors.text }}>Sudah punya akun? </ThemedText>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <ThemedText style={[styles.loginLink, { color: colors.tint }]}>
                  Masuk di sini
                </ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordContainer: {
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  registerButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 50,
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
