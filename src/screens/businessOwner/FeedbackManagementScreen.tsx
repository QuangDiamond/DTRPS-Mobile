import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function FeedbackManagementScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Feedback Management" {...props} />;
}
