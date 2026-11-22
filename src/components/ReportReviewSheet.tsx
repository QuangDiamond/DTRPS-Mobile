import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Typography';
import { errorMessage } from '../api/http';
import { placeReviewApi, REPORT_REASONS, type PlaceReview, type ReviewReportReason } from '../api/placeReviewApi';
import { colors } from '../theme';
import { Sheet } from '../ui/Bits';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/States';

/** Báo cáo đánh giá của người khác — giống ReportReviewDialog của web */
export default function ReportReviewSheet({
  placeId,
  review,
  onClose,
  onReported,
}: {
  placeId: number;
  review: PlaceReview | null;
  onClose: () => void;
  onReported: (reviewId: number) => void;
}) {
  const [reason, setReason] = useState<ReviewReportReason | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setReason(null);
    setNote('');
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!review || !reason) {
      setError('Hãy chọn lý do báo cáo.');
      return;
    }
    if (reason === 'OTHER' && !note.trim()) {
      setError('Hãy ghi rõ lý do.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await placeReviewApi.report(placeId, review.reviewId, { reason, note: note.trim() || null });
      onReported(review.reviewId);
      close();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={review !== null}
      onClose={close}
      title="Báo cáo đánh giá"
      footer={<Button title="Gửi báo cáo" variant="danger" loading={busy} onPress={() => void submit()} />}
    >
      <Text className="mb-3 text-[12.5px] leading-5 text-[#557080]">
        Quản trị viên sẽ xem xét đánh giá của {review?.userName ?? 'người dùng này'}. Mỗi người chỉ báo
        cáo một đánh giá một lần.
      </Text>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {REPORT_REASONS.map((item) => {
        const selected = reason === item.value;
        return (
          <Pressable
            key={item.value}
            onPress={() => setReason(item.value)}
            style={{
              borderColor: selected ? colors.danger : colors.line,
              backgroundColor: selected ? colors.dangerSoft : '#FFFFFF',
            }}
            className="mb-2 flex-row items-center gap-3 rounded-xl border p-3"
          >
            <Icon
              name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={20}
              color={selected ? colors.danger : '#A5B6BE'}
            />
            <View className="min-w-0 flex-1">
              <Text className="text-[13px] font-bold text-[#0F2A3B]">{item.label}</Text>
              <Text className="text-[11.5px] text-[#557080]">{item.hint}</Text>
            </View>
          </Pressable>
        );
      })}
      {reason === 'OTHER' ? (
        <Field label="Ghi chú" value={note} onChangeText={setNote} multiline maxLength={500} placeholder="Mô tả vấn đề" />
      ) : null}
    </Sheet>
  );
}
