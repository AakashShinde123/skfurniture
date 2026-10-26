# Furniture Catalogue Website + CMS

A production-ready furniture shop website with a private, database-backed admin CMS. Customers browse the catalogue and enquire directly on WhatsApp; the shop owner manages products, images, categories, the homepage hero and contact details — all without touching code.

Built for a small furniture retailer per the v1.0 PRD (October 2026): inexpensive to run, SEO-friendly, mobile-first and easy to extend.

---

## Feature summary

### Public website
| Page | Route | Highlights |
|------|-------|-----------|
| Home | `/` | Hero banner (CMS-managed), category tiles, featured products, trust points, showroom banner, testimonials (optional), contact CTA |
| Catalogue | `/catalogue` | Debounced search, category filter, 4 sort orders, pagination — all reflected in the URL |
| Product detail | `/products/[slug]` | Gallery, SKU badge, price or "Enquire for price", specifications, availability, related products, product-specific WhatsApp enquiry |
| About | `/about` | Shop story + showroom gallery (CMS-managed) |
| Contact | `/contact` | Phone/WhatsApp/email, hours, service areas, Google Maps embed |

- Every product card and detail page has an **Enquire on WhatsApp** button that opens a prefilled draft with the product name, SKU, configured price (when set) and public URL. The customer presses Send — nothing is auto-submitted.
- Draft products return genuine 404s; published products are the only publicly visible records.

### Admin CMS (`/admin`)
- Secure session login (bcrypt hashes, HTTP-only cookie, DB-stored hashed session tokens, login rate limiting, 7-day expiry). No public registration.
- **Dashboard** — totals (products / published / drafts / unavailable), quick actions, recently updated list.
- **Products** — create, edit, preview, publish/unpublish, availability toggle, duplicate, delete (with confirm), search + status/availability filters, pagination.
- **Product form** — all PRD fields: name, unique SKU, auto-generated editable slug, category, short/full description, price + original price (strike-through), dimensions (W×D×H + unit), material, finish, colours, availability, delivery info, featured toggle, SEO title/description (auto defaults), publish switch, multi-image gallery with cover selection, reordering, per-image alt text, unsaved-changes warning.
- **Categories** — create, edit, activate/deactivate, reorder (drives the homepage grid), delete guarded by product references.
- **Media library** — upload with drag & drop, sharp-powered EXIF-rotate + downscale + WebP optimisation, alt text editing, copy URL, delete protected by reference checks.
- **Site settings** — shop name/tagline/logo, WhatsApp number, phone/email/address, hours, service areas, announcement bar, homepage hero (headline, subtitle, image, CTA and the 4-stat strip under it), about story, showroom photos, social links, testimonials (with enable toggle), default SEO.

### SEO & performance (PRD §9)
- Dynamic `sitemap.xml` (static pages + published products + categories) and `robots.txt` (admin/API excluded).
- Per-page titles/descriptions, canonical URLs, Open Graph + Twitter cards, per-product SEO overrides.
- Descriptive alt text defaults, lazy-loaded images, `Cache-Control: immutable` media responses, no heavy client-side animation libraries.
- 404 page for missing/unpublished products; admin routes send `noindex`.

---

## Tech stack

- **Next.js 16 (App Router) + TypeScript 5** — server components render public pages straight from the services layer; client islands only where interactivity demands it.
- **Tailwind CSS 4 + shadcn/ui (New York)** — warm ivory / wood brown / charcoal design system, Fraunces (display) + DM Sans (body), Lucide icons.
- **Prisma ORM + PostgreSQL** — works with any managed Postgres (Neon, Supabase, Amazon RDS, Railway) or a local server. Tables: `products`, `categories`, `product_images`, `site_settings`, `admin_user`, `admin_session`, `media_asset`. Every DB-backed page/route renders per-request (`force-dynamic`), so builds never touch the database.
- **Storage abstraction** — local disk driver in development, **R2 / any S3-compatible bucket** in production via `aws4fetch` (SigV4, no vendor SDK; one env-var swap — see `docs/DEPLOYMENT.md`).
- **TanStack Query** (server state) + URL-as-state for catalogue filters; react-hook-form + Zod for the admin forms.
- **zod** schemas shared verbatim between API routes and forms (one validation source).

## Project structure

```
src/
├── app/
│   ├── (public)/               # Public site (shared header/footer layout)
│   │   ├── page.tsx            # Home
│   │   ├── catalogue/          # Catalogue (search/filter/sort)
│   │   ├── products/[slug]/    # Product detail (dynamic)
│   │   ├── about/              # About
│   │   └── contact/            # Contact + map
│   ├── admin/
│   │   ├── login/              # CMS login (public door)
│   │   └── (dashboard)/        # Session-guarded CMS
│   │       ├── page.tsx        # Dashboard
│   │       ├── products/       # List / new / [id]/edit
│   │       ├── categories/     # Category manager
│   │       ├── media/          # Media library
│   │       └── settings/       # Site settings
│   ├── api/                    # REST API (see below)
│   ├── sitemap.ts, robots.ts   # SEO endpoints
│   └── not-found.tsx, error.tsx
├── components/
│   ├── layout/                 # Site header/footer
│   ├── public/                 # Hero, cards, gallery, WhatsApp button…
│   ├── admin/                  # Shell, product form, uploader, managers
│   └── ui/                     # shadcn/ui primitives
├── services/                   # Business logic (product/category/settings/
│   │                           #   media/auth/dashboard) — no React, no HTTP
├── lib/                        # env, errors, api-handler, auth, storage,
│                               #   whatsapp, seo, media, slug, constants
├── hooks/admin/                # TanStack Query data hooks for the CMS
├── types/                      # Shared DTOs
├── validations/                # Zod schemas (API + forms)
└── proxy.ts                    # Edge guard for /admin (cookie presence; Next 16 "proxy", formerly middleware)
```

