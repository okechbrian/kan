import type { PrismaClient } from "@prisma/client";

const globalDatabase = globalThis as typeof globalThis & { kanPrisma?: PrismaClient };

/** Reuse one pool per server process; never open/disconnect a pool per sync request. */
export function getServerDb(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalDatabase.kanPrisma) {
    const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
    const connection = new URL(process.env.DATABASE_URL);
    if (!connection.searchParams.has("connection_limit")) connection.searchParams.set("connection_limit", "3");
    if (!connection.searchParams.has("connect_timeout")) connection.searchParams.set("connect_timeout", "10");
    globalDatabase.kanPrisma = new PrismaClient({ datasources: { db: { url: connection.toString() } } });
  }
  return globalDatabase.kanPrisma;
}
