import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Typography';
import { errorMessage } from '../api/http';
import { weatherApi, type WeatherImpactedItem, type WeatherSuggestion } from '../api/weatherApi';
import { Icon } from '../ui/Icon';
import { formatTime } from '../utils/format';
import { isStormCode, weatherIconName } from '../utils/weather';

/**
 * Cảnh báo UC-045: hoạt động ngoài trời rơi vào khung giờ mưa to/giông. Chỉ là ĐỀ XUẤT — chỉ đổi
 * lịch trình khi khách bấm "Áp dụng" cho đúng 1 gợi ý (giống WeatherImpactBanner của web).
 */
export default function WeatherImpactBanner({
  itineraryId,
  items,
  onApplied,
}: {
  itineraryId: number;
  items: WeatherImpactedItem[];
  onApplied: () => void;
}) {
  const [applyingKey, setApplyingKey] = useState<string | null>(null);
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (items.length === 0) return null;

  const apply = (item: WeatherImpactedItem, suggestion: WeatherSuggestion, index: number) => {
    const key = `${item.itemId}-${index}`;
    setApplyingKey(key);
    weatherApi
      .applyImpact(itineraryId, {
        itemId: item.itemId,
        suggestionType: suggestion.type,
        newDate: suggestion.newDate,
        newStartTime: suggestion.newStartTime,
        newEndTime: suggestion.newEndTime,
        newPlaceId: suggestion.newPlaceId,
      })
      .then(() => {
        setAppliedKeys((previous) => new Set(previous).add(key));
        onApplied();
      })
      .catch((caught: unknown) => setErrors((previous) => ({ ...previous, [key]: errorMessage(caught) })))
      .finally(() => setApplyingKey(null));
  };

  return (
    <View className="mb-4 gap-3">
      {items.map((item) => {
        const storm = isStormCode(item.weatherCode);
        const tone = storm ? '#B45335' : '#9A6B10';
        return (
          <View
            key={item.itemId}
            style={{ borderColor: storm ? '#F3C3B0' : '#F6DCA8', backgroundColor: storm ? '#FFF3EF' : '#FFF8EC' }}
            className="rounded-2xl border p-3.5"
          >
            <View className="flex-row gap-2.5">
              <View style={{ backgroundColor: storm ? '#FDE3D8' : '#FBEAC4' }} className="h-10 w-10 items-center justify-center rounded-xl">
                <Icon name={weatherIconName(item.weatherCode)} size={21} color={tone} />
              </View>
              <View className="min-w-0 flex-1">
                <Text style={{ color: tone }} className="text-[13px] font-extrabold leading-[18px]">
                  {item.warningMessage}
                </Text>
                <Text className="mt-0.5 text-[11.5px] text-[#6B5A35]">
                  {item.placeName} · {formatTime(item.startTime)}–{formatTime(item.endTime)} · {item.condition}
                </Text>
              </View>
            </View>
            <Text className="mb-2 mt-3 text-[11px] font-bold text-[#7A6A4A]">Đề xuất điều chỉnh — bạn chọn, hệ thống không tự sửa lịch</Text>
            <View className="gap-2">
              {item.suggestions.map((suggestion, index) => {
                const key = `${item.itemId}-${index}`;
                const applied = appliedKeys.has(key);
                const applying = applyingKey === key;
                return (
                  <View key={key} className="flex-row items-center gap-2 rounded-xl bg-white p-2.5">
                    <View className="min-w-0 flex-1">
                      <Text className="text-[12px] leading-[17px] text-[#3B4B57]">{suggestion.description}</Text>
                      {errors[key] ? <Text className="mt-1 text-[11px] text-[#D83A48]">{errors[key]}</Text> : null}
                    </View>
                    {applied ? (
                      <View className="flex-row items-center gap-1">
                        <Icon name="check-circle" size={15} color="#13936B" />
                        <Text className="text-[11.5px] font-bold text-[#13936B]">Đã áp dụng</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => apply(item, suggestion, index)}
                        disabled={applying}
                        className="rounded-full bg-[#0891B2] px-3 py-1.5"
                        style={{ opacity: applying ? 0.6 : 1 }}
                      >
                        <Text className="text-[11.5px] font-bold text-white">{applying ? 'Đang áp dụng...' : 'Áp dụng'}</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
