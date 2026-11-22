# DTRPS-Mobile ↔ Web du khách — trạng thái đồng bộ

Mobile **chỉ phục vụ du khách** (không có khu Đối tác / Quản trị). Mọi màn hình gọi đúng API mà web du
khách (`DTRPS-Admin-Web/src/client/traveller`) đang gọi, nên một tài khoản du khách dùng chung được cả
hai nơi: kế hoạch, lịch trình, yêu thích, sở thích, đánh giá đều là cùng một dữ liệu trên Backend.

## Chạy app

```bash
npm install
# Máy thật: đặt IP LAN của máy chạy Backend (mặc định 10.0.2.2 = máy host của Android Emulator)
echo EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api > .env
# Bản đồ Goong giống web: EXPO_PUBLIC_GOONG_MAPTILES_KEY=<VITE_GOONG_MAPTILES_KEY của web> trong .env.local
npx expo prebuild --clean          # sinh lại thư mục android (quyền vị trí, ảnh, MapLibre)
npx expo run:android
```

Kiểm tra: `npx tsc --noEmit` và `npx eslint App.tsx src` phải sạch.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/api` | Bản mobile của `client/api` của web: `http.ts` (tự làm mới token khi 401), `authApi`, `userApi`, `placesApi`, `placeReviewApi`, `referenceApi`, `tripFlowApi`, `weatherApi`, `adApi`, `siteInfoApi`. Khi web thêm/đổi API, sửa file cùng tên ở đây. |
| `src/auth` | `AuthProvider` (phiên lưu bằng expo-secure-store, refresh token, revoke khi đăng xuất), `FavoritesProvider` (yêu thích lấy thẳng từ `/users/me/favorites`). |
| `src/navigation` | Stack gốc + 5 tab (Trang chủ, Khám phá, Chuyến đi, Yêu thích, Tài khoản). Khách chưa đăng nhập xem được Trang chủ, Khám phá, chi tiết địa điểm. |
| `src/screens` | Mỗi màn ứng với một trang web (bảng dưới). |
| `src/components`, `src/ui` | Thành phần dùng chung (bản đồ, thời tiết, đánh giá, form kế hoạch, nút, ô nhập, sheet…). |
| `src/ui/Typography.tsx` | Font Be Vietnam Pro giống web; luôn import `Text`/`TextInput` từ đây thay vì từ react-native. |
| `src/data/planTrip.ts` | Câu hỏi cá nhân hóa, người đồng hành, nhịp độ — chép từ `traveller/data/planTrip.ts` của web. |

## Màn hình ↔ trang web

| Web | Mobile |
|---|---|
| WelcomePage, LoginPage (cổng TRAVELLER), RegisterPage (OTP 3 bước), ForgotPasswordPage (OTP 3 bước) | `screens/auth/*` |
| HomePage (+ FeaturedPlaces, HomePlaceSearch) | `home/HomeScreen` |
| ExplorePage, PlaceDetailsPage (+ thời tiết, đánh giá, báo cáo đánh giá) | `explore/*` |
| FavoritesPage | `favorites/FavoritesScreen` |
| ProfilePage, EditProfilePage, ChangePasswordPage, SettingsPage | `profile/*` |
| TravelPreferencesPage | `preferences/PreferencesScreen` |
| PlanTripPage → GeneratingTripPage → SuggestedPlacesPage (+ cột đối tác) → SuggestionDetailPage → SelectedPlacesPage | `trips/PlanTrip…SelectedPlaces` |
| MyTripsPage, EditTripPlanPage | `trips/MyTripsScreen`, `trips/EditPlanScreen` |
| ItineraryOverviewPage (sửa hoạt động, dự báo 7 ngày, đánh giá chuyến đi) | `trips/ItineraryOverviewScreen` |
| ItineraryDetailPage (tiến độ ngày, cảnh báo thời tiết) | `trips/ItineraryDayScreen` |
| TripLiveMapPage (GPS + tuyến Goong, đã đến/bỏ qua, hoàn thành ngày) | `trips/LiveMapScreen` |
| Chuông thông báo (NotificationBell) | `notifications/NotificationsScreen` + chuông ở Trang chủ, mục Thông báo ở Tài khoản (hỏi lại số chưa đọc mỗi 60 giây thay cho realtime) |
| SiteAnnouncementBanner | `components/SiteAnnouncementBanner` ở đầu Trang chủ |

Không chuyển: `AddLocationPage` của web vẫn là dữ liệu mẫu (chưa gắn Backend).

Đăng nhập Google: dùng `@react-native-google-signin/google-signin` (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = client
web), gửi `idToken` lên `POST /auth/google` (Backend kiểm `aud` = client web). Cần thêm OAuth client loại
Android (package `com.dtrps.mobile` + SHA-1 của keystore) trong cùng project Google Cloud với client web.

Bản đồ: `@maplibre/maplibre-react-native` + style Goong (`EXPO_PUBLIC_GOONG_MAPTILES_KEY`), không có key thì dùng
nền CARTO giống web.
