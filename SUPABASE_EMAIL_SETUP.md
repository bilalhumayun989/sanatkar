# Supabase Email Verification Setup Guide

## Issue: Email verification emails are not being sent after signup

### Most Common Causes & Solutions:

## 1. Email Confirmation Disabled in Supabase Dashboard

**Go to your Supabase Dashboard:**
1. Open your Supabase project: https://ljxsfnurjgrdyxmsjeio.supabase.co
2. Go to **Authentication** → **Settings** 
3. Look for **"Enable email confirmations"**
4. Make sure it's **ENABLED** ✅
5. Set **"Confirm email change"** to **ENABLED** ✅

## 2. Email Template Configuration

**Check Email Templates:**
1. In Supabase Dashboard → **Authentication** → **Email Templates**
2. Make sure **"Confirm signup"** template is enabled
3. Verify the **Subject** and **Body** are configured properly
4. The redirect URL should be: `{{ .SiteURL }}/auth/callback`

## 3. Site URL Configuration

**Set correct Site URL:**
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:3001` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3001/auth/callback`
   - `http://localhost:3001/auth/callback?**`
   - `https://yourdomain.com/auth/callback` (for production)

## 4. SMTP Configuration (Optional but Recommended)

**For production, configure custom SMTP:**
1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **"Enable custom SMTP"**
3. Configure your email provider settings

## 5. Development vs Production

**For Development:**
- Supabase provides default email service
- Emails might go to spam folder
- Check your spam/junk folder

**For Production:**
- Set up custom SMTP (Gmail, SendGrid, etc.)
- Configure proper domain authentication

## 6. Test Email Delivery

After making changes:
1. Clear browser cache
2. Try signup with a fresh email
3. Check both inbox AND spam folder
4. Check Supabase Dashboard → **Authentication** → **Users** to see if user was created

## 7. Alternative: Disable Email Confirmation (For Testing)

**If you want to test without email confirmation:**
1. Go to **Authentication** → **Settings**
2. **DISABLE** "Enable email confirmations"
3. Users will be immediately active without email verification

⚠️ **Warning:** Only use this for development/testing!