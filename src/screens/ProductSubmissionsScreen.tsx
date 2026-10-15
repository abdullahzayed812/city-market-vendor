import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import {
  AppText as Text,
  Chip,
  IconButton,
  StatusBadge,
  EmptyState,
  LoadingState,
  palette,
  radii,
  space,
  elevation,
  type Tone,
} from '@city-market/mobile-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { PackagePlus, ClipboardList } from 'lucide-react-native';
import { EventType, type ProductSubmission, type ProductSubmissionStatusValue } from '@city-market/shared';
import CustomHeader from '../components/common/CustomHeader';
import QueryError from '../components/common/QueryError';
import ImageWithPlaceholder from '../components/common/ImageWithPlaceholder';
import { useSocket } from '../app/SocketContext';
import { ProductSubmissionService } from '../services/api/productSubmissionService';

const PAGE_SIZE = 20;
const FILTERS: Array<'ALL' | ProductSubmissionStatusValue> = ['ALL', 'PENDING_REVIEW', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED', 'CANCELLED'];

export const SUBMISSION_TONE: Record<ProductSubmissionStatusValue, Tone> = {
  PENDING_REVIEW: 'info',
  NEEDS_CHANGES: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'neutral',
};

// Refetch proposals when an admin decision is pushed to this merchant
export const useSubmissionLiveUpdates = () => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    const onReviewed = (payload: { submissionId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['productSubmissions'] });
      if (payload?.submissionId) queryClient.invalidateQueries({ queryKey: ['productSubmission', payload.submissionId] });
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
    };
    socket.on(EventType.PRODUCT_SUBMISSION_REVIEWED, onReviewed);
    return () => {
      socket.off(EventType.PRODUCT_SUBMISSION_REVIEWED, onReviewed);
    };
  }, [socket, queryClient]);
};

const Row = React.memo(({ item, onPress }: { item: ProductSubmission; onPress: () => void }) => {
  const { t, i18n } = useTranslation();
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button" accessibilityLabel={item.name}>
      <ImageWithPlaceholder uri={item.imageUrl || null} style={styles.thumb} />
      <View style={styles.rowBody}>
        <Text variant="bodyStrong" color={palette.text} numberOfLines={2}>
          {item.name}
        </Text>
        <Text variant="caption" color={palette.textMuted} numberOfLines={1}>
          {item.globalCategoryName ?? '—'} · {new Date(item.submittedAt).toLocaleDateString(i18n.language)}
        </Text>
        <StatusBadge size="sm" tone={SUBMISSION_TONE[item.status]} label={t(`product_submissions.status.${item.status}`)} style={styles.badge} />
        {item.status === 'NEEDS_CHANGES' && item.reviewNote ? (
          <Text variant="caption" color={palette.warning} numberOfLines={2}>
            {item.reviewNote}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

const ProductSubmissionsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  useSubmissionLiveUpdates();

  const { data, isLoading, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['productSubmissions', filter],
    queryFn: ({ pageParam }) => ProductSubmissionService.list({ status: filter === 'ALL' ? undefined : filter, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: last => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
  const items = data?.pages.flatMap(p => p.data) ?? [];

  const propose = () => navigation.navigate('ProductSubmissionForm');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title={t('product_submissions.title')}
        showBack
        rightComponent={<IconButton icon={PackagePlus} variant="primary" onPress={propose} accessibilityLabel={t('product_submissions.propose_new')} size={40} />}
      />
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map(f => (
            <Chip key={f} label={f === 'ALL' ? t('common.all') : t(`product_submissions.status.${f}`)} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>
      {isLoading ? (
        <LoadingState />
      ) : error && items.length === 0 ? (
        <QueryError error={error} onRetry={refetch} retrying={isRefetching} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={s => s.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.primary} colors={[palette.primary]} />}
          renderItem={({ item }) => <Row item={item} onPress={() => navigation.navigate('ProductSubmissionDetail', { id: item.id })} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={palette.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardList}
              title={t('product_submissions.empty')}
              message={t('product_submissions.subtitle')}
              actionLabel={t('product_submissions.propose_new')}
              onAction={propose}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  filtersBar: { backgroundColor: palette.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  filters: { paddingHorizontal: space.lg, paddingVertical: space.sm, gap: space.sm },
  list: { padding: space.lg, gap: space.md, flexGrow: 1 },
  row: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radii.lg, backgroundColor: palette.surface, ...elevation.card },
  pressed: { opacity: 0.85 },
  thumb: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  rowBody: { flex: 1, gap: space.xs },
  badge: { alignSelf: 'flex-start' },
  footer: { paddingVertical: space.lg },
});

export default ProductSubmissionsScreen;
