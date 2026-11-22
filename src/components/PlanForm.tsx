import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text, TextInput } from '../ui/Typography';
import type { ReferenceItem } from '../api/types';
import { PACE_OPTIONS, type PaceId } from '../data/planTrip';
import { colors, shadow } from '../theme';
import { Sheet } from '../ui/Bits';
import { Icon, type IconName } from '../ui/Icon';
import { fold, formatNumber } from '../utils/format';

/** Khối có icon + tiêu đề (giống SectionCard của web) */
export function SectionCard({
  icon,
  title,
  subtitle,
  right,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={shadow.card} className="mb-3.5 rounded-[20px] bg-white p-4">
      <View className="mb-3 flex-row items-center">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#ECFEFF]">
          <Icon name={icon} size={19} color={colors.primary} />
        </View>
        <View className="ml-2.5 min-w-0 flex-1">
          <Text className="text-[14px] font-extrabold text-[#13364A]">{title}</Text>
          {subtitle ? <Text className="text-[11.5px] text-[#72818C]">{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  label,
  suffix,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  suffix?: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        accessibilityLabel={`Giảm ${label}`}
        style={{ opacity: value <= min ? 0.4 : 1 }}
        className="h-9 w-9 items-center justify-center rounded-full bg-[#ECFEFF]"
      >
        <Icon name="remove" size={19} color={colors.primaryStrong} />
      </Pressable>
      <Text className="min-w-[56px] text-center text-[16px] font-extrabold text-[#13364A]">
        {value}
        {suffix ? ` ${suffix}` : ''}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        accessibilityLabel={`Tăng ${label}`}
        style={{ opacity: value >= max ? 0.4 : 1 }}
        className="h-9 w-9 items-center justify-center rounded-full bg-[#0E7490]"
      >
        <Icon name="add" size={19} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

/** Ô bấm mở danh sách lựa chọn */
export function SelectBox({
  icon,
  value,
  placeholder,
  onPress,
  disabled,
}: {
  icon: IconName;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.55 : 1 }}
      className="h-12 flex-row items-center rounded-2xl border border-[#E3E7F0] bg-[#F3FBFC] px-3.5"
    >
      <Icon name={icon} size={19} color={colors.primary} />
      <Text numberOfLines={1} className={`ml-2 flex-1 text-[14px] font-bold ${value ? 'text-[#13364A]' : 'text-[#93A7B1]'}`}>
        {value ?? placeholder}
      </Text>
      <Icon name="expand-more" size={21} color={colors.muted} />
    </Pressable>
  );
}

/** Chọn tỉnh/thành từ danh mục của hệ thống, có ô tìm không dấu */
export function ProvinceSheet({
  visible,
  provinces,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  provinces: ReferenceItem[];
  selected: string | null;
  onClose: () => void;
  onSelect: (item: ReferenceItem) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const term = fold(query);
    return term ? provinces.filter((item) => fold(item.name).includes(term)) : provinces;
  }, [provinces, query]);
  return (
    <Sheet visible={visible} onClose={onClose} title="Chọn điểm đến">
      <View className="mb-3 flex-row items-center rounded-2xl border border-[#E3E7F0] bg-[#F3FBFC] px-3">
        <Icon name="search" size={19} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm tỉnh/thành"
          placeholderTextColor="#93A7B1"
          style={{ flex: 1, height: 44, marginLeft: 8, fontSize: 14, color: colors.ink }}
        />
      </View>
      {filtered.map((item) => {
        const active = item.name === selected;
        return (
          <Pressable
            key={item.code}
            onPress={() => {
              onSelect(item);
              setQuery('');
              onClose();
            }}
            className={`flex-row items-center gap-2 rounded-xl px-3 py-3 ${active ? 'bg-[#ECFEFF]' : ''}`}
          >
            <Icon name="location-on" size={18} color={active ? colors.primary : '#9AB2BC'} />
            <Text className={`flex-1 text-[14px] ${active ? 'font-extrabold text-[#0E7490]' : 'font-semibold text-[#13364A]'}`}>
              {item.name}
            </Text>
            {active ? <Icon name="check" size={18} color={colors.primary} /> : null}
          </Pressable>
        );
      })}
      {filtered.length === 0 ? (
        <Text className="py-6 text-center text-[12.5px] text-[#72818C]">Không có tỉnh/thành phù hợp.</Text>
      ) : null}
    </Sheet>
  );
}

export const MAX_BUDGET = 1_000_000_000;

/** Nhập ngân sách tổng (chỉ chữ số, tối đa 1 tỷ) + các mức gợi ý nhanh */
export function BudgetInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const amount = Number(value) || 0;
  return (
    <View>
      <View className="h-12 flex-row items-center rounded-2xl border border-[#E3E7F0] bg-[#F3FBFC] px-3.5">
        <TextInput
          value={value ? formatNumber(amount) : ''}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '');
            onChange(digits === '' ? '' : String(Math.min(MAX_BUDGET, Number(digits))));
          }}
          keyboardType="number-pad"
          placeholder="Nhập ngân sách"
          placeholderTextColor="#93A7B1"
          style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.ink }}
        />
        <Text className="text-[12px] font-bold text-[#72818C]">VND</Text>
      </View>
      <View className="mt-2.5 flex-row flex-wrap gap-2">
        {[3_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000].map((preset) => (
          <Pressable
            key={preset}
            onPress={() => onChange(String(preset))}
            className={`rounded-full px-3 py-1.5 ${amount === preset ? 'bg-[#0891B2]' : 'bg-[#ECFEFF]'}`}
          >
            <Text className={`text-[11.5px] font-bold ${amount === preset ? 'text-white' : 'text-[#0E7490]'}`}>
              {preset / 1_000_000} triệu
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="mt-1.5 text-[11px] text-[#8193A0]">Tổng ngân sách cho cả chuyến đi · tối đa 1 tỷ</Text>
    </View>
  );
}

export function PacePicker({ value, onChange }: { value: PaceId; onChange: (value: PaceId) => void }) {
  return (
    <View className="gap-2">
      {PACE_OPTIONS.map((item) => {
        const active = item.id === value;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={{ borderColor: active ? colors.primary : colors.line, backgroundColor: active ? colors.primarySoft : '#FFFFFF' }}
            className="flex-row items-start gap-3 rounded-2xl border p-3"
          >
            <Icon name={active ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={active ? colors.primary : '#A5B6BE'} />
            <View className="min-w-0 flex-1">
              <View className="flex-row flex-wrap items-center gap-x-2">
                <Text className="text-[14px] font-extrabold text-[#13364A]">{item.label}</Text>
                <Text className="text-[11.5px] font-bold text-[#0891B2]">{item.perDay}</Text>
              </View>
              <Text className="mt-0.5 text-[12px] leading-[18px] text-[#72818C]">{item.description}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
