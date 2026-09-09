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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, loading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Harap isi semua field');
      return;
    }

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Gagal', error instanceof Error ? error.message : 'Terjadi kesalahan');
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
            Masuk ke akun Anda
          </ThemedText>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
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
                placeholder="Masukkan password Anda"
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

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <ThemedText style={[styles.loginButtonText, { color: colors.background }]}>Masuk</ThemedText>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <ThemedText style={{ color: colors.text }}>Belum punya akun? </ThemedText>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <ThemedText style={[styles.registerLink, { color: colors.tint }]}>
                  Daftar di sini
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
  loginButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 50,
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
