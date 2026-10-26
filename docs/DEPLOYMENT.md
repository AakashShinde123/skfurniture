# Deployment Guide

The app is a standard Next.js (Node.js) server with **Prisma + PostgreSQL**. Two first-class
paths are documented:

1. **Netlify** (recommended, ₹0 tier) — what `netlify.toml` in the repo root is wired for.
2. **VPS / Render / Railway** — plain `npm run build && npm start` with a persistent disk.

Images are stored via the pluggable driver in `src/lib/storage/index.ts`: local disk in
development, **Cloudflare R2 (or any S3-compatible bucket) in production** — on serverless
hosts this is mandatory, because their filesystems are read-only and ephemeral.

---

## 1. Architecture

| Concern | Local development | Production (Netlify) |
|---|---|---|
| Runtime | `npm run dev` (Node ≥ 20) | `npm run build` via `netlify.toml` + `@netlify/plugin-nextjs` |
| Database | Any local PostgreSQL | **Managed PostgreSQL** — Neon / Supabase / Amazon RDS / Railway |
| Images | Local `uploads/` folder, served by `/api/media/*` | **R2 bucket with public access** (custom domain or `r2.dev` URL) |
| Storage driver | `STORAGE_DRIVER=local` | `STORAGE_DRIVER=r2` + `NEXT_PUBLIC_STORAGE_PUBLIC_BASE` |
| Sessions | `AdminSession` table via Prisma | Same, in your Postgres database |
| Secrets | `.env` (git-ignored) | Netlify dashboard → Site settings → Environment variables |

Deployment-friendly by design:

