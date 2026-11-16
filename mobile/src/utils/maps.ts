import { Linking, Alert } from 'react-native';

/**
 * Membuka lokasi event langsung di aplikasi Google Maps (atau browser).
 * @param location Nama atau alamat lokasi event
 */
export const openGoogleMaps = async (location: string): Promise<void> => {
  if (!location || !location.trim()) {
    Alert.alert('Info Lokasi', 'Lokasi untuk event ini belum ditentukan.');
    return;
  }

  const query = encodeURIComponent(location.trim());
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  try {
    const canOpen = await Linking.canOpenURL(googleMapsUrl);
    if (canOpen) {
      await Linking.openURL(googleMapsUrl);
    } else {
      await Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  } catch (error) {
    console.error('Gagal membuka Google Maps:', error);
    Alert.alert(
      'Gagal Membuka Peta',
      'Tidak dapat membuka Google Maps. Pastikan aplikasi Google Maps atau browser tersedia di perangkat Anda.'
    );
  }
};

