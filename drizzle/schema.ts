import { bigint, boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * MUKALCHAT is fully anonymous, so this table stays unused; it is kept so the
 * starter's helpers keep working if authentication is ever added.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
 * A live chat room. Rooms exist only while a conversation is running; once a
 * participant leaves, the room is closed and its messages are deleted.
 */
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  publicCode: varchar("publicCode", { length: 12 }),
  status: mysqlEnum("status", ["active", "closed"]).default("active").notNull(),
  lastActivity: timestamp("lastActivity").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("rooms_public_code_unique").on(table.publicCode)]);

/**
 * Anonymous visitor. `token` is the random per-tab secret the browser keeps.
 * No personal data is stored: only the assigned animal identity and presence.
 */
export const participants = mysqlTable(
  "participants",
  {
    id: int("id").autoincrement().primaryKey(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    animalKey: varchar("animalKey", { length: 32 }).notNull(),
    displayName: varchar("displayName", { length: 40 }).notNull(),
    emoji: varchar("emoji", { length: 16 }).notNull(),
    color: varchar("color", { length: 16 }).notNull(),
    status: mysqlEnum("status", ["idle", "waiting", "chatting", "partner_left"])
      .default("idle")
      .notNull(),
    roomId: int("roomId"),
    queuedAt: timestamp("queuedAt"),
    typingAt: timestamp("typingAt"),
    isHidden: boolean("isHidden").default(false).notNull(),
    visibilityVersion: bigint("visibilityVersion", { mode: "number" }).default(0).notNull(),
    lastSeen: timestamp("lastSeen").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("idx_participants_last_seen").on(table.lastSeen),
    index("idx_participants_status").on(table.status, table.queuedAt),
    index("idx_participants_room").on(table.roomId),
  ]
);

/**
 * Transient messages of an active room. Rows are hard-deleted the moment the
 * conversation ends (leave, tab close, disconnect) and by the sweeper for
 * abandoned rooms, so no message history is ever kept.
 */
export const messages = mysqlTable(
  "messages",
  {
    id: int("id").autoincrement().primaryKey(),
    roomId: int("roomId").notNull(),
    senderId: int("senderId").notNull(),
    clientId: varchar("clientId", { length: 36 }),
    body: varchar("body", { length: 600 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    deliveredAt: timestamp("deliveredAt"),
    readAt: timestamp("readAt"),
  },
  table => [
    index("idx_messages_room").on(table.roomId, table.id),
    uniqueIndex("uq_messages_sender_client").on(table.senderId, table.clientId),
  ]
);

export type Room = typeof rooms.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Message = typeof messages.$inferSelect;
