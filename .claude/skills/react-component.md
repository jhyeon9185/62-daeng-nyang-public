---
name: react-component
description: Creates React components with TypeScript, TailwindCSS, and proper project conventions. Use when creating new UI components, pages, or layouts. Keywords: component, react, frontend, ui, page, layout.
---

# React Component Generator

## Purpose
Generate React components following project conventions:
- TypeScript with proper typing
- TailwindCSS for styling
- Functional components with hooks
- Proper file structure and naming

## Component Types

### Page Component
Location: `frontend/src/pages/{domain}/{PageName}.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface PageNameProps {
  // props
}

export default function PageName({ }: PageNameProps) {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page content */}
    </div>
  );
}
```

### UI Component
Location: `frontend/src/components/ui/{ComponentName}.tsx`

```tsx
import { type ReactNode } from 'react';

interface ComponentNameProps {
  children?: ReactNode;
  className?: string;
}

export function ComponentName({ children, className = '' }: ComponentNameProps) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}
```

### Layout Component
Location: `frontend/src/components/layout/{LayoutName}.tsx`

```tsx
import { Outlet } from 'react-router-dom';

export function LayoutName() {
  return (
    <div className="min-h-screen flex flex-col">
      <header>{/* Header */}</header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer>{/* Footer */}</footer>
    </div>
  );
}
```

## Naming Conventions
- Components: PascalCase (e.g., `AnimalCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Utils: camelCase (e.g., `formatDate.ts`)
- Types: PascalCase with descriptive suffix (e.g., `AnimalResponse.ts`)

## Import Order
1. React imports
2. Third-party libraries
3. Internal components
4. Hooks
5. Utils
6. Types
7. Styles/Assets

## TailwindCSS Guidelines
- Use utility classes directly
- Extract common patterns to components
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Use state variants: `hover:`, `focus:`, `active:`

## State Management
- Local state: `useState`
- Server state: React Query (`useQuery`, `useMutation`)
- Global client state: Zustand store
