import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function BecomeBusinessOwnerScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Become Business Owner" {...props} />;
}
