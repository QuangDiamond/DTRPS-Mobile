export type AppLanguage = 'vi' | 'en';

/**
 * Từ điển dịch chính xác các nhãn UI Du khách (Tiếng Việt → English).
 * Chỉ chứa chuỗi giao diện cố định — dữ liệu từ DB/API (tên địa điểm, nhận xét, hướng dẫn Goong)
 * không nằm trong bảng này nên luôn được giữ nguyên.
 */
const EXACT_VI_TO_EN: Record<string, string> = {
  // Tabs & Điều hướng
  'Trang chủ': 'Home',
  'Khám phá': 'Explore',
  'Chuyến đi': 'Trips',
  'Yêu thích': 'Favorites',
  'Tài khoản': 'Account',
  'Hồ sơ': 'Profile',
  'Quay lại': 'Back',
  Đóng: 'Close',
  Hủy: 'Cancel',
  'Xác nhận': 'Confirm',
  Lưu: 'Save',
  'Lưu thay đổi': 'Save changes',
  'Thử lại': 'Retry',
  'Xem tất cả': 'See all',
  'Đang tải…': 'Loading…',
  'Đang tải...': 'Loading...',
  'Đang tải thêm…': 'Loading more…',
  'Đang mở…': 'Opening…',

  // Đăng nhập / Đăng ký / Chào mừng
  'Đăng nhập': 'Sign in',
  'Đăng ký': 'Sign up',
  'Đăng xuất': 'Sign out',
  'Quên mật khẩu?': 'Forgot password?',
  'Quên mật khẩu': 'Forgot password',
  'Tiếp tục với Google': 'Continue with Google',
  'Khám phá không cần đăng nhập': 'Explore as guest',
  'Chưa có tài khoản?': "Don't have an account?",
  'Đã có tài khoản?': 'Already have an account?',
  'Mật khẩu': 'Password',
  'Nhập mật khẩu': 'Enter password',
  'Xác nhận mật khẩu': 'Confirm password',
  'Họ và tên': 'Full name',
  'Số điện thoại': 'Phone number',
  'Gửi mã OTP': 'Send OTP code',
  'Xác thực OTP': 'Verify OTP',
  'Đổi mật khẩu': 'Change password',
  'Đổi mật khẩu đăng nhập': 'Update login password',

  // Trang chủ
  'Việt Nam theo cách': 'Vietnam, your own',
  'của riêng bạn': 'way',
  'Tìm địa điểm, nhận gợi ý cá nhân hóa và để SmartTravel sắp xếp lịch trình theo sở thích, ngân sách của bạn.':
    'Discover places, get personalized AI suggestions, and let SmartTravel organize your itinerary by your interests and budget.',
  'Lập kế hoạch với AI': 'Plan with AI',
  'Được tài trợ': 'Sponsored',
  'Đối tác đã xác minh': 'Verified partner',
  'Mới trên SmartTravel': 'New on SmartTravel',
  'Khám phá ngay': 'Explore now',
  'CHUYẾN ĐI SẮP TỚI': 'UPCOMING TRIP',
  'Chuyến đi sắp tới': 'Upcoming trip',
  'ĐANG DIỄN RA': 'IN PROGRESS',
  'Xem chuyến đi': 'View trip',
  'Hoàn thiện sở thích du lịch': 'Complete travel preferences',
  'Càng hiểu bạn, gợi ý càng sát: chế độ ăn, người đi cùng, nhu cầu đặc biệt…':
    'The more we know you, the better our suggestions: diet, companions, special needs…',
  'Thiết lập sở thích': 'Set preferences',
  'Vừa cập nhật': 'Just updated',
  'VỪA CẬP NHẬT': 'JUST UPDATED',
  'Mới có trên SmartTravel': 'New on SmartTravel',
  'Cách hoạt động': 'How it works',
  '3 bước để có lịch trình hoàn chỉnh': '3 steps to a complete itinerary',
  'Cho chúng tôi biết bạn thích gì': 'Tell us what you like',
  'Chọn điểm đến, ngân sách, người đi cùng và kiểu trải nghiệm bạn mong muốn.':
    'Choose destination, budget, companions, and your preferred travel style.',
  'AI gợi ý kèm % phù hợp': 'AI picks with match %',
  'Mỗi địa điểm có độ phù hợp và lý do được gợi ý, bạn tự do thêm hay bỏ.':
    'Each place includes a match score and reason — freely add or remove.',
  'Lịch trình tự chia theo ngày': 'Auto day-by-day schedule',
  'Hệ thống sắp xếp thứ tự, giờ giấc và cảnh báo nếu một ngày quá dày.':
    'Automatically arranges order, timing, and warns if a day is too packed.',
  'địa điểm': 'places',
  'tỉnh thành': 'provinces',
  'gợi ý': 'suggestions',
  'Tìm địa điểm, ví dụ: Chùa Hương, Hồ Tây…': 'Search places, e.g. West Lake…',
  'Tìm địa điểm, ví dụ: Chùa Hương, Hồ Tây...': 'Search places, e.g. West Lake...',
  // 34 tỉnh/thành Việt Nam
  'Hà Nội': 'Ha Noi',
  Huế: 'Hue',
  'Hải Phòng': 'Hai Phong',
  'Đà Nẵng': 'Da Nang',
  'TP. Hồ Chí Minh': 'Ho Chi Minh City',
  'Cần Thơ': 'Can Tho',
  'Lai Châu': 'Lai Chau',
  'Điện Biên': 'Dien Bien',
  'Sơn La': 'Son La',
  'Lạng Sơn': 'Lang Son',
  'Quảng Ninh': 'Quang Ninh',
  'Thanh Hóa': 'Thanh Hoa',
  'Nghệ An': 'Nghe An',
  'Hà Tĩnh': 'Ha Tinh',
  'Cao Bằng': 'Cao Bang',
  'Tuyên Quang': 'Tuyen Quang',
  'Lào Cai': 'Lao Cai',
  'Thái Nguyên': 'Thai Nguyen',
  'Phú Thọ': 'Phu Tho',
  'Bắc Ninh': 'Bac Ninh',
  'Hưng Yên': 'Hung Yen',
  'Ninh Bình': 'Ninh Binh',
  'Quảng Trị': 'Quang Tri',
  'Quảng Ngãi': 'Quang Ngai',
  'Gia Lai': 'Gia Lai',
  'Khánh Hòa': 'Khanh Hoa',
  'Lâm Đồng': 'Lam Dong',
  'Đắk Lắk': 'Dak Lak',
  'Đồng Nai': 'Dong Nai',
  'Tây Ninh': 'Tay Ninh',
  'Vĩnh Long': 'Vinh Long',
  'Đồng Tháp': 'Dong Thap',
  'Cà Mau': 'Ca Mau',
  'An Giang': 'An Giang',

  // Danh mục tham chiếu cố định từ DB (nhóm loại hình, loại hình con, sở thích, phương tiện, nhu cầu)
  'Lưu trú': 'Stays',
  'Ẩm thực': 'Food & Drink',
  'Vui chơi & Tham quan': 'Attractions',
  'Mua sắm & Đặc sản': 'Shopping & Specialties',
  'Khách sạn': 'Hotel',
  'Nhà hàng': 'Restaurant',
  'Quán cà phê': 'Cafe',
  'Quán ăn địa phương': 'Local Eatery',
  'Di tích & Di sản': 'Heritage & History',
  'Khu vui chơi': 'Amusement Park',
  'Công viên': 'Park',
  'Danh lam thắng cảnh': 'Scenic Spot',
  'Điểm check-in': 'Check-in Spot',
  'Chợ đêm': 'Night Market',
  'Cửa hàng đặc sản': 'Specialty Store',
  'Cửa hàng lưu niệm': 'Souvenir Shop',
  'Làng nghề': 'Craft Village',
  'Thiên nhiên & Ngoài trời': 'Nature & Outdoors',
  'Văn hóa & Lịch sử': 'Culture & History',
  'Chụp ảnh': 'Photography',
  'Mua sắm': 'Shopping',
  'Cuộc sống về đêm': 'Nightlife',
  Biển: 'Beach',
  'Máy bay': 'Flight',
  'Tàu hỏa': 'Train',
  'Xe khách': 'Bus',
  'Đi bộ': 'Walking',
  'Ăn chay': 'Vegetarian',
  'Phù hợp trẻ em': 'Kid-friendly',
  'Phù hợp người lớn tuổi': 'Senior-friendly',
  'Thân thiện với thú cưng': 'Pet-friendly',
  'Người khuyết tật': 'Accessible',
  'Nhóm đông người': 'Large group',
  'Hạn chế vận động mạnh': 'Low physical effort',
  'Ưu tiên không gian yên tĩnh': 'Quiet space preferred',
  'Tìm địa điểm theo tên, ví dụ: Chùa Hương, Hồ Tây...':
    'Search places by name, e.g. Huong Pagoda, West Lake...',
  'Tìm địa điểm du lịch, món ăn, khách sạn…': 'Search places, food, hotels…',

  // Khám phá & Bộ lọc
  'Khám phá Việt Nam': 'Explore Vietnam',
  'Bạn muốn đi đâu?': 'Where do you want to go?',
  'Nhập tỉnh/thành, ví dụ: Đà Nẵng': 'Enter province/city, e.g. Da Nang',
  'Điều gì khiến bạn hứng thú?': 'What interests you?',
  'Tất cả địa điểm': 'All places',
  'Bộ lọc': 'Filters',
  'Tinh chỉnh trải nghiệm': 'Refine experience',
  'Đặt lại': 'Reset',
  'Xem kết quả': 'Show results',
  'Khám phá tất cả': 'Explore all',
  'Chưa tìm thấy điểm đến phù hợp': 'No matching places found',
  'Thử bỏ bớt bộ lọc hoặc chọn tỉnh/thành khác.':
    'Try clearing filters or choosing another province.',
  'Địa chỉ đang cập nhật': 'Address updating',
  'Chưa có địa chỉ': 'No address yet',
  Mới: 'New',
  'Điểm đến': 'Destination',
  'Việt Nam': 'Vietnam',

  // Chi tiết địa điểm
  'Chi tiết điểm đến': 'Place details',
  'Chi tiết địa điểm': 'Place details',
  'Đang mở cửa': 'Open now',
  'Đã đóng cửa': 'Closed',
  'Mở cả ngày': 'Open all day',
  'Đóng cửa hôm nay': 'Closed today',
  'Cả ngày': 'All day',
  'Chưa có giá': 'No price info',
  'Miễn phí': 'Free',
  'Chưa cập nhật': 'Not updated',
  'Giờ mở cửa': 'Opening hours',
  'Giá tham khảo': 'Reference price',
  'Điện thoại': 'Phone',
  'Trang web': 'Website',
  'Giới thiệu': 'About',
  'Vị trí & Đường đi': 'Location & Directions',
  'Mở Bản Đồ': 'Open Map',
  'Chỉ đường': 'Directions',
  'Đánh giá địa điểm': 'Place reviews',
  'Viết đánh giá': 'Write a review',
  'Gửi đánh giá': 'Submit review',
  'Báo cáo đánh giá': 'Report review',
  'Không tìm thấy địa điểm': 'Place not found',
  'Địa điểm có thể đã bị ẩn hoặc xoá.': 'This place may have been hidden or removed.',
  'Thứ 2': 'Monday',
  'Thứ 3': 'Tuesday',
  'Thứ 4': 'Wednesday',
  'Thứ 5': 'Thursday',
  'Thứ 6': 'Friday',
  'Thứ 7': 'Saturday',
  'Chủ nhật': 'Sunday',
  'Vé vào cổng': 'Entrance ticket',
  'Giá phòng / đêm': 'Room / night',
  'Giá món / bữa ăn': 'Avg. meal',
  'Giá đồ uống': 'Avg. drink',
  Khác: 'Other',

  // Yêu thích
  'Địa điểm yêu thích': 'Favorite places',
  'Chưa có địa điểm yêu thích': 'No favorite places yet',
  'Bấm vào trái tim trên địa điểm bạn thích để lưu lại xem sau.':
    'Tap the heart icon on places you like to save them for later.',
  'Không có địa điểm nào trong nhóm này': 'No places in this category',
  'Khám phá địa điểm': 'Explore places',
  'Tất cả': 'All',
  'Lưu gần đây': 'Recently saved',
  'Đánh giá cao': 'Top rated',

  // Chuyến đi & Lập kế hoạch
  'Chuyến đi của tôi': 'My trips',
  'Các kế hoạch đã lưu trong tài khoản Smart Travel': 'Saved plans in your SmartTravel account',
  'Mở chuyến đi': 'Open trip',
  'Đang kiểm tra...': 'Checking...',
  'Tạo chuyến đi mới': 'Create new trip',
  'Chưa có kế hoạch nào': 'No trips yet',
  'Chưa có chuyến đi nào kết thúc': 'No finished trips yet',
  'Đang lên kế hoạch': 'Planning',
  'Đã hoàn thành': 'Completed',
  'Đang diễn ra': 'In progress',
  'Sắp tới': 'Upcoming',
  'Kết thúc': 'Finished',
  'Thời gian': 'Duration',
  'Số người': 'Group size',
  'Còn lại': 'Remaining',
  'Kế hoạch của tôi': 'My plan',
  'Lập kế hoạch chuyến đi': 'Plan a trip',
  'Tạo lịch trình': 'Generate itinerary',
  'Sửa kế hoạch': 'Edit plan',
  'Địa điểm gợi ý': 'Suggested places',
  'Địa điểm đã chọn': 'Selected places',
  'Lịch trình chi tiết': 'Itinerary details',
  'Tổng quan lịch trình': 'Itinerary overview',
  'Chưa có chi phí ước tính': 'No estimated cost',

  // Bản đồ & Dẫn đường
  'Ô tô': 'Car',
  'Xe máy': 'Motorbike',
  'Bắt đầu đi': 'Start',
  'Bắt đầu dẫn đường': 'Start navigation',
  Thoát: 'Exit',
  'Các bước': 'Steps',
  'Tuyến đường Goong': 'Goong route',
  'Tính lại': 'Recalculate',
  'Tuyến nhanh nhất': 'Fastest route',
  'Đổi cây xăng': 'Change station',
  'Về tuyến chính': 'Back to main route',
  'Tiếp tục bám theo': 'Recenter',
  'Toàn tuyến': 'Overview',
  'Rẽ qua': 'Detour',
  'Đổi sang': 'Switch',
  'Đang chọn': 'Selected',
  'Cây xăng gần bạn (≤ 5 km)': 'Nearby gas stations (≤ 5 km)',
  'Đang tìm cây xăng gần vị trí của bạn...': 'Searching for nearby gas stations...',
  'Bỏ qua': 'Skip',
  'Đã đến · Tiếp tục': 'Arrived · Next',
  'Hoàn thành ngày': 'Complete day',
  'ĐIỂM TIẾP THEO': 'NEXT STOP',
  'Điểm tiếp theo': 'Next stop',
  'Sau đó:': 'Then:',
  'Bản đồ': 'Map',
  'Vệ tinh': 'Satellite',

  // Thông báo
  'Thông báo': 'Notifications',
  'Đọc tất cả': 'Mark all read',
  'Chưa đọc': 'Unread',
  'Chưa có thông báo nào': 'No notifications yet',
  'Không có thông báo chưa đọc': 'No unread notifications',
  'Thời tiết': 'Weather',
  'Đánh giá': 'Reviews',
  'Niêm yết': 'Listings',
  'Quảng cáo': 'Ads',

  // Hồ sơ & Cài đặt
  'Du khách': 'Traveller',
  'Đối tác': 'Partner',
  'Quản trị viên': 'Admin',
  'HÀNH TRÌNH & YÊU THÍCH': 'TRIPS & FAVORITES',
  'CÀI ĐẶT & TIỆN ÍCH': 'SETTINGS & UTILITIES',
  'Chỉnh sửa hồ sơ': 'Edit profile',
  'Cập nhật thông tin cá nhân & ảnh': 'Update personal info & photo',
  'Quản lý kế hoạch & lịch trình': 'Manage plans & itineraries',
  'Bộ sưu tập điểm đến & quán ăn': 'Saved places & restaurants',
  'Sở thích du lịch': 'Travel preferences',
  'Trải nghiệm, phong cách, yêu cầu đặc biệt': 'Experiences, style, special needs',
  'Cập nhật đánh giá, chuyến đi & hệ thống': 'Reviews, trips & system updates',
  'Bảo mật tài khoản': 'Account security',
  'Cài đặt ứng dụng': 'App settings',
  'Thông báo, định vị, hỗ trợ': 'Notifications, permissions, support',
  'Đăng xuất khỏi thiết bị này': 'Sign out from this device',
  'Điểm đã lưu': 'Saved places',
  'NGÔN NGỮ': 'LANGUAGE',
  'Ngôn ngữ': 'Language',
  'Chọn ngôn ngữ hiển thị cho ứng dụng': 'Choose display language for the app',
  'THÔNG BÁO & QUYỀN ỨNG DỤNG': 'NOTIFICATIONS & PERMISSIONS',
  'Thông báo đẩy': 'Push notifications',
  'Cập nhật quan trọng về tài khoản': 'Important account & trip updates',
  'Nhắc lịch trình': 'Trip reminders',
  'Nhắc trước ngày khởi hành & đánh giá chuyến': 'Remind before departure & trip review',
  'Cảnh báo thời tiết': 'Weather alerts',
  'Khi thời tiết ảnh hưởng lịch trình': 'When bad weather affects your itinerary',
  'Quyền ứng dụng (GPS & Thông báo)': 'App permissions (GPS & Notifications)',
  'Mở cài đặt hệ thống để cấp lại quyền vị trí, thông báo':
    'Open system settings to manage location & notification permissions',
  'HỖ TRỢ & THÔNG TIN': 'SUPPORT & INFO',
  'Tổng đài hỗ trợ': 'Support hotline',
  'Email hỗ trợ': 'Support email',
  'Phiên bản': 'Version',
  'Tài khoản của bạn': 'Your account',
  'Đăng nhập để quản lý hồ sơ, chuyến đi và sở thích du lịch.':
    'Sign in to manage your profile, trips, and travel preferences.',
  'Đăng nhập để lưu và xem lại các địa điểm bạn thích.':
    'Sign in to save and revisit your favorite places.',
};