- `prisma/schema.prisma` — single source of truth; `npm run db:push` applies it anywhere.
  The generator already ships both query engines (`native` + `rhel-openssl-3.0.x` for
  Netlify's Node 20+ runtime).
- **Every DB-backed page and API route renders per-request** (`export const dynamic =
  "force-dynamic"`), so the production build never needs a database connection and CMS
  edits go live instantly (no stale caches).
- All image references stored in the DB are **driver-agnostic storage keys**, rendered
  through `mediaUrl(key)` using `NEXT_PUBLIC_STORAGE_PUBLIC_BASE` — swapping the driver
  requires no template changes.
- `src/proxy.ts` (Next 16's replacement for `middleware.ts`) guards `/admin` at the edge;
  deep session validation additionally happens server-side in the admin layout and API.

## 2. Create the PostgreSQL database

Pick any managed Postgres (Neon / Supabase / RDS all have free tiers), then:

1. Create a database named `sk_furniture` (or use the provider default).
2. Copy the **connection string** — it looks like:
   ```
   postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
   ```
   - **Neon:** Dashboard → Connection Details (use the "pooled" string for app runtime).
   - **Supabase:** Project Settings → Database → Connection string (URI).
3. From your machine, create the schema and seed demo content:
   ```bash
   npm install
   cp .env.example .env        # paste your DATABASE_URL
   npm run db:push             # creates all tables
   npm run seed                # optional: admin + demo catalogue + settings
   ```

## 3. Deploying to Netlify

The repo already contains **`netlify.toml`**:

```toml
[build]
  command = "npm run build"
  publish = ".next"
[build.environment]
  NODE_VERSION = "22"
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. **app.netlify.com → Add new site → Import an existing project** → pick the repo.
   The build command and Next.js runtime are picked up from `netlify.toml` automatically.
3. Add environment variables (Site configuration → **Environment variables**) — **never
   commit them into `netlify.toml`**:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | your Postgres connection string (pooled string on Neon) |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-site.netlify.app` (or your custom domain) |
   | `STORAGE_DRIVER` | `r2` (Netlify has **no persistent disk** — `local` will fail uploads) |
   | `NEXT_PUBLIC_STORAGE_PUBLIC_BASE` | your R2 public URL, e.g. `https://images.yourdomain.in` |
   | `R2_ACCOUNT_ID` | Cloudflare account id |
   | `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token credentials |
   | `R2_BUCKET` | e.g. `sk-furniture-media` |

   Secrets like `SEED_ADMIN_PASSWORD` are **only** used by the seed script — keep them out
   of Netlify entirely.
4. Deploy. The build does **not** touch the database (no `DATABASE_URL` needed at build
   time); Prisma's client is generated in `postinstall`, and the Netlify runtime engine
   (`rhel-openssl-3.0.x`) is pre-built into the client via the schema's `binaryTargets`.
5. If the production database is still empty, seed it once from your machine:
   ```bash
   DATABASE_URL="<prod url>" npm run db:push
   DATABASE_URL="<prod url>" npm run seed   # optional demo content
   ```
6. Every push to the production branch redeploys automatically.

### Common Netlify issues

| Symptom | Cause / fix |
|---|---|
| `Both middleware file … and proxy file … are detected` | A stale `middleware.ts` from an older copy is still in the repo next to the Next.js 16 `proxy.ts`. Delete every `middleware.ts` — or simply refresh the repo from the latest project zip: `npm run build` runs `scripts/cleanup-legacy.mjs` first and removes it automatically. |
| `Environment variable not found: DATABASE_URL` during build | Was fixed by making all DB routes `force-dynamic`. If a custom page reintroduces static DB access, add `export const dynamic = "force-dynamic"` to it. |
| `Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"` | Don't remove `binaryTargets` from `schema.prisma`, and keep `postinstall: prisma generate`. |
| **Site deploys, but every page shows "Something went wrong"** | The database is not ready. Open **`https://<your-site>/api/health`** — it tells you which case applies: **`missing-tables`** → the schema was never deployed to this (new) database. From your machine, put the production URL in `.env` (`DATABASE_URL=postgresql://…`) and run `npm run db:push` then `npm run seed` once — this creates the tables, the admin account and demo content. **`down`** → the database cannot be reached from Netlify: check the env var exists with the **Functions** scope enabled, the DB isn't paused (Neon free tier), SSL mode is right (`?sslmode=require` on Neon/Supabase), and IP allowlists accept 0.0.0.0/0. Public pages now degrade gracefully in the meantime (default branding, empty catalogue) instead of erroring. |
| Uploads fail with `EROFS` / read-only filesystem | `STORAGE_DRIVER` is still `local` — set it to `r2` (§4). |
| Images upload but don't display | `NEXT_PUBLIC_STORAGE_PUBLIC_BASE` is not the bucket's public URL, or the R2 bucket isn't public. |

## 4. Images with Cloudflare R2 (required on Netlify)

The R2 driver is **fully implemented** (S3 REST API + AWS SigV4 via the lightweight
`aws4fetch` package — no vendor SDK). Setup is configuration only:

1. Cloudflare dashboard → **R2 → Create bucket** (e.g. `sk-furniture-media`).
2. **Settings → Public access** — connect a custom domain (e.g. `images.yourdomain.in`)
   or enable the `r2.dev` public URL. Note the exact base URL (no trailing slash).
3. **R2 → Manage API Tokens → Create API token** — permission *Object Read & Write*,
   scope: only this bucket. Note the **Access Key ID** and **Secret Access Key**.
4. Your **Account ID** is on the R2 overview page (right sidebar).
5. Set the environment variables (locally in `.env` and/or in the Netlify dashboard):
   ```
   STORAGE_DRIVER=r2
   NEXT_PUBLIC_STORAGE_PUBLIC_BASE=https://images.yourdomain.in
   R2_ACCOUNT_ID=<account id>
   R2_ACCESS_KEY_ID=<key id>
   R2_SECRET_ACCESS_KEY=<secret>
   R2_BUCKET=sk-furniture-media
   ```
6. **Verify credentials any time** — uploads a small test object and deletes it:
   ```bash
   npm run check:r2
   ```
7. (Optional) `R2_ENDPOINT` overrides the S3 endpoint — pointing it at MinIO / AWS S3 /
   Backblaze B3 works out of the box. An offline wiring test exists too:
   `npx tsx scripts/r2-wiring-test.ts`.

Browsers fetch images directly from the public bucket URL (cacheable, immutable keys);
the media service tracks metadata in Postgres and reference-checks deletions, exactly as
with the local driver.

## 5. Deploying to a VPS / Render / Railway

```bash
npm ci
npm run build
npm run start          # serves on $PORT (default 3000)
```

- Put the app behind Nginx/Caddy for TLS, or use the platform's built-in HTTPS.
- Set the same environment variables as §3 (a `.env` file works).
- Attach a **persistent disk** mounted at the project root if using `STORAGE_DRIVER=local`
  so `uploads/` survives redeploys — or use R2 here as well and skip the disk entirely.

## 6. Custom domain + HTTPS

1. Point `yourdomain.in` (A/CNAME) at your host per its dashboard instructions
   (Netlify: Domain management → Add domain → follow the DNS prompts).
2. HTTPS certificates are automatic on Netlify/Vercel/Render/Railway; on a VPS use Caddy
   or `certbot`.
3. Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.in` — canonical URLs, the sitemap and
   WhatsApp message links all derive from it.

## 7. Verify before launch (PRD §10 step 7)

Run the full QA pass on the staging URL **before** touching DNS:

- [ ] Admin login/logout, wrong-password rate limiting
- [ ] Product create → upload images → publish → visible on site
- [ ] Unpublish → public 404
- [ ] Category create/reorder → homepage grid order
- [ ] Hero stats edit in Site Settings → live on homepage
- [ ] WhatsApp links contain real name/SKU/price/URL (`wa.me/<digits>?text=…`)
- [ ] Image upload works on the host (R2 driver: `npm run check:r2` passed)
- [ ] Mobile + tablet + desktop layouts
- [ ] `/sitemap.xml`, `/robots.txt`, 404 page

## 8. Backups (PRD §10 — "Database backups must be planned")

Automate a nightly dump from any machine (cron):

```bash
pg_dump "$DATABASE_URL" -Fc -f backup-$(date +%F).dump    # database
# images: rsync the uploads/ folder (local driver) or sync the R2 bucket
#   rclone sync r2:sk-furniture-media ./media-backup
```

Keep at least: weekly full dump + the image folder/bucket (images are immutable objects;
deleting is only possible through the CMS which reference-checks first). Restore drill:
`pg_restore -d "<staging url>" backup.dump` once a year on a staging database.

Managed providers (Neon, Supabase, RDS) also include point-in-time recovery on paid
plans — a cheap safety net worth considering.

## 9. Cost model (free-tier targets)

| Component | Free tier? | Notes |
|---|---|---|
| Netlify free / Vercel Hobby / Render free | ₹0 | Ample bandwidth for a shop catalogue site |
| Neon / Supabase Postgres | ₹0 | ~0.5 GB free — thousands of products |
| R2 | ₹0 | 10 GB-month + 10M Class B ops/month |
| HTTPS/custom domain | ₹0 | Automatic on Netlify/Vercel/Render/Railway; Caddy on VPS |
| WhatsApp | ₹0 | Click-to-Chat deep links, no Business API |
| Domain | ~₹800–1,500/year | Registrar renewal, paid by client |

If traffic outgrows the free tiers, the next step is a $5–7/mo instance on the same
providers — decide with the client at that point, not before.
