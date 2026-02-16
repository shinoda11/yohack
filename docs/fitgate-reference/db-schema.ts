import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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
 * 1on1 test session applications table
 */
export const testSessions = mysqlTable("testSessions", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  currentHousing: mysqlEnum("currentHousing", ["賃貸", "持ち家"]).notNull(),
  incomeRange: mysqlEnum("incomeRange", ["1000-1500", "1500-2000", "2000-3000", "3000以上"]).notNull(),
  propertyRange: mysqlEnum("propertyRange", ["賃貸継続", "6000", "8000", "1億以上"]).notNull(),
  goalMode: mysqlEnum("goalMode", ["守り", "ゆるExit", "フルFIRE視野"]).notNull(),
  preferredTime: varchar("preferredTime", { length: 64 }),
  notes: text("notes"),
  
  // UTM parameters
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  utmContent: varchar("utmContent", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TestSession = typeof testSessions.$inferSelect;
export type InsertTestSession = typeof testSessions.$inferInsert;

/**
 * Fit Gate 12-question responses table
 */
export const fitGateResponses = mysqlTable("fitGateResponses", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  email: varchar("email", { length: 320 }),
  q1DecisionDeadline: varchar("q1DecisionDeadline", { length: 64 }),
  q2HousingStatus: varchar("q2HousingStatus", { length: 64 }),
  q3PriceRange: varchar("q3PriceRange", { length: 64 }),
  q4IncomeRange: varchar("q4IncomeRange", { length: 64 }),
  q5AssetRange: varchar("q5AssetRange", { length: 64 }),
  q6NumberInputTolerance: varchar("q6NumberInputTolerance", { length: 128 }),
  q7CareerChange: varchar("q7CareerChange", { length: 128 }),
  q8LifeEvent: varchar("q8LifeEvent", { length: 128 }),
  q9CurrentQuestion: varchar("q9CurrentQuestion", { length: 255 }),
  q10PreferredApproach: varchar("q10PreferredApproach", { length: 128 }),
  q11PrivacyConsent: boolean("q11PrivacyConsent").notNull(),
  q12BudgetSense: varchar("q12BudgetSense", { length: 64 }),
  invitationToken: varchar("invitationToken", { length: 64 }),
  judgmentResult: mysqlEnum("judgmentResult", ["prep", "ready", "session"]),
  prepBucket: mysqlEnum("prepBucket", ["near", "notyet"]),
  sessionDone: boolean("sessionDone").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FitGateResponse = typeof fitGateResponses.$inferSelect;
export type InsertFitGateResponse = typeof fitGateResponses.$inferInsert;

/**
 * Prep Mode subscribers (newsletter/preparation guidance)
 */
export const prepModeSubscribers = mysqlTable("prepModeSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  prepBucket: mysqlEnum("prepBucket", ["near", "notyet"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PrepModeSubscriber = typeof prepModeSubscribers.$inferSelect;
export type InsertPrepModeSubscriber = typeof prepModeSubscribers.$inferInsert;

/**
 * Invitation tokens for Session access
 */
export const invitationTokens = mysqlTable("invitationTokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  isUsed: boolean("isUsed").default(false).notNull(),
  usedBy: varchar("usedBy", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

export type InvitationToken = typeof invitationTokens.$inferSelect;
export type InsertInvitationToken = typeof invitationTokens.$inferInsert;

/**
 * Invite tokens for PASS friend referral (14 days, 1 time use)
 */
export const inviteTokens = mysqlTable("inviteTokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["PASS"]).default("PASS").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  isUsed: boolean("isUsed").default(false).notNull(),
  usedAt: timestamp("usedAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InviteToken = typeof inviteTokens.$inferSelect;
export type InsertInviteToken = typeof inviteTokens.$inferInsert;

/**
 * Pass subscriptions table (29,800円, 90日間)
 */
export const passSubscriptions = mysqlTable("passSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  loginId: varchar("loginId", { length: 320 }),
  loginPassword: varchar("loginPassword", { length: 64 }),
  purchaseDate: timestamp("purchaseDate").defaultNow().notNull(),
  expiryDate: timestamp("expiryDate").notNull(),
  price: int("price").notNull(), // 29800
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PassSubscription = typeof passSubscriptions.$inferSelect;
export type InsertPassSubscription = typeof passSubscriptions.$inferInsert;

/**
 * Pass Onboarding progress (3 tasks)
 * Task 1: アプリを開いた
 * Task 2: シナリオ比較を1回見た
 * Task 3: 意思決定メモを1回生成した
 */
export const passOnboarding = mysqlTable("passOnboarding", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  task1AppOpened: boolean("task1AppOpened").default(false).notNull(),
  task2CompareViewed: boolean("task2CompareViewed").default(false).notNull(),
  task3MemoGenerated: boolean("task3MemoGenerated").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PassOnboarding = typeof passOnboarding.$inferSelect;
export type InsertPassOnboarding = typeof passOnboarding.$inferInsert;

/**
 * Upgrade requests (Pass → Session)
 */
export const upgradeRequests = mysqlTable("upgradeRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  requestDate: timestamp("requestDate").defaultNow().notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  checkoutUrl: varchar("checkoutUrl", { length: 512 }),
  checkoutExpiry: timestamp("checkoutExpiry"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UpgradeRequest = typeof upgradeRequests.$inferSelect;
export type InsertUpgradeRequest = typeof upgradeRequests.$inferInsert;

/**
 * Session checkouts (Private, 48-hour expiry, one-time use)
 */
export const sessionCheckouts = mysqlTable("sessionCheckouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  checkoutToken: varchar("checkoutToken", { length: 64 }).notNull().unique(),
  checkoutUrl: varchar("checkoutUrl", { length: 512 }).notNull(),
  expiryDate: timestamp("expiryDate").notNull(),
  isUsed: boolean("isUsed").default(false).notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionCheckout = typeof sessionCheckouts.$inferSelect;
export type InsertSessionCheckout = typeof sessionCheckouts.$inferInsert;

/**
 * NotYet followup emails (30-day reminder for re-diagnosis)
 */
export const notyetFollowup = mysqlTable("notyetFollowup", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  fitGateResponseId: int("fitGateResponseId").notNull(),
  followupType: varchar("followupType", { length: 32 }).notNull().default("30d"), // "30d" for 30-day followup
  status: mysqlEnum("status", ["pending", "sending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  lastError: text("lastError"),
  providerMessageId: varchar("providerMessageId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotyetFollowup = typeof notyetFollowup.$inferSelect;
export type InsertNotyetFollowup = typeof notyetFollowup.$inferInsert;

/**
 * Unsubscribe table (opt-out from email notifications)
 */
export const unsubscribe = mysqlTable("unsubscribe", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  optOut: boolean("optOut").default(true).notNull(),
  unsubscribedAt: timestamp("unsubscribedAt").defaultNow().notNull(),
});

export type Unsubscribe = typeof unsubscribe.$inferSelect;
export type InsertUnsubscribe = typeof unsubscribe.$inferInsert;

/**
 * Job locks table (for preventing concurrent job execution)
 */
export const jobLocks = mysqlTable("jobLocks", {
  id: int("id").autoincrement().primaryKey(),
  jobName: varchar("jobName", { length: 64 }).notNull().unique(),
  lockedAt: timestamp("lockedAt").defaultNow().notNull(),
  lockedBy: varchar("lockedBy", { length: 255 }),
});

export type JobLock = typeof jobLocks.$inferSelect;
export type InsertJobLock = typeof jobLocks.$inferInsert;
