import React, { useState } from 'react';
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

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const { register, loading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleRegister = async () => {
    setErrorMessage('');

    const nama = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    if (!firstName.trim()) {
      setErrorMessage('Harap masukkan nama depan Anda');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Harap masukkan alamat email yang valid');
      return;
    }
    if (!password) {
      setErrorMessage('Harap masukkan password');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password minimal harus terdiri dari 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok');
      return;
    }

    try {
      await register(nama, email, password);
      Alert.alert(
        'Pendaftaran Berhasil!',
        `Selamat datang di Concertix, ${nama}!`,
        [{ text: 'Mulai Jelajah', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Pendaftaran gagal';
      setErrorMessage(msg);
      Alert.alert('Registrasi Gagal', msg);
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
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.backgroundElement }]}
              onPress={() => router.back()}
              accessibilityLabel="Kembali"
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.logoBadge}>
              <Ionicons name="person-add" size={24} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.heroTitle}>
              Buat akun baru
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Bergabung dan temukan pengalaman konser favoritmu
            </ThemedText>
          </View>

          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ThemedText style={[styles.formTitle, { color: colors.text }]}>
              Daftar dengan email
            </ThemedText>
            <ThemedText style={[styles.formSubtitle, { color: colors.textSecondary }]}>
              Isi data berikut untuk membuat akun Concertix.
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

            <View style={styles.nameRow}>
              <TextInput
                style={[
                  styles.nameInput,
                  { backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
                placeholder="Nama depan"
                placeholderTextColor={colors.placeholder}
                value={firstName}
                onChangeText={(val) => {
                  setFirstName(val);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="words"
                editable={!loading}
                accessibilityLabel="Nama depan"
                returnKeyType="next"
              />
              <TextInput
                style={[
                  styles.nameInput,
                  { backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
                placeholder="Nama belakang"
                placeholderTextColor={colors.placeholder}
                value={lastName}
                onChangeText={(val) => {
                  setLastName(val);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="words"
                editable={!loading}
                accessibilityLabel="Nama belakang"
                returnKeyType="next"
              />
            </View>

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
                placeholder="Kata sandi (minimal 6 karakter)"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
                accessibilityLabel="Kata sandi"
                returnKeyType="next"
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

            <View style={[styles.passwordWrapper, { backgroundColor: colors.backgroundElement }]}>
              <TextInput
                style={[styles.input, styles.passwordInput, { color: colors.text }]}
                placeholder="Konfirmasi kata sandi"
                placeholderTextColor={colors.placeholder}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                accessibilityLabel="Konfirmasi kata sandi"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                style={[styles.eyeIcon, { borderLeftColor: colors.border }]}
                accessibilityLabel={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
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
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Buat Akun</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <ThemedText style={{ color: colors.textSecondary }}>
                Sudah punya akun?{' '}
              </ThemedText>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <ThemedText style={[styles.linkBold, { color: colors.accent }]}>
                    Masuk
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
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
    paddingTop: 62,
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
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    maxWidth: 280,
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
  nameRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    borderRadius: 26,
    paddingHorizontal: 13,
    fontSize: 13,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  linkBold: {
    fontWeight: '700',
    fontSize: 13,
  },
});

