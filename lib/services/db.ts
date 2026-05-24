// lib/services/db.ts
// ─── Prisma Client Singleton ──────────────────────────────────────────────────
// After cloning, run: npx prisma generate
// This creates the typed client. Until then, we use a dynamic import.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any;

function getDb() {
  if (_db) return _db;
  // Dynamic require so tsc doesn't fail before `prisma generate` runs
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  const globalKey = "prismaGlobal";
  const g = globalThis as Record<string, unknown>;
  _db = g[globalKey] ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  if (process.env.NODE_ENV !== "production") g[globalKey] = _db;
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return getDb()[prop];
  },
});
