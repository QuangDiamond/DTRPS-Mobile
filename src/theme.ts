/** Màu chủ đạo của app du khách — trùng với khu client của web (--color-client-*) */
export const colors = {
  primary: '#0891B2',
  primaryStrong: '#0E7490',
  primarySoft: '#ECFEFF',
  pale: '#CFFAFE',
  bg: '#F5FDFE',
  ink: '#0F2A3B',
  muted: '#557080',
  line: '#DCECF0',
  field: '#F3FBFC',
  white: '#FFFFFF',
  gold: '#D79B00',
  goldSoft: '#FFF6E0',
  danger: '#D83A48',
  dangerSoft: '#FDEEEF',
  success: '#13936B',
  successSoft: '#E6F7F0',
  warning: '#B45309',
  warningSoft: '#FFF7E6',
  verified: '#1F5FBF',
  verifiedSoft: '#E8F1FF',
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F2A3B',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F2A3B',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;
