import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function MyBusinessLocationScreen(props: OwnerScreenProps) {
  return <OwnerPage route="My Business Location" {...props} />;
}
