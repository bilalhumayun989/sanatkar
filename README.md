# SanatKar

SanatKar is a full-stack marketplace built with Next.js 16, React, Supabase authentication, and PostgreSQL through Prisma.

## Local development

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

The site runs at `http://localhost:3000`. Configure the required environment variables in `.env` before using database or authentication features. See `.env.example` for the variable names.

## Production hosting

This application runs as a Node.js web application. Deploy it to SoIn Web as a Node.js/Next.js app, with the project root as the app directory and these commands:

```bash
npm ci
npm run build
npm start
```

Do not deploy it as a static export: the site uses server-rendered pages, API routes, authentication callbacks, and database access. Set the production environment variables in the hosting panel, including:

- `DATABASE_URL` for the production PostgreSQL database.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase authentication.
- `NEXT_PUBLIC_APP_URL=https://sanatkaar.broshtech.com` for links sent by email.
- `JWT_SECRET` and the mail settings used by the configured email flows.

Add the production domain to Supabase's allowed site and redirect URLs. Keep secrets in the hosting environment settings; do not commit `.env`.

The upload API writes public images under `public/uploads` and private seller payment proofs under `private/seller-payments`. The host must provide persistent writable storage for these directories. If deployments use ephemeral storage or multiple app instances, configure shared persistent storage before relying on uploaded files.

## Useful commands

```bash
npm run lint
npx prisma migrate deploy
```

Run database migrations against the production database only when the corresponding release is ready to deploy.
