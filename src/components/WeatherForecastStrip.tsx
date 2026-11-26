import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '../ui/Typography';
import { errorMessage } from '../api/http';
import { weatherApi, type DailyForecast } from '../api/weatherApi';
import { Icon } from '../ui/Icon';
import { formatTemp, isStormCode, weatherIconName, weekdayShortLabel } from '../utils/weather';

/** Dải dự báo 7 ngày cho lịch trình — GET /itineraries/{id}/weather (giống web) */
export default function WeatherForecastStrip({ itineraryId }: { itineraryId: number }) {
  const [daily, setDaily] = useState<DailyForecast[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    weatherApi
      .forItinerary(itineraryId)
      .then((result) => {
        if (!active) return;
        // Lấy đại diện 1 địa điểm có dữ liệu — các điểm cùng khu vực/khung ngày
        const place = result.places.find((item) => item.daily.length > 0);
        setDaily(place?.daily ?? []);
      })
      .catch((caught: unknown) => active && setError(errorMessage(caught)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [itineraryId]);

  if (loading || error || !daily || daily.length === 0) {
    return (
      <View className="mt-4 rounded-2xl bg-white p-4">
        <Text className="text-center text-[12.5px] text-[#8793AB]">
          {loading ? 'Đang tải dự báo thời tiết...' : 'Không tải được dự báo thời tiết.'}
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-4 rounded-2xl bg-white p-4">
      <Text className="mb-2.5 text-[14px] font-extrabold text-[#13364A]">
        Dự báo thời tiết {daily.length} ngày
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {daily.map((day) => {
          const storm = isStormCode(day.weatherCode);
          return (
            <View
              key={day.date}
              className={`w-[66px] items-center rounded-2xl py-2.5 ${storm ? 'bg-[#FDECEC]' : 'bg-[#F3F6FB]'}`}
            >
              <Text className="text-[11px] font-bold text-[#5B6B7A]">
                {weekdayShortLabel(day.date)}
              </Text>
              <Text className="text-[10px] text-[#8793AB]">
                {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
              </Text>
              <Icon
                name={weatherIconName(day.weatherCode)}
                size={22}
                color={storm ? '#C2410C' : '#3B6FD8'}
              />
              <Text className="text-[12px] font-bold text-[#13364A]">
                {formatTemp(day.temperatureMax)}
              </Text>
              {day.precipitationProbabilityMax !== null && day.precipitationProbabilityMax > 0 ? (
                <Text className="text-[10px] font-bold text-[#3B6FD8]">
                  {day.precipitationProbabilityMax}%
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