## API structure

All endpoints return a consistent envelope — `{ data }` on success, `{ error: { code, message, details? } }` on failure — via the shared `withApi`/`withAdmin` handlers that funnel every thrown error (Zod issues, `AppError` subclasses, Prisma unique violations) through one mapper. Authorization is enforced **server-side** on every write.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/login` | — | Sign in (rate-limited) |
| POST | `/api/auth/logout` | — | Sign out |
| GET | `/api/auth/session` | — | Current session |
| GET | `/api/products` | public* | Catalogue list (published only) — `search`, `categorySlug`, `sort`, `page`, `pageSize` |
| POST | `/api/products` | admin | Create product |
| GET/PUT/DELETE | `/api/products/:id` | admin | Read / update / delete (+ orphan reaping) |
| PATCH | `/api/products/:id/status` | admin | Publish / unpublish |
| POST | `/api/products/:id/duplicate` | admin | Clone as draft |
| GET | `/api/categories` | public | Active categories (`?includeInactive=1` for CMS) |
| POST | `/api/categories` | admin | Create |
| GET/PUT/DELETE | `/api/categories/:id` | admin | Read / update / delete |
| POST | `/api/categories/reorder` | admin | Persist new order |
| GET/PUT | `/api/settings` | public GET / admin PUT | Site settings |
| POST | `/api/upload` | admin | Image upload → optimise → store |
| GET | `/api/media` | admin | Media library listing |
| POST | `/api/media/manage` | admin | Delete image / set alt text |
| GET | `/api/media/*` | public | Serve stored image bytes |
| GET | `/api/dashboard` | admin | CMS counters |

\* Admin-scoped filters (`status=DRAFT`, per-category id) are honoured by the same handler and used by the CMS; the public site only ever requests published products.

## Getting started

Prerequisites: **Node.js ≥ 20** and a **PostgreSQL** database (local server or free managed tier — Neon/Supabase both work).

```bash
# 1. Install
npm install

# 2. Configure environment — paste your Postgres connection string into DATABASE_URL
cp .env.example .env

# 3. Create the database schema
npm run db:push

# 4. Seed demo data (admin user, 8 categories, 12 products, site settings)
npm run seed

# 5. Run
npm run dev        # http://localhost:3000
```

**Default CMS login** (change immediately in production): username `admin`, password `Admin@123` — configurable via `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` before seeding.

### Useful scripts
| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` + `npm run start` | Production build + serve (`next start`) |
| `npm run lint` | ESLint (strict, 0-warning target) |
| `npm run db:push` | Sync Prisma schema to PostgreSQL |
| `npm run db:studio` | Prisma Studio — browse data in a GUI |
| `npm run seed` | Idempotent demo seed (also resets the admin password) |
| `npm run check:r2` | Verify R2 / S3 bucket credentials (upload + delete a test object) |
| `bash scripts/generate-seed-images.sh` | (Optional) regenerate demo product photography |

## Where things connect

- **WhatsApp number** — CMS → Site Settings → Shop & Contact. Every enquiry button reads it from the database; change it once, it updates site-wide.
- **Prices** — stored as whole INR integers; leave empty for "Enquire for price".
- **Image ratios** (PRD §4) — enforced visually via CSS aspect ratios (4:5 cards, 1:1 tiles, 16:9 hero) and documented inside the uploader; the optimiser caps the longest edge at 2400 px and converts to WebP (~quality 82).
- **Backups** — see `docs/HANDOVER.md` (`pg_dump` + `uploads/` folder copy procedure).

## Deployment

**Netlify (recommended, ₹0 tier):** connect the repo and Netlify reads `netlify.toml` (`npm run build` + the official Next.js runtime). Add `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `STORAGE_DRIVER=r2` and the `R2_*` variables in the Netlify dashboard — Netlify has no persistent disk, so product images go to a free Cloudflare R2 bucket. **Step-by-step: `docs/DEPLOYMENT.md`.**

Other targets (Vercel, Render, Railway, VPS with plain `next start`) are supported too — the storage layer is driver-based and every page renders per-request from the database, so the production build never needs database access. See **`docs/DEPLOYMENT.md`** for the full guide and **`docs/HANDOVER.md`** for client handover, credential resets and backup procedures.

## Version 1 scope notes

Deliberately excluded (per PRD §11): cart/checkout/payments, stock quantities, customer accounts/CRM, automated WhatsApp notifications, bulk CSV import, multi-user roles. The architecture (service layer + typed API + settings table) leaves room to add these later without rework.
