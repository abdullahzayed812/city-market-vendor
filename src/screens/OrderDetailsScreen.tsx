import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, AlertCircle, Minus, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderDetails } from '../hooks/useOrderDetails';
import { theme } from '../theme';
import {
  VendorOrderStatus,
  ProposalType,
  ProposeChangesDto,
} from '@city-market/shared';
import CustomHeader from '../components/common/CustomHeader';

const OrderDetailsScreen = ({ route }: any) => {
  const { orderId } = route.params;
  const { t } = useTranslation();

  const {
    order,
    isLoading,
    acceptOrder,
    proposeChanges,
    updateStatus,
    isAccepting,
    isProposing,
    isUpdatingStatus,
  } = useOrderDetails(orderId);

  const [localProposals, setLocalProposals] = useState<
    Record<string, { type: ProposalType; quantity?: number }>
  >({});

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const handleProposeQuantity = (
    itemId: string,
    currentQty: number,
    change: number,
  ) => {
    const existing = localProposals[itemId];
    const newQty = Math.max(0, (existing?.quantity ?? currentQty) + change);

    if (newQty === currentQty) {
      const next = { ...localProposals };
      delete next[itemId];
      setLocalProposals(next);
    } else {
      setLocalProposals({
        ...localProposals,
        [itemId]: {
          type:
            newQty === 0
              ? ProposalType.UNAVAILABLE
              : ProposalType.QUANTITY_REDUCTION,
          quantity: newQty,
        },
      });
    }
  };

  const submitAllProposals = () => {
    const proposals: ProposeChangesDto[] = Object.entries(localProposals).map(
      ([itemId, p]) => ({
        itemId,
        type: p.type,
        proposedQuantity: p.quantity,
      }),
    );
    // console.log(proposals);
    proposeChanges(proposals, {
      onSuccess: () => setLocalProposals({}),
    });
  };

  const canAccept = order?.status === VendorOrderStatus.PENDING;
  const isProcessing = isAccepting || isProposing || isUpdatingStatus;

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title={t('orders.details')} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{t('orders.status')}</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
          >
            <Text style={styles.badgeText}>
              {t(`orders.status_${order?.status.toLowerCase()}`)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('orders.order_items')}</Text>
        {order?.items.map((item: any) => {
          const proposal = localProposals[item.id];
          const isUnavailable = proposal?.type === ProposalType.UNAVAILABLE;

          return (
            <View
              key={item.id}
              style={[styles.itemCard, isUnavailable && styles.unavailableItem]}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemPrice}>
                  ${item.unitPrice.toFixed(2)}
                </Text>
              </View>

              <View style={styles.itemActions}>
                <View style={styles.quantityContainer}>
                  <Text style={styles.qtyLabel}>{t('products.quantity')}:</Text>
                  {order?.status === VendorOrderStatus.PENDING ? (
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        onPress={() =>
                          handleProposeQuantity(item.id, item.quantity, -1)
                        }
                        style={styles.qtyBtn}
                      >
                        <Minus size={16} color={theme.colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>
                        {proposal?.quantity ?? item.quantity}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          handleProposeQuantity(item.id, item.quantity, 1)
                        }
                        style={styles.qtyBtn}
                        disabled={
                          (proposal?.quantity ?? item.quantity) >= item.quantity
                        }
                      >
                        <Plus
                          size={16}
                          color={
                            (proposal?.quantity ?? item.quantity) >=
                            item.quantity
                              ? theme.colors.border
                              : theme.colors.primary
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                  )}
                </View>

                {proposal && (
                  <View style={styles.proposalBadge}>
                    <AlertCircle size={14} color={theme.colors.warning} />
                    <Text style={styles.proposalText}>{t('orders.proposed')}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footerActions}>
        {Object.keys(localProposals).length > 0 ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.warning },
            ]}
            onPress={submitAllProposals}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              {t('orders.submit_proposals')}
            </Text>
          </TouchableOpacity>
        ) : canAccept ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => acceptOrder()}
            disabled={isProcessing}
          >
            <Check
              color={theme.colors.white}
              size={20}
              style={{ marginEnd: 8 }}
            />
            <Text style={styles.buttonText}>{t('orders.accept_order')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: theme.spacing.lg },
  statusCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: { color: theme.colors.textMuted, fontWeight: '600' },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  badgeText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 15,
  },
  itemCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  unavailableItem: { opacity: 0.6, backgroundColor: '#fdf2f2' },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    flex: 1,
  },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: theme.colors.success },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  qtyLabel: { color: theme.colors.textMuted, marginEnd: 10 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    width: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  proposalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '15',
    padding: 6,
    borderRadius: 6,
  },
  proposalText: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: 'bold',
    marginStart: 4,
  },
  footerActions: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.medium,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: theme.colors.white, fontSize: 16, fontWeight: 'bold' },
});

export default OrderDetailsScreen;
