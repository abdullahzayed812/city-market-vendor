import React from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, RefreshControl } from 'react-native';
import { AppText as Text, Button, StatusBadge, LoadingState, palette, radii, space } from '@city-market/mobile-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Pencil, Undo2, Tag, ImageOff } from 'lucide-react-native';
import CustomHeader from '../components/common/CustomHeader';
import QueryError from '../components/common/QueryError';
import { ProductSubmissionService, submissionErrorKey } from '../services/api/productSubmissionService';
import { SUBMISSION_TONE, useSubmissionLiveUpdates } from './ProductSubmissionsScreen';

const ProductSubmissionDetailScreen = ({ navigation, route }: any) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const id: string = route.params.id;
  useSubmissionLiveUpdates();

  const { data: s, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['productSubmission', id],
    queryFn: () => ProductSubmissionService.get(id),
  });

  const withdraw = useMutation({
    mutationFn: () => ProductSubmissionService.cancel(id),
    onSuccess: updated => {
      queryClient.setQueryData(['productSubmission', id], updated);
      queryClient.invalidateQueries({ queryKey: ['productSubmissions'] });
      Toast.show({ type: 'success', text1: t('product_submissions.withdrawn') });
    },
    onError: err => Toast.show({ type: 'error', text1: t(submissionErrorKey(err), { defaultValue: t('product_submissions.errors.generic') }) }),
  });

  const confirmWithdraw = () =>
    Alert.alert(t('product_submissions.withdraw'), t('product_submissions.confirm_withdraw'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('product_submissions.withdraw'), style: 'destructive', onPress: () => withdraw.mutate() },
    ]);

  if (isLoading) return <LoadingState />;
  if (error || !s) return <QueryError error={error} onRetry={refetch} retrying={isRefetching} />;

  const open = s.status === 'PENDING_REVIEW' || s.status === 'NEEDS_CHANGES';
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString(i18n.language) : '—');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader title={t('product_submissions.detail_title')} showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.primary} colors={[palette.primary]} />}
      >
        {s.imageUrl ? (
          <Image source={{ uri: s.imageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <ImageOff size={28} color={palette.textMuted} />
          </View>
        )}
        <View style={styles.gap}>
          <Text variant="title" color={palette.text}>
            {s.name}
          </Text>
          <StatusBadge tone={SUBMISSION_TONE[s.status]} label={t(`product_submissions.status.${s.status}`)} style={styles.badge} />
          <Text variant="body" color={palette.textSecondary}>
            {t(`product_submissions.status_help.${s.status}`)}
          </Text>
        </View>

        {s.reviewNote && s.status !== 'APPROVED' ? (
          <View style={[styles.note, s.status === 'REJECTED' ? styles.noteError : styles.noteWarning]}>
            <Text variant="label" color={s.status === 'REJECTED' ? palette.error : palette.warning}>
              {t(s.status === 'REJECTED' ? 'product_submissions.rejection_reason' : 'product_submissions.admin_feedback')}
            </Text>
            <Text variant="body" color={palette.text}>
              {s.reviewNote}
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {[
            [t('product_submissions.category'), s.globalCategoryName ?? '—'],
            [
              t('product_submissions.sold_by'),
              s.measurementType === 'WEIGHT'
                ? `${t('product_submissions.by_weight')} (${t(`product_submissions.unit_${(s.weightUnit ?? 'KG').toLowerCase()}`)})`
                : t('product_submissions.by_unit'),
            ],
            [t('product_submissions.description'), s.description || '—'],
            [t('product_submissions.submitted_at'), fmt(s.submittedAt)],
          ].map(([label, value]) => (
            <View key={label} style={styles.kv}>
              <Text variant="caption" color={palette.textMuted}>
                {label}
              </Text>
              <Text variant="body" color={palette.text}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        {s.history && s.history.length > 0 ? (
          <View style={styles.card}>
            <Text variant="label" color={palette.text}>
              {t('product_submissions.history')}
            </Text>
            {s.history.map(h => (
              <View key={h.id} style={styles.historyRow}>
                <Text variant="bodyStrong" color={palette.text}>
                  {t(`product_submissions.action.${h.action}`)}
                </Text>
                <Text variant="caption" color={palette.textMuted}>
                  {fmt(h.createdAt)}
                </Text>
                {h.note ? (
                  <Text variant="caption" color={palette.textSecondary}>
                    {h.note}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {s.status === 'APPROVED' && s.vendorProductId ? (
          <Button
            label={t('product_submissions.set_price_stock')}
            icon={Tag}
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('ProductsList', { editProductId: s.vendorProductId })}
          />
        ) : null}
        {open ? (
          <>
            <Button
              label={t(s.status === 'NEEDS_CHANGES' ? 'product_submissions.edit_and_resubmit' : 'product_submissions.edit_proposal')}
              icon={Pencil}
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('ProductSubmissionForm', { submission: s })}
            />
            <Button label={t('product_submissions.withdraw')} icon={Undo2} variant="dangerOutline" fullWidth loading={withdraw.isPending} onPress={confirmWithdraw} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.huge },
  image: { width: '100%', height: 240, borderRadius: radii.lg, backgroundColor: palette.surface },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  gap: { gap: space.sm },
  badge: { alignSelf: 'flex-start' },
  note: { gap: space.xs, padding: space.md, borderRadius: radii.md },
  noteWarning: { backgroundColor: palette.warningSoft },
  noteError: { backgroundColor: palette.errorSoft },
  card: { gap: space.md, padding: space.md, borderRadius: radii.lg, backgroundColor: palette.surface },
  kv: { gap: 2 },
  historyRow: { gap: 2, paddingBottom: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
});

export default ProductSubmissionDetailScreen;
