export type PlaceCategory = 'Biển đảo' | 'Thiên nhiên' | 'Văn hóa' | 'Ẩm thực';
export type Region = 'Tất cả' | 'Miền Bắc' | 'Miền Trung' | 'Miền Nam';
export interface Place { id: string; name: string; location: string; region: Exclude<Region,'Tất cả'>; category: PlaceCategory; price: number; rating: number; description: string; image: string; }
export interface DiscoveryFilters { query: string; region: Region; category: 'Tất cả' | PlaceCategory; maxPrice: number; minRating: number; }
export type RootStackParams = {
  StitchDetail: {id:string}; Login: undefined; Register: undefined; Main: undefined; Filters: undefined };
export type MainTabParams = {
  StitchDirectory: undefined; Home: undefined; Discovery: undefined };
