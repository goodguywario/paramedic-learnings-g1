import { pgTable, serial, text, timestamp, boolean, integer, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const AREAS = [
  "cardiac",
  "trauma",
  "respiratory",
  "neurological",
  "obstetrics",
  "pediatrics",
  "operations",
] as const;

export type Area = (typeof AREAS)[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  guidance: text("guidance").notNull(),
  area: text("area"),
  rationale: text("rationale"),
  createdBy: text("created_by").notNull().default("system"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    userId: integer("user_id").notNull().references(() => users.id),
    topicId: integer("topic_id").notNull().references(() => topics.id),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.topicId] }),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [subscriptions.topicId],
    references: [topics.id],
  }),
}));

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const SOURCE_TYPES = ["debrief", "research", "guideline", "other"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceType: text("source_type").notNull(),
  submittedBy: text("submitted_by").notNull().default("system"),
  topicId: integer("topic_id").references(() => topics.id),
  // AI-generated fields (Stories 12, 13, 14)
  aiSummary: text("ai_summary"),
  suggestedTopicId: integer("suggested_topic_id").references(() => topics.id),
  conflictFlag: boolean("conflict_flag"),
  conflictReason: text("conflict_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
