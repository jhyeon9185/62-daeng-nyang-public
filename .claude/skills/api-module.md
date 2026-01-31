---
name: api-module
description: Creates frontend API modules using Axios for communicating with backend. Use when creating API calls, HTTP client modules. Keywords: api, axios, http, fetch, client, request.
---

# API Module Generator

## Purpose
Generate Axios-based API modules for frontend:
- Type-safe API calls
- Centralized error handling
- Request/response interceptors
- Proper TypeScript typing

## Axios Instance
Location: `frontend/src/api/axios.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## API Module Template
Location: `frontend/src/api/{domain}.api.ts`

```typescript
import apiClient from './axios';
import type {
  DomainListResponse,
  DomainDetailResponse,
  DomainCreateRequest,
  DomainUpdateRequest,
  PageResponse
} from '@/types';

const BASE_PATH = '/domains';

export const domainApi = {
  // Get all with pagination
  getAll: async (params?: { page?: number; size?: number; sort?: string }) => {
    const { data } = await apiClient.get<PageResponse<DomainListResponse>>(BASE_PATH, { params });
    return data;
  },

  // Get by ID
  getById: async (id: number) => {
    const { data } = await apiClient.get<DomainDetailResponse>(`${BASE_PATH}/${id}`);
    return data;
  },

  // Create
  create: async (request: DomainCreateRequest) => {
    const { data } = await apiClient.post<DomainDetailResponse>(BASE_PATH, request);
    return data;
  },

  // Update
  update: async (id: number, request: DomainUpdateRequest) => {
    const { data } = await apiClient.put<DomainDetailResponse>(`${BASE_PATH}/${id}`, request);
    return data;
  },

  // Delete
  delete: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  },
};
```

## Project API Modules (DN Platform)

### auth.api.ts
```typescript
export const authApi = {
  signup: (request: SignupRequest) => apiClient.post('/auth/signup', request),
  login: (request: LoginRequest) => apiClient.post<TokenResponse>('/auth/login', request),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get<UserResponse>('/auth/me'),
  refreshToken: (refreshToken: string) => apiClient.post<TokenResponse>('/auth/refresh', { refreshToken }),
};
```

### animal.api.ts
```typescript
export const animalApi = {
  getAll: (params?: AnimalFilterParams) => apiClient.get<PageResponse<AnimalResponse>>('/animals', { params }),
  getById: (id: number) => apiClient.get<AnimalDetailResponse>(`/animals/${id}`),
  create: (request: AnimalCreateRequest) => apiClient.post<AnimalResponse>('/animals', request),
  update: (id: number, request: AnimalUpdateRequest) => apiClient.put<AnimalResponse>(`/animals/${id}`, request),
  delete: (id: number) => apiClient.delete(`/animals/${id}`),
};
```

### adoption.api.ts
```typescript
export const adoptionApi = {
  apply: (request: AdoptionRequest) => apiClient.post<AdoptionResponse>('/adoptions', request),
  getMyList: () => apiClient.get<AdoptionResponse[]>('/adoptions/my'),
  cancel: (id: number) => apiClient.put(`/adoptions/${id}/cancel`),
  approve: (id: number) => apiClient.put(`/adoptions/${id}/approve`),
  reject: (id: number, reason: string) => apiClient.put(`/adoptions/${id}/reject`, { reason }),
};
```

### volunteer.api.ts
```typescript
export const volunteerApi = {
  getRecruitments: (params?: PageParams) => apiClient.get<PageResponse<RecruitmentResponse>>('/volunteers/recruitments', { params }),
  createRecruitment: (request: RecruitmentCreateRequest) => apiClient.post('/volunteers/recruitments', request),
  apply: (request: VolunteerApplyRequest) => apiClient.post('/volunteers', request),
  getMyList: () => apiClient.get<VolunteerResponse[]>('/volunteers/my'),
  approve: (id: number) => apiClient.put(`/volunteers/${id}/approve`),
  reject: (id: number, reason: string) => apiClient.put(`/volunteers/${id}/reject`, { reason }),
};
```

### donation.api.ts
```typescript
export const donationApi = {
  getRequests: (params?: PageParams) => apiClient.get<PageResponse<DonationRequestResponse>>('/donations/requests', { params }),
  createRequest: (request: DonationRequestCreateRequest) => apiClient.post('/donations/requests', request),
  donate: (request: DonationApplyRequest) => apiClient.post('/donations', request),
  getMyList: () => apiClient.get<DonationResponse[]>('/donations/my'),
  approve: (id: number) => apiClient.put(`/donations/${id}/approve`),
  complete: (id: number) => apiClient.put(`/donations/${id}/complete`),
};
```

### board.api.ts
```typescript
export const boardApi = {
  getAll: (params?: BoardFilterParams) => apiClient.get<PageResponse<BoardResponse>>('/boards', { params }),
  getById: (id: number) => apiClient.get<BoardDetailResponse>(`/boards/${id}`),
  create: (request: BoardCreateRequest) => apiClient.post('/boards', request),
  update: (id: number, request: BoardUpdateRequest) => apiClient.put(`/boards/${id}`, request),
  delete: (id: number) => apiClient.delete(`/boards/${id}`),
  addComment: (boardId: number, content: string) => apiClient.post(`/boards/${boardId}/comments`, { content }),
};
```

## React Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalApi } from '@/api/animal.api';

// Query hook
export function useAnimals(params?: AnimalFilterParams) {
  return useQuery({
    queryKey: ['animals', params],
    queryFn: () => animalApi.getAll(params),
  });
}

// Mutation hook
export function useCreateAnimal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: animalApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });
}
```
