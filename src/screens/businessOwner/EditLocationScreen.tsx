import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function EditLocationScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Edit Location" {...props} />;
}
