import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function PricePromotionManagementScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Price / Promotion Management" {...props} />;
}
