import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEarnings } from '../hooks/useEarnings';

const EarningsScreen = () => {
    const { t } = useTranslation();
    const { pendingData, settlements, isLoading, isRefetching, refetch } = useEarnings();

    if (isLoading && !isRefetching) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>{t("financial.earnings_and_settlements")}</Text>
                <Text style={styles.subtitle}>{t("financial.track_payouts_subtitle")}</Text>
            </View>

            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
                    <Text style={styles.statLabel}>{t("financial.unsettled_orders")}</Text>
                    <Text style={styles.statValue}>{pendingData?.unsettledOrders || 0}</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#10B981', backgroundColor: '#ECFDF5' }]}>
                    <Text style={styles.statLabel}>{t("financial.net_payout")}</Text>
                    <Text style={styles.statValue}>{t("common.currency")} {pendingData?.netPayout?.toLocaleString() || 0}</Text>
                </View>
            </View>

            <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>{t("financial.settlement_history")}</Text>
                {settlements.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{t("financial.no_settlement_history")}</Text>
                    </View>
                ) : (
                    settlements.map((item: any) => (
                        <View key={item.id} style={styles.settlementItem}>
                            <View style={styles.settlementHeader}>
                                <Text style={styles.settlementId}>#{item.id.split('-')[0]}</Text>
                                <View style={[styles.statusBadge, item.status === 'PAID' ? styles.statusPaid : styles.statusPending]}>
                                    <Text style={[styles.statusText, item.status === 'PAID' ? styles.statusTextPaid : styles.statusTextPending]}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.settlementPeriod}>
                                {new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}
                            </Text>
                            <View style={styles.settlementFooter}>
                                <Text style={styles.orderCount}>{t("financial.orders_count", { count: item.orderCount })}</Text>
                                <Text style={styles.payoutAmount}>{t("common.currency")} {item.netPayout.toLocaleString()}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    statsGrid: { padding: 20, flexDirection: 'row', gap: 12 },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    historySection: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
    settlementItem: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    settlementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    settlementId: { fontSize: 12, color: '#9CA3AF' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusPaid: { backgroundColor: '#D1FAE5' },
    statusPending: { backgroundColor: '#FEF3C7' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    statusTextPaid: { color: '#065F46' },
    statusTextPending: { color: '#92400E' },
    settlementPeriod: { fontSize: 14, color: '#374151', marginBottom: 12 },
    settlementFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    orderCount: { fontSize: 13, color: '#6B7280' },
    payoutAmount: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9CA3AF', fontSize: 14 }
});

export default EarningsScreen;
