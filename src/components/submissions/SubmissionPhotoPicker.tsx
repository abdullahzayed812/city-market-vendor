import React, { useState } from 'react';
import { View, Pressable, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AppText as Text, palette, radii, space } from '@city-market/mobile-ui';
import { Camera, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import type { SubmissionImageRules } from '@city-market/shared';
import { DEFAULT_IMAGE_RULES, ProductSubmissionService, submissionErrorKey } from '../../services/api/productSubmissionService';

export interface SubmissionPhoto {
  // Empty for the current photo of a proposal being edited (the server keeps it)
  key: string;
  uri: string;
  width: number | null;
  height: number | null;
}

// Full quality: product photos must be at least 800 x 800, so nothing is downscaled here.
// media-service re-checks the real content and re-encodes it.
const PICKER_OPTIONS = { mediaType: 'photo' as const, quality: 0.9 as const, maxWidth: 2400, maxHeight: 2400 };

interface Props {
  value: SubmissionPhoto | null;
  error?: string;
  onChange: (photo: SubmissionPhoto | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export const SubmissionPhotoPicker: React.FC<Props> = ({ value, error, onChange, onUploadingChange }) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { data: rules = DEFAULT_IMAGE_RULES } = useQuery<SubmissionImageRules>({
    queryKey: ['submission-image-rules'],
    queryFn: () => ProductSubmissionService.getImageRules(),
    staleTime: 60 * 60 * 1000,
  });
  const maxMb = Math.round((rules.maxBytes / (1024 * 1024)) * 10) / 10;

  const handleResult = async (result: ImagePickerResponse) => {
    if (result.didCancel) return;
    if (result.errorCode) {
      setLocalError(t('product_submissions.errors.photo_picker'));
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setLocalError(null);
    if (asset.type && !rules.mimeTypes.includes(asset.type)) return setLocalError(t('product_submissions.errors.image_format_not_allowed'));
    if (asset.fileSize && asset.fileSize > rules.maxBytes) return setLocalError(t('product_submissions.errors.image_too_large_n', { mb: maxMb }));
    if (asset.width && asset.height && (asset.width < rules.minWidth || asset.height < rules.minHeight)) {
      return setLocalError(
        t('product_submissions.errors.image_too_small_n', { w: rules.minWidth, h: rules.minHeight, actualW: asset.width, actualH: asset.height }),
      );
    }

    setProgress(0);
    onUploadingChange?.(true);
    try {
      const uploaded = await ProductSubmissionService.uploadImage(
        { uri: asset.uri, type: asset.type, fileName: asset.fileName, fileSize: asset.fileSize },
        setProgress,
      );
      onChange({ key: uploaded.key, uri: asset.uri, width: uploaded.width, height: uploaded.height });
    } catch (err) {
      setLocalError(t(submissionErrorKey(err), { defaultValue: t('product_submissions.errors.generic') }));
    } finally {
      setProgress(null);
      onUploadingChange?.(false);
    }
  };

  const choose = () =>
    Alert.alert(t('product_submissions.photo'), undefined, [
      { text: t('onboarding.take_photo'), onPress: () => launchCamera(PICKER_OPTIONS).then(handleResult) },
      { text: t('onboarding.choose_from_gallery'), onPress: () => launchImageLibrary(PICKER_OPTIONS).then(handleResult) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);

  const uploading = progress !== null;
  const shownError = localError ?? error;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={choose}
        disabled={uploading}
        style={({ pressed }) => [styles.box, value && styles.boxFilled, !!shownError && styles.boxError, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('product_submissions.photo')}
      >
        {value ? (
          <Image source={{ uri: value.uri }} style={styles.preview} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Camera size={30} color={palette.primary} />
            <Text variant="label" color={palette.primary}>
              {t('product_submissions.choose_photo')}
            </Text>
          </View>
        )}
        {uploading ? (
          <View style={styles.overlay}>
            <ActivityIndicator color={palette.primary} />
            <Text variant="caption" color={palette.text}>
              {t('product_submissions.uploading', { percent: progress })}
            </Text>
          </View>
        ) : value ? (
          <View style={styles.replace}>
            <RefreshCw size={12} color={palette.text} />
            <Text variant="micro" color={palette.text}>
              {t('product_submissions.replace_photo')}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.rules}>
        <Text variant="caption" color={palette.textMuted}>
          • {t('product_submissions.rule_formats', { formats: rules.formats.map(f => f.toUpperCase()).join(', ') })}
        </Text>
        <Text variant="caption" color={palette.textMuted}>
          • {t('product_submissions.rule_min_size', { w: rules.minWidth, h: rules.minHeight })}
        </Text>
        <Text variant="caption" color={palette.textMuted}>
          • {t('product_submissions.rule_max_bytes', { mb: maxMb })}
        </Text>
        <Text variant="caption" color={palette.textMuted}>
          • {t('product_submissions.rule_content')}
        </Text>
      </View>

      {value && !shownError && value.width && value.height ? (
        <View style={styles.row}>
          <CheckCircle2 size={14} color={palette.success} />
          <Text variant="caption" color={palette.success}>
            {t('product_submissions.photo_ok', { w: value.width, h: value.height })}
          </Text>
        </View>
      ) : null}
      {shownError ? (
        <View style={styles.row} accessibilityRole="alert">
          <AlertCircle size={14} color={palette.error} />
          <Text variant="caption" color={palette.error} style={styles.flex}>
            {shownError}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  box: {
    height: 220,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.borderStrong,
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxFilled: { borderStyle: 'solid', borderColor: palette.success },
  boxError: { borderColor: palette.error },
  pressed: { backgroundColor: palette.primarySoft },
  placeholder: { alignItems: 'center', gap: space.sm },
  preview: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.sm,
  },
  replace: {
    position: 'absolute',
    bottom: space.sm,
    end: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  rules: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  flex: { flex: 1 },
});
