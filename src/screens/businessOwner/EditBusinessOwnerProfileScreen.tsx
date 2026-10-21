import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function EditBusinessOwnerProfileScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Edit Business Owner Profile" {...props} />;
}
