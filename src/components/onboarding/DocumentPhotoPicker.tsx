import React from 'react';
import { View, Pressable, Image, StyleSheet, Alert } from 'react-native';
import { AppText as Text, palette, radii, space } from '@city-market/mobile-ui';
import { Camera, CheckCircle2, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { PickedImage } from '../../services/api/vendorService';

// Document photos only need to be readable; keep uploads small. media-service accepts
// jpeg / png / webp up to 10 MB.
const PICKER_OPTIONS = { mediaType: 'photo' as const, quality: 0.7 as const, maxWidth: 1600, maxHeight: 1600 };
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface Props {
  label: string;
  required?: boolean;
  // A new photo, or the URL already on the application (when correcting it)
  value: PickedImage | null;
  existingUrl?: string | null;
  error?: string;
  onChange: (image: PickedImage | null) => void;
}

export const DocumentPhotoPicker: React.FC<Props> = ({ label, required, value, existingUrl, error, onChange }) => {
  const { t } = useTranslation();

  const handleResult = (result: ImagePickerResponse) => {
    if (result.didCancel) return;
    if (result.errorCode) {
      Toast.show({ type: 'error', text1: t('onboarding.photo_error') });
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    if (asset.type && !ACCEPTED_TYPES.includes(asset.type)) {
      Toast.show({ type: 'error', text1: t('onboarding.errors.file_type') });
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_FILE_BYTES) {
      Toast.show({ type: 'error', text1: t('onboarding.errors.file_size') });
      return;
    }
    onChange({ uri: asset.uri, type: asset.type, fileName: asset.fileName, fileSize: asset.fileSize });
  };

  const choose = () =>
    Alert.alert(label, undefined, [
      { text: t('onboarding.take_photo'), onPress: () => launchCamera(PICKER_OPTIONS).then(handleResult) },
      { text: t('onboarding.choose_from_gallery'), onPress: () => launchImageLibrary(PICKER_OPTIONS).then(handleResult) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);

  const shown = value?.uri ?? existingUrl ?? null;

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.box, shown && styles.boxFilled, !!error && styles.boxError, pressed && styles.pressed]}
        onPress={choose}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {shown ? (
          <Image source={{ uri: shown }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Camera size={26} color={palette.primary} />
          </View>
        )}
        <View style={styles.text}>
          <View style={styles.labelRow}>
            <Text variant="label" color={palette.text} style={styles.flexShrink}>
              {label}
              {required ? ' *' : ` (${t('onboarding.optional')})`}
            </Text>
            {shown ? <CheckCircle2 size={16} color={palette.success} /> : null}
          </View>
          <Text variant="caption" color={palette.textMuted}>
            {value ? t('onboarding.tap_to_replace') : existingUrl ? t('onboarding.document_on_file') : t('onboarding.tap_to_add')}
          </Text>
        </View>
        {value ? (
          <Pressable hitSlop={12} onPress={() => onChange(null)} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
            <X size={18} color={palette.textMuted} />
          </Pressable>
        ) : null}
      </Pressable>
      {error ? (
        <Text variant="caption" color={palette.error} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    padding: space.md,
    backgroundColor: palette.surface,
  },
  boxFilled: { borderStyle: 'solid', borderColor: palette.success },
  boxError: { borderColor: palette.error },
  pressed: { backgroundColor: palette.primarySoft },
  placeholder: { width: 72, height: 56, borderRadius: radii.sm, backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' },
  preview: { width: 72, height: 56, borderRadius: radii.sm },
  text: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  flexShrink: { flexShrink: 1 },
  error: { marginTop: space.xs },
});
