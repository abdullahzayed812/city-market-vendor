import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrders } from './useOrders';
import { orderFilterOf, type OrderFilter } from '../features/orderStatus';

export const useOrdersLogic = (filter: OrderFilter) => {
  const { t } = useTranslation();
  const { orders, ...query } = useOrders();

  const counts = useMemo(() => {
    const c: Record<OrderFilter, number> = { action: 0, active: 0, done: 0, all: orders.length };
    orders.forEach(o => { c[orderFilterOf(o.status)] += 1; });
    return c;
  }, [orders]);

  const visibleOrders = useMemo(
    () => (filter === 'all' ? orders : orders.filter(o => orderFilterOf(o.status) === filter)),
    [orders, filter],
  );

  return { t, orders: visibleOrders, counts, ...query };
};
