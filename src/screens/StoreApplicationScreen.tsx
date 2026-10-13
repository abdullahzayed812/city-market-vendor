import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AppText as Text, Button, BackIcon, ForwardIcon, palette, radii, sizes, space, apiErrorMessage } from '@city-market/mobile-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LogOut, MapPin, Check } from 'lucide-react-native';
import Config from 'react-native-config';
import { Vendor, VendorType } from '@city-market/shared';
import { VendorService, PickedImage, StoreApplication } from '../services/api/vendorService';
import { DocumentPhotoPicker } from '../components/onboarding/DocumentPhotoPicker';
import StoreMapPickerModal from '../components/StoreMapPickerModal';
import { useAuth } from '../app/AuthContext';

const PHONE_RE = /^\+?[0-9]{10,15}$/;
const GOOGLE_MAPS_API_KEY = Config.GOOGLE_MAPS_API_KEY ?? '';
// New Borg El Arab: where the map opens when the store has no location yet
const DEFAULT_LOCATION = { latitude: 30.8725, longitude: 29.5408 };

type DocKey = 'ownerNationalId' | 'commercialRegister' | 'taxCard';
const DOCS: { key: DocKey; urlField: 'ownerNationalIdUrl' | 'commercialRegisterUrl' | 'taxCardUrl'; required: boolean }[] = [
  { key: 'ownerNationalId', urlField: 'ownerNationalIdUrl', required: true },
  { key: 'commercialRegister', urlField: 'commercialRegisterUrl', required: true },
  { key: 'taxCard', urlField: 'taxCardUrl', required: false },
];

const STEPS = ['store', 'location', 'documents', 'review'] as const;
type Step = (typeof STEPS)[number];

const cleanPhone = (p: string) => p.replace(/[\s-]/g, '');

interface Props {
  // Set when correcting an application (pending or rejected); fields and documents prefill
  existing?: Vendor | null;
  onSubmitted: () => void;
  onCancel?: () => void;
}

