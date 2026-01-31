/**
 * 카카오 지도 컴포넌트
 * 주소 또는 위·경도로 보호소 위치 표시
 * .env에 VITE_MAP_API_KEY (카카오 JavaScript 키) 설정 필요
 */

import { useEffect, useRef, useState } from 'react';

const KAKAO_SCRIPT_URL = '//dapi.kakao.com/v2/maps/sdk.js';
const APP_KEY = import.meta.env.VITE_MAP_API_KEY;

declare global {
  interface Window {
    kakao?: {
      maps: {
        Map: new (container: HTMLElement, options: { center: any; level: number }) => any;
        LatLng: new (lat: number, lng: number) => any;
        Marker: new (options: { position: any }) => any;
        event: { addListener: (target: any, type: string, handler: () => void) => void };
        services: {
          Geocoder: new () => {
            addressSearch: (address: string, callback: (result: { x: string; y: string }[], status: string) => void) => void;
          };
          Status: { OK: string };
        };
      };
    };
  }
}

export interface KakaoMapProps {
  /** 보호소 주소 (위경도 없을 때 주소 검색으로 표시) */
  address?: string | null;
  /** 위도 (있으면 주소 검색 생략) */
  latitude?: number | null;
  /** 경도 */
  longitude?: number | null;
  /** 지도 높이 (px) */
  height?: number | string;
  className?: string;
}

function loadKakaoScript(): Promise<void> {
  if (window.kakao?.maps?.services) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="dapi.kakao.com"][src*="maps/sdk"]');
    if (existing) {
      const kakao = (window as any).kakao;
      if (kakao?.maps?.load) {
        kakao.maps.load(() => resolve());
      } else if (kakao?.maps?.services) {
        resolve();
      } else {
        setTimeout(() => resolve(), 500);
      }
      return;
    }
    const script = document.createElement('script');
    script.src = `https:${KAKAO_SCRIPT_URL}?appkey=${APP_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      const kakao = (window as any).kakao;
      if (!kakao?.maps) {
        reject(new Error('Kakao Maps SDK not available'));
        return;
      }
      if (kakao.maps.load) {
        kakao.maps.load(() => resolve());
      } else {
        resolve();
      }
    };
    script.onerror = () => reject(new Error('Failed to load Kakao Maps script'));
    document.head.appendChild(script);
  });
}

export default function KakaoMap({
  address,
  latitude,
  longitude,
  height = 280,
  className = '',
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!APP_KEY || APP_KEY === 'your_map_api_key_here') {
      setError('지도 API 키가 설정되지 않았습니다.');
      return;
    }
    const hasCoords = latitude != null && longitude != null;
    if (!hasCoords && (!address || !address.trim())) {
      setError('표시할 주소가 없습니다.');
      return;
    }

    let cancelled = false;
    loadKakaoScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const kakao = (window as any).kakao;
        if (!kakao?.maps?.services?.Geocoder) {
          setError('지도 서비스(Geocoder)를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.');
          return;
        }
        const geocoder = new kakao.maps.services.Geocoder();

        const showMap = (lat: number, lng: number) => {
          if (!containerRef.current) return;
          const center = new kakao.maps.LatLng(lat, lng);
          const map = new kakao.maps.Map(containerRef.current, {
            center,
            level: 3,
          });
          const marker = new kakao.maps.Marker({ position: center });
          marker.setMap(map);
          mapRef.current = map;
        };

        if (hasCoords) {
          showMap(latitude!, longitude!);
          return;
        }
        geocoder.addressSearch(address!.trim(), (result: unknown, status: unknown) => {
          if (cancelled) return;
          const arr = Array.isArray(result) ? result : [];
          if (status === kakao.maps.services.Status.OK && arr[0]) {
            const lat = parseFloat(arr[0].y);
            const lng = parseFloat(arr[0].x);
            showMap(lat, lng);
          } else {
            setError('주소를 찾을 수 없습니다.');
          }
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || '지도를 불러올 수 없습니다.');
      });

    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, [address, latitude, longitude]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-500 rounded-xl ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden bg-gray-100 ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      aria-label="보호소 위치 지도"
    />
  );
}
