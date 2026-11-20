import type { IconName } from '../../constants/places';
import type { ReferenceItem } from '../../services/referenceApi';

/**
 * Port của DTRPS-Web/src/client/traveller/data/preferenceOptions.ts — icon tra theo mã thật lấy
 * từ GET /api/reference/special-needs (UC-006), không phải danh sách tự tạo.
 */

export interface IconOption {
  id: string;
  label: string;
  icon: IconName;
  note?: string;
}

const SPECIAL_NEED_ICONS: Record<string, IconName> = {
  vegetarian: 'leaf',
  kids: 'human-child',
  elderly: 'human-cane',
  pets: 'paw',
  disability: 'wheelchair-accessibility',
  largeGroup: 'account-group-outline',
  limitedMobility: 'walk',
  quietSpace: 'meditation',
};
const DEFAULT_SPECIAL_NEED_ICON: IconName = 'information-outline';

export const toSpecialNeedOptions = (items: ReferenceItem[]): IconOption[] =>
  items.map((item) => ({
    id: item.code,
    label: item.name,
    icon: SPECIAL_NEED_ICONS[item.code] ?? DEFAULT_SPECIAL_NEED_ICON,
  }));
