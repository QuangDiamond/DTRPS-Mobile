import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';


import { planDestinations } from '../../constants/planTrip';
import {
  getMatchScore,
  interestTagLabels,
  suggestedPlaces,
  suggestionCategoryLabels,
  type SuggestedPlace,
  type SuggestionCategory,
} from '../../constants/suggestedPlaces';
import SuggestionDetailScreen from './SuggestionDetailScreen';

// ==================== TYPES ====================

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type SuggestedPlacesScreenProps = {
  destinationId: string;
  /** Sở thích đã chọn ở màn Lập kế hoạch */
  interests: string[];
  onBack: () => void;
  /** Lưu kế hoạch với các địa điểm đã chọn */
  onSavePlan: (placeIds: string[]) => void;
};

type ScoredPlace = SuggestedPlace & { match: number };

// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  background: '#F8F8FF',
  lightPurple: '#EBEDFF',
  mint: '#C3F8F0',
  heart: '#E5484D',
  white: '#FFFFFF',
};

const tagIcons: Record<string, IconName> = {
  beach: 'beach',
  food: 'food-outline',
  culture: 'bank-outline',
  nature: 'image-filter-hdr',
  shopping: 'shopping-outline',
  adventure: 'hiking',
  relax: 'spa-outline',
};

// Bước hiện tại trong luồng lập kế hoạch (thanh 6 đoạn trên cùng)
const FLOW_STEPS = 6;
const CURRENT_FLOW_STEP = 3;

// ==================== PLACE CARD ====================

