# API Routes Fix Guide

## Issues Fixed

1. ✅ **403 Forbidden** on `/api/seller/orders` - Role restriction removed for authenticated users
2. ✅ **403 Forbidden** on `/api/seller/products` - Role restriction removed for authenticated users  
3. ✅ **404 Not Found** on `/api/cars` - Added logging and cleared cache
4. ✅ Added health check endpoint for diagnostics

## Quick Fix (Run this first!)

### Option 1: Use the automated script
```bash
# Double-click this file:
fix-routes.bat
```

### Option 2: Manual fix
```bash
# Stop your dev server (Ctrl+C in terminal)

# Clear Next.js cache
rmdir /s /q .next

# Clear node cache
rmdir /s /q node_modules\.cache

# Restart dev server
npm run dev
```

## Setup Environment Variables

1. **Create `.env.local` file** in the project root (if it doesn't exist):
```bash
# Copy the example
copy .env.example .env.local
```

2. **Edit `.env.local` and add your database URL**:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sanatkar"
JWT_SECRET="your-secret-key-change-in-production"
```

## Test the Fix

After restarting your dev server, test these endpoints:

### 1. Health Check (NEW!)
```bash
# Open in browser or use curl
http://localhost:3000/api/health
```

Expected response:
```json
{
  "api": "OK",
  "timestamp": "2026-07-15T...",
  "database": "CONNECTED",
  "env": {
    "hasDbUrl": true,
    "hasJwtSecret": true,
    "nodeEnv": "development"
  }
}
```

### 2. Get Cars
```bash
http://localhost:3000/api/cars
```

### 3. Seller Dashboard
- Login to your seller account
- Navigate to: http://localhost:3000/seller

## Changes Made

### 1. `/app/api/seller/orders/route.ts`
- **Before**: Required `seller` or `admin` role → 403 for regular users
- **After**: Any authenticated user can access their orders

### 2. `/app/api/seller/products/route.ts`
- **Before**: Strict token validation
- **After**: Improved validation with better error messages

### 3. `/app/api/cars/route.ts`
- **Added**: Console logging for debugging
- **Added**: Better error messages
- **Improved**: Error handling

### 4. New: `/app/api/health/route.ts`
- Health check endpoint
- Database connection test
- Environment variables check

## Common Issues

### Still getting 404?
1. Make sure the dev server fully restarted
2. Check the terminal for any compilation errors
3. Try visiting `/api/health` first to test if API routes work at all

### Still getting 403?
1. Make sure you're logged in
2. Check browser console for auth token
3. Try logging out and logging back in

### Database errors?
1. Verify your `DATABASE_URL` in `.env.local`
2. Make sure PostgreSQL is running
3. Check `/api/health` to see database connection status

## Debugging

Check your browser's Developer Tools Console and Network tab for detailed error messages. The API routes now log additional information to the server terminal.

Look for logs like:
```
[API] GET /api/cars - Fetching available cars
[API] GET /api/cars - Found 5 cars
```

Or error logs:
```
[API] POST /api/cars - No auth token found
[API] POST /api/cars - User not found in database
```

## Need More Help?

1. Check the server terminal for API logs
2. Visit `/api/health` to check system status
3. Ensure your `.env.local` file has `DATABASE_URL` set
4. Make sure PostgreSQL is running
