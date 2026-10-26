/**
 * R2 / S3 storage self-check — run with:  npm run check:r2
 *
 * Verifies that the object-storage credentials in your environment actually
 * work before (or after) deploying: uploads a small text object, then deletes
 * it. Exits 0 on success, 1 with a readable explanation on failure.
 *
 * Load your environment first (dotenv is not auto-loaded by tsx for every
 * shell) — easiest is `set -a; source .env; set +a;` or export the variables:
 *   STORAGE_DRIVER=r2
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *   NEXT_PUBLIC_STORAGE_PUBLIC_BASE (public bucket URL)
 *   R2_ENDPOINT (optional override, e.g. MinIO / AWS S3)
 */

import { env } from "@/lib/env";
import { storage } from "@/lib/storage";

function fail(message: string): never {
  console.error(`\n❌  ${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log("SK Furniture — object storage check");
  console.log(`  STORAGE_DRIVER = ${env.storageDriver}`);

  if (env.storageDriver !== "r2") {
    fail(
      'STORAGE_DRIVER is not "r2". Add STORAGE_DRIVER=r2 (plus the R2_* variables) ' +
        "to your .env and re-run: npm run check:r2",
    );
  }

  const required: Array<[string, string]> = [
    ["R2_ACCOUNT_ID", env.r2AccountId],
    ["R2_ACCESS_KEY_ID", env.r2AccessKeyId],
    ["R2_SECRET_ACCESS_KEY", env.r2SecretAccessKey],
    ["R2_BUCKET", env.r2Bucket],
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) {
    fail(`Missing environment variables: ${missing.join(", ")} (see docs/DEPLOYMENT.md).`);
  }

  const key = `health-check/${Date.now()}.txt`;
  const payload = Buffer.from(
    `SK Furniture storage check — ${new Date().toISOString()}\nYou can safely delete this file.\n`,
  );

  console.log(`  PUT  ${key} …`);
  const url = await storage().put(key, payload, "text/plain");
  console.log(`✅  Upload succeeded → ${url}`);

  console.log(`  DELETE  ${key} …`);
  await storage().delete(key);
  console.log("✅  Delete succeeded");

  console.log(
    "\n🎉  Object storage is configured correctly. " +
      "Product/category/hero image uploads will use this bucket in production.",
  );
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(`Storage check failed: ${message}`);
});
