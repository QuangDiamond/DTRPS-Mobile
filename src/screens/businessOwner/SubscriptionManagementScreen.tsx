import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function SubscriptionManagementScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Subscription Management" {...props} />;
}
