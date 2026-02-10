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

import { useAuthStore } from '@/store/authStore';

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [board, setBoard] = useState<Board | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // 현재 게시글이 실제 서버 데이터인지 여부
  const isRealBoard = useRef(false);

  // 조회수 증가 요청 여부 (중복 방지)
  const viewCountRequested = useRef(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    if (id && !viewCountRequested.current) {
      viewCountRequested.current = true;
      boardApi.increaseViewCount(Number(id)).catch(console.error);
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

  const handleBoardDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await boardApi.delete(Number(id));
      alert('게시글이 삭제되었습니다.');
      navigate('/boards');
    } catch (err: any) {
      alert(err.response?.data?.message || '게시글 삭제에 실패했습니다.');
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

  const handleCommentUpdate = async (commentId: number) => {
    if (!editCommentText.trim()) return;
    try {
      await boardApi.updateComment(commentId, editCommentText);
      setEditingCommentId(null);
      setEditCommentText('');
      // 댓글 목록 갱신
      const updatedComments = await boardApi.getComments(Number(id));
      setComments(updatedComments);
    } catch (err: any) {
      alert(err.response?.data?.message || '댓글 수정에 실패했습니다.');
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await boardApi.deleteComment(commentId);
      // 댓글 목록 갱신
      const updatedComments = await boardApi.getComments(Number(id));
      setComments(updatedComments);
    } catch (err: any) {
      alert(err.response?.data?.message || '댓글 삭제에 실패했습니다.');
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
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
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
                {/* 게시글 수정/삭제 버튼 (본인일 경우) */}
                {currentUser?.id === board.userId && isRealBoard.current && (
                  <div className="flex gap-2 text-sm">
                    <button
                      onClick={() => navigate(`/boards/${id}/edit`)}
                      className="text-gray-500 hover:text-blue-600 underline"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleBoardDelete}
                      className="text-gray-500 hover:text-red-600 underline"
                    >
                      삭제
                    </button>
                  </div>
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
                      {editingCommentId === comment.id ? (
                        // 댓글 수정 모드
                        <div className="mb-2">
                          <textarea
                            className="w-full border border-gray-300 rounded-lg p-2 mb-2"
                            rows={3}
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end text-sm">
                            <button
                              onClick={() => handleCommentUpdate(comment.id)}
                              className="text-blue-600 hover:underline"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-gray-500 hover:underline"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 댓글 일반 모드
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{comment.userName || '익명'}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {/* 댓글 수정/삭제 버튼 (본인일 경우) */}
                            {currentUser?.id === comment.userId && isRealBoard.current && (
                              <div className="flex gap-2 text-xs">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditCommentText(comment.content);
                                  }}
                                  className="text-gray-400 hover:text-blue-600"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleCommentDelete(comment.id)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </>
                      )}
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