function SuggestionCard({
  place,
  best,
  favorite,
  inPlan,
  onPress,
  onToggleFavorite,
}: {
  place: ScoredPlace;
  best: boolean;
  favorite: boolean;
  inPlan: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-[20px] bg-white active:opacity-90"
      style={{ elevation: 2, shadowOpacity: 0.06, shadowRadius: 8 }}
    >
      <ImageBackground source={{ uri: place.image }} style={{ height: 150 }}>
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.6)']}
          style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-row gap-1.5">
              {best && (
                <View className="flex-row items-center rounded-full px-2.5 py-1" style={{ backgroundColor: '#FFF1C7' }}>
                  <MaterialCommunityIcons name="star" size={12} color="#D99A00" />
                  <Text className="ml-1 text-[10px] font-bold" style={{ color: '#7A5600' }}>
                    Phù hợp nhất
                  </Text>
                </View>
              )}
              {inPlan && (
                <View className="flex-row items-center rounded-full px-2.5 py-1" style={{ backgroundColor: COLORS.mint }}>
                  <MaterialCommunityIcons name="check" size={12} color={COLORS.primaryDark} />
                  <Text className="ml-1 text-[10px] font-bold" style={{ color: COLORS.primaryDark }}>
                    Trong kế hoạch
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={onToggleFavorite}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/90"
              accessibilityLabel={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            >
              <MaterialCommunityIcons
                name={favorite ? 'heart' : 'heart-outline'}
                size={18}
                color={favorite ? COLORS.heart : COLORS.text}
              />
            </Pressable>
          </View>

          <View className="flex-row items-end justify-between">
            <View className="min-w-0 flex-1 pr-2">
              <Text numberOfLines={1} className="text-[18px] font-extrabold text-white">
                {place.name}
              </Text>
              <View className="mt-0.5 flex-row items-center">
                <MaterialCommunityIcons name="map-marker-outline" size={13} color="white" />
                <Text numberOfLines={1} className="ml-1 text-[11px] text-white">
                  {place.location}
                </Text>
              </View>
            </View>
            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: COLORS.mint }}>
              <Text className="text-[11px] font-bold" style={{ color: COLORS.primaryDark }}>
                Độ phù hợp {place.match}%
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View className="flex-row justify-around px-3 py-3">
        {place.tags.slice(0, 3).map((tag) => (
          <View key={tag} className="flex-row items-center">
            <MaterialCommunityIcons name={tagIcons[tag]} size={15} color={COLORS.primary} />
            <Text className="ml-1 text-[11px]" style={{ color: COLORS.text }}>
              {interestTagLabels[tag]}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// ==================== MAIN SCREEN ====================

export default function SuggestedPlacesScreen({
  destinationId,
  interests,
  onBack,
  onSavePlan,
}: SuggestedPlacesScreenProps) {
  const destination =
    planDestinations.find((item) => item.id === destinationId) ?? planDestinations[0];

  const [category, setCategory] = useState<SuggestionCategory | 'all'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Địa điểm của điểm đến đã chọn, xếp theo độ phù hợp
  const places = useMemo<ScoredPlace[]>(
    () =>
      suggestedPlaces
        .filter((place) => place.destinationId === destination.id)
        .map((place) => ({ ...place, match: getMatchScore(place, interests) }))
        .sort((a, b) => b.match - a.match),
    [destination.id, interests]
  );

  const categories = useMemo(() => {
    const used = Array.from(new Set(places.map((place) => place.category)));
    return [
      { id: 'all' as const, label: 'Tất cả', count: places.length },
      ...used.map((id) => ({
        id,
        label: suggestionCategoryLabels[id],
        count: places.filter((place) => place.category === id).length,
      })),
    ];
  }, [places]);

  const visiblePlaces =
    category === 'all' ? places : places.filter((place) => place.category === category);

  const selectedPlace = places.find((place) => place.id === selectedId) ?? null;

  // Nút Back cứng trên Android: đóng chi tiết trước khi rời màn
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedId) {
        setSelectedId(null);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [selectedId]);

  const toggle = (setter: typeof setFavorites, id: string) =>
    setter((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );

  const handleBack = () => {
    if (planIds.length === 0) {
      onBack();
      return;
    }
    Alert.alert('Bỏ các địa điểm đã chọn?', 'Kế hoạch của bạn chưa được lưu.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Bỏ', style: 'destructive', onPress: onBack },
    ]);
  };

  return (
    <View className="flex-1">
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1"
        style={{ backgroundColor: COLORS.white }}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* ================= HEADER ================= */}

        <View className="h-[54px] flex-row items-center px-3">
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center"
            accessibilityLabel="Quay lại"
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
          </Pressable>
          <Text className="ml-1 text-[17px] font-bold" style={{ color: COLORS.text }}>
            Gợi ý điểm đến cho bạn
          </Text>
        </View>

        {/* Thanh tiến trình luồng lập kế hoạch */}
        <View className="flex-row gap-1.5 px-5">
          {Array.from({ length: FLOW_STEPS }, (_, index) => (
            <View
              key={index}
              className="h-[5px] flex-1 rounded-full"
              style={{ backgroundColor: index < CURRENT_FLOW_STEP ? COLORS.primaryDark : '#E3E8EF' }}
            />
          ))}
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        >
          {/* ================= INTRO ================= */}

          <View className="flex-row items-center rounded-2xl p-3.5" style={{ backgroundColor: '#E8F8F5' }}>
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: COLORS.mint }}
            >
              <MaterialCommunityIcons name="star-four-points" size={20} color={COLORS.primaryDark} />
            </View>
            <Text className="ml-3 flex-1 text-[12px] leading-[18px]" style={{ color: COLORS.text }}>
              Dựa trên sở thích và kế hoạch của bạn, đây là những nơi nên đến tại{' '}
              <Text className="font-bold" style={{ color: COLORS.primaryDark }}>
                {destination.short}
              </Text>
              .
            </Text>
          </View>

          {/* ================= CATEGORIES ================= */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {categories.map((item) => {
              const selected = item.id === category;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  className="rounded-full px-4 py-2"
                  style={{ backgroundColor: selected ? COLORS.primaryDark : COLORS.lightPurple }}
                >
                  <Text
                    className="text-[12px] font-semibold"
                    style={{ color: selected ? COLORS.white : COLORS.text }}
                  >
                    {item.label} ({item.count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ================= LIST ================= */}

          <View className="mt-4">
            {visiblePlaces.map((place) => (
              <SuggestionCard
                key={place.id}
                place={place}
                best={place.id === places[0]?.id}
                favorite={favorites.includes(place.id)}
                inPlan={planIds.includes(place.id)}
                onPress={() => setSelectedId(place.id)}
                onToggleFavorite={() => toggle(setFavorites, place.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* ================= FOOTER ================= */}

        <View className="border-t border-[#EEF1F5] bg-white px-4 pb-2 pt-2.5">
          <Pressable
            onPress={() => onSavePlan(planIds)}
            disabled={planIds.length === 0}
            className="h-12 flex-row items-center justify-center rounded-full active:opacity-80"
            style={{
              backgroundColor: planIds.length > 0 ? COLORS.primaryDark : '#E3E8EF',
            }}
          >
            <MaterialCommunityIcons
              name="content-save-check-outline"
              size={19}
              color={planIds.length > 0 ? 'white' : COLORS.muted}
            />
            <Text
              className="ml-2 text-[14px] font-bold"
              style={{ color: planIds.length > 0 ? 'white' : COLORS.muted }}
            >
              {planIds.length > 0
                ? `Lưu kế hoạch (${planIds.length} địa điểm)`
                : 'Chọn địa điểm để thêm vào kế hoạch'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* ================= DETAIL ================= */}

      {selectedPlace && (
        <View style={StyleSheet.absoluteFill}>
          <SuggestionDetailScreen
            place={selectedPlace}
            matchScore={selectedPlace.match}
            interests={interests}
            favorite={favorites.includes(selectedPlace.id)}
            inPlan={planIds.includes(selectedPlace.id)}
            onBack={() => setSelectedId(null)}
            onToggleFavorite={() => toggle(setFavorites, selectedPlace.id)}
            onTogglePlan={() => toggle(setPlanIds, selectedPlace.id)}
          />
        </View>
      )}
    </View>
  );
}
