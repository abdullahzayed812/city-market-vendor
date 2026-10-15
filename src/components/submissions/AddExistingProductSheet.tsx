import React, { useEffect, useState } from 'react';
import { View, Modal, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text, Button, IconButton, palette, radii, sizes, space } from '@city-market/mobile-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { X } from 'lucide-react-native';
import { MeasurementType, WeightUnit, type ProductDuplicateMatch } from '@city-market/shared';
import { ProductService } from '../../services/api/productService';
import { submissionErrorKey } from '../../services/api/productSubmissionService';
import { useAuth } from '../../app/AuthContext';

interface Props {
  match: ProductDuplicateMatch | null;
  onClose: () => void;
  onAdded: (globalProductId: string) => void;
}

// Adds an existing catalog product to the store with the merchant's price and stock (the
// bulk-add endpoint, which validates both on the server)
export const AddExistingProductSheet: React.FC<Props> = ({ match, onClose, onAdded }) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { vendor } = useAuth();
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState<string | null>(null);
  const align = { textAlign: i18n.language === 'ar' ? 'right' : 'left' } as const;

  useEffect(() => {
    setPrice('');
    setStock('');
    setError(null);
  }, [match?.globalProductId]);

  const byWeight = match?.measurementType === MeasurementType.WEIGHT;
  const inKg = (match?.weightUnit ?? WeightUnit.KG) === WeightUnit.KG;

  const add = useMutation({
    mutationFn: ({ p, s }: { p: number; s: number }) =>
      ProductService.bulkAddProductsFromGlobal(vendor.id, [
        byWeight
          ? { globalProductId: match!.globalProductId, price: p, stockWeightGrams: Math.round(inKg ? s * 1000 : s) }
          : { globalProductId: match!.globalProductId, price: p, stockQuantity: Math.round(s) },
      ]),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      Toast.show({ type: 'success', text1: t(result?.added ? 'product_submissions.added_with_price' : 'product_submissions.already_in_store') });
      onAdded(match!.globalProductId);
    },
    onError: err => setError(t(submissionErrorKey(err), { defaultValue: t('product_submissions.errors.generic') })),
  });

  const save = () => {
    const p = Number(price.replace(',', '.').trim());
    const s = Number(stock.replace(',', '.').trim());
    if (!price.trim() || !Number.isFinite(p) || p <= 0) return setError(t('product_submissions.errors.invalid_price'));
    if (!stock.trim() || !Number.isFinite(s) || s < 0 || (!byWeight && !Number.isInteger(s))) return setError(t('product_submissions.errors.invalid_stock'));
    setError(null);
    add.mutate({ p, s });
  };

  if (!match) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text variant="heading" color={palette.text}>
                {t('product_submissions.add_to_store')}
              </Text>
              <Text variant="body" color={palette.textSecondary} numberOfLines={2}>
                {match.name}
              </Text>
            </View>
            <IconButton icon={X} onPress={onClose} accessibilityLabel={t('common.cancel')} variant="soft" size={40} />
          </View>

          <Text variant="label" color={palette.text}>
            {byWeight ? t('product_submissions.price_per_kg') : t('product_submissions.price_per_unit')}
          </Text>
          <TextInput style={[styles.input, align]} value={price} onChangeText={setPrice} keyboardType="decimal-pad" autoFocus />

          <Text variant="label" color={palette.text} style={styles.label}>
            {byWeight
              ? t('product_submissions.stock_weight', { unit: t(inKg ? 'product_submissions.unit_kg' : 'product_submissions.unit_gram') })
              : t('product_submissions.stock_units')}
          </Text>
          <TextInput style={[styles.input, align]} value={stock} onChangeText={setStock} keyboardType={byWeight ? 'decimal-pad' : 'number-pad'} />

          {error ? (
            <Text variant="caption" color={palette.error} style={styles.label} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          <Button label={t('product_submissions.add_to_store')} size="lg" fullWidth loading={add.isPending} onPress={save} style={styles.button} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: palette.overlay },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.lg },
  label: { marginTop: space.md },
  input: {
    minHeight: sizes.input,
    marginTop: space.xs,
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.primary,
    paddingHorizontal: space.lg,
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
  },
  button: { marginTop: space.lg },
});
