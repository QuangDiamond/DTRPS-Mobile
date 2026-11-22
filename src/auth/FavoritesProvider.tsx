import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { userApi } from '../api/userApi';
import { useRootNav } from '../navigation/hooks';
import { useAuth } from './AuthProvider';

interface FavoritesValue {
  favoriteIds: Set<number>;
  isFavorite: (placeId: number) => boolean;
  /** Khách chưa đăng nhập → chuyển sang Đăng nhập (giống web) */
  toggleFavorite: (placeId: number) => void;
  /** Đọc lại danh sách từ Backend (sau khi bỏ yêu thích ở màn khác…) */
  reload: () => void;
  version: number;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

const PAGE = 100;
const MAX_PAGES = 10;

/**
 * Địa điểm yêu thích lấy thẳng từ Backend (/users/me/favorites) nên web và mobile luôn cùng một
 * danh sách. Bấm tim cập nhật giao diện ngay rồi lưu ở nền (PUT/DELETE lặp lại không lỗi).
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigation = useRootNav();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    let active = true;
    (async () => {
      const ids = new Set<number>();
      for (let page = 0; page < MAX_PAGES; page++) {
        const result = await userApi.favorites({ page, size: PAGE });
        result.items.forEach((item) => ids.add(item.id));
        if ((page + 1) * PAGE >= result.total) break;
      }
      if (active) setFavoriteIds(ids);
    })().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user, version]);

  const toggleFavorite = useCallback(
    (placeId: number) => {
      if (!user) {
        navigation.navigate('Login', { notice: 'Đăng nhập để lưu địa điểm yêu thích' });
        return;
      }
      const adding = !favoriteIds.has(placeId);
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (adding) next.add(placeId);
        else next.delete(placeId);
        return next;
      });
      (adding ? userApi.addFavorite(placeId) : userApi.removeFavorite(placeId)).catch(() => {
        // Lưu thất bại: trả lại trạng thái cũ
        setFavoriteIds((current) => {
          const next = new Set(current);
          if (adding) next.delete(placeId);
          else next.add(placeId);
          return next;
        });
      });
    },
    [user, navigation, favoriteIds],
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      isFavorite: (placeId: number) => favoriteIds.has(placeId),
      toggleFavorite,
      reload,
      version,
    }),
    [favoriteIds, toggleFavorite, reload, version],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites phải nằm trong FavoritesProvider');
  return value;
}
