import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function FeedbackDetailsScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Feedback Details" {...props} />;
}
