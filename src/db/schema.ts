import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
