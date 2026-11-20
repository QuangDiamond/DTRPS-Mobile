// Cấu hình kết nối Backend thật (Spring Boot). Android Emulator dùng 10.0.2.2 để trỏ về
// localhost của máy host; thiết bị thật (USB/WiFi) phải đổi thành địa chỉ LAN của máy chạy
// Backend (ví dụ 'http://192.168.1.5:8080/api'), KHÔNG dùng localhost/10.0.2.2.
export const API_BASE_URL = 'http://10.0.2.2:8080/api';

export const DEFAULT_TIMEOUT_MS = 15_000;

// Gợi ý AI (OpenAI embedding + truy vấn pgvector) chậm hơn CRUD thông thường.
export const RECOMMENDATION_TIMEOUT_MS = 60_000;
