import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../ui/Typography';
import { errorMessage } from '../api/http';
import { weatherApi, type WeatherResponse } from '../api/weatherApi';
import { Icon } from '../ui/Icon';
import { formatTemp, weatherIconName, weekdayShortLabel } from '../utils/weather';

const BLUE = '#3B6FD8';

/**
 * Dự báo thời tiết cho một địa điểm — GET /weather?placeId= (công khai). Hiện gọn hôm nay; bấm
 * mở dải 7 ngày, chọn ngày xem theo giờ (giống TodayWeatherCard của web).
 */
export default function TodayWeatherCard({ placeId }: { placeId: number }) {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    weatherApi
      .forPlace(placeId)
      .then((result) => {
        if (!active) return;
        setWeather(result);
        setSelectedDate(result.daily[0]?.date ?? null);
      })
      .catch((caught: unknown) => active && setError(errorMessage(caught)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [placeId]);

  const box = 'rounded-2xl bg-white p-4';
  if (loading) {
    return (
      <View className={box}>
        <Text className="text-center text-[12.5px] text-[#8793AB]">Đang tải dự báo thời tiết...</Text>
      </View>
    );
  }
  if (error || !weather) {
    return (
      <View className={box}>
        <Text className="text-center text-[12.5px] text-[#8793AB]">Không tải được dự báo thời tiết.</Text>
      </View>
    );
  }
  const today = weather.daily[0];
  if (!today) {
    return (
      <View className={box}>
        <Text className="text-center text-[12.5px] text-[#8793AB]">Chưa có dự báo thời tiết cho địa điểm này.</Text>
      </View>
    );
  }
  const activeDate = selectedDate ?? today.date;
  const activeHourly = weather.hourly.filter((hour) => hour.date === activeDate);

  return (
    <View className={box}>
      <Pressable onPress={() => setExpanded((v) => !v)} className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#E3EDFF]">
          <Icon name={weatherIconName(today.weatherCode)} size={26} color={BLUE} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-extrabold text-[#13364A]">{today.condition}</Text>
          <Text className="text-[12px] text-[#72818C]">
            {formatTemp(today.temperatureMax)} / {formatTemp(today.temperatureMin)}
          </Text>
        </View>
        {today.precipitationProbabilityMax !== null ? (
          <View className="flex-row items-center gap-1 rounded-full bg-[#E3EDFF] px-2.5 py-1">
            <Icon name="water-drop" size={14} color={BLUE} />
            <Text className="text-[11px] font-bold text-[#3B6FD8]">{today.precipitationProbabilityMax}%</Text>
          </View>
        ) : null}
        <Icon name={expanded ? 'expand-less' : 'expand-more'} size={20} color="#8793AB" />
      </Pressable>

      {expanded ? (
        <View className="mt-3.5 border-t border-[#EEF1F4] pt-3.5">
          <Text className="mb-2 text-[11px] font-bold uppercase text-[#8793AB]">Dự báo 7 ngày tới</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {weather.daily.map((day) => {
              const selected = day.date === activeDate;
              return (
                <Pressable
                  key={day.date}
                  onPress={() => setSelectedDate(day.date)}
                  style={{
                    width: 66,
                    alignItems: 'center',
                    borderRadius: 14,
                    paddingVertical: 8,
                    backgroundColor: selected ? BLUE : '#F3F6FB',
                  }}
                >
                  <Text style={{ color: selected ? '#FFFFFF' : '#5B6B7A' }} className="text-[11px] font-bold">
                    {day.date === today.date ? 'Hôm nay' : weekdayShortLabel(day.date)}
                  </Text>
                  <Icon name={weatherIconName(day.weatherCode)} size={22} color={selected ? '#FFFFFF' : BLUE} />
                  <Text style={{ color: selected ? '#FFFFFF' : '#13364A' }} className="text-[11.5px] font-bold">
                    {formatTemp(day.temperatureMax)}
                  </Text>
                  <Text style={{ color: selected ? '#DCE7FB' : '#8793AB' }} className="text-[10.5px]">
                    {formatTemp(day.temperatureMin)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {activeHourly.length > 0 ? (
            <>
              <Text className="mb-2 mt-3 text-[11px] font-bold uppercase text-[#8793AB]">Theo giờ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {activeHourly.map((hour) => (
                  <View key={`${hour.date}-${hour.time}`} className="w-[58px] items-center rounded-xl bg-[#F7F9FC] py-2">
                    <Text className="text-[10.5px] font-bold text-[#5B6B7A]">{hour.time.slice(0, 5)}</Text>
                    <Icon name={weatherIconName(hour.weatherCode)} size={19} color={BLUE} />
                    <Text className="text-[11.5px] font-bold text-[#13364A]">{formatTemp(hour.temperature)}</Text>
                    {hour.precipitationProbability !== null ? (
                      <Text className="text-[10px] text-[#3B6FD8]">{hour.precipitationProbability}%</Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}
          {weather.notAvailable.includes(activeDate) ? (
            <Text className="mt-2 text-[11.5px] text-[#8793AB]">Chưa có dự báo cho ngày này.</Text>
          ) : null}
          {weather.stale ? (
            <Text className="mt-2 text-[11px] text-[#B45309]">Đang hiển thị dữ liệu dự báo đã lưu trước đó.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
