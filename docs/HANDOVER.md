# Client Handover — Shop Owner Guide

Congratulations — your furniture website is live. This document explains everything you need to run it day-to-day, keep control of your accounts, and recover from accidents. Hand it to whoever will manage the catalogue.

---

## 1. What you own (important)

At handover, **you** must be in possession of:

- **Domain registrar** login (where `yourdomain.in` is registered and renewed yearly).
- **Hosting account** login (Netlify / Vercel / Render / VPS — hosts the website).
- **Database account** login (Neon / Supabase / RDS — hosts the PostgreSQL data).
- **Image storage account** login (Cloudflare R2 or the server's disk).
- **CMS admin account** (below).
- A copy of the **backup files** (see §5) — or the schedule that produces them.

Nobody else needs to keep your passwords. If a developer ever leaves, you can replace them by changing these logins.

## 2. Your CMS account

- **Address:** `https://yourdomain.in/admin` (bookmark it; it is not linked publicly and search engines are blocked).
- **First login:** username `admin` with the password provided to you privately.
- **Change the password immediately** — see §4.

What you can do without any developer:

| Task | Where |
|---|---|
| Add / edit / delete products | **Products → Add product** (or pencil icon on any row) |
| Publish or hide a product | **Products → ⋯ menu → Publish / Unpublish**, or the "Published" switch inside the form |
| Mark something sold out | **Products → ⋯ → Mark unavailable** (card shows "Currently unavailable"; WhatsApp enquiries still work) |
| Add photos | Inside the product form — first photo becomes the cover; drag & drop, reorder with arrows, write alt text |
| Manage categories / their order | **Categories** (order controls the homepage grid) |
| Change hero banner, hero numbers (27+ years…), announcement, WhatsApp number, hours, socials | **Site Settings** → *Homepage Hero* tab |
| Customer reviews | **Site Settings → Social & Reviews** — only publish genuine reviews |

**Product codes (SKU):** keep them unique and stable (e.g. `SOF001`). They appear on the website and in WhatsApp enquiries — customers may quote them.

**Pricing:** leave the price empty to show "Enquire for price". Fill "Original price" to show a strike-through discount automatically.

**Bestsellers:** the "Featured" switch places a product in the homepage "Featured Furniture" row (up to ~6 looks best).

## 3. How WhatsApp enquiries work

Every product has an **Enquire on WhatsApp** button. Clicking it opens WhatsApp with a ready draft:

```
Hello! I'm interested in this furniture product.

Product: Modern 3-Seater Fabric Sofa
Product Code: SOF001
Price: ₹24,999
Product page: https://yourdomain.in/products/modern-3-seater-sofa

Please share availability, colour options and delivery details.
```

The message is **not sent automatically** — the customer presses Send after reviewing it. Enquiries arrive in your normal WhatsApp inbox. To change the destination number: **Site Settings → Shop & Contact → WhatsApp number** (digits only with country code, e.g. `919876543210`).

## 4. Security basics

- **Change the admin password** after handover: ask your developer, or run the reset procedure in §6.
- **Never share the password** over chat. If it leaks, reset it (§6) — sessions die instantly.
- The CMS hides draft products from customers but **anyone with the URL of a published product can see it** — don't put unreleased pricing on published items.
- Sessions expire after 7 days; just sign in again.

## 5. Backups (do not skip)

Two things can be lost: your **database** (products, categories, settings) and your **images**.

**Minimum viable backup (monthly, 10 minutes):**
1. Download a database backup — `pg_dump "$DATABASE_URL" -Fc -f backup-$(date +%F).dump`
   (ask your developer to set this up as a scheduled task), or use your database provider's
   dashboard export (Neon/Supabase/RDS all have one).
2. Download the images — the `uploads/` folder (local driver) or your R2 bucket
   (`rclone sync r2:sk-furniture-media ./media-backup`).

Store both in a folder named `backup-YYYY-MM-DD` in your Google Drive / email to yourself. **Restore drill:** once a year, ask your developer to load the newest backup into a staging database to prove it works.

## 6. Emergency procedures

**Forgot the admin password** — your developer runs:
```bash
# on the project:
SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD=<NewPassword> npm run seed
```
(it updates the password hash; all other data is untouched), then deletes active sessions:
```sql
DELETE FROM AdminSession;
```

**Deleted a product by mistake** — restore the latest database backup (§5); anything added after that backup will need re-entry. This is why monthly backups matter.

**Website down / hosting issue** — check your hosting provider's status page (Vercel/Neon/Supabase status) first; then your developer. Your data is not lost during outages.

**Want to leave your developer** — change the registrar + hosting + database logins, then hire anyone familiar with Next.js and PostgreSQL; this project's `README.md` and `docs/DEPLOYMENT.md` contain everything they need.

## 7. Acceptance checklist (PRD §12)

Walk through this with your developer before paying the final invoice:

- [ ] Admin can log in and log out securely
- [ ] Admin can add, edit, preview, publish and unpublish products
- [ ] Product images upload and appear on the website
- [ ] Categories can be created, edited and reordered
- [ ] Product updates appear correctly on the public site
- [ ] Draft products are hidden from visitors
- [ ] Search and category filtering work
- [ ] WhatsApp messages contain the correct product name, SKU and price
- [ ] Product links open the correct public page
- [ ] Mobile, tablet and desktop layouts work
- [ ] Custom domain and HTTPS work
- [ ] Database and image recovery procedures are documented (this file)
- [ ] You control the domain, hosting and admin account

## 8. Day-1 quick wins

1. Change the admin password.
2. **Site Settings**: replace the demo shop name, address, WhatsApp number and hours with your real details (the demo data — "Woodcraft Furniture House", ₹ products, sample reviews — must all be replaced before going live).
3. Upload your real product photos (4:5 portraits look best) and set your hero banner (wide, 1920×1080).
4. Delete the demo products once your real ones are published.
5. Test one WhatsApp enquiry from your own phone end-to-end.
