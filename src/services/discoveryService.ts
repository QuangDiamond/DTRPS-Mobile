import { mockPlaces } from '../mocks/places';
import type { DiscoveryFilters, Place } from '../types';
// Adapter dữ liệu: khi có API thật, chỉ thay nội dung hàm này.
export async function getPlaces(filters: DiscoveryFilters): Promise<Place[]> {
 const q = filters.query.trim().toLocaleLowerCase('vi-VN');
 return mockPlaces.filter(p => (!q || `${p.name} ${p.location} ${p.description}`.toLocaleLowerCase('vi-VN').includes(q)) && (filters.region === 'Tất cả' || p.region === filters.region) && (filters.category === 'Tất cả' || p.category === filters.category) && p.price <= filters.maxPrice && p.rating >= filters.minRating);
}
