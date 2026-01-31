/**
 * 알림 API
 * 내 알림 목록, 읽음 처리
 */

import axiosInstance from '@/lib/axios';
import type {
  ApiResponse,
  NotificationResponse,
  NotificationListResponse,
} from '@/types/dto';

export const notificationApi = {
  /** 내 알림 목록 */
  getMyList: async (page = 0, size = 20) => {
    const response = await axiosInstance.get<ApiResponse<NotificationListResponse>>(
      '/notifications',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /** 읽지 않은 알림 수 */
  getUnreadCount: async () => {
    const response = await axiosInstance.get<ApiResponse<{ unreadCount: number }>>(
      '/notifications/unread-count'
    );
    return response.data.data;
  },

  /** 알림 읽음 처리 */
  markAsRead: async (id: number) => {
    const response = await axiosInstance.put<ApiResponse<NotificationResponse>>(
      `/notifications/${id}/read`
    );
    return response.data.data;
  },
};
