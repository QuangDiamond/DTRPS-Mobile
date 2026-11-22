import { clientRequest } from './http';
import type { CategoryGroup, ReferenceItem } from './types';

export const referenceApi = {
  provinces: () => clientRequest<ReferenceItem[]>('/reference/provinces', { auth: false }),
  categories: () => clientRequest<CategoryGroup[]>('/reference/categories', { auth: false }),
  interests: () => clientRequest<ReferenceItem[]>('/reference/interests'),
  specialNeeds: () => clientRequest<ReferenceItem[]>('/reference/special-needs'),
};
