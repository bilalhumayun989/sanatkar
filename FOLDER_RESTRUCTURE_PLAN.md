# Folder Structure Reorganization Plan

## Current Issues:
1. Components scattered throughout the app directory
2. Auth-related pages spread across multiple directories
3. Shop/seller functionality not grouped properly
4. No clear separation between pages, components, and utilities
5. Missing proper lib organization

## Proposed New Structure:

```
app/
├── (auth)/                     # Route groups for auth pages
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   └── verify-email/
├── (dashboard)/               # Protected dashboard routes
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── mini/
│   │   └── super/
│   ├── seller/
│   ├── profile/
│   ├── my-ads/
│   └── my-shop/
├── (public)/                  # Public pages
│   ├── contact/
│   ├── category/
│   ├── shop/
│   ├── buyer/
│   └── seller-profile/
├── components/                # Shared components
│   ├── ui/                   # Basic UI components
│   ├── forms/                # Form components
│   ├── layout/               # Layout components (Navbar, Footer)
│   └── features/             # Feature-specific components
├── lib/                      # Utilities and configurations
│   ├── auth/
│   ├── database/
│   ├── utils/
│   └── types/
└── api/                      # API routes (keep as is - Next.js convention)
```

## Benefits:
1. Clear separation of auth, dashboard, and public routes
2. Grouped related functionality
3. Shared components in dedicated directory
4. Better lib organization
5. More maintainable and scalable structure