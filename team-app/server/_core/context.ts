import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // DEV BYPASS: Always return a mock admin user
    const db = await import("../db");
    const mockOpenId = "dev_owner";
    let mockUser = await db.getUserByOpenId(mockOpenId);
    if (!mockUser) {
      await db.upsertUser({
        openId: mockOpenId,
        name: "Admin Dashboard",
        email: "admin@dev.local",
        loginMethod: "local",
        role: "admin",
      });
      mockUser = await db.getUserByOpenId(mockOpenId);
    }
    user = mockUser ?? null;
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
