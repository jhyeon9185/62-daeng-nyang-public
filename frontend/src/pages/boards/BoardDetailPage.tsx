import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (id) {
      loadBoard();
      loadComments();
    }
  }, [id]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      
      // 목업 데이터 사용 (백엔드 연결 전)
      const USE_MOCK = true;
      
      if (USE_MOCK) {
        const foundBoard = mockBoards.find(b => b.id === Number(id));
        if (foundBoard) {
          setBoard(foundBoard);
        } else {
          alert('게시글을 찾을 수 없습니다.');
          navigate('/boards');
        }
      } else {
        const data = await boardApi.getById(Number(id));
        setBoard(data);
      }
    } catch (err) {
      console.error(err);
      alert('게시글을 불러오는데 실패했습니다.');
      navigate('/boards');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      // 목업 데이터 사용 (백엔드 연결 전)
      const USE_MOCK = true;
      
      if (USE_MOCK) {
        const boardComments = mockComments[Number(id)] || [];
        setComments(boardComments);
      } else {
        const data = await boardApi.getComments(Number(id));
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      await boardApi.addComment(Number(id), { content: commentText });
      setCommentText('');
      loadComments();
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
