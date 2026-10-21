import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function ReviewManagementScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Review Management" {...props} />;
}
