import React from 'react';
import { OwnerPage } from './OwnerPage';
import type { OwnerScreenProps } from './types';

export default function ManageServiceTagsScreen(props: OwnerScreenProps) {
  return <OwnerPage route="Manage Service Tags" {...props} />;
}
