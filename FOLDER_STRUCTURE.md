# 📁 Folder Structure Guide

This document explains the new organized folder structure of the Sanatkar application.

## 🎯 Key Benefits

- ✅ **Clear separation of concerns** - Auth, dashboard, and public routes are grouped
- ✅ **Better maintainability** - Related components and utilities are co-located
- ✅ **Improved scalability** - Easier to find and modify specific features
- ✅ **Professional organization** - Follows modern Next.js best practices

## 📂 Directory Structure

### `/app` - Next.js App Router
```
app/
├── (auth)/                     # 🔐 Authentication pages
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   └── verify-email/
├── (dashboard)/               # 🏠 Protected dashboard routes
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── mini/
│   │   └── super/
│   ├── seller/
│   ├── profile/
│   ├── my-ads/
│   ├── my-shop/
│   ├── messages/
│   └── saved/
├── (public)/                  # 🌐 Public-facing pages
│   ├── contact/
│   ├── category/
│   ├── shop/
│   ├── buyer/
│   ├── seller-profile/
│   ├── checkout/
│   └── ads/
├── api/                       # 🔌 API routes (unchanged)
├── components/                # 🧩 Reusable components
│   ├── layout/               # Header, Footer, etc.
│   ├── forms/                # Form components
│   ├── features/             # Feature-specific components
│   └── ui/                   # Basic UI components
├── globals.css
├── layout.tsx
└── page.tsx (homepage)
```

### `/lib` - Utilities & Configuration
```
lib/
├── auth/                      # 🔐 Authentication utilities
│   └── supabase/             # Supabase client configs
├── utils/                     # 🛠️ General utilities
├── database/                  # 💾 Database-related files
└── types/                     # 📝 TypeScript types
```

### `/supabase` - Database
```
supabase/
└── migrations/               # 🗃️ Database migrations
```

## 🎨 Route Groups Explained

### `(auth)` - Authentication Routes
- **Purpose**: All authentication-related pages
- **Access**: Public (unauthenticated users)
- **Examples**: `/login`, `/signup`, `/forgot-password`

### `(dashboard)` - Protected Dashboard
- **Purpose**: User dashboard and protected features
- **Access**: Requires authentication
- **Examples**: `/admin/dashboard`, `/profile`, `/my-ads`

### `(public)` - Public Pages
- **Purpose**: Public-facing content and features
- **Access**: Available to all users
- **Examples**: `/contact`, `/category/[slug]`, `/shop/[id]`

## 🧩 Component Organization

### `layout/` - Layout Components
- Navbar, Footer, Headers
- Global layout elements

### `forms/` - Form Components
- Registration forms, contact forms
- Reusable form elements

### `features/` - Feature Components
- Product cards, ad spaces, modals
- Business logic components

### `ui/` - Basic UI Components
- Buttons, inputs, cards
- Pure presentational components

## 📝 Import Examples

### Before (Old Structure)
```typescript
import Navbar from '@/app/components/Navbar';
import { fetchJson } from '@/lib/fetchJson';
import { createClient } from '@/lib/supabase/client';
```

### After (New Structure)
```typescript
import { Navbar } from '@/app/components/layout';
import { fetchJson } from '@/lib/utils';
import { createClient } from '@/lib/auth';
```

## 🚀 Migration Benefits

1. **Easier Navigation**: Logical grouping makes finding files intuitive
2. **Better Imports**: Cleaner import statements with barrel exports
3. **Scalability**: Easy to add new features without cluttering
4. **Team Collaboration**: Clear structure for multiple developers
5. **Maintenance**: Related files are co-located for easier updates

## 🔧 Next Steps

1. Update any remaining hardcoded import paths
2. Add TypeScript types in `/lib/types/`
3. Create more UI components in `/app/components/ui/`
4. Consider adding a `/hooks/` directory for custom React hooks