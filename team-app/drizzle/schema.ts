import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Scoring history table - stores all credit risk scoring records
 */
export const scoringHistory = mysqlTable("scoring_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Input features (24 features)
  amount: decimal("amount", { precision: 12, scale: 2 }),
  duration: int("duration"),
  payments: decimal("payments", { precision: 12, scale: 2 }),
  accountAgeDays: int("account_age_days"),
  ownerAge: int("owner_age"),
  nDisponents: int("n_disponents"),
  nOrders: int("n_orders"),
  totalOrderAmount: decimal("total_order_amount", { precision: 12, scale: 2 }),
  avgOrderAmount: decimal("avg_order_amount", { precision: 12, scale: 2 }),
  nTransBeforeLoan: int("n_trans_before_loan"),
  avgBalanceBeforeLoan: decimal("avg_balance_before_loan", { precision: 12, scale: 2 }),
  stdBalanceBeforeLoan: decimal("std_balance_before_loan", { precision: 12, scale: 2 }),
  minBalanceBeforeLoan: decimal("min_balance_before_loan", { precision: 12, scale: 2 }),
  maxBalanceBeforeLoan: decimal("max_balance_before_loan", { precision: 12, scale: 2 }),
  lastBalanceBeforeLoan: decimal("last_balance_before_loan", { precision: 12, scale: 2 }),
  avgAmountBeforeLoan: decimal("avg_amount_before_loan", { precision: 12, scale: 2 }),
  totalAmountBeforeLoan: decimal("total_amount_before_loan", { precision: 12, scale: 2 }),
  // Categorical features
  purpose: varchar("purpose", { length: 100 }),
  frequency: varchar("frequency", { length: 100 }),
  region: varchar("region", { length: 100 }),
  division: varchar("division", { length: 100 }),
  ownerSex: varchar("owner_sex", { length: 10 }),
  isLocalClient: int("is_local_client"),
  hasCardBeforeLoan: int("has_card_before_loan"),
  // Prediction results
  riskProbability: decimal("risk_probability", { precision: 5, scale: 4 }).notNull(),
  riskLabel: varchar("risk_label", { length: 10 }).notNull(), // 'Good' or 'Bad'
  // Decision thresholds used
  riskThreshold: decimal("risk_threshold", { precision: 5, scale: 4 }).notNull(),
  approvalThreshold: decimal("approval_threshold", { precision: 5, scale: 4 }).notNull(),
  autoReviewThreshold: decimal("auto_review_threshold", { precision: 5, scale: 4 }).notNull(),
  // Decision result
  decisionStatus: varchar("decision_status", { length: 50 }).notNull(), // 'Tự động duyệt', 'Cần kiểm duyệt', 'Từ chối'
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScoringHistory = typeof scoringHistory.$inferSelect;
export type InsertScoringHistory = typeof scoringHistory.$inferInsert;

/**
 * Decision thresholds table - stores user-configured thresholds
 */
export const decisionThresholds = mysqlTable("decision_thresholds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Three decision thresholds
  riskThreshold: decimal("risk_threshold", { precision: 5, scale: 4 }).notNull().default("0.5"),
  approvalThreshold: decimal("approval_threshold", { precision: 5, scale: 4 }).notNull().default("0.7248"),
  autoReviewThreshold: decimal("auto_review_threshold", { precision: 5, scale: 4 }).notNull().default("0.3"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DecisionThresholds = typeof decisionThresholds.$inferSelect;
export type InsertDecisionThresholds = typeof decisionThresholds.$inferInsert;