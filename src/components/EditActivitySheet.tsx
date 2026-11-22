import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text, TextInput } from '../ui/Typography';
import { errorMessage } from '../api/http';
import { placesApi } from '../api/placesApi';
import { referenceApi } from '../api/referenceApi';
import {
  tripFlowApi,
  type ItineraryActivity,
  type ItineraryOverview,
  type ItineraryOverviewDay,
} from '../api/tripFlowApi';
import type { PlaceSummary } from '../api/types';
import { colors } from '../theme';
import { Sheet } from '../ui/Bits';
import { Button } from '../ui/Button';
import { Icon, type IconName } from '../ui/Icon';
import { Notice } from '../ui/States';
import { formatDate, formatTime } from '../utils/format';

export type EditMode = 'time' | 'replace' | 'swap';

const MODES: { id: EditMode; label: string; icon: IconName }[] = [
  { id: 'time', label: 'Đổi giờ', icon: 'schedule' },
  { id: 'replace', label: 'Thay địa điểm', icon: 'edit-location-alt' },
  { id: 'swap', label: 'Hoán đổi', icon: 'swap-horiz' },
];

/** "0830" / "8:30" → "08:30" */
function normalizeTime(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View className="flex-1">
      <Text className="mb-1 text-[12px] font-semibold text-[#557080]">{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(normalizeTime(text))}
        keyboardType="number-pad"
        placeholder="HH:mm"
        placeholderTextColor="#93A7B1"
        maxLength={5}
        style={{
          height: 50,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.field,
          textAlign: 'center',
          fontSize: 18,
          fontWeight: '800',
          color: colors.ink,
        }}
      />
    </View>
  );
}

/** Đổi giờ / thay địa điểm / hoán đổi một hoạt động — giống EditActivityModal của web */
export default function EditActivitySheet({
  overview,
  target,
  onClose,
  onSaved,
}: {
  overview: ItineraryOverview;
  target: { day: ItineraryOverviewDay; activity: ItineraryActivity; mode: EditMode } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const activity = target?.activity;
  const [mode, setMode] = useState<EditMode>('time');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [keyword, setKeyword] = useState('');
  const [province, setProvince] = useState<string | null>(null);
  const [provinceError, setProvinceError] = useState('');
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [replacement, setReplacement] = useState<PlaceSummary | null>(null);
  const [swapId, setSwapId] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!target) return;
    setMode(target.mode);
    setStart(target.activity.startTime?.slice(0, 5) ?? '');
    setEnd(target.activity.endTime?.slice(0, 5) ?? '');
    setKeyword('');
    setReplacement(null);
    setSwapId(null);
    setSaveError('');
  }, [target]);

  const usedIds = useMemo(
    () => new Set(overview.days.flatMap((d) => d.activities.map((a) => a.placeId))),
    [overview],
  );
  const swapOptions = overview.days.flatMap((d) =>
    d.activities.filter((a) => a.itemId !== activity?.itemId && a.status === 'PLANNED').map((a) => ({ day: d, activity: a })),
  );

  // Mã tỉnh của điểm đến (để tìm địa điểm thay thế cùng tỉnh)
  useEffect(() => {
    let active = true;
    referenceApi
      .provinces()
      .then((list) => {
        if (!active) return;
        const destination = overview.destination.trim().toLocaleLowerCase('vi');
        const matched = list.find(
          (p) => p.name.trim().toLocaleLowerCase('vi') === destination || p.code.toLowerCase() === destination,
        );
        if (matched) setProvince(matched.code);
        else setProvinceError('Không xác định được mã tỉnh/thành của chuyến đi.');
      })
      .catch((e) => active && setProvinceError(errorMessage(e)));
    return () => {
      active = false;
    };
  }, [overview.destination]);

  useEffect(() => {
    if (!target || mode !== 'replace' || !province) return;
    let active = true;
    setSearchLoading(true);
    setSearchError('');
    const timer = setTimeout(() => {
      (async () => {
        const all: PlaceSummary[] = [];
        for (let page = 0; active; page += 1) {
          const result = await placesApi.list({ province, keyword: keyword.trim(), page, size: 100 });
          all.push(...result.items);
          if (result.items.length === 0 || all.length >= result.total) break;
        }
        return all;
      })()
        .then((items) => active && setResults(items.filter((p) => !usedIds.has(p.id))))
        .catch((e) => active && setSearchError(errorMessage(e)))
        .finally(() => active && setSearchLoading(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [target, mode, province, keyword, usedIds]);

  if (!target || !activity) return null;

  const save = async () => {
    if (saving) return;
    setSaveError('');
    const swapTarget = swapOptions.find((o) => o.activity.itemId === swapId);
    if (mode === 'swap' && !swapTarget) return setSaveError('Hãy chọn hoạt động cần hoán đổi.');
    if (mode === 'replace' && !replacement) return setSaveError('Hãy chọn địa điểm thay thế.');
    if (mode !== 'swap' && (!validTime(start) || !validTime(end) || start >= end)) {
      return setSaveError('Giờ kết thúc phải sau giờ bắt đầu (định dạng HH:mm).');
    }
    setSaving(true);
    try {
      await tripFlowApi.editActivity(overview.planId, {
        itineraryId: overview.itineraryId,
        itemId: activity.itemId,
        ...(mode === 'swap' && swapTarget
          ? { swapWithItemId: swapTarget.activity.itemId }
          : {
              startTime: `${start}:00`,
              endTime: `${end}:00`,
              ...(mode === 'replace' && replacement ? { placeId: replacement.id } : {}),
            }),
      });
      onSaved();
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible
      onClose={() => !saving && onClose()}
      title="Chỉnh sửa hoạt động"
      footer={
        <View>
          {saveError ? <Notice tone="danger">{saveError}</Notice> : null}
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Button title="Hủy" variant="outline" disabled={saving} onPress={onClose} />
            </View>
            <View className="flex-[1.4]">
              <Button title={saving ? 'Đang lưu...' : 'Lưu thay đổi'} icon="check" loading={saving} onPress={() => void save()} />
            </View>
          </View>
        </View>
      }
    >
      <View className="mb-3 rounded-2xl bg-[#12344A] p-4">
        <Text className="text-[11.5px] font-semibold text-[#C1E8EC]">
          Ngày {target.day.dayNumber} · {formatDate(target.day.visitDate)}
        </Text>
        <Text className="mt-1 text-[15px] font-extrabold text-white">{activity.placeName}</Text>
        <Text className="mt-0.5 text-[12px] text-[#C1E8EC]">
          {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
        </Text>
      </View>

      <View className="mb-4 flex-row gap-1 rounded-2xl bg-[#F0F5F3] p-1">
        {MODES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setMode(item.id)}
            className={`flex-1 flex-row items-center justify-center gap-1 rounded-xl py-2 ${mode === item.id ? 'bg-white' : ''}`}
          >
            <Icon name={item.icon} size={16} color={mode === item.id ? colors.primaryStrong : colors.muted} />
            <Text className={`text-[11.5px] font-bold ${mode === item.id ? 'text-[#0E7490]' : 'text-[#72818C]'}`}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {mode !== 'swap' ? (
        <View className="mb-4 flex-row gap-3">
          <TimeInput label="Bắt đầu" value={start} onChange={setStart} />
          <TimeInput label="Kết thúc" value={end} onChange={setEnd} />
        </View>
      ) : null}

      {mode === 'replace' ? (
        <View>
          {provinceError ? <Notice tone="danger">{provinceError}</Notice> : null}
          <View className="mb-2 flex-row items-center rounded-xl border border-[#DCE8E6] bg-[#F8FBFA] px-3">
            <Icon name="search" size={19} color={colors.muted} />
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder={`Tìm địa điểm ở ${overview.destination}`}
              placeholderTextColor="#93A7B1"
              style={{ flex: 1, height: 46, marginLeft: 8, fontSize: 14, color: colors.ink }}
            />
          </View>
          {searchError ? <Notice tone="danger">{searchError}</Notice> : null}
          {searchLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : results.length === 0 ? (
            <Text className="py-4 text-center text-[12.5px] text-[#72818C]">Không có địa điểm phù hợp chưa nằm trong lịch trình.</Text>
          ) : (
            <View className="gap-2">
              {results.map((place) => {
                const active = replacement?.id === place.id;
                return (
                  <Pressable
                    key={place.id}
                    onPress={() => setReplacement(place)}
                    style={{ borderColor: active ? colors.primary : '#E5EDEB', backgroundColor: active ? '#EDF8F3' : '#FFFFFF' }}
                    className="flex-row items-center gap-3 rounded-xl border p-3"
                  >
                    <Icon name={active ? 'radio-button-checked' : 'radio-button-unchecked'} size={19} color={active ? colors.primary : '#A5B6BE'} />
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="text-[13px] font-bold text-[#163D42]">
                        {place.name}
                      </Text>
                      <Text numberOfLines={1} className="text-[11.5px] text-[#72818C]">
                        {[place.category?.name, place.address].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      {mode === 'swap' ? (
        swapOptions.length === 0 ? (
          <Text className="py-4 text-center text-[12.5px] text-[#72818C]">Không có hoạt động nào khác để hoán đổi.</Text>
        ) : (
          <View className="gap-2">
            {swapOptions.map((option) => {
              const active = swapId === option.activity.itemId;
              return (
                <Pressable
                  key={option.activity.itemId}
                  onPress={() => setSwapId(option.activity.itemId)}
                  style={{ borderColor: active ? colors.primary : '#E5EDEB', backgroundColor: active ? '#EDF8F3' : '#FFFFFF' }}
                  className="flex-row items-center gap-3 rounded-xl border p-3"
                >
                  <Icon name={active ? 'radio-button-checked' : 'radio-button-unchecked'} size={19} color={active ? colors.primary : '#A5B6BE'} />
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-[13px] font-bold text-[#163D42]">
                      {option.activity.placeName}
                    </Text>
                    <Text className="text-[11.5px] text-[#72818C]">
                      Ngày {option.day.dayNumber} · {formatTime(option.activity.startTime)} – {formatTime(option.activity.endTime)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )
      ) : null}

      <View className="mt-4 flex-row gap-2 rounded-xl bg-[#F5F9F9] p-3">
        <Icon name="info" size={17} color={colors.primary} />
        <Text className="flex-1 text-[11.5px] leading-[18px] text-[#506775]">
          Thay đổi được kiểm tra trước khi lưu. Chi phí và thời gian di chuyển sẽ được cập nhật theo dữ liệu hiện có.
        </Text>
      </View>
    </Sheet>
  );
}
