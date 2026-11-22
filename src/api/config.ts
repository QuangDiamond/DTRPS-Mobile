/**
 * Địa chỉ Backend (Spring Boot). Mặc định là máy host nhìn từ Android Emulator (10.0.2.2).
 * Máy thật: đặt EXPO_PUBLIC_API_URL=http://<IP LAN của máy chạy Backend>:8080/api trong file
 * .env của DTRPS-Mobile rồi chạy lại Metro (không dùng localhost/10.0.2.2 trên máy thật).
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api';

/** Thời gian chờ mặc định giống web (REQUEST_TIMEOUT_MS) */
export const REQUEST_TIMEOUT_MS = 20_000;
