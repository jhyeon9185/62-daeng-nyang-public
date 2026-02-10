/**
 * Board API 모듈
 * 게시판 목록 조회, 상세 조회, 작성, 댓글 작성
 */

import axiosInstance from '@/lib/axios';
import type {
  BoardListRequest,
  BoardCreateRequest,
  BoardResponse,
  BoardListResponse,
  CommentCreateRequest,
  CommentResponse,
  ApiResponse,
} from '@/types/dto';

export const boardApi = {
  /**
   * 게시글 목록 조회
   */
  getAll: async (params?: BoardListRequest & { keyword?: string }) => {
    const response = await axiosInstance.get<ApiResponse<BoardListResponse>>('/boards', {
      params,
    });
    return response.data.data;
  },

  /**
   * 게시글 상세 조회
   */
  getById: async (id: number) => {
    const response = await axiosInstance.get<ApiResponse<BoardResponse>>(`/boards/${id}`);
    return response.data.data;
  },

  /**
   * 게시글 작성
   */
  create: async (data: BoardCreateRequest) => {
    const response = await axiosInstance.post<ApiResponse<BoardResponse>>('/boards', data);
    return response.data.data;
  },

  /**
   * 댓글 작성
   */
  addComment: async (boardId: number, data: CommentCreateRequest) => {
    const response = await axiosInstance.post<ApiResponse<CommentResponse>>(
      `/boards/${boardId}/comments`,
      data
    );
    return response.data.data;
  },

  /**
   * 게시글 댓글 목록 조회
   */
  getComments: async (boardId: number) => {
    const response = await axiosInstance.get<ApiResponse<CommentResponse[]>>(
      `/boards/${boardId}/comments`
    );
    return response.data.data;
  },

  /**
   * 조회수 증가
   */
  increaseViewCount: async (id: number) => {
    await axiosInstance.post(`/boards/${id}/view`);
  },

  /**
   * 게시글 수정
   */
  update: async (id: number, data: BoardCreateRequest) => {
    const response = await axiosInstance.put<ApiResponse<BoardResponse>>(`/boards/${id}`, data);
    return response.data.data;
  },

  /**
   * 게시글 삭제
   */
  delete: async (id: number) => {
    await axiosInstance.delete<ApiResponse<null>>(`/boards/${id}`);
  },

  /**
   * 댓글 수정
   */
  updateComment: async (commentId: number, content: string) => {
    const response = await axiosInstance.put<ApiResponse<CommentResponse>>(
      `/boards/comments/${commentId}`,
      { content }
    );
    return response.data.data;
  },

  /**
   * 댓글 삭제
   */
  deleteComment: async (commentId: number) => {
    await axiosInstance.delete<ApiResponse<null>>(`/boards/comments/${commentId}`);
  },
};
