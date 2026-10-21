import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function ReviewDetailsScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Review Details" {...props} />;
}
