import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://172.19.23.51:5000';

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  dateBirth: string;
};

interface PersonalInfoModalProps {
  visible: boolean;
  onClose: () => void;
  ticketCategoryId: number;
  quantity: number;
  onSuccess: () => void;
}

export function PersonalInfoModal({
  visible,
  onClose,
  ticketCategoryId,
  quantity,
  onSuccess,
}: PersonalInfoModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [form, setForm] = useState<FormValues>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    dateBirth: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof FormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toDatabaseDate = (value: string) => {
    const parts = value.split('/');
    if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
    const [day, month, year] = parts;
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;
    return `${year}-${month}-${day}`;
  };

  const fields: {
    key: keyof FormValues;
    label: string;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
  }[] = [
    { key: 'firstName', label: 'First Name', placeholder: 'Masukkan nama depan' },
    { key: 'lastName', label: 'Last Name', placeholder: 'Masukkan nama belakang' },
    { key: 'email', label: 'Email', placeholder: 'nama@email.com', keyboardType: 'email-address' },
    { key: 'phone', label: 'Nomor Telepon', placeholder: 'Contoh: 08123456789', keyboardType: 'phone-pad' },
    { key: 'idNumber', label: 'ID Number', placeholder: 'Masukkan nomor identitas', keyboardType: 'phone-pad' },
    { key: 'dateBirth', label: 'Date of Birth', placeholder: 'DD/MM/YYYY' },
  ];

  const handleSubmit = async () => {
    const normalizedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    ) as FormValues;
    const missingFields = fields
      .filter((field) => !normalizedForm[field.key])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      Alert.alert('Data belum lengkap', `Harap isi: ${missingFields.join(', ')}`);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedForm.email)) {
      Alert.alert('Email tidak valid', 'Masukkan alamat email yang benar.');
      return;
    }

    if (!/^\d+$/.test(normalizedForm.phone) || !/^\d+$/.test(normalizedForm.idNumber)) {
      Alert.alert('Data tidak valid', 'Nomor telepon dan ID number hanya boleh berisi angka.');
      return;
    }

    const dateBirth = toDatabaseDate(normalizedForm.dateBirth);
    if (!dateBirth) {
      Alert.alert('Tanggal tidak valid', 'Gunakan format DD/MM/YYYY.');
      return;
    }

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
          ticket_category_id: ticketCategoryId,
          jumlah_tiket: quantity,
          first_name: normalizedForm.firstName,
          last_name: normalizedForm.lastName,
          email: normalizedForm.email,
          phone: normalizedForm.phone,
          id_number: normalizedForm.idNumber,
          date_birth: dateBirth,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Pesanan gagal dibuat');

      Alert.alert('Pesanan berhasil', 'Informasi personal dan pesanan sudah dikonfirmasi.', [
        {
          text: 'Lihat Pesanan',
          onPress: () => {
            onClose();
            onSuccess();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Pemesanan gagal', error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={onClose} />
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
              <ThemedText type="title" style={{ color: colors.text, fontSize: 20 }}>
                Informasi Personal
              </ThemedText>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: colors.text + '10' }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ThemedText style={[styles.description, { color: colors.text + '99' }]}>
              Lengkapi data berikut untuk melanjutkan pemesanan tiket.
            </ThemedText>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.formContainer}
            >
              {fields.map((field) => (
                <View key={field.key} style={styles.fieldGroup}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>
                    {field.label}
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.text + '33',
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    value={form[field.key]}
                    onChangeText={(value) => updateField(field.key, value)}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.text + '60'}
                    keyboardType={field.keyboardType ?? 'default'}
                    autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.text, opacity: submitting ? 0.7 : 1 },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <ThemedText style={[styles.submitText, { color: colors.background }]}>
                    Konfirmasi Pemesanan
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  formContainer: {
    paddingBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  submitButton: {
    minHeight: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