/** Dịch các chuỗi UI có số / biến động (vd. "Xin chào, Nam 👋", "Còn 4 ngày nữa", "2 người") */
export function translateViToEn(input: string): string {
  const trimmed = input.replace(/\s+/g, ' ').trim();
  if (!trimmed) return input;

  const exact = EXACT_VI_TO_EN[trimmed];
  if (exact) return exact;

  // Các mẫu câu động phổ biến
  let m: RegExpMatchArray | null;

  if ((m = trimmed.match(/^Xin chào,\s*(.+?)\s*👋$/))) {
    return `Hello, ${m[1] === 'bạn' ? 'there' : m[1]} 👋`;
  }
  if ((m = trimmed.match(/^Còn\s+(\d+)\s+ngày nữa$/))) {
    return `${m[1]} days left`;
  }
  if ((m = trimmed.match(/^(\d+)\s+người$/))) {
    return `${m[1]} ${Number(m[1]) === 1 ? 'person' : 'people'}`;
  }
  if ((m = trimmed.match(/^(\d+)\s+điểm$/))) {
    return `${m[1]} places`;
  }
  if ((m = trimmed.match(/^(\d+)\s+sắp tới$/))) {
    return `${m[1]} upcoming`;
  }
  if ((m = trimmed.match(/^(\d+)\s+loại hình$/))) {
    return `${m[1]} categories`;
  }
  if ((m = trimmed.match(/^(\d+)\s+chưa đọc$/))) {
    return `${m[1]} unread`;
  }
  if ((m = trimmed.match(/^(\d+)\s+đánh giá$/))) {
    return `${m[1]} reviews`;
  }
  if ((m = trimmed.match(/^·\s*(\d+)\s+đánh giá$/))) {
    return `· ${m[1]} reviews`;
  }
  if ((m = trimmed.match(/^(\d+)\s*\/\s*(\d+)\s+địa điểm$/))) {
    return `${m[1]} / ${m[2]} places`;
  }
  if ((m = trimmed.match(/^Địa điểm tại\s+(.+)$/))) {
    return `Places in ${m[1]}`;
  }
  if ((m = trimmed.match(/^Dự báo thời tiết\s+(\d+)\s+ngày$/))) {
    return `${m[1]}-day weather forecast`;
  }
  if ((m = trimmed.match(/^Chọn tuyến đường\s*\((\d+)\s+tuyến\)$/))) {
    return `Choose route (${m[1]} routes)`;
  }
  if ((m = trimmed.match(/^Tuyến\s+(\d+)$/))) {
    return `Route ${m[1]}`;
  }
  if ((m = trimmed.match(/^Ngày\s+(\d+)$/))) {
    return `Day ${m[1]}`;
  }
  if ((m = trimmed.match(/^Cách\s+(.+)$/))) {
    return `${m[1]} away`;
  }
  if ((m = trimmed.match(/^Từ\s+(.+)$/))) {
    return `From ${m[1]}`;
  }
  if ((m = trimmed.match(/^(\d+)\s+phút trước$/))) {
    return `${m[1]} min ago`;
  }
  if ((m = trimmed.match(/^(\d+)\s+giờ trước$/))) {
    return `${m[1]} hr ago`;
  }
  if ((m = trimmed.match(/^(\d+)\s+ngày trước$/))) {
    return `${m[1]}d ago`;
  }
  if (trimmed === 'Vừa xong') {
    return 'Just now';
  }
  if ((m = trimmed.match(/^Xem thêm đánh giá\s*\((\d+)\)$/))) {
    return `Load more reviews (${m[1]})`;
  }
  if ((m = trimmed.match(/^Bắt đầu chuyến đi — Ngày\s+(\d+)$/))) {
    return `Start trip — Day ${m[1]}`;
  }
  if ((m = trimmed.match(/^đến\s+(.+)$/))) {
    return `to ${m[1]}`;
  }
  if ((m = trimmed.match(/^([^·]+?)\s*·\s*(.+)$/))) {
    const rawLeft = m[1].trim();
    const rawRight = m[2].trim();
    const left = EXACT_VI_TO_EN[rawLeft] ?? rawLeft;
    const right = EXACT_VI_TO_EN[rawRight] ?? rawRight;
    if (left !== rawLeft || right !== rawRight) return `${left} · ${right}`;
  }

  return input;
}
