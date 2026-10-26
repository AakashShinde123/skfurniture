// Debug: print the raw Prisma error message structure for bad DB URLs.
import { PrismaClient, Prisma } from "@prisma/client";

async function probe(label: string, url: string) {
  const client = new PrismaClient({
    datasources: { db: { url: url || undefined } },
    log: ["error"],
  });
  try {
    await client.$queryRaw`SELECT 1`;
    console.log(`[${label}] OK`);
  } catch (error: unknown) {
    const e = error as { name?: string; message?: string; errorCode?: string; code?: string };
    console.log(`=== [${label}] name=${e.name} errorCode=${e.errorCode ?? e.code ?? "-"} ===`);
    console.log(JSON.stringify(e.message));
    console.log(`instanceof init: ${error instanceof Prisma.PrismaClientInitializationError}`);
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

async function main() {
  const base = process.argv[2] ?? "postgresql://u:p@localhost:9/nonexistent";
  await probe("unreachable-host", base);
  await probe("bad-scheme", "mysql://u:p@localhost/db");
  await probe("sqlite-path", "file:./db/custom.db");
}

void main();
