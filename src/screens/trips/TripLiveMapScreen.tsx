import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, type LatLng } from 'react-native-maps';
import * as Location from 'expo-location';

// ==================== TYPES ====================

type TripMapActivity = {
  id: string;
  title: string;
  location: string;
  time: string;
  duration: string;
  category?: string;
};

type TripLiveMapScreenProps = {
  onBack: () => void;
  dayNumber: number;
  dayTitle: string;
  activities: TripMapActivity[];
};

type MapStop = TripMapActivity & {
  coordinate: LatLng;
};

// ==================== COLORS ====================

const C = {
  teal: '#087E79',
  darkTeal: '#006B67',
  navy: '#17344A',
  muted: '#75879A',
  white: '#FFFFFF',
  light: '#E6F8F4',
  border: '#E7EEF0',
  orange: '#E69B31',
};

// ==================== DEMO COORDINATES ====================
// Điểm tham khảo phục vụ demo, KHÔNG dùng làm định tuyến thật.
// Với địa điểm chung chung (ăn trưa, trung tâm...), tọa độ chỉ minh họa.

const COORDINATES: Record<string, LatLng> = {
  airport: { latitude: 16.0439, longitude: 108.1994 },
  'linh-ung': { latitude: 16.1014, longitude: 108.2782 },
  lunch: { latitude: 16.0692, longitude: 108.2240 },
  'my-khe': { latitude: 16.0567, longitude: 108.2497 },
  'dragon-bridge': { latitude: 16.0614, longitude: 108.2272 },

  'day2-1': { latitude: 16.0660, longitude: 108.2210 },
  'day2-2': { latitude: 15.9957, longitude: 107.9960 },
  'day2-3': { latitude: 15.9985, longitude: 107.9955 },
  'day2-4': { latitude: 15.9990, longitude: 107.9950 },

  'day3-1': { latitude: 16.0567, longitude: 108.2497 },
  'day3-2': { latitude: 16.0686, longitude: 108.2240 },
  'day3-3': { latitude: 16.0708, longitude: 108.2246 },

  'day4-1': { latitude: 16.0670, longitude: 108.2200 },
  'day4-2': { latitude: 16.0439, longitude: 108.1994 },
};

const DEFAULT_CENTER: LatLng = {
  latitude: 16.0678,
  longitude: 108.2208,
};

function getStopCoordinate(id: string, index: number): LatLng {
  return (
    COORDINATES[id] ?? {
      latitude: DEFAULT_CENTER.latitude + index * 0.003,
      longitude: DEFAULT_CENTER.longitude + index * 0.003,
    }
  );
}

// ==================== MAIN SCREEN ====================

