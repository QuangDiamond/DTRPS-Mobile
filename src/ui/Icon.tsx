import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { colors } from '../theme';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

/** Icon Material (cùng bộ icon với web, tên dùng gạch ngang: auto-awesome, location-on…) */
export function Icon({
  name,
  size = 20,
  color = colors.ink,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}
