import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export async function savePublicLead(input: {
  kind: "contact" | "newsletter" | "account_deletion";
  email?: string;
  name?: string;
  phone?: string;
  businessName?: string;
  message?: string;
  referenceId?: string;
}) {
  if (!process.env.DATABASE_URL) return;
  try {
    // eslint-disable-next-line
    const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
    const db = new PrismaClient();
    try {
      await db.publicLead.create({
        data: {
          id: randomUUID(),
          kind: input.kind,
          email: input.email ?? "",
          name: input.name ?? "",
          phone: input.phone ?? "",
          business_name: input.businessName ?? "",
          message: input.message ?? "",
          reference_id: input.referenceId ?? "",
        },
      });
    } finally {
      await db.$disconnect();
    }
  } catch {
    // Public forms stay non-blocking if cloud DB is temporarily unreachable.
  }
}

export function publicLeadJson(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}
