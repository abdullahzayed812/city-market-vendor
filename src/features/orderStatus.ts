import {
  CircleCheck,
  CircleX,
  Clock,
  CookingPot,
  FileQuestion,
  Hourglass,
  PackageCheck,
  Truck,
  Bike,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react-native';
import type { Tone } from '@city-market/mobile-ui';
import { VendorOrderStatus } from '@city-market/shared';

/** Badge tone and icon per vendor-order status (status is never shown by color alone). */
export const vendorOrderStatusMeta = (status: string | undefined | null): { tone: Tone; icon: LucideIcon } => {
  switch (status) {
    case VendorOrderStatus.PENDING:
      return { tone: 'warning', icon: Hourglass };
    case VendorOrderStatus.PROPOSAL_SENT:
      return { tone: 'info', icon: FileQuestion };
    case VendorOrderStatus.CONFIRMED:
      return { tone: 'brand', icon: BadgeCheck };
    case VendorOrderStatus.PREPARING:
      return { tone: 'brand', icon: CookingPot };
    case 'READY':
      return { tone: 'brand', icon: PackageCheck };
    case VendorOrderStatus.PICKED_UP:
      return { tone: 'neutral', icon: Bike };
    case VendorOrderStatus.ON_THE_WAY:
      return { tone: 'neutral', icon: Truck };
    case VendorOrderStatus.DELIVERED:
      return { tone: 'success', icon: CircleCheck };
    case VendorOrderStatus.CANCELLED:
      return { tone: 'error', icon: CircleX };
    default:
      return { tone: 'neutral', icon: Clock };
  }
};

export type OrderFilter = 'action' | 'active' | 'done' | 'all';

/** Which list filter a status belongs to. */
export const orderFilterOf = (status: string): Exclude<OrderFilter, 'all'> => {
  if (status === VendorOrderStatus.PENDING) return 'action';
  if (status === VendorOrderStatus.DELIVERED || status === VendorOrderStatus.CANCELLED) return 'done';
  return 'active';
};

/** i18n key for a vendor-order status label. */
export const vendorOrderStatusKey = (status: string | undefined | null): string =>
  status ? `orders.status_${status.toLowerCase()}` : 'orders.status';
