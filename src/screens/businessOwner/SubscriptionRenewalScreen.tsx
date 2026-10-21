import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function SubscriptionRenewalScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Subscription Renewal / Payment" {...props} />;
}
