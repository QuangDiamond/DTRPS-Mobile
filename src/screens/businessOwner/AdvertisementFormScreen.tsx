import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function AdvertisementFormScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Create / Edit Advertisement" {...props} />;
}
