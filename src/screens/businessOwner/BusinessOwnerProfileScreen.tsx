import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function BusinessOwnerProfileScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Business Owner Profile" {...props} />;
}
