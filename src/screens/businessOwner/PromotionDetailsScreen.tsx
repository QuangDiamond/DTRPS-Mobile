import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function PromotionDetailsScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Promotion Details" {...props} />;
}
