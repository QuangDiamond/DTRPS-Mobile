import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function LocationChangeRequestDetailsScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Location Change Request Details" {...props} />;
}
