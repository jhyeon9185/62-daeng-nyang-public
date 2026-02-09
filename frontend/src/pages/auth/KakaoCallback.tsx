import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

export default function KakaoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isProcessing = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      console.error('카카오 인가 코드가 없습니다.');
      navigate('/login');
      return;
    }

    if (isProcessing.current) return;
    isProcessing.current = true;

    const handleKakaoLogin = async () => {
      try {
        const response = await authApi.kakaoLogin(code);
        const data = response.data.data;

        login(data, { keepLoggedIn: true });

        navigate('/');
      } catch (error: unknown) {
        console.error('카카오 로그인 실패:', error);
        const errorMessage = error instanceof Error && (error as any).response?.data?.message 
          ? (error as any).response.data.message 
          : '카카오 로그인에 실패했습니다.';
        alert(errorMessage);
        navigate('/login');
      }
    };

    handleKakaoLogin();
  }, [searchParams, navigate, login]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      gap: '1rem',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3182f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ color: '#6b7684', fontSize: '1.25rem', fontWeight: 600 }}>
        카카오 로그인 처리 중...
      </p>
    </div>
  );
}