// Merchant application in four short steps: store, location, documents, review. Nothing
// is sent until the last step; the documents upload first, then the application, and
// the merchant only moves on once vendor-service has accepted it.
const StoreApplicationScreen = ({ existing, onSubmitted, onCancel }: Props) => {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const align = { textAlign: i18n.language === 'ar' ? 'right' : 'left' } as const;

  const [step, setStep] = useState<Step>('store');
  const [shopName, setShopName] = useState(existing?.shopName ?? '');
  const [type, setType] = useState(existing?.type ?? '');
  const [shopDescription, setShopDescription] = useState(existing?.shopDescription ?? '');
  const [ownerName, setOwnerName] = useState(existing?.ownerName ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
    existing?.latitude != null && existing?.longitude != null ? { latitude: Number(existing.latitude), longitude: Number(existing.longitude) } : null,
  );
  const [mapOpen, setMapOpen] = useState(false);
  const [photos, setPhotos] = useState<Record<DocKey, PickedImage | null>>({ ownerNationalId: null, commercialRegister: null, taxCard: null });
  const [urls, setUrls] = useState<Record<DocKey, string | null>>({
    ownerNationalId: existing?.ownerNationalIdUrl ?? null,
    commercialRegister: existing?.commercialRegisterUrl ?? null,
    taxCard: existing?.taxCardUrl ?? null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (s: Step): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 'store') {
      if (!shopName.trim()) e.shopName = t('onboarding.errors.required');
      if (!type) e.type = t('onboarding.errors.choose_category');
      if (!ownerName.trim()) e.ownerName = t('onboarding.errors.required');
      if (!PHONE_RE.test(cleanPhone(phone))) e.phone = t('onboarding.errors.invalid_phone');
    }
    if (s === 'location') {
      if (!address.trim()) e.address = t('onboarding.errors.required');
      if (!location) e.location = t('onboarding.errors.location_required');
    }
    if (s === 'documents') {
      for (const d of DOCS) if (d.required && !photos[d.key] && !urls[d.key]) e[d.key] = t('onboarding.errors.document_required');
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(STEPS[STEPS.indexOf(step) + 1]);
  };

  const back = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
    else onCancel?.();
  };

  const submit = async () => {
    // The merchant may have gone back and changed a step: check everything again
    for (const s of STEPS.slice(0, 3)) {
      const e = validate(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    setSubmitError(null);
    try {
      const uploaded = { ...urls };
      for (const d of DOCS) {
        const photo = photos[d.key];
        if (!photo) continue;
        const name = t(`onboarding.documents.${d.key}`);
        setProgress(t('onboarding.uploading_document', { name, percent: 0 }));
        uploaded[d.key] = await VendorService.uploadDocument(photo, percent => setProgress(t('onboarding.uploading_document', { name, percent })));
        // Keep it: a retry after a failed submit won't upload the same photo again
        setUrls(u => ({ ...u, [d.key]: uploaded[d.key] }));
        setPhotos(p => ({ ...p, [d.key]: null }));
      }
      setProgress(t('onboarding.submitting'));
      const application: StoreApplication = {
        shopName: shopName.trim(),
        type,
        shopDescription: shopDescription.trim() || undefined,
        ownerName: ownerName.trim(),
        phone: cleanPhone(phone),
        address: address.trim(),
        latitude: location!.latitude,
        longitude: location!.longitude,
        ownerNationalIdUrl: uploaded.ownerNationalId!,
        commercialRegisterUrl: uploaded.commercialRegister!,
        taxCardUrl: uploaded.taxCard ?? null,
      };
      if (existing) await VendorService.resubmitStore(application);
      else await VendorService.registerStore(application);
      onSubmitted();
    } catch (err: any) {
      setSubmitError(apiErrorMessage(err) ?? t('onboarding.errors.submit_failed'));
    } finally {
      setProgress(null);
    }
  };

  const busy = progress !== null;
  const stepIndex = STEPS.indexOf(step);

  const field = (key: string, label: string, input: React.ReactNode, opts: { required?: boolean; hint?: string } = {}) => (
    <View style={styles.field}>
      <Text variant="label" color={palette.text}>
        {label}
        {opts.required ? ' *' : ` (${t('onboarding.optional')})`}
      </Text>
      {input}
      {errors[key] ? (
        <Text variant="caption" color={palette.error}>{errors[key]}</Text>
      ) : opts.hint ? (
        <Text variant="caption" color={palette.textMuted}>{opts.hint}</Text>
      ) : null}
    </View>
  );

  const clearError = (key: string) => setErrors(e => (e[key] ? { ...e, [key]: '' } : e));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text variant="heading" color={palette.text}>{t(existing ? 'onboarding.edit_title' : 'onboarding.title')}</Text>
            <Text variant="caption" color={palette.textMuted}>{t('onboarding.subtitle')}</Text>
          </View>
          <Pressable onPress={signOut} disabled={busy} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.logout')}>
            <LogOut size={22} color={palette.textMuted} />
          </Pressable>
        </View>

        <View style={styles.steps} accessibilityLabel={t('onboarding.steps_label')}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepBar, i <= stepIndex && styles.stepBarActive]} />
              <Text variant="micro" color={i === stepIndex ? palette.primary : palette.textMuted}>{t(`onboarding.step.${s}`)}</Text>
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {step === 'store' && (
            <>
              {field(
                'shopName',
                t('onboarding.shop_name'),
                <TextInput style={[styles.input, align, errors.shopName && styles.inputError]} value={shopName} maxLength={255} onChangeText={v => { setShopName(v); clearError('shopName'); }} />,
                { required: true },
              )}
              {field(
                'type',
                t('onboarding.category'),
                <View style={styles.chips}>
                  {Object.values(VendorType).map(v => (
                    <Pressable
                      key={v}
                      onPress={() => { setType(v); clearError('type'); }}
                      style={[styles.chip, type === v && styles.chipActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: type === v }}
                    >
                      <Text variant="caption" color={type === v ? palette.white : palette.text}>{t(`vendor_types.${v}`)}</Text>
                    </Pressable>
                  ))}
                </View>,
                { required: true },
              )}
              {field(
                'ownerName',
                t('onboarding.owner_name'),
                <TextInput style={[styles.input, align, errors.ownerName && styles.inputError]} value={ownerName} maxLength={255} onChangeText={v => { setOwnerName(v); clearError('ownerName'); }} />,
                { required: true, hint: t('onboarding.owner_name_hint') },
              )}
              {field(
                'phone',
                t('onboarding.phone'),
                <TextInput
                  style={[styles.input, styles.ltr, errors.phone && styles.inputError]}
                  value={phone}
                  keyboardType="phone-pad"
                  placeholder="01xxxxxxxxx"
                  placeholderTextColor={palette.textDisabled}
                  onChangeText={v => { setPhone(v); clearError('phone'); }}
                />,
                { required: true, hint: t('onboarding.phone_hint') },
              )}
              {field(
                'shopDescription',
                t('onboarding.description'),
                <TextInput style={[styles.input, styles.multiline, align]} value={shopDescription} maxLength={1000} multiline onChangeText={setShopDescription} />,
              )}
            </>
          )}

          {step === 'location' && (
            <>
              {field(
                'address',
                t('onboarding.address'),
                <TextInput style={[styles.input, align, errors.address && styles.inputError]} value={address} onChangeText={v => { setAddress(v); clearError('address'); }} />,
                { required: true, hint: t('onboarding.address_hint') },
              )}
              {field(
                'location',
                t('onboarding.map_location'),
                <Pressable style={[styles.mapButton, !!errors.location && styles.inputError]} onPress={() => setMapOpen(true)} accessibilityRole="button">
                  <MapPin size={20} color={palette.primary} />
                  <Text variant="bodyStrong" color={location ? palette.text : palette.primary} style={styles.flex}>
                    {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : t('onboarding.pick_on_map')}
                  </Text>
                  {location ? <Check size={18} color={palette.success} /> : null}
                </Pressable>,
                { required: true, hint: t('onboarding.map_location_hint_mobile') },
              )}
              <StoreMapPickerModal
                visible={mapOpen}
                onClose={() => setMapOpen(false)}
                googleApiKey={GOOGLE_MAPS_API_KEY}
                initialLocation={location ?? DEFAULT_LOCATION}
                onConfirm={picked => {
                  setLocation({ latitude: picked.latitude, longitude: picked.longitude });
                  // The map search fills the address only if the merchant hasn't typed one
                  if (!address.trim() && picked.address && picked.address !== 'Selected Store Location') setAddress(picked.address);
                  clearError('location');
                }}
              />
            </>
          )}

          {step === 'documents' && (
            <>
              <Text variant="body" color={palette.textSecondary} style={styles.intro}>{t('onboarding.documents_intro')}</Text>
              {DOCS.map(d => (
                <DocumentPhotoPicker
                  key={d.key}
                  label={t(`onboarding.documents.${d.key}`)}
                  required={d.required}
                  value={photos[d.key]}
                  existingUrl={urls[d.key]}
                  error={errors[d.key]}
                  onChange={image => { setPhotos(p => ({ ...p, [d.key]: image })); clearError(d.key); }}
                />
              ))}
              <Text variant="caption" color={palette.textMuted}>{t('onboarding.documents_privacy')}</Text>
            </>
          )}

          {step === 'review' && (
            <>
              {[
                [t('onboarding.shop_name'), shopName],
                [t('onboarding.category'), type ? t(`vendor_types.${type}`) : ''],
                [t('onboarding.owner_name'), ownerName],
                [t('onboarding.phone'), cleanPhone(phone)],
                [t('onboarding.address'), address],
                [t('onboarding.documents_title'), DOCS.filter(d => photos[d.key] || urls[d.key]).map(d => t(`onboarding.documents.${d.key}`)).join(' · ')],
              ].map(([label, value]) => (
                <View key={label} style={styles.summaryRow}>
                  <Text variant="caption" color={palette.textMuted}>{label}</Text>
                  <Text variant="bodyStrong" color={palette.text}>{value || '—'}</Text>
                </View>
              ))}
              <View style={styles.notice}>
                <Text variant="caption" color={palette.warning}>{t('onboarding.review_notice')}</Text>
              </View>
              {submitError ? (
                <View style={styles.errorBox} accessibilityRole="alert">
                  <Text variant="caption" color={palette.error}>{submitError}</Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={stepIndex === 0 && onCancel ? t('common.cancel') : t('onboarding.back')}
            variant="ghost"
            icon={BackIcon}
            onPress={back}
            disabled={busy || (stepIndex === 0 && !onCancel)}
          />
          {step !== 'review' ? (
            <Button label={t('onboarding.next')} trailingIcon={ForwardIcon} onPress={next} />
          ) : (
            <Button
              label={progress ?? (submitError ? t('onboarding.retry') : existing ? t('onboarding.resubmit') : t('onboarding.submit'))}
              onPress={submit}
              loading={busy}
              style={styles.flexShrink}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingHorizontal: space.xxl, paddingTop: space.lg },
  steps: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.xxl, paddingVertical: space.lg },
  stepItem: { flex: 1, gap: space.xs },
  stepBar: { height: 5, borderRadius: radii.pill, backgroundColor: palette.border },
  stepBarActive: { backgroundColor: palette.primary },
  container: { paddingHorizontal: space.xxl, paddingBottom: space.xxxl },
  field: { marginBottom: space.lg, gap: space.xs },
  input: {
    minHeight: sizes.input,
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingHorizontal: space.lg,
    fontSize: 16,
    color: palette.text,
  },
  inputError: { borderColor: palette.error },
  ltr: { textAlign: 'left', writingDirection: 'ltr' },
  multiline: { minHeight: 90, paddingTop: space.md, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.surface },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: sizes.input,
    paddingHorizontal: space.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
  },
  intro: { marginBottom: space.lg },
  summaryRow: { backgroundColor: palette.surface, borderRadius: radii.sm, padding: space.md, marginBottom: space.sm, gap: space.xxs },
  notice: { backgroundColor: palette.warningSoft, borderRadius: radii.sm, padding: space.md, marginTop: space.sm },
  errorBox: { backgroundColor: palette.errorSoft, borderRadius: radii.sm, padding: space.md, marginTop: space.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xxl,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
});

export default StoreApplicationScreen;
