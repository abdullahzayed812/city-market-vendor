import React, { useEffect, useMemo, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { AppText as Text, Button, StatusBadge, palette, radii, sizes, space } from '@city-market/mobile-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Search, PackagePlus, PackageCheck, CheckCircle2, Ban } from 'lucide-react-native';
import { MeasurementType, WeightUnit, type ProductDuplicateMatch, type ProductSubmission, type ProductSubmissionInput } from '@city-market/shared';
import CustomHeader from '../components/common/CustomHeader';
import { SubmissionPhotoPicker, type SubmissionPhoto } from '../components/submissions/SubmissionPhotoPicker';
import { AddExistingProductSheet } from '../components/submissions/AddExistingProductSheet';
import { ProductService } from '../services/api/productService';
import { ProductSubmissionService, submissionErrorKey } from '../services/api/productSubmissionService';

type Step = 'search' | 'form' | 'review' | 'done';

const isStrong = (m: ProductDuplicateMatch) => m.exact || (m.sameCategory && m.score >= 0.75);

const useDebounced = <T,>(value: T, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

const MatchRow = ({ match, action }: { match: ProductDuplicateMatch; action?: React.ReactNode }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.match}>
      {match.imageUrl ? <Image source={{ uri: match.imageUrl }} style={styles.matchImage} /> : <View style={styles.matchImage} />}
      <View style={styles.flex}>
        <Text variant="bodyStrong" color={palette.text} numberOfLines={2}>
          {match.name}
        </Text>
        <View style={styles.badges}>
          {match.globalCategoryName ? (
            <Text variant="caption" color={palette.textMuted}>
              {match.globalCategoryName}
            </Text>
          ) : null}
          {match.exact ? <StatusBadge size="sm" tone="error" label={t('product_submissions.same_name')} /> : null}
          {match.sameCategory ? <StatusBadge size="sm" tone="neutral" label={t('product_submissions.same_category')} /> : null}
        </View>
      </View>
      {action}
    </View>
  );
};

