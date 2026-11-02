import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// ==================== TYPES ====================

export type StopReview = {
  stopId: string;
  rating: number;
  comment: string;
  photos: string[];
};

type StopReviewCardProps = {
  stopId: string;
  stopTitle: string;
  /** Nhận xét đã gửi trước đó của điểm này (nếu có) */
  savedReview?: StopReview;
  onSubmit: (review: StopReview) => void;
};

// ==================== CONFIG ====================

const C = {
  darkTeal: '#006B67',
  navy: '#17344A',
  muted: '#75879A',
  white: '#FFFFFF',
  light: '#E6F8F4',
  star: '#F2B01E',
  surface: '#F3F6FC',
  border: '#E3E9EF',
};

const MAX_PHOTOS = 5;
const MAX_COMMENT = 300;
const RATING_LABELS = ['', 'Tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];

// ==================== COMPONENT ====================

export default function StopReviewCard({
  stopId,
  stopTitle,
  savedReview,
  onSubmit,
}: StopReviewCardProps) {
  const [rating, setRating] = useState(savedReview?.rating ?? 0);
  const [comment, setComment] = useState(savedReview?.comment ?? '');
  const [photos, setPhotos] = useState<string[]>(savedReview?.photos ?? []);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(!savedReview);

  const remaining = MAX_PHOTOS - photos.length;

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    setPhotos(previous =>
      [...previous, ...assets.map(asset => asset.uri)].slice(0, MAX_PHOTOS)
    );
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7,
      });
      if (!result.canceled) addAssets(result.assets);
    } catch {
      Alert.alert('Không mở được thư viện ảnh', 'Vui lòng thử lại.');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Chưa có quyền camera', 'Hãy cấp quyền camera trong Cài đặt để chụp ảnh.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled) addAssets(result.assets);
    } catch {
      Alert.alert('Không mở được camera', 'Thiết bị này có thể không hỗ trợ camera.');
    }
  };


  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Chưa chấm điểm', 'Hãy chọn số sao cho điểm này.');
      return;
    }
    onSubmit({ stopId, rating, comment: comment.trim(), photos });
    setEditing(false);
    setExpanded(false);
    Alert.alert('Đã gửi nhận xét', `Cảm ơn bạn đã đánh giá "${stopTitle}".`);
  };

  // ---------- Đã gửi: hiện tóm tắt ----------
  if (!editing && savedReview) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="check-decagram" size={17} color={C.darkTeal} />
          <Text style={styles.sentTitle}>Đã nhận xét</Text>
          <View style={styles.starsSmall}>
            {[1, 2, 3, 4, 5].map(value => (
              <MaterialCommunityIcons
                key={value}
                name={value <= savedReview.rating ? 'star' : 'star-outline'}
                size={14}
                color={C.star}
              />
            ))}
          </View>
          {savedReview.photos.length > 0 && (
            <Text style={styles.sentMeta}>· {savedReview.photos.length} ảnh</Text>
          )}
          <Pressable onPress={() => { setEditing(true); setExpanded(true); }} hitSlop={8}>
            <Text style={styles.editLink}>Sửa</Text>
          </Pressable>
        </View>
        {!!savedReview.comment && (
          <Text style={styles.sentComment} numberOfLines={2}>
            “{savedReview.comment}”
          </Text>
        )}
      </View>
    );
  }

  // ---------- Đang viết nhận xét ----------
  const showForm = expanded || rating > 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>Nhận xét điểm này</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map(value => (
            <Pressable
              key={value}
              onPress={() => setRating(value)}
              hitSlop={4}
              accessibilityLabel={`${value} sao`}
            >
              <MaterialCommunityIcons
                name={value <= rating ? 'star' : 'star-outline'}
                size={24}
                color={value <= rating ? C.star : '#B9C4CF'}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {!showForm ? (
        <Pressable onPress={() => setExpanded(true)} style={styles.collapsedHint}>
          <MaterialCommunityIcons name="camera-plus-outline" size={15} color={C.muted} />
          <Text style={styles.hintText}>Chấm sao, viết cảm nhận và gửi ảnh</Text>
        </Pressable>
      ) : (
        <>
          {rating > 0 && <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>}

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ cảm nhận của bạn về điểm này..."
            placeholderTextColor="#9AA8B5"
            multiline
            maxLength={MAX_COMMENT}
            style={styles.input}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}
            keyboardShouldPersistTaps="handled"
          >
            {remaining > 0 && (
              <>
                {/* Chụp ảnh mới bằng camera */}
                <Pressable
                  onPress={() => void takePhoto()}
                  style={styles.addPhoto}
                  accessibilityLabel="Chụp ảnh"
                >
                  <MaterialCommunityIcons name="camera-plus-outline" size={20} color={C.darkTeal} />
                  <Text style={styles.addPhotoText}>Chụp ảnh</Text>
                </Pressable>

                {/* Chọn ảnh có sẵn trong máy */}
                <Pressable
                  onPress={() => void pickFromLibrary()}
                  style={styles.addPhoto}
                  accessibilityLabel="Chọn ảnh từ thư viện"
                >
                  <MaterialCommunityIcons name="image-multiple-outline" size={20} color={C.darkTeal} />
                  <Text style={styles.addPhotoText}>Thư viện</Text>
                </Pressable>
              </>
            )}
            {photos.map((uri, index) => (
              <View key={`${uri}-${index}`}>
                <Image source={{ uri }} style={styles.photo} />
                <Pressable
                  onPress={() => setPhotos(previous => previous.filter((_, i) => i !== index))}
                  style={styles.removePhoto}
                  hitSlop={6}
                  accessibilityLabel="Xoá ảnh"
                >
                  <MaterialCommunityIcons name="close" size={12} color={C.white} />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.photoCount}>
            {photos.length}/{MAX_PHOTOS} ảnh{remaining === 0 ? ' · đã đủ' : ''}
          </Text>

          <Pressable
            onPress={handleSubmit}
            style={[styles.submit, rating === 0 && { opacity: 0.5 }]}
          >
            <MaterialCommunityIcons name="send" size={15} color={C.white} />
            <Text style={styles.submitText}>Gửi nhận xét</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: 12.5, fontWeight: '800', color: C.navy },
  stars: { flexDirection: 'row', gap: 2 },
  collapsedHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  hintText: { fontSize: 10.5, color: C.muted },
  ratingLabel: {
    alignSelf: 'flex-end', fontSize: 10.5, fontWeight: '700', color: '#B07A00', marginTop: 2,
  },
  input: {
    marginTop: 6, minHeight: 46, maxHeight: 80, backgroundColor: C.white,
    borderRadius: 11, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: C.navy,
    textAlignVertical: 'top',
  },
  photoRow: { gap: 8, paddingTop: 9 },
  addPhoto: {
    width: 62, height: 54, borderRadius: 11, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: '#9FD9CF', backgroundColor: C.light,
    alignItems: 'center', justifyContent: 'center',
  },
  addPhotoText: { fontSize: 9, fontWeight: '700', color: C.darkTeal, marginTop: 2 },
  photoCount: { fontSize: 10, color: C.muted, marginTop: 5 },
  photo: { width: 54, height: 54, borderRadius: 11 },
  removePhoto: {
    position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(23,52,74,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  submit: {
    marginTop: 10, height: 38, borderRadius: 11, backgroundColor: C.darkTeal,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  submitText: { color: C.white, fontSize: 12, fontWeight: '800' },
  starsSmall: { flexDirection: 'row', marginLeft: 6 },
  sentTitle: { fontSize: 12, fontWeight: '800', color: C.darkTeal, marginLeft: 5 },
  sentMeta: { fontSize: 10.5, color: C.muted, marginLeft: 4 },
  editLink: { fontSize: 11.5, fontWeight: '800', color: C.darkTeal, marginLeft: 'auto', paddingLeft: 10 },
  sentComment: { fontSize: 11, color: '#526C7D', marginTop: 5, fontStyle: 'italic' },
});
