import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function ApplicationStatusScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Application Status" {...props} />;
}
