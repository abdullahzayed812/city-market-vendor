import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrderDetails } from './useOrderDetails';
import {
  VendorOrderStatus,
  ProposalType,
  ProposeChangesDto,
} from '@city-market/shared';

export const useOrderDetailsLogic = (orderId: string) => {
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

  const [isProposalModalVisible, setIsProposalModalVisible] = useState(false);
  const [proposalData, setProposalData] = useState<
    Record<
      string,
      { isUnavailable: boolean; newQuantity?: number; newWeightKg?: string }
    >
  >({});

  useEffect(() => {
    if (order && isProposalModalVisible) {
      const initialData: typeof proposalData = {};
      order.items.forEach((item: any) => {
        initialData[item.id] = {
          isUnavailable: false,
          newQuantity: item.quantity,
          newWeightKg: item.requestedWeightGrams
            ? (
                (item.actualWeightGrams || item.requestedWeightGrams) / 1000
              ).toString()
            : undefined,
        };
      });
      setProposalData(initialData);
    }
  }, [order, isProposalModalVisible]);

  const handleUpdateProposal = useCallback((itemId: string, updates: any) => {
    setProposalData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...updates },
    }));
  }, []);

  const submitProposals = useCallback(() => {
    const proposals: ProposeChangesDto[] = [];

    order?.items.forEach((item: any) => {
      const data = proposalData[item.id];
      if (!data) return;

      if (data.isUnavailable) {
        proposals.push({
          itemId: item.id,
          type: ProposalType.UNAVAILABLE,
        });
      } else if (item.quantity && data.newQuantity) {
        if (data.newQuantity < item.quantity) {
          proposals.push({
            itemId: item.id,
            type: ProposalType.QUANTITY_REDUCTION,
            proposedQuantity: data.newQuantity,
          });
        }
      } else if (item.requestedWeightGrams && data.newWeightKg) {
        const newWeightGrams = Math.round(parseFloat(data.newWeightKg) * 1000);
        if (
          newWeightGrams !==
          (item.actualWeightGrams || item.requestedWeightGrams)
        ) {
          proposals.push({
            itemId: item.id,
            type: ProposalType.WEIGHT_ADJUSTMENT,
            proposedWeightGrams: newWeightGrams,
            requestedWeightGrams: item.requestedWeightGrams,
          });
        }
      }
    });

    if (proposals.length > 0) {
      proposeChanges(proposals, {
        onSuccess: () => setIsProposalModalVisible(false),
      });
    } else {
      setIsProposalModalVisible(false);
    }
  }, [order, proposalData, proposeChanges]);

  const canAccept = order?.status === VendorOrderStatus.PENDING;
  const isPreparing = order?.status === VendorOrderStatus.PREPARING;
  const isProcessing = isAccepting || isProposing || isUpdatingStatus;

  return {
    t,
    order,
    isLoading,
    acceptOrder,
    updateStatus,
    isProposalModalVisible,
    setIsProposalModalVisible,
    proposalData,
    handleUpdateProposal,
    submitProposals,
    canAccept,
    isPreparing,
    isProcessing,
    isUpdatingStatus,
  };
};
