import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { boardApi } from '@/api';
import type { Board, Comment } from '@/types/entities';
import { mockBoards, mockComments } from '@/data/mockBoards';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const typeLabels: Record<string, string> = {
  NOTICE: '공지사항',
  FAQ: 'FAQ',
  FREE: '자유게시판',
  VOLUNTEER: '봉사 모집',
  DONATION: '물품 후원',
};

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 현재 게시글이 실제 서버 데이터인지 여부
  const isRealBoard = useRef(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. 실제 서버 데이터 조회 시도
      try {
        const data = await boardApi.getById(Number(id));
        setBoard(data);
        isRealBoard.current = true;

        // 실제 댓글 목록 조회
        const commentsData = await boardApi.getComments(Number(id));
        setComments(commentsData);
      } catch (apiErr) {
        // 2. 실패 시 (404 등) Mock 데이터에서 찾기
        // console.warn('Server fetch failed, falling back to mock:', apiErr);
        isRealBoard.current = false;

        const foundBoard = mockBoards.find(b => b.id === Number(id));
        if (foundBoard) {
          setBoard(foundBoard);
          const boardComments = mockComments[Number(id)] || [];
          setComments(boardComments);
        } else {
          // 둘 다 없으면 에러
          throw new Error('Geust not found');
        }
      }
    } catch (err) {
      console.error(err);
      alert('게시글을 찾을 수 없습니다.');
      navigate('/boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      if (isRealBoard.current) {
        setSubmitting(true);
        await boardApi.addComment(Number(id), { content: commentText });
        setCommentText('');
        // 댓글 목록 갱신
        const updatedComments = await boardApi.getComments(Number(id));
        setComments(updatedComments);
      } else {
        alert('데모 게시글에는 댓글을 저장할 수 없습니다. (새로고침 시 사라짐)');
        // Mock 환경에서의 시물레이션 (옵션)
        const newComment: Comment = {
          id: Date.now(),
          boardId: Number(id),
          userId: 0,
          userName: '게스트',
          content: commentText,
          createdAt: new Date().toISOString(),
        };
        setComments(prev => [...prev, newComment]);
        setCommentText('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">로딩 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1" style={{ background: 'var(--landing-gray-100)', paddingTop: '6.5rem' }}>
        <section className="landing-section">
          <div className="landing-inner max-w-4xl">
            <Link to="/boards" className="text-green-600 hover:underline mb-4 inline-block">
              ← 목록으로
            </Link>

            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                  {typeLabels[board.type]}
                </span>
                {board.isPinned && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                    공지
                  </span>
                )}
                {!isRealBoard.current && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-500">
                    Demo
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">{board.title}</h1>
              <div className="flex gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
                <span>{board.userName || '익명'}</span>
                <span>조회 {board.views}</span>
                <span>{new Date(board.createdAt).toLocaleString()}</span>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-800">{board.content}</p>
              </div>
            </div>

            {/* 댓글 영역 */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-bold mb-4">댓글 {comments.length}</h2>

              {/* 댓글 작성 */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3"
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="landing-btn landing-btn-primary disabled:opacity-50"
                  >
                    {submitting ? '작성 중...' : '댓글 작성'}
                  </button>
                </div>
              </form>

              {/* 댓글 목록 */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">첫 댓글을 남겨보세요.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold">{comment.userName || '익명'}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