export default function TripLiveMapScreen({
                                            onBack,
                                            dayNumber,
                                            dayTitle,
                                            activities,
                                          }: TripLiveMapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [gpsAllowed, setGpsAllowed] = useState(false);
  const [myLocation, setMyLocation] = useState<LatLng | null>(null);
  const [gpsMessage, setGpsMessage] = useState('Đang kiểm tra GPS');

  const stops = useMemo<MapStop[]>(
    () =>
      activities.map((activity, index) => ({
        ...activity,
        coordinate: getStopCoordinate(activity.id, index),
      })),
    [activities]
  );

  const currentStop = stops[activeIndex];
  const reachedCount = completed ? stops.length : visitedCount;
  const progress = stops.length
    ? Math.round((reachedCount / stops.length) * 100)
    : 0;

  // Định vị thiết bị trong khi màn hình đang mở.
  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (permission.status !== 'granted') {
          setGpsMessage('Chưa cấp quyền định vị');
          return;
        }

        setGpsAllowed(true);
        setGpsMessage('GPS đã bật');

        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          position => {
            if (!mounted) return;
            setMyLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        );

        if (!mounted) {
          watcher.remove();
          return;
        }
        subscription = watcher;
      } catch {
        if (mounted) setGpsMessage('Không lấy được GPS');
      }
    };

    void startTracking();
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  const focusStop = (index: number) => {
    const stop = stops[index];
    if (!stop) return;
    setActiveIndex(index);
    mapRef.current?.animateToRegion(
      {
        ...stop.coordinate,
        latitudeDelta: 0.026,
        longitudeDelta: 0.026,
      },
      450
    );
  };

  const showWholeRoute = () => {
    if (!stops.length) return;
    if (stops.length === 1) {
      focusStop(0);
      return;
    }
    mapRef.current?.fitToCoordinates(
      stops.map(stop => stop.coordinate),
      {
        edgePadding: { top: 150, right: 60, bottom: 355, left: 60 },
        animated: true,
      }
    );
  };

  const focusMyPosition = () => {
    if (!myLocation) {
      Alert.alert(
        'Vị trí của bạn',
        gpsAllowed
          ? 'Đang lấy tín hiệu GPS. Hãy kiểm tra vị trí giả lập trong Android Emulator.'
          : 'Bạn cần cấp quyền vị trí để dùng chức năng này.'
      );
      return;
    }
    mapRef.current?.animateToRegion(
      { ...myLocation, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      500
    );
  };

  const openExternalDirections = async () => {
    if (!currentStop) return;
    // Tìm bằng tên, không dùng tọa độ demo để dẫn đường thực tế.
    const destination = encodeURIComponent(currentStop.location);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Không thể mở bản đồ', 'Hãy kiểm tra ứng dụng bản đồ trên thiết bị.');
    }
  };

  const markArrived = () => {
    if (completed || !stops.length) return;
    if (activeIndex !== visitedCount) {
      Alert.alert(
        'Chưa tới lượt điểm này',
        'Hãy hoàn thành các điểm dừng theo thứ tự của lịch trình.',
        [{ text: 'Về điểm kế tiếp', onPress: () => focusStop(visitedCount) }]
      );
      return;
    }
    if (activeIndex === stops.length - 1) {
      setVisitedCount(stops.length);
      setCompleted(true);
      Alert.alert(
        'Hoàn thành ngày tham quan',
        `Bạn đã đánh dấu hoàn tất ${stops.length} điểm dừng của Ngày ${dayNumber}.`,
        [
          { text: 'Ở lại bản đồ', style: 'cancel' },
          { text: 'Về chi tiết lịch trình', onPress: onBack },
        ]
      );
      return;
    }
    setVisitedCount(activeIndex + 1);
    focusStop(activeIndex + 1);
  };

  if (!currentStop) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text>Ngày này chưa có hoạt động nào.</Text>
        <Pressable onPress={onBack} style={styles.emptyButton}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* BẢN ĐỒ FULL SCREEN */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...stops[0].coordinate,
          latitudeDelta: 0.065,
          longitudeDelta: 0.065,
        }}
        showsUserLocation={gpsAllowed}
        showsMyLocationButton={false}
        showsCompass
        toolbarEnabled={false}
        onMapReady={showWholeRoute}
      >
        {/* Nối các địa điểm bằng đường minh họa (không bám đường phố). */}
        {stops.length > 1 && (
          <Polyline
            coordinates={stops.map(stop => stop.coordinate)}
            strokeColor={C.teal}
            strokeWidth={4}
            lineDashPattern={[9, 7]}
          />
        )}

        {stops.map((stop, index) => {
          const selected = index === activeIndex;
          const visited = index < reachedCount;
          return (
            <Marker
              key={stop.id}
              coordinate={stop.coordinate}
              onPress={() => focusStop(index)}
              title={stop.title}
              description={stop.location}
            >
              <View
                style={[
                  styles.pin,
                  {
                    width: selected ? 44 : 36,
                    height: selected ? 44 : 36,
                    borderRadius: selected ? 22 : 18,
                    backgroundColor: visited
                      ? '#86969A'
                      : selected
                        ? C.darkTeal
                        : C.teal,
                  },
                ]}
              >
                <Text style={styles.pinNumber}>{index + 1}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* HEADER NỔI TRÊN BẢN ĐỒ */}
      <SafeAreaView edges={['top']} style={styles.topSafe} pointerEvents="box-none">
        <View style={styles.headerCard}>
          <Pressable onPress={onBack} style={styles.iconButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.navy} />
          </Pressable>

          <View style={{ flex: 1, paddingHorizontal: 10 }}>
            <Text style={styles.headerCaption}>ĐANG THEO DÕI · NGÀY {dayNumber}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{dayTitle}</Text>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert(
                'Thoát hành trình?',
                'Tiến độ hiện chỉ lưu tạm trên màn hình demo.',
                [
                  { text: 'Ở lại', style: 'cancel' },
                  { text: 'Thoát', onPress: onBack },
                ]
              )
            }
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name="close" size={23} color={C.navy} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* NÚT ĐIỀU KHIỂN BẢN ĐỒ */}
      <View style={styles.mapControls}>
        <Pressable onPress={showWholeRoute} style={styles.mapControlButton}>
          <MaterialCommunityIcons name="map-marker-multiple-outline" size={23} color={C.darkTeal} />
        </Pressable>
        <Pressable onPress={focusMyPosition} style={styles.mapControlButton}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={C.darkTeal} />
        </Pressable>
      </View>

      {/* BOTTOM SHEET - TƯƠNG TỰ GIAO DIỆN GỌI XE */}
      <View style={styles.sheetContainer}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.sheetHeading}>
            <View style={styles.activeBadge}>
              <MaterialCommunityIcons
                name={completed ? 'check-circle' : 'navigation-variant'}
                size={15}
                color={C.darkTeal}
              />
              <Text style={styles.activeBadgeText}>
                {completed ? 'ĐÃ HOÀN THÀNH' : activeIndex === visitedCount ? 'ĐIỂM ĐẾN TIẾP THEO' : 'ĐIỂM ĐANG XEM'}
              </Text>
            </View>
            <Text style={styles.progressLabel}>{reachedCount}/{stops.length} điểm</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.stopInfo}>
            <View style={styles.stopNumberBox}>
              <Text style={styles.stopNumberText}>{activeIndex + 1}</Text>
            </View>
            <View style={{ flex: 1, paddingLeft: 11 }}>
              <Text style={styles.stopTitle} numberOfLines={2}>
                {completed ? 'Đã hoàn thành tất cả điểm dừng!' : currentStop.title}
              </Text>
              <View style={styles.locationLine}>
                <MaterialCommunityIcons name="map-marker-outline" size={15} color={C.muted} />
                <Text style={styles.locationText} numberOfLines={1}>{currentStop.location}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={C.darkTeal} />
            <Text style={styles.metaText}>
              {currentStop.time} · {currentStop.duration} (dự kiến)
            </Text>
            <View style={styles.metaDivider} />
            <MaterialCommunityIcons name="crosshairs-gps" size={15} color={C.darkTeal} />
            <Text style={styles.metaText} numberOfLines={1}>{gpsMessage}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stopChips}
          >
            {stops.map((stop, index) => (
              <Pressable
                key={stop.id}
                onPress={() => focusStop(index)}
                style={[
                  styles.stopChip,
                  index === activeIndex && styles.selectedChip,
                ]}
              >
                <Text
                  style={[
                    styles.stopChipText,
                    index === activeIndex && { color: C.white },
                  ]}
                >
                  {index < reachedCount ? '✓' : index + 1} · {stop.time}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.demoInfo}>
            <MaterialCommunityIcons name="information-outline" size={15} color="#64758A" />
            <Text style={styles.demoInfoText}>
              Đường nét đứt và vị trí điểm dừng là dữ liệu demo, chưa phải chỉ đường theo đường phố.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable onPress={openExternalDirections} style={styles.outlineButton}>
              <MaterialCommunityIcons name="directions" size={21} color={C.darkTeal} />
              <Text style={styles.outlineButtonText}>Chỉ đường</Text>
            </Pressable>

            <Pressable
              onPress={completed ? onBack : markArrived}
              style={styles.mainButton}
            >
              <MaterialCommunityIcons
                name={completed ? 'arrow-left' : 'check-circle-outline'}
                size={21}
                color={C.white}
              />
              <Text style={styles.mainButtonText}>
                {completed ? 'Trở về lịch trình' : 'Đã đến · Tiếp tục'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D9E8E7' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyButton: { backgroundColor: C.darkTeal, borderRadius: 14, padding: 14 },
  pin: {
    alignItems: 'center', justifyContent: 'center', borderWidth: 3,
    borderColor: '#FFFFFF', elevation: 5,
  },
  pinNumber: { color: C.white, fontWeight: '800', fontSize: 15 },
  topSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerCard: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 19, marginHorizontal: 12, marginTop: 7,
    elevation: 5,
  },
  iconButton: {
    width: 38, height: 38, borderRadius: 13, backgroundColor: '#F2F5F7',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCaption: { color: C.darkTeal, fontSize: 10, fontWeight: '800' },
  headerTitle: { color: C.navy, fontSize: 14, fontWeight: '800', marginTop: 2 },
  mapControls: { position: 'absolute', top: 160, right: 14, gap: 10 },
  mapControlButton: {
    width: 47, height: 47, borderRadius: 17, backgroundColor: C.white,
    elevation: 5, justifyContent: 'center', alignItems: 'center',
  },
  sheetContainer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: C.white, borderTopLeftRadius: 27,
    borderTopRightRadius: 27, paddingHorizontal: 17, paddingTop: 10,
    elevation: 12,
  },
  dragHandle: {
    alignSelf: 'center', width: 43, height: 5, borderRadius: 5,
    backgroundColor: '#DCE5E7', marginBottom: 14,
  },
  sheetHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBadge: {
    flexDirection: 'row', gap: 5, alignItems: 'center',
    borderRadius: 22, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: C.light,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: C.darkTeal },
  progressLabel: { fontSize: 12, fontWeight: '700', color: C.muted },
  progressTrack: {
    height: 6, backgroundColor: '#EDF2F2', borderRadius: 5,
    overflow: 'hidden', marginTop: 11,
  },
  progressFill: { height: '100%', backgroundColor: C.teal, borderRadius: 5 },
  stopInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  stopNumberBox: {
    width: 47, height: 47, borderRadius: 16,
    backgroundColor: C.darkTeal, alignItems: 'center', justifyContent: 'center',
  },
  stopNumberText: { color: C.white, fontSize: 23, fontWeight: '800' },
  stopTitle: { fontSize: 16, fontWeight: '800', color: C.navy, lineHeight: 21 },
  locationLine: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { color: C.muted, fontSize: 11, flex: 1, marginLeft: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 13, gap: 4 },
  metaText: { fontSize: 10.5, color: '#526C7D', fontWeight: '600', maxWidth: '43%' },
  metaDivider: { width: 1, height: 16, backgroundColor: '#E0E8ED', marginHorizontal: 5 },
  stopChips: { gap: 8, paddingVertical: 14 },
  stopChip: {
    borderRadius: 13, backgroundColor: '#EEF2F5',
    paddingHorizontal: 14, paddingVertical: 9,
  },
  selectedChip: { backgroundColor: C.darkTeal },
  stopChipText: { fontSize: 11, fontWeight: '800', color: C.navy },
  demoInfo: {
    backgroundColor: '#F3F6FC', borderRadius: 12,
    flexDirection: 'row', alignItems: 'flex-start', padding: 10,
  },
  demoInfoText: {
    flex: 1, marginLeft: 6, fontSize: 10.2, lineHeight: 15, color: '#64758A',
  },
  buttonRow: { flexDirection: 'row', gap: 10, paddingTop: 13, paddingBottom: 7 },
  outlineButton: {
    flex: 0.9, height: 51, backgroundColor: C.light, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  outlineButtonText: { color: C.darkTeal, fontSize: 12, fontWeight: '800' },
  mainButton: {
    flex: 1.3, height: 51, backgroundColor: C.darkTeal, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  mainButtonText: { color: C.white, fontSize: 12, fontWeight: '800' },
});
