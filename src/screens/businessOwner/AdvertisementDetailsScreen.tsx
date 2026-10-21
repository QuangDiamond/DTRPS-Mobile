import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function AdvertisementDetailsScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Advertisement Details / Approval Status" {...props} />;
}
