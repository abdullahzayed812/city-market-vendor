import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, AlertCircle, Minus, Plus, Scale, X } from 'lucide-react-native';
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
    isAccepting,
    isProposing,
    isUpdatingStatus,
  } = useOrderDetails(orderId);

  const [localProposals, setLocalProposals] = useState<
    Record<string, { type: ProposalType; quantity?: number }>
  >({});

  const [isWeightModalVisible, setIsWeightModalOpen] = useState(false);
  const [actualWeights, setActualWeights] = useState<Record<string, string>>(
    {},
  );

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
    proposeChanges(proposals, {
      onSuccess: () => setLocalProposals({}),
    });
  };

  const openWeightAdjustment = () => {
    const initialWeights: Record<string, string> = {};
    order?.items.forEach((item: any) => {
      if (item.requestedWeightGrams) {
        initialWeights[item.id] = (
          item.actualWeightGrams || item.requestedWeightGrams
        ).toString();
      }
    });
    setActualWeights(initialWeights);
    setIsWeightModalOpen(true);
  };

  const submitWeightAdjustments = () => {
    const proposals: ProposeChangesDto[] = Object.entries(actualWeights).map(
      ([itemId, weightGrams]) => {
        const item = order?.items.find((i: any) => i.id === itemId);
        return {
          itemId,
          type: ProposalType.WEIGHT_ADJUSTMENT,
          proposedWeightGrams: parseInt(weightGrams),
          requestedWeightGrams: item?.requestedWeightGrams,
        };
      },
    );

    proposeChanges(proposals, {
      onSuccess: () => setIsWeightModalOpen(false),
    });
  };

  const canAccept = order?.status === VendorOrderStatus.PENDING;
  const isPreparing = order?.status === VendorOrderStatus.PREPARING;
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
                  {item.quantity !== undefined ? (
                    <>
                      <Text style={styles.qtyLabel}>
                        {t('products.quantity')}:
                      </Text>
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
                              (proposal?.quantity ?? item.quantity) >=
                              item.quantity
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
                    </>
                  ) : (
                    <>
                      <Text style={styles.qtyLabel}>{t('orders.weight')}:</Text>
                      <Text style={styles.qtyValue}>
                        ≈ {(item.requestedWeightGrams / 1000).toFixed(2)} kg
                        {item.actualWeightGrams
                          ? ` (Act: ${(item.actualWeightGrams / 1000).toFixed(
                              2,
                            )} kg)`
                          : ''}
                      </Text>
                    </>
                  )}
                </View>

                {proposal && (
                  <View style={styles.proposalBadge}>
                    <AlertCircle size={14} color={theme.colors.warning} />
                    <Text style={styles.proposalText}>
                      {t('orders.proposed')}
                    </Text>
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
        ) : isPreparing &&
          order?.items.some((i: any) => i.requestedWeightGrams) ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.secondary },
            ]}
            onPress={openWeightAdjustment}
            disabled={isProcessing}
          >
            <Scale
              color={theme.colors.white}
              size={20}
              style={{ marginEnd: 8 }}
            />
            <Text style={styles.buttonText}>
              {t('orders.adjust_weight') || 'Adjust Weight'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Weight Adjustment Modal */}
      <Modal
        visible={isWeightModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsWeightModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('orders.weight_adjustment') || 'Weight Adjustment'}
              </Text>
              <TouchableOpacity onPress={() => setIsWeightModalOpen(false)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {order?.items
                .filter((i: any) => i.requestedWeightGrams)
                .map((item: any) => (
                  <View key={item.id} style={styles.weightInputRow}>
                    <Text style={styles.weightItemName}>
                      {item.productName}
                    </Text>
                    <View style={styles.weightInputContainer}>
                      <TextInput
                        style={styles.weightInput}
                        keyboardType="numeric"
                        value={(
                          (parseFloat(actualWeights[item.id]) || 0) / 1000
                        ).toString()}
                        onChangeText={text => {
                          const grams = Math.round(parseFloat(text) * 1000);
                          setActualWeights({
                            ...actualWeights,
                            [item.id]: grams.toString(),
                          });
                        }}
                      />
                      <Text style={styles.weightUnit}>kg</Text>
                    </View>
                    <Text style={styles.reqWeightHint}>
                      Req: ≈ {(item.requestedWeightGrams / 1000).toFixed(2)} kg
                    </Text>
                  </View>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={submitWeightAdjustments}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.modalSubmitText}>
                  {t('orders.send_weight_proposal') || 'Send Proposal'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  qtyLabel: { fontSize: 13, color: theme.colors.textMuted, marginEnd: 8 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: 2,
  },
  qtyBtn: { padding: 6 },
  qtyValue: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  proposalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  proposalText: {
    fontSize: 11,
    color: theme.colors.warning,
    fontWeight: '600',
    marginStart: 4,
  },
  footerActions: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
  },
  buttonText: { color: theme.colors.white, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalBody: {
    marginBottom: 20,
  },
  weightInputRow: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  weightItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    fontSize: 16,
  },
  weightUnit: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  reqWeightHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  modalSubmitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OrderDetailsScreen;
