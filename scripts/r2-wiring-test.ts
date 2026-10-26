/**
 * Offline R2 driver wiring test — verifies the R2Storage driver builds
 * correct S3 URLs, signs requests and passes bodies/headers without errors,
 * using a local stub endpoint instead of a real bucket.
 *
 *   npx tsx scripts/r2-wiring-test.ts
 *
 * (For real credentials use `npm run check:r2` — this stub only proves the
 * client-side wiring; AWS SigV4 itself is handled by aws4fetch.)
 */

import http from "node:http";

interface RecordedRequest {
  method: string;
  url: string;
  auth: string | null;
  contentType: string | null;
  bodyLength: number;
}

async function main(): Promise<void> {
  // Stub S3 endpoint — accepts everything, records what arrived.
  const requests: RecordedRequest[] = [];
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      requests.push({
        method: req.method ?? "",
        url: req.url ?? "",
        auth: req.headers.authorization ?? null,
        contentType: (req.headers["content-type"] as string | undefined) ?? null,
        bodyLength: Buffer.concat(chunks).length,
      });
      res.statusCode = req.method === "DELETE" ? 204 : 200;
      res.end();
    });
  });

  await new Promise<void>((resolve) => server.listen(4566, "127.0.0.1", resolve));

  // Configure the driver against the stub before importing app modules.
  process.env.STORAGE_DRIVER = "r2";
  process.env.R2_ACCOUNT_ID = "test-account-id";
  process.env.R2_ACCESS_KEY_ID = "test-access-key";
  process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
  process.env.R2_BUCKET = "test-bucket";
  process.env.R2_ENDPOINT = "http://127.0.0.1:4566";
  process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BASE = "https://images.example.com";

  const { storage } = await import("../src/lib/storage");
  const driver = storage();

  const payload = Buffer.from("hello r2 wiring test");
  const publicUrl = await driver.put("products/2026-wiring-test.webp", payload, "image/webp");
  const publicUrlExpected = "https://images.example.com/products/2026-wiring-test.webp";
  if (publicUrl !== publicUrlExpected) {
    throw new Error(`publicUrl mismatch: ${publicUrl} !== ${publicUrlExpected}`);
  }

  await driver.delete("products/2026-wiring-test.webp");
  server.close();

  console.log("Public URL:", publicUrl);
  console.log("Requests seen by stub endpoint:");
  for (const request of requests) {
    console.log(
      `  ${request.method} ${request.url}  auth=${request.auth ? "signed ✓" : "MISSING ✗"}  ` +
        `content-type=${request.contentType ?? "-"}  body=${request.bodyLength}B`,
    );
  }

  const put = requests.find((r) => r.method === "PUT");
  const del = requests.find((r) => r.method === "DELETE");
  const problems: string[] = [];
  if (!put) problems.push("PUT never reached the endpoint");
  if (put && put.url !== "/test-bucket/products/2026-wiring-test.webp") {
    problems.push(`unexpected PUT path: ${put.url}`);
  }
  if (put && !put.auth?.startsWith("AWS4-HMAC-SHA256")) problems.push("PUT was not SigV4-signed");
  if (put && put.contentType !== "image/webp") problems.push("content-type header lost");
  if (put && put.bodyLength !== payload.length) problems.push("body bytes lost");
  if (!del) problems.push("DELETE never reached the endpoint");
  if (del && !del.auth?.startsWith("AWS4-HMAC-SHA256")) problems.push("DELETE was not SigV4-signed");

  if (problems.length > 0) {
    console.error("\n❌ R2 wiring test FAILED:", problems.join("; "));
    process.exit(1);
  }
  console.log("\n✅ R2 driver wiring OK (URL scheme, SigV4 signing, headers, body).");
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("❌ wiring test crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
