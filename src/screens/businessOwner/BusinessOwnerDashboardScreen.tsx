import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function BusinessOwnerDashboardScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Dashboard" {...props} />;
}
