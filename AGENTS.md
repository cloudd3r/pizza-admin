# pizza-admin

Internal admin panel for the pizzeria. Companion to the customer-facing storefront at https://github.com/cloudd3r/pizza-app — both repos share the same Neon Postgres DB.

## Stack
- Next.js 15 (App Router), React 18.3, TypeScript 5
- Prisma 6 + Neon HTTP adapter (`@prisma/adapter-neon` → `PrismaNeonHTTP`) — see the heavy comment in `prisma/prisma-client.ts` explaining why HTTP is used over TCP/WebSocket
- NextAuth v4: Credentials-only (no OAuth in admin)
- Zustand for client state
- Tailwind + Radix UI primitives + `lucide-react`
- React Hook Form + Zod for forms
- `@tanstack/react-table` for the data tables on category/ingredient pages
- `date-fns` for formatting

## Layout
- `app/(root)/` — admin layout with sidebar + navbar, wraps all routes
  - `(root)/(routes)/categories/` — list, create/edit pages, with `components/` (client.tsx, columns.tsx, cell-action.tsx, [categoryId]/components/category-form.tsx)
  - `(root)/(routes)/ingredients/` — same pattern
  - `(root)/(routes)/overview/` — dashboard placeholder
- `app/api/` — REST endpoints (`categories`, `ingredients`, `auth`)
- `app/api/health/warmup/route.ts` — keepalive endpoint for the Neon HTTP adapter
- `components/` — `ui/` (shadcn), `modals/` (alert-modal etc.), shared admin primitives (`heading`, `data-table`, `image-upload`, `auth-guard`, `login-form`)
- `lib/` — `get-user-session.ts`, `utils.ts`
- `constants/auth-options.ts` — NextAuth config (Credentials only, JWT strategy)
- `prisma/schema.prisma` — same schema as pizza-app (User, Category, Product, ProductItem, Ingredient, Cart, CartItem, Order, VerificationCode)
- `prisma/prisma-client.ts` — Neon HTTP adapter with retry-on-transient-error wrapper. Read the file's docstring before changing it.

## Commands
- `npm run dev` — Next.js dev on http://localhost:3000 (set a different port via `PORT=3001` if pizza-app is also running)
- `npm run build`
- `npm run lint`
- `npm run prisma:push` — push schema to Neon
- `npm run prisma:studio` — Prisma Studio on :5555
- `npm run prisma:seed` — uses `node --loader ts-node/esm` (different from pizza-app which uses `ts-node`)

## Environment variables
- `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` (same Neon DB as pizza-app)
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — image upload via Cloudinary unsigned preset

## Conventions
- DB access via `prisma` from `@/prisma/prisma-client`. The instance has a global retry wrapper for transient network errors (`ECONNRESET`, `fetch failed`, etc.) — do not bypass it by importing `PrismaClient` directly.
- Interactive transactions (`prisma.$transaction(async tx => …)`) are **not supported** by the HTTP adapter. Use batch-array transactions (`prisma.$transaction([…])`) instead.
- Admin pages with `prisma` queries must export `export const dynamic = 'force-dynamic'` to avoid static prerender at build time.
- Forms = React Hook Form + Zod. Tables = `@tanstack/react-table` via `components/ui/data-table.tsx`.
- Imports use `@/...` alias.
- API route convention: `[ID]_GET` / `[ID]_POST` / `[ID]_PATCH` / `[ID]_DELETE` log prefixes inside catch blocks.

## Notes for AI assistants
- Schema is shared with pizza-app — never edit `prisma/schema.prisma` without coordinating both repos.
- This repo uses **Prisma 6 + HTTP adapter**, the storefront uses **Prisma 5 + default TCP**. The two `prisma-client.ts` files are NOT interchangeable.
- Auth here is Credentials-only by design (only ADMIN-role users from the shared User table). Don't add OAuth providers without asking.
- If you generate a new admin route under `(root)/(routes)/X/`, mirror the existing `categories` / `ingredients` folder shape: `page.tsx` + `components/{client,columns,cell-action}.tsx` + `[xId]/page.tsx` + `[xId]/components/x-form.tsx`.
- The Cloudinary preset is unsigned; do not commit signed Cloudinary API keys here.
