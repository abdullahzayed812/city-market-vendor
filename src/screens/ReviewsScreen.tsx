import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  AppText as Text,
  Card,
  EmptyState,
  LoadingState,
  palette,
  space,
  shortId,
} from '@city-market/mobile-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, MessageSquare } from 'lucide-react-native';
import type { TFunction } from 'i18next';
import CustomHeader from '../components/common/CustomHeader';
import QueryError from '../components/common/QueryError';
import { useReviews } from '../hooks/useReviews';

const Stars = ({ value, size }: { value: number; size: number }) => (
  <View style={styles.stars} accessibilityLabel={`${value}/5`}>
    {[0, 1, 2, 3, 4].map(i => (
      <Star
        key={i}
        size={size}
        color={i < Math.round(value) ? palette.accent : palette.borderStrong}
        fill={i < Math.round(value) ? palette.accent : 'transparent'}
      />
    ))}
  </View>
);

const ReviewSummary = ({ summary, t }: { summary: { averageRating: number; totalRatings: number }; t: TFunction }) => (
  <Card style={styles.summary}>
    <Text variant="display" color={palette.text} style={styles.tabular}>
      {summary.totalRatings > 0 ? summary.averageRating.toFixed(1) : '—'}
    </Text>
    <View style={styles.summaryText}>
      <Stars value={summary.averageRating} size={20} />
      <Text variant="caption" color={palette.textMuted}>
        {t('reviews.total_reviews')}: {summary.totalRatings}
      </Text>
    </View>
  </Card>
);

const ReviewItem = React.memo(({ item, t }: { item: any; t: TFunction }) => (
  <Card style={styles.review}>
    <View style={styles.reviewHead}>
      <Stars value={item.stars} size={16} />
      <Text variant="caption" color={palette.textMuted}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
    {item.comment ? (
      <Text variant="body" color={palette.text}>{item.comment}</Text>
    ) : (
      <Text variant="body" color={palette.textMuted}>{t('reviews.no_comment')}</Text>
    )}
    <Text variant="caption" color={palette.textMuted}>
      {t('orders.order_id')} {shortId(item.orderId)}
    </Text>
  </Card>
));

const ReviewsScreen = () => {
  const { t, loading, refreshing, error, summary, reviews, refresh } = useReviews();
  const header = <CustomHeader title={t('reviews.title')} showBack />;

  let body: React.ReactNode;
  if (loading) {
    body = <LoadingState />;
  } else if (error && reviews.length === 0) {
    body = <QueryError error={error} onRetry={refresh} retrying={refreshing} />;
  } else {
    body = (
      <FlatList
        data={reviews}
        renderItem={({ item }) => <ReviewItem item={item} t={t} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.primary} colors={[palette.primary]} />
        }
        ListHeaderComponent={<ReviewSummary summary={summary} t={t} />}
        ListEmptyComponent={<EmptyState icon={MessageSquare} title={t('reviews.no_reviews')} compact />}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {header}
      {body}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  list: { padding: space.lg, gap: space.md, flexGrow: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  stars: { flexDirection: 'row', gap: 2 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  summaryText: { flex: 1, gap: space.xs },
  review: { gap: space.sm },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

export default ReviewsScreen;
