// Dữ liệu mẫu cho màn Chuyến đi của tôi (chưa có backend)

export type TripStatus =
  | 'upcoming' // Đã chốt, sắp khởi hành
  | 'planned' // Đã lên lịch, còn xa ngày đi
  | 'draft' // Bản nháp, chưa hoàn thành
  | 'saved' // Lịch trình đã lưu (của người khác / gợi ý)
  | 'completed'; // Đã đi

export type Trip = {
  id: string;
  title: string;
  location: string;
  duration: string;
  image: string;
  status: TripStatus;
  /** Nhãn hiển thị trên ảnh, vd "Khởi hành sau 3 ngày" */
  statusLabel: string;
  dateRange?: string;
  guests: string;
  budget?: string;
  placeCount: number;
  hotelBooked?: number;
};

export const trips: Trip[] = [
  // ---------- Sắp tới ----------
  {
    id: 'my-khe',
    title: 'Tinh Hoa Di Sản & Biển Mỹ Khê',
    location: 'Đà Nẵng - Hội An',
    duration: '4 Ngày 3 Đêm',
    image:
      'https://images.unsplash.com/photo-1564596823821-79b97151055e?w=1200&q=80',
    status: 'upcoming',
    statusLabel: 'Khởi hành sau 3 ngày',
    dateRange: '24/10 - 27/10',
    guests: '2 người lớn',
    budget: '~7.800.000 đ',
    placeCount: 12,
    hotelBooked: 1,
  },
  {
    id: 'ha-long-trip',
    title: 'Hải Trình Kỳ Quan Vịnh Hạ Long',
    location: 'Hạ Long, Quảng Ninh',
    duration: '3 Ngày 2 Đêm',
    image:
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
    status: 'planned',
    statusLabel: 'Dự kiến 12/11/2024',
    dateRange: '12/11 - 14/11',
    guests: '4 người (Gia đình)',
    budget: '~12.500.000 đ',
    placeCount: 9,
  },
  {
    id: 'sa-pa-draft',
    title: 'Săn Mây & Mùa Lúa Chín Sa Pa',
    location: 'Sa Pa, Lào Cai',
    duration: '3 Ngày 2 Đêm',
    image:
      'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=1200&q=80',
    status: 'draft',
    statusLabel: 'Bản nháp',
    dateRange: 'Tháng 12/2024',
    guests: '2 người',
    placeCount: 8,
  },

  // ---------- Đã lưu ----------
  {
    id: 'hoi-an-saved',
    title: 'Ký Ức Di Sản Phố Cổ & Biển An Bàng',
    location: 'Hội An - Quảng Nam',
    duration: '3 Ngày 2 Đêm',
    image:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80',
    status: 'saved',
    statusLabel: 'Đã lưu vào danh sách',
    guests: '2 người lớn',
    budget: '~5.600.000 đ',
    placeCount: 9,
  },
  {
    id: 'saigon-saved',
    title: 'Sài Gòn Ẩm Thực Về Đêm',
    location: 'TP. Hồ Chí Minh',
    duration: '2 Ngày 1 Đêm',
    image:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80',
    status: 'saved',
    statusLabel: 'Đã lưu vào danh sách',
    guests: '2 người',
    budget: '~2.400.000 đ',
    placeCount: 7,
  },
  {
    id: 'ba-na-saved',
    title: 'Bà Nà Hills & Cầu Vàng Trong Mây',
    location: 'Đà Nẵng',
    duration: '2 Ngày 1 Đêm',
    image:
      'https://images.unsplash.com/photo-1564596823821-79b97151055e?w=1200&q=80',
    status: 'saved',
    statusLabel: 'Đã lưu vào danh sách',
    guests: '3 người',
    budget: '~4.200.000 đ',
    placeCount: 6,
  },

  // ---------- Đã đi ----------
  {
    id: 'ha-long-done',
    title: 'Du Thuyền Vịnh Lan Hạ',
    location: 'Hạ Long, Quảng Ninh',
    duration: '2 Ngày 1 Đêm',
    image:
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
    status: 'completed',
    statusLabel: 'Đã hoàn thành',
    dateRange: '02/09 - 03/09/2024',
    guests: '2 người lớn',
    budget: '6.100.000 đ',
    placeCount: 6,
  },
  {
    id: 'hoi-an-done',
    title: 'Hội An Đèn Lồng Mùa Trăng',
    location: 'Hội An - Quảng Nam',
    duration: '3 Ngày 2 Đêm',
    image:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80',
    status: 'completed',
    statusLabel: 'Đã hoàn thành',
    dateRange: '15/06 - 17/06/2024',
    guests: '4 người (Gia đình)',
    budget: '9.300.000 đ',
    placeCount: 10,
  },
];