// Propose a product that isn't in the catalog (or edit / resubmit a proposal)
const ProductSubmissionFormScreen = ({ navigation, route }: any) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const existing: ProductSubmission | undefined = route.params?.submission;
  const editing = !!existing;
  const align = { textAlign: i18n.language === 'ar' ? 'right' : 'left' } as const;

  const [step, setStep] = useState<Step>(editing ? 'form' : 'search');
  const [query, setQuery] = useState('');
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [categoryId, setCategoryId] = useState(existing?.globalCategoryId ?? '');
  const [measurementType, setMeasurementType] = useState<MeasurementType>(existing?.measurementType ?? MeasurementType.UNIT);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(existing?.weightUnit ?? WeightUnit.KG);
  const [photo, setPhoto] = useState<SubmissionPhoto | null>(
    existing?.imageUrl ? { key: '', uri: existing.imageUrl, width: existing.imageWidth, height: existing.imageHeight } : null,
  );
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'name' | 'category' | 'photo', string>>>({});
  const [acknowledged, setAcknowledged] = useState(existing?.vendorAcknowledgedDuplicates ?? false);
  const [conflict, setConflict] = useState<ProductDuplicateMatch[] | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  // Catalog product being added (price / stock sheet)
  const [adding, setAdding] = useState<ProductDuplicateMatch | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['globalCategories'], queryFn: () => ProductService.getGlobalCategories() });
  const categoryName = useMemo(() => categories.find((c: any) => c.id === categoryId)?.name, [categories, categoryId]);

  const debouncedQuery = useDebounced(query.trim());
  const { data: searchMatches = [], isFetching: searching } = useQuery({
    queryKey: ['submissionSearch', debouncedQuery],
    queryFn: () => ProductSubmissionService.checkDuplicates(debouncedQuery),
    enabled: step === 'search' && debouncedQuery.length >= 2,
  });
  const { data: reviewMatches = [], isFetching: checking } = useQuery({
    queryKey: ['submissionReviewMatches', name.trim(), categoryId],
    queryFn: () => ProductSubmissionService.checkDuplicates(name.trim(), categoryId),
    enabled: step === 'review' && name.trim().length >= 2,
  });
  const matches = conflict ?? reviewMatches;
  // Same name in the same category: already in the catalog, the server refuses a proposal
  const alreadyInCatalog = matches.filter(m => m.exact && m.sameCategory);
  const needsAck = alreadyInCatalog.length === 0 && matches.some(isStrong);

  const save = useMutation({
    mutationFn: () => {
      const input: ProductSubmissionInput = {
        name: name.trim(),
        description: description.trim() || null,
        globalCategoryId: categoryId,
        measurementType,
        weightUnit: measurementType === MeasurementType.WEIGHT ? weightUnit : null,
        imageKey: photo?.key ?? '',
        acknowledgedDuplicates: acknowledged,
      };
      return existing ? ProductSubmissionService.update(existing.id, input) : ProductSubmissionService.create(input);
    },
    onSuccess: submission => {
      queryClient.invalidateQueries({ queryKey: ['productSubmissions'] });
      queryClient.setQueryData(['productSubmission', submission.id], submission);
      setStep('done');
    },
    onError: (err: any) => {
      const code = err?.response?.data?.message;
      if (code === 'possible_duplicates' || code === 'product_already_in_catalog') {
        setConflict(err.response.data.errors?.matches ?? []);
        setAcknowledged(false);
        return;
      }
      Toast.show({ type: 'error', text1: t(submissionErrorKey(err), { defaultValue: t('product_submissions.errors.generic') }) });
    },
  });

  const validate = () => {
    const e: typeof errors = {};
    const n = name.trim();
    if (n.length < 2) e.name = t('product_submissions.errors.submission_name_required');
    else if (n.length > 255) e.name = t('product_submissions.errors.submission_name_too_long');
    if (!categoryId) e.category = t('product_submissions.errors.invalid_global_category');
    if (!photo) e.photo = t('product_submissions.errors.submission_image_required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const title = editing
    ? t(existing?.status === 'NEEDS_CHANGES' ? 'product_submissions.edit_and_resubmit' : 'product_submissions.edit_proposal')
    : t('product_submissions.propose_title');

  const addButton = (match: ProductDuplicateMatch, label: string) =>
    added.has(match.globalProductId) ? (
      <CheckCircle2 size={22} color={palette.success} accessibilityLabel={t('product_submissions.in_store')} />
    ) : (
      <Button size="sm" variant="outline" icon={PackageCheck} label={label} onPress={() => setAdding(match)} />
    );

  const chip = (selected: boolean, label: string, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={[styles.chip, selected && styles.chipActive]} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Text variant="label" color={selected ? palette.textInverse : palette.text}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader title={title} showBack />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 'search' && (
            <>
              <Text variant="body" color={palette.textSecondary}>
                {t('product_submissions.step_search_hint')}
              </Text>
              <View style={styles.searchBox}>
                <Search size={18} color={palette.textMuted} />
                <TextInput
                  style={[styles.searchInput, align]}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('product_submissions.search_catalog')}
                  placeholderTextColor={palette.textDisabled}
                  autoFocus
                />
              </View>
              {searching ? <ActivityIndicator color={palette.primary} /> : null}
              {debouncedQuery.length >= 2 && !searching ? (
                searchMatches.length > 0 ? (
                  <View style={styles.gap}>
                    <Text variant="label" color={palette.textSecondary}>
                      {t('product_submissions.found_in_catalog')}
                    </Text>
                    {searchMatches.map(m => (
                      <MatchRow key={m.globalProductId} match={m} action={addButton(m, t('product_submissions.add_short'))} />
                    ))}
                  </View>
                ) : (
                  <Text variant="body" color={palette.textMuted}>
                    {t('product_submissions.nothing_found')}
                  </Text>
                )
              ) : null}
              <View style={styles.notListed}>
                <Text variant="body" color={palette.textSecondary}>
                  {t('product_submissions.not_listed')}
                </Text>
                <Button
                  label={t('product_submissions.propose_new')}
                  icon={PackagePlus}
                  variant="secondary"
                  disabled={query.trim().length < 2}
                  onPress={() => {
                    setName(query.trim());
                    setStep('form');
                  }}
                />
              </View>
            </>
          )}

          {step === 'form' && (
            <>
              {existing?.status === 'NEEDS_CHANGES' && existing.reviewNote ? (
                <View style={styles.feedback}>
                  <Text variant="label" color={palette.warning}>
                    {t('product_submissions.admin_feedback')}
                  </Text>
                  <Text variant="body" color={palette.text}>
                    {existing.reviewNote}
                  </Text>
                </View>
              ) : null}
              <View style={styles.field}>
                <Text variant="label" color={palette.text}>
                  {t('product_submissions.name')} *
                </Text>
                <TextInput style={[styles.input, align, errors.name && styles.inputError]} value={name} maxLength={255} onChangeText={setName} />
                <Text variant="caption" color={palette.textMuted}>
                  {t('product_submissions.name_hint')}
                </Text>
                {errors.name ? (
                  <Text variant="caption" color={palette.error}>
                    {errors.name}
                  </Text>
                ) : null}
              </View>
              <View style={styles.field}>
                <Text variant="label" color={palette.text}>
                  {t('product_submissions.category')} *
                </Text>
                <View style={styles.chips}>{categories.map((c: any) => chip(categoryId === c.id, c.name, () => setCategoryId(c.id)))}</View>
                {errors.category ? (
                  <Text variant="caption" color={palette.error}>
                    {errors.category}
                  </Text>
                ) : null}
              </View>
              <View style={styles.field}>
                <Text variant="label" color={palette.text}>
                  {t('product_submissions.sold_by')} *
                </Text>
                <View style={styles.chips}>
                  {chip(measurementType === MeasurementType.UNIT, t('product_submissions.by_unit'), () => setMeasurementType(MeasurementType.UNIT))}
                  {chip(measurementType === MeasurementType.WEIGHT, t('product_submissions.by_weight'), () => setMeasurementType(MeasurementType.WEIGHT))}
                </View>
                {measurementType === MeasurementType.WEIGHT ? (
                  <View style={styles.chips}>
                    {chip(weightUnit === WeightUnit.KG, t('product_submissions.unit_kg'), () => setWeightUnit(WeightUnit.KG))}
                    {chip(weightUnit === WeightUnit.GRAM, t('product_submissions.unit_gram'), () => setWeightUnit(WeightUnit.GRAM))}
                  </View>
                ) : null}
              </View>
              <View style={styles.field}>
                <Text variant="label" color={palette.text}>
                  {t('product_submissions.description')}
                </Text>
                <TextInput
                  style={[styles.input, styles.multiline, align]}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={2000}
                  multiline
                />
              </View>
              <View style={styles.field}>
                <Text variant="label" color={palette.text}>
                  {t('product_submissions.photo')} *
                </Text>
                <SubmissionPhotoPicker value={photo} onChange={setPhoto} onUploadingChange={setUploading} error={errors.photo} />
              </View>
              <Text variant="caption" color={palette.textMuted}>
                {t('product_submissions.price_later_hint')}
              </Text>
              <Button
                label={t('product_submissions.next')}
                size="lg"
                fullWidth
                disabled={uploading}
                onPress={() => {
                  if (!validate()) return;
                  setConflict(null);
                  setStep('review');
                }}
              />
            </>
          )}

          {step === 'review' && (
            <>
              <Text variant="body" color={palette.textSecondary}>
                {t('product_submissions.step_review_hint')}
              </Text>
              <View style={styles.summary}>
                {photo ? <Image source={{ uri: photo.uri }} style={styles.summaryImage} resizeMode="contain" /> : null}
                <View style={styles.flex}>
                  <Text variant="heading" color={palette.text}>
                    {name.trim()}
                  </Text>
                  <Text variant="body" color={palette.textSecondary}>
                    {categoryName ?? '—'}
                  </Text>
                  <Text variant="body" color={palette.textSecondary}>
                    {measurementType === MeasurementType.WEIGHT
                      ? `${t('product_submissions.by_weight')} (${t(`product_submissions.unit_${weightUnit.toLowerCase()}`)})`
                      : t('product_submissions.by_unit')}
                  </Text>
                  {description.trim() ? (
                    <Text variant="caption" color={palette.textMuted}>
                      {description.trim()}
                    </Text>
                  ) : null}
                </View>
              </View>
              {checking ? <ActivityIndicator color={palette.primary} /> : null}
              {alreadyInCatalog.length > 0 ? (
                <View style={[styles.similar, styles.blocked]}>
                  <View style={styles.badges}>
                    <Ban size={16} color={palette.error} />
                    <Text variant="label" color={palette.error} style={styles.flex}>
                      {t('product_submissions.already_in_catalog')}
                    </Text>
                  </View>
                  {alreadyInCatalog.map(m => (
                    <MatchRow key={m.globalProductId} match={m} action={addButton(m, t('product_submissions.add_short'))} />
                  ))}
                </View>
              ) : matches.length > 0 ? (
                <View style={styles.similar}>
                  <Text variant="label" color={palette.warning}>
                    {t('product_submissions.similar_exist')}
                  </Text>
                  {matches.map(m => (
                    <MatchRow key={m.globalProductId} match={m} action={editing ? null : addButton(m, t('product_submissions.use_this'))} />
                  ))}
                  {needsAck ? (
                    <Pressable style={styles.ack} onPress={() => setAcknowledged(a => !a)} accessibilityRole="checkbox" accessibilityState={{ checked: acknowledged }}>
                      <View style={[styles.checkbox, acknowledged && styles.checkboxOn]}>
                        {acknowledged ? <CheckCircle2 size={16} color={palette.textInverse} /> : null}
                      </View>
                      <Text variant="body" color={palette.text} style={styles.flex}>
                        {t('product_submissions.confirm_different')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              <Text variant="caption" color={palette.textMuted}>
                {t('product_submissions.review_notice')}
              </Text>
              <Button
                label={t(editing ? 'product_submissions.save_and_submit' : 'product_submissions.submit')}
                size="lg"
                fullWidth
                loading={save.isPending}
                disabled={checking || alreadyInCatalog.length > 0 || (needsAck && !acknowledged)}
                onPress={() => save.mutate()}
              />
              <Button label={t('product_submissions.back')} variant="ghost" fullWidth onPress={() => setStep('form')} disabled={save.isPending} />
            </>
          )}

          {step === 'done' && (
            <View style={styles.done}>
              <CheckCircle2 size={56} color={palette.success} />
              <Text variant="heading" color={palette.text}>
                {t(editing ? 'product_submissions.resubmitted_title' : 'product_submissions.submitted_title')}
              </Text>
              <Text variant="body" color={palette.textSecondary} style={styles.center}>
                {t('product_submissions.submitted_body')}
              </Text>
              <Button label={t('product_submissions.view_requests')} fullWidth onPress={() => navigation.navigate('ProductSubmissions')} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <AddExistingProductSheet
        match={adding}
        onClose={() => setAdding(null)}
        onAdded={id => {
          setAdded(prev => new Set(prev).add(id));
          setAdding(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.huge },
  gap: { gap: space.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: sizes.input,
    paddingHorizontal: space.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
  },
  searchInput: { flex: 1, fontSize: 15, color: palette.text, paddingVertical: space.sm },
  notListed: { gap: space.sm, padding: space.md, borderRadius: radii.md, borderWidth: 1, borderStyle: 'dashed', borderColor: palette.borderStrong },
  match: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: radii.md, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  matchImage: { width: 52, height: 52, borderRadius: radii.sm, backgroundColor: palette.surfaceMuted },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs },
  field: { gap: space.xs },
  input: {
    minHeight: sizes.input,
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingHorizontal: space.lg,
    fontSize: 15,
    color: palette.text,
  },
  inputError: { borderColor: palette.error },
  multiline: { minHeight: 90, paddingTop: space.md, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.surface },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  feedback: { gap: space.xs, padding: space.md, borderRadius: radii.md, backgroundColor: palette.warningSoft },
  summary: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radii.lg, backgroundColor: palette.surface },
  summaryImage: { width: 96, height: 96, borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  similar: { gap: space.sm, padding: space.md, borderRadius: radii.md, backgroundColor: palette.warningSoft },
  blocked: { backgroundColor: palette.errorSoft },
  ack: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, paddingTop: space.xs },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: palette.primary },
  done: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
});

export default ProductSubmissionFormScreen;
