import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './Typography';
import { colors } from '../theme';
import { parseIsoDate, toIsoDate } from '../utils/format';
import { Sheet } from './Bits';
import { Icon } from './Icon';

const WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Chọn một ngày (yyyy-MM-dd) trên lịch tháng; bấm tiêu đề để chọn năm */
export function DatePickerSheet({
  visible,
  title,
  value,
  min,
  max,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  value: string | null;
  min?: string;
  max?: string;
  onClose: () => void;
  onSelect: (iso: string) => void;
}) {
  const initial = value ? parseIsoDate(value) : max ? parseIsoDate(max) : new Date();
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [pickingYear, setPickingYear] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const base = value ? parseIsoDate(value) : min ? parseIsoDate(min) : max ? parseIsoDate(max) : new Date();
    setMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setPickingYear(false);
  }, [visible, value, min, max]);

  const year = month.getFullYear();
  const firstWeekday = (month.getDay() + 6) % 7; // Thứ 2 = 0
  const daysInMonth = new Date(year, month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const minYear = min ? parseIsoDate(min).getFullYear() : 1920;
  const maxYear = max ? parseIsoDate(max).getFullYear() : new Date().getFullYear() + 5;

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => setMonth(new Date(year, month.getMonth() - 1, 1))}
          className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F8FA]"
          accessibilityLabel="Tháng trước"
        >
          <Icon name="chevron-left" size={22} />
        </Pressable>
        <Pressable onPress={() => setPickingYear((v) => !v)} className="flex-row items-center gap-1">
          <Text className="text-[15px] font-extrabold text-[#0F2A3B]">
            Tháng {month.getMonth() + 1}, {year}
          </Text>
          <Icon name={pickingYear ? 'expand-less' : 'expand-more'} size={20} color={colors.muted} />
        </Pressable>
        <Pressable
          onPress={() => setMonth(new Date(year, month.getMonth() + 1, 1))}
          className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F8FA]"
          accessibilityLabel="Tháng sau"
        >
          <Icon name="chevron-right" size={22} />
        </Pressable>
      </View>

      {pickingYear ? (
        <ScrollView style={{ maxHeight: 300 }}>
          <View className="flex-row flex-wrap gap-2">
            {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((y) => (
              <Pressable
                key={y}
                onPress={() => {
                  setMonth(new Date(y, month.getMonth(), 1));
                  setPickingYear(false);
                }}
                style={{ backgroundColor: y === year ? colors.primary : colors.field }}
                className="w-[22%] items-center rounded-xl py-2.5"
              >
                <Text style={{ color: y === year ? '#FFFFFF' : colors.ink }} className="text-[13px] font-bold">
                  {y}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View>
          <View className="flex-row">
            {WEEK.map((day) => (
              <Text key={day} className="flex-1 py-1 text-center text-[11.5px] font-bold text-[#8193A0]">
                {day}
              </Text>
            ))}
          </View>
          <View className="flex-row flex-wrap">
            {cells.map((day, index) => {
              if (day === null) return <View key={`e${index}`} style={{ width: '14.28%', height: 44 }} />;
              const iso = toIsoDate(new Date(year, month.getMonth(), day));
              const disabled = (min !== undefined && iso < min) || (max !== undefined && iso > max);
              const selected = iso === value;
              return (
                <Pressable
                  key={iso}
                  disabled={disabled}
                  onPress={() => {
                    onSelect(iso);
                    onClose();
                  }}
                  style={{ width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? colors.primary : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? '#FFFFFF' : disabled ? '#C3CED4' : colors.ink,
                        fontWeight: selected ? '800' : '600',
                        fontSize: 14,
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </Sheet>
  );
}
