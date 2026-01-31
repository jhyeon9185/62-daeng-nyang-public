---
name: zustand-store
description: Creates Zustand stores for global client state management. Use when creating global state, auth state, UI state. Keywords: zustand, store, state, global, auth.
---

# Zustand Store Generator

## Purpose
Generate Zustand stores for client-side state:
- Authentication state
- UI state
- Global application state

## Store Template
Location: `frontend/src/store/{storeName}.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  // State
  value: string;
  items: Item[];

  // Actions
  setValue: (value: string) => void;
  addItem: (item: Item) => void;
  reset: () => void;
}

const initialState = {
  value: '',
  items: [],
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...initialState,

      setValue: (value) => set({ value }),

      addItem: (item) => set((state) => ({
        items: [...state.items, item],
      })),

      reset: () => set(initialState),
    }),
    {
      name: 'store-storage', // localStorage key
    }
  )
);
```

## Project Stores (DN Platform)

### Auth Store
Location: `frontend/src/store/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'SHELTER_ADMIN' | 'SUPER_ADMIN';
}

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// Selectors (for optimized re-renders)
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsAdmin = (state: AuthState) =>
  state.user?.role === 'SHELTER_ADMIN' || state.user?.role === 'SUPER_ADMIN';
export const selectIsSuperAdmin = (state: AuthState) =>
  state.user?.role === 'SUPER_ADMIN';
```

### UI Store
Location: `frontend/src/store/uiStore.ts`

```typescript
import { create } from 'zustand';

interface UIState {
  // State
  isLoading: boolean;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  modalState: {
    isOpen: boolean;
    type: string | null;
    data: unknown;
  };

  // Actions
  setLoading: (isLoading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isLoading: false,
  isSidebarOpen: false,
  theme: 'light',
  modalState: {
    isOpen: false,
    type: null,
    data: null,
  },

  // Actions
  setLoading: (isLoading) => set({ isLoading }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  setTheme: (theme) => set({ theme }),

  openModal: (type, data = null) =>
    set({
      modalState: { isOpen: true, type, data },
    }),

  closeModal: () =>
    set({
      modalState: { isOpen: false, type: null, data: null },
    }),
}));
```

### Notification Store
Location: `frontend/src/store/notificationStore.ts`

```typescript
import { create } from 'zustand';

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  relatedUrl?: string;
  createdAt: string;
}

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    })),

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
```

### Filter Store (Animals)
Location: `frontend/src/store/filterStore.ts`

```typescript
import { create } from 'zustand';

interface AnimalFilters {
  species?: 'DOG' | 'CAT';
  size?: 'SMALL' | 'MEDIUM' | 'LARGE';
  gender?: 'MALE' | 'FEMALE';
  status?: 'PROTECTED' | 'ADOPTED' | 'FOSTERING';
  region?: string;
  neutered?: boolean;
  sortBy?: 'latest' | 'oldest' | 'name';
}

interface FilterState {
  filters: AnimalFilters;
  setFilter: <K extends keyof AnimalFilters>(key: K, value: AnimalFilters[K]) => void;
  setFilters: (filters: Partial<AnimalFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: AnimalFilters = {
  sortBy: 'latest',
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: defaultFilters,

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
```

## Usage in Components

```typescript
import { useAuthStore, selectUser, selectIsAuthenticated } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

function MyComponent() {
  // Get state with selector (prevents unnecessary re-renders)
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  // Get actions
  const logout = useAuthStore((state) => state.logout);
  const openModal = useUIStore((state) => state.openModal);

  // Use multiple values
  const { isLoading, setLoading } = useUIStore();

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={() => openModal('login')}>Login</button>
      )}
    </div>
  );
}
```
