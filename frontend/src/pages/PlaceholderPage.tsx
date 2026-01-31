import { Link, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const labels: Record<string, string> = {
  animals: '입양',
  volunteers: '봉사',
  donations: '기부',
  boards: '게시판',
  login: '로그인',
  signup: '회원가입',
  'admin/login': '관리자 로그인',
  privacy: '개인정보처리방침',
  terms: '이용약관',
};

export default function PlaceholderPage() {
  const pathname = useLocation().pathname.replace(/^\//, '') || 'page';
  const title = labels[pathname] ?? '페이지';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
          <p className="text-slate-600 mb-8">해당 페이지는 준비 중입니다.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
          >
            홈으로 돌아가기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
