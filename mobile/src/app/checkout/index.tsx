import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config/api';

export default function CheckoutFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    eventId: string;
    categoryId: string;
    ticketName: string;
    ticketPrice: string;
    quantity: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    poster: string;
  }>();

  const { user } = useAuth();

  // 1. Timer Countdown (15 menit = 900 detik)
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          Alert.alert('Waktu Habis', 'Waktu pemesanan tiket telah habis. Silakan ulangi pilihan Anda.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 2. Accordion State
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // 3. Form Data Pemesan Utama
  const [namaLengkap, setNamaLengkap] = useState(user?.nama || '');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [dateBirth, setDateBirth] = useState('1998-09-18');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  // 4. Data Pengunjung Tambahan (jika tiket > 1)
  const ticketCount = parseInt(params.quantity || '1', 10);
  const [syncGuest1, setSyncGuest1] = useState(true);

  const [guest2Nama, setGuest2Nama] = useState('');
  const [guest2Nik, setGuest2Nik] = useState('');
  const [guest2Phone, setGuest2Phone] = useState('');
  const [guest2Email, setGuest2Email] = useState('');

  // Auto-fill dari Akun Saya
  const handleAutoFill = () => {
    if (user) {
      if (user.nama) setNamaLengkap(user.nama);
      if (user.email) setEmail(user.email);
      Alert.alert('Sukses', 'Data pemesan diisi dari profil akun Anda.');
    } else {
      Alert.alert('Info', 'Belum ada data profil tersimpan.');
    }
  };

  const unitPrice = parseInt(params.ticketPrice || '0', 10);
  const totalPrice = unitPrice * ticketCount;

  const handleNextStep = () => {
    // Validasi
    if (!namaLengkap.trim()) {
      Alert.alert('Perhatian', 'Nama lengkap pemesan wajib diisi.');
      return;
    }
    if (!idNumber.trim()) {
      Alert.alert('Perhatian', 'Nomor Identitas (NIK/Paspor) wajib diisi.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Perhatian', 'Alamat email wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Perhatian', 'Nomor WhatsApp wajib diisi.');
      return;
    }

    if (ticketCount > 1 && !guest2Nama.trim()) {
      Alert.alert('Perhatian', 'Nama lengkap pengunjung kedua wajib diisi.');
      return;
    }

    // Lanjut ke Layanan Pembayaran
    router.push({
      pathname: '/checkout/payment' as any,
      params: {
        eventId: params.eventId,
        categoryId: params.categoryId,
        ticketName: params.ticketName,
        ticketPrice: params.ticketPrice,
        quantity: params.quantity,
        eventTitle: params.eventTitle,
        eventDate: params.eventDate,
        eventLocation: params.eventLocation,
        poster: params.poster,
        namaLengkap: namaLengkap.trim(),
        idNumber: idNumber.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dateBirth: dateBirth.trim(),
      },
    });
  };

  const getPosterUri = (poster: string | null) => {
    if (!poster) return null;
    if (poster.startsWith('http')) return poster;
    return `${API_URL}/uploads/${poster}`;
  };

  const posterUri = getPosterUri(params.poster || null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#131B2E" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Data Pemesan</Text>
          <Text style={styles.headerSubtitle}>Langkah 1 dari 3</Text>
        </View>
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#004AC6" />
          <Text style={styles.securityBadgeText}>Aman</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Stepper Progress */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperRow}>
            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepActive]}>
                <Ionicons name="person" size={14} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepLabel, styles.stepLabelActive]}>1. Data Diri</Text>
            </View>

            <View style={styles.stepLine} />

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Ionicons name="wallet-outline" size={14} color="#64748B" />
              </View>
              <Text style={styles.stepLabel}>2. Bayar</Text>
            </View>

            <View style={styles.stepLine} />

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Ionicons name="ticket-outline" size={14} color="#64748B" />
              </View>
              <Text style={styles.stepLabel}>3. E-Tiket</Text>
            </View>
          </View>
        </View>

        {/* 3. Countdown Timer Sisa Waktu */}
        <View style={styles.timerBanner}>
          <View style={styles.timerLeft}>
            <View style={styles.timerIconCircle}>
              <Ionicons name="hourglass-outline" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.timerLabel}>SISA WAKTU PEMESANAN</Text>
              <Text style={styles.timerDesc}>Selesaikan sebelum tiket terlepas</Text>
            </View>
          </View>
          <View style={styles.timerPill}>
            <Ionicons name="timer-outline" size={14} color="#D22348" />
            <Text style={styles.timerCount}>{formatTimer(secondsLeft)}</Text>
          </View>
        </View>

        {/* 4. Ringkasan Singkat Pesanan Tiket (Accordion) */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.summaryTop}
            activeOpacity={0.8}
            onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
          >
            <View style={styles.summaryThumbnail}>
              {posterUri ? (
                <Image source={{ uri: posterUri }} style={styles.summaryImage} />
              ) : (
                <View style={styles.summaryPlaceholder}>
                  <Ionicons name="musical-notes" size={24} color="#94A3B8" />
                </View>
              )}
            </View>
            <View style={styles.summaryInfo}>
              <View style={styles.summaryBadgeRow}>
                <View style={styles.summaryCategoryBadge}>
                  <Text style={styles.summaryCategoryBadgeText}>
                    {params.ticketName || 'Kategori Tiket'}
                  </Text>
                </View>
                <Text style={styles.summaryQtyText}>• {ticketCount} Tiket</Text>
              </View>
              <Text style={styles.summaryTitle} numberOfLines={1}>
                {params.eventTitle || 'Event Concertix'}
              </Text>
              <Text style={styles.summarySubtext} numberOfLines={1}>
                {params.eventDate} • {params.eventLocation}
              </Text>
            </View>
            <Ionicons
              name={isSummaryExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#64748B"
            />
          </TouchableOpacity>

          {isSummaryExpanded && (
            <View style={styles.summaryDetailBox}>
              <View style={styles.summaryDetailRow}>
                <Text style={styles.summaryDetailLabel}>
                  {ticketCount}x {params.ticketName || 'Tiket Konser'}
                </Text>
                <Text style={styles.summaryDetailVal}>
                  Rp{totalPrice.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.summaryDetailRow}>
                <Text style={styles.summaryDetailLabel}>Pajak Hiburan & Biaya Layanan</Text>
                <Text style={styles.summaryFreeBadge}>Termasuk</Text>
              </View>
            </View>
          )}
        </View>

        {/* 5. BAGIAN A: Data Pemesan Utama */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <View style={styles.titleIconRow}>
                <Ionicons name="id-card-outline" size={18} color="#004AC6" />
                <Text style={styles.cardTitle}>Data Pemesan</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                E-ticket & invoice akan dikirim ke kontak ini.
              </Text>
            </View>
            <TouchableOpacity style={styles.autoFillBtn} onPress={handleAutoFill}>
              <Ionicons name="sparkles" size={12} color="#00174B" />
              <Text style={styles.autoFillBtnText}>Akun Saya</Text>
            </TouchableOpacity>
          </View>

          {/* Input: Nama Lengkap */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Nama Lengkap Sesuai KTP / Paspor</Text>
              <Text style={styles.requiredStar}>*Wajib</Text>
            </View>
            <View style={styles.inputFieldBox}>
              <Ionicons name="person-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Dimas Arya Pratama"
                placeholderTextColor="#94A3B8"
                value={namaLengkap}
                onChangeText={setNamaLengkap}
              />
              {namaLengkap.length > 0 && (
                <Ionicons name="checkmark-circle" size={16} color="#004AC6" />
              )}
            </View>
          </View>

          {/* Input: NIK / Paspor */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Nomor Identitas (NIK KTP / Paspor)</Text>
              <Text style={styles.requiredStar}>*Wajib</Text>
            </View>
            <View style={styles.inputFieldBox}>
              <Ionicons name="card-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.textInput}
                placeholder="16 digit NIK KTP atau No. Paspor"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={idNumber}
                onChangeText={setIdNumber}
              />
            </View>
          </View>

          {/* Input: Email */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Alamat Email</Text>
              <Text style={styles.requiredStar}>*Wajib</Text>
            </View>
            <View style={styles.inputFieldBox}>
              <Ionicons name="mail-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.textInput}
                placeholder="nama@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <Text style={styles.inputHelper}>Barcode E-Ticket akan dikirim ke alamat ini.</Text>
          </View>

          {/* Input: Nomor WhatsApp */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Nomor WhatsApp Aktif</Text>
              <Text style={styles.requiredStar}>*Wajib</Text>
            </View>
            <View style={styles.phoneRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>🇮🇩 +62</Text>
              </View>
              <View style={[styles.inputFieldBox, { flex: 1 }]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="812-3456-7890"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <Ionicons name="chatbubbles-outline" size={16} color="#64748B" />
              </View>
            </View>
          </View>

          {/* Tanggal Lahir & Jenis Kelamin */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tanggal Lahir (Batas Usia 17+)</Text>
            <View style={styles.inputFieldBox}>
              <Ionicons name="calendar-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                value={dateBirth}
                onChangeText={setDateBirth}
              />
            </View>
          </View>

          {/* Jenis Kelamin Radio Pills */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Jenis Kelamin</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderPill, gender === 'male' && styles.genderPillActive]}
                onPress={() => setGender('male')}
              >
                <Ionicons
                  name="male"
                  size={16}
                  color={gender === 'male' ? '#FFFFFF' : '#434655'}
                />
                <Text
                  style={[styles.genderText, gender === 'male' && styles.genderTextActive]}
                >
                  Laki-laki
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderPill, gender === 'female' && styles.genderPillActive]}
                onPress={() => setGender('female')}
              >
                <Ionicons
                  name="female"
                  size={16}
                  color={gender === 'female' ? '#FFFFFF' : '#434655'}
                />
                <Text
                  style={[styles.genderText, gender === 'female' && styles.genderTextActive]}
                >
                  Perempuan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 6. BAGIAN B: Toggle Cepat Pengunjung 1 */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIconCircle}>
                <Ionicons name="person-circle-outline" size={20} color="#004AC6" />
              </View>
              <View>
                <View style={styles.toggleTitleRow}>
                  <Text style={styles.toggleTitle}>Data Pengunjung 1</Text>
                  <View style={styles.badgeMini}>
                    <Text style={styles.badgeMiniText}>{params.ticketName || 'Tiket 1'}</Text>
                  </View>
                </View>
                <Text style={styles.toggleDesc}>Samakan dengan identitas Pemesan</Text>
              </View>
            </View>
            <Switch
              value={syncGuest1}
              onValueChange={setSyncGuest1}
              trackColor={{ false: '#EAEDFF', true: '#2563EB' }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>
          {syncGuest1 && (
            <View style={styles.syncNotice}>
              <Ionicons name="checkmark-done" size={15} color="#004AC6" />
              <Text style={styles.syncNoticeText}>
                Identitas Tiket 1 terisi atas nama{' '}
                <Text style={{ fontWeight: '700' }}>{namaLengkap || 'Pemesan'}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* 7. BAGIAN C: Data Pengunjung Tambahan (hanya jika tiket > 1) */}
        {ticketCount > 1 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <View style={styles.titleIconRow}>
                  <Ionicons name="people-outline" size={18} color="#4B41E1" />
                  <Text style={styles.cardTitle}>Data Pengunjung 2</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Identitas fisik diperlukan untuk validasi wristband.
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Nama Lengkap Pengunjung 2</Text>
                <Text style={styles.requiredStar}>*Wajib</Text>
              </View>
              <View style={styles.inputFieldBox}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nama sesuai KTP/SIM/Paspor"
                  placeholderTextColor="#94A3B8"
                  value={guest2Nama}
                  onChangeText={setGuest2Nama}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nomor Identitas (NIK KTP / Paspor)</Text>
              <View style={styles.inputFieldBox}>
                <Ionicons name="card-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  placeholder="16 digit NIK Pengunjung"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={guest2Nik}
                  onChangeText={setGuest2Nik}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nomor WhatsApp Pengunjung</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCodeText}>🇮🇩 +62</Text>
                </View>
                <View style={[styles.inputFieldBox, { flex: 1 }]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="812-xxxx-xxxx"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={guest2Phone}
                    onChangeText={setGuest2Phone}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alamat Email (Opsional)</Text>
              <View style={styles.inputFieldBox}>
                <Ionicons name="mail-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  placeholder="email@pengunjung.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={guest2Email}
                  onChangeText={setGuest2Email}
                />
              </View>
            </View>
          </View>
        )}

        {/* 8. Jaminan Privasi */}
        <View style={styles.privacyBox}>
          <Ionicons name="lock-closed" size={18} color="#004AC6" />
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyTitle}>Jaminan Privasi & Enkripsi SSL 256-Bit</Text>
            <Text style={styles.privacyDesc}>
              Data identitas Anda aman dan hanya diteruskan ke sistem gerbang tiket resmi Concertix untuk validasi penukaran wristband.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 9. Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Total ({ticketCount} Tiket)</Text>
          <Text style={styles.bottomPriceValue}>
            Rp{totalPrice.toLocaleString('id-ID')}
          </Text>
        </View>
        <TouchableOpacity style={styles.nextBtn} activeOpacity={0.9} onPress={handleNextStep}>
          <Text style={styles.nextBtnText}>Lanjut ke Bayar</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#131B2E',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004AC6',
    letterSpacing: 0.5,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F2F3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004AC6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAEDFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: '#2563EB',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  stepLabelActive: {
    color: '#004AC6',
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#EAEDFF',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E2E7FF',
    borderRadius: 14,
    padding: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D22348',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#434655',
  },
  timerDesc: {
    fontSize: 11,
    color: '#131B2E',
    fontWeight: '500',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D22348',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#EAEDFF',
  },
  summaryImage: {
    width: '100%',
    height: '100%',
  },
  summaryPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  summaryCategoryBadge: {
    backgroundColor: '#DBE1FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  summaryCategoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00174B',
  },
  summaryQtyText: {
    fontSize: 10,
    color: '#64748B',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#131B2E',
  },
  summarySubtext: {
    fontSize: 10,
    color: '#64748B',
  },
  summaryDetailBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F2F3FF',
    gap: 6,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDetailLabel: {
    fontSize: 11,
    color: '#434655',
  },
  summaryDetailVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#131B2E',
  },
  summaryFreeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004AC6',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#131B2E',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBE1FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  autoFillBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00174B',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#131B2E',
  },
  requiredStar: {
    fontSize: 10,
    color: '#D22348',
    fontWeight: '700',
  },
  inputFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 12,
    color: '#131B2E',
  },
  inputHelper: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeBox: {
    backgroundColor: '#F2F3FF',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#131B2E',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F2F3FF',
  },
  genderPillActive: {
    backgroundColor: '#2563EB',
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434655',
  },
  genderTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  toggleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
  },
  badgeMini: {
    backgroundColor: '#EAEDFF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeMiniText: {
    fontSize: 9,
    color: '#434655',
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: 10,
    color: '#64748B',
  },
  syncNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F3FF',
    padding: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  syncNoticeText: {
    fontSize: 10,
    color: '#004AC6',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F2F3FF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  privacyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#131B2E',
  },
  privacyDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderColor: '#F2F3FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  bottomPriceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#004AC6',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
