import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { theme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '../components/common/CustomHeader';
import { Star, MessageSquare } from 'lucide-react-native';
import { useReviews } from '../hooks/useReviews';

const ReviewSummary = React.memo(({ summary, t }: any) => (
  <View style={styles.summaryContainer}>
    <View style={styles.summaryCard}>
      <Star size={24} color={theme.colors.warning} fill={theme.colors.warning} />
      <Text style={styles.averageRating}>{summary.averageRating.toFixed(1)}</Text>
      <Text style={styles.totalRatings}>{summary.totalRatings} {t('reviews.total_reviews')}</Text>
    </View>
  </View>
));

const ReviewItem = React.memo(({ item, t }: any) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <View style={styles.starContainer}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            color={i < item.stars ? theme.colors.warning : theme.colors.textMuted}
            fill={i < item.stars ? theme.colors.warning : 'transparent'}
          />
        ))}
      </View>
      <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
    <Text style={styles.reviewComment}>{item.comment || t('reviews.no_comment')}</Text>
    <Text style={styles.orderId}>{t('orders.order_id')}: #{item.orderId.slice(-8).toUpperCase()}</Text>
  </View>
));

const ReviewsScreen = () => {
  const { t, loading, summary, reviews } = useReviews();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CustomHeader title={t('reviews.title')} showBack={true} />
      
      <FlatList
        data={reviews}
        renderItem={({ item }) => <ReviewItem item={item} t={t} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<ReviewSummary summary={summary} t={t} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MessageSquare size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>{t('reviews.no_reviews')}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryContainer: { padding: 20 },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  averageRating: { fontSize: 36, fontWeight: '900', color: theme.colors.secondary, marginVertical: 8 },
  totalRatings: { fontSize: 14, color: theme.colors.textLight },
  listContent: { paddingBottom: 20 },
  reviewCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    ...theme.shadows.card,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  starContainer: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 12, color: theme.colors.textMuted },
  reviewComment: { fontSize: 15, color: theme.colors.secondary, lineHeight: 22 },
  orderId: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textMuted, marginTop: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: theme.colors.textMuted, fontSize: 16 },
});

export default ReviewsScreen;
