import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import ScrollRestoration from '@/components/ScrollRestoration';
import { useProactiveRefresh } from '@/hooks/useProactiveRefresh';
import LandingPage from '@/pages/landing/LandingPage';
import AnimalsPage from '@/pages/animals/AnimalsPage';
import AnimalDetailPage from '@/pages/animals/AnimalDetailPage';
import VolunteersPage from '@/pages/volunteers/VolunteersPage';
import DonationsPage from '@/pages/donations/DonationsPage';
import BoardsPage from '@/pages/boards/BoardsPage';
import BoardDetailPage from '@/pages/boards/BoardDetailPage';
import BoardWritePage from '@/pages/boards/BoardWritePage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import MyPage from '@/pages/auth/MyPage';
import PreferencePage from '@/pages/auth/PreferencePage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminSignupPage from '@/pages/admin/AdminSignupPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import GuideAdoptionPage from '@/pages/guide/GuideAdoptionPage';
import GuideFosterPage from '@/pages/guide/GuideFosterPage';

function App() {
  useProactiveRefresh();
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollRestoration />
        <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* 입양 */}
        <Route path="/animals" element={<AnimalsPage />} />
        <Route path="/animals/:id" element={<AnimalDetailPage />} />
        {/* 절차 안내 */}
        <Route path="/guide/adoption" element={<GuideAdoptionPage />} />
        <Route path="/guide/foster" element={<GuideFosterPage />} />
        
        {/* 봉사 */}
        <Route path="/volunteers" element={<VolunteersPage />} />
        
        {/* 기부 */}
        <Route path="/donations" element={<DonationsPage />} />
        
        {/* 게시판 */}
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/boards/write" element={<BoardWritePage />} />
        <Route path="/boards/:id" element={<BoardDetailPage />} />
        
        {/* 인증 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/mypage/preferences" element={<PreferencePage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/signup" element={<AdminSignupPage />} />
        
        {/* 약관 */}
        <Route path="/privacy" element={<PlaceholderPage />} />
        <Route path="/terms" element={<PlaceholderPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
