import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function BusinessOwnerApplicationScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Business Owner Application" {...props} />;
}
