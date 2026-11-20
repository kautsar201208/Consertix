import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const { login, loading, isLoggedIn } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Jika sudah login, langsung arahkan ke beranda (tidak perlu login ulang)
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn]);

  const handleLogin = async () => {
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Harap masukkan email dan password');
      return;
    }

    try {
      await login(email, password);
      Alert.alert('Sukses', 'Login berhasil! Selamat datang kembali.', [
        { text: 'Lanjut', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Terjadi kesalahan saat login';
      setErrorMessage(msg);
      Alert.alert('Login Gagal', msg);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, { backgroundColor: colors.tint }]}>
            <View style={styles.heroShapeLeft} />
            <View style={styles.heroShapeRight} />
            <View style={styles.logoBadge}>
              <Ionicons name="musical-notes" size={25} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.heroTitle}>Selamat datang kembali</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Masuk untuk melanjutkan pengalaman konsermu
            </ThemedText>
          </View>

          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ThemedText style={[styles.formTitle, { color: colors.text }]}>
              Masuk ke akun Concertix
            </ThemedText>
            <ThemedText style={[styles.formSubtitle, { color: colors.textSecondary }]}>
              Gunakan email dan kata sandi yang terdaftar.
            </ThemedText>

            {errorMessage ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.error + '15',
                    borderColor: colors.error + '40',
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {errorMessage}
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
                placeholder="Email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                accessibilityLabel="Email"
                returnKeyType="next"
              />
            </View>

            <View style={[styles.passwordWrapper, { backgroundColor: colors.backgroundElement }]}>
              <TextInput
                style={[styles.input, styles.passwordInput, { color: colors.text }]}
                placeholder="Kata sandi"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
                accessibilityLabel="Kata sandi"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={[styles.eyeIcon, { borderLeftColor: colors.border }]}
                accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={19}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.tint,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Masuk</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <ThemedText style={{ color: colors.textSecondary }}>
                Belum punya akun?{' '}
              </ThemedText>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <ThemedText style={[styles.linkBold, { color: colors.accent }]}>
                    Daftar sekarang
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => router.replace('/(tabs)')}
              disabled={loading}
            >
              <ThemedText style={[styles.guestText, { color: colors.textSecondary }]}>
                Jelajahi sebagai tamu
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  hero: {
    width: '100%',
    minHeight: 226,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 70,
    borderRadius: 28,
    overflow: 'hidden',
  },
  heroShapeLeft: {
    position: 'absolute',
    width: 130,
    height: 130,
    left: -64,
    bottom: -34,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroShapeRight: {
    position: 'absolute',
    width: 112,
    height: 112,
    right: -48,
    bottom: -18,
    borderRadius: 56,
    backgroundColor: 'rgba(180,197,255,0.45)',
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 10,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#DBEAFE',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 270,
    marginTop: 5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  formCard: {
    width: '100%',
    maxWidth: 500,
    marginTop: -48,
    padding: 20,
    borderWidth: 1,
    borderRadius: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  formSubtitle: {
    fontSize: 12,
    marginTop: 3,
    marginBottom: 6,
  },
  inputGroup: {
    marginTop: 14,
  },
  input: {
    minHeight: 50,
    borderRadius: 26,
    paddingHorizontal: 17,
    fontSize: 13,
  },
  eyeIcon: {
    width: 46,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    marginTop: 12,
    borderRadius: 26,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  submitButton: {
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 52,
    shadowColor: '#004AC6',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 9,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  linkBold: {
    fontWeight: '700',
    fontSize: 13,
  },
  guestButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

