/**
 * 찜(즐겨찾기) 버튼 - 하트 아이콘
 * 로그인 시 토글, 비로그인 시 클릭 시 로그인 페이지로 이동
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoriteApi } from '@/api';
import { useAuthStore } from '@/store/authStore';

interface FavoriteButtonProps {
  animalId: number;
  isFavorited: boolean;
  onToggle?: (newState: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-6 h-6 p-1',
  md: 'w-8 h-8 p-1.5',
  lg: 'w-10 h-10 p-2',
};

export default function FavoriteButton({
  animalId,
  isFavorited,
  onToggle,
  className = '',
  size = 'md',
}: FavoriteButtonProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      return; // 비로그인 시 Link로 이동 (아래에서 처리)
    }

    if (loading) return;
    setLoading(true);
    try {
      const newState = !favorited;
      if (newState) {
        await favoriteApi.add(animalId);
      } else {
        await favoriteApi.remove(animalId);
      }
      setFavorited(newState);
      onToggle?.(newState);
    } catch {
      // 에러 시 토스트 등 가능
    } finally {
      setLoading(false);
    }
  };

  const btn = (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-full flex items-center justify-center transition-colors ${
        favorited ? 'text-red-500 hover:text-red-600 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
      } ${sizeClasses[size]} ${className}`}
      aria-label={favorited ? '찜 해제' : '찜하기'}
    >
      {favorited ? (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate('/login', { state: { from: `/animals/${animalId}` } });
        }}
        className={`inline-flex rounded-full items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ${sizeClasses[size]} ${className}`}
        aria-label="로그인 후 찜하기"
      >
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    );
  }

  return btn;
}
