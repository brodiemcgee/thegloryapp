# Component Usage Guide

Documentation for the production-ready components in thehole.app.

## LoadingSpinner

Reusable animated spinner for inline loading states.

### Usage

```tsx
import LoadingSpinner from '@/components/LoadingSpinner';

// Basic spinner
<LoadingSpinner />

// Small spinner
<LoadingSpinner size="sm" />

// Large spinner with text
<LoadingSpinner size="lg" text="Loading users..." />

// Custom className
<LoadingSpinner className="my-4" />
```

### Props

- `size?: 'sm' | 'md' | 'lg'` - Spinner size (default: 'md')
- `text?: string` - Optional loading text below spinner
- `className?: string` - Additional CSS classes

---

## LoadingScreen

Full-screen loading overlay for initial app load or major transitions.

### Usage

```tsx
import LoadingScreen from '@/components/LoadingScreen';

// Basic loading screen
<LoadingScreen />

// With custom text
<LoadingScreen text="Connecting to server..." />
```

### Props

- `text?: string` - Loading message (default: 'Loading...')

---

## ErrorBoundary

React error boundary that catches errors in child components and shows fallback UI.

### Usage

Already implemented in `src/app/layout.tsx` to wrap the entire app:

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

Can also wrap specific sections:

```tsx
<ErrorBoundary>
  <ComplexFeature />
</ErrorBoundary>
```

### Features

- Catches JavaScript errors in child components
- Shows friendly error message to users
- "Try Again" button to reset error state
- "Reload page" option for persistent errors
- Logs errors to console (can be extended to send to error tracking service)
- Shows error details in development mode

---

## EmptyState

Reusable component for empty states (no data, no results, etc.).

### Usage

```tsx
import EmptyState from '@/components/EmptyState';

// Basic empty state
<EmptyState
  title="No messages yet"
  description="Start a conversation to see messages here"
/>

// With icon
<EmptyState
  icon={
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  }
  title="No messages yet"
  description="Start a conversation to see messages here"
/>

// With action button
<EmptyState
  title="No nearby users"
  description="Try adjusting your filters or check back later"
  action={{
    label: "Refresh",
    onClick: () => refetchUsers()
  }}
/>
```

### Props

- `icon?: ReactNode` - Optional icon to display above title
- `title: string` - Main heading (required)
- `description?: string` - Secondary text below title
- `action?: { label: string; onClick: () => void }` - Optional action button
- `className?: string` - Additional CSS classes

---

## Example: Loading States in a View

```tsx
'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<UserIcon />}
        title="No users nearby"
        description="Check back later or adjust your search filters"
        action={{
          label: "Refresh",
          onClick: loadUsers
        }}
      />
    );
  }

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

---

## Styling

All components use the app's dark theme defined in `tailwind.config.ts`:

- `bg-hole-bg` - #0a0a0a (main background)
- `bg-hole-surface` - #141414 (cards, surfaces)
- `border-hole-border` - #262626 (borders)
- `text-hole-muted` - #737373 (muted text)
- `bg-hole-accent` - #ef4444 (red accent)
- `bg-hole-accent-hover` - #dc2626 (darker red on hover)

Components are fully responsive and follow mobile-first design principles.
