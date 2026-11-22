/**
 * Cờ "vừa đăng nhập lần đầu sau khi đăng ký": màn Trang chủ thấy cờ này sẽ mở màn câu hỏi sở
 * thích ngay (giống web chuyển thẳng tới /preferences sau lần đăng nhập đầu tiên).
 */
let pending = false;

export function setPendingOnboarding(value: boolean): void {
  pending = value;
}

/** Đọc rồi xoá cờ */
export function takePendingOnboarding(): boolean {
  const value = pending;
  pending = false;
  return value;
}
