import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { boardApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import type { BoardCreateRequest } from '@/types/dto';
import type { BoardType } from '@/types/entities';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const typeLabels: Record<BoardType, string> = {
  NOTICE: '공지사항',
  FAQ: 'FAQ',
  FREE: '자유게시판',
  VOLUNTEER: '봉사 모집',
  DONATION: '물품 후원',
};

/** 공지/FAQ/자유만 게시판 글쓰기에서 선택 가능 (봉사·물품 제외). 공지·FAQ는 시스템 관리자만 선택 가능 */
const WRITABLE_TYPES_FOR_ADMIN: BoardType[] = ['NOTICE', 'FAQ', 'FREE'];
const WRITABLE_TYPES_FOR_USER: BoardType[] = ['FREE'];

export default function BoardWritePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const allowedTypes = useMemo(() => (isSuperAdmin ? WRITABLE_TYPES_FOR_ADMIN : WRITABLE_TYPES_FOR_USER), [isSuperAdmin]);

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<BoardCreateRequest>({
    type: 'FREE',
    title: '',
    content: '',
  });

  const typeOptions = useMemo(
    () => allowedTypes.map((t) => ({ value: t, label: typeLabels[t] })),
    [allowedTypes]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await boardApi.create(formData);
      alert('게시글이 작성되었습니다!');
      navigate(`/boards/${result.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || '게시글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1" style={{ background: 'var(--landing-gray-100)', paddingTop: '6.5rem' }}>
        <section className="landing-section">
          <div className="landing-inner max-w-3xl">
            <Link to="/boards" className="text-green-600 hover:underline mb-4 inline-block">
              ← 목록으로
            </Link>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-2xl font-bold mb-6">게시글 작성</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">게시판 선택 *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3"
                    value={allowedTypes.includes(formData.type) ? formData.type : 'FREE'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as BoardType })}
                    required
                  >
                    {typeOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {!isSuperAdmin && (
                    <p className="mt-1 text-sm text-gray-500">공지사항·FAQ는 시스템 관리자만 작성할 수 있습니다.</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-2">제목 *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="제목을 입력하세요"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">내용 *</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3"
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="내용을 입력하세요"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Link
                    to="/boards"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center font-semibold"
                  >
                    취소
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 landing-btn landing-btn-primary disabled:opacity-50"
                  >
                    {submitting ? '작성 중...' : '작성하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
