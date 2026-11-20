import { and, asc, eq, getTableColumns, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { randomInt } from "node:crypto";
import { nanoid } from "nanoid";
import { messages, participants, rooms } from "../drizzle/schema.js";
import { getDb } from "./db.js";

/**
 * SELAMCHAT server logic.
 *
 * Design notes:
 * - No accounts, no profiles. A visitor is a row with a random animal identity
 *   and a secret token kept in the browser.
 * - Presence is a visibility-aware 60-second lease (`lastSeen`). Hidden polls
 *   do not extend that away timer.
 * - Messages live only while a room is active. Button exits close and delete
 *   immediately; a lost page connection is cleaned after its lease expires.
 */

/** Waiting users have up to 30 seconds to establish a match. */
export const QUEUE_WINDOW_SECONDS = 30;
/** A foreground client that stops heartbeating expires after 60 seconds. */
export const CHAT_DISCONNECT_TIMEOUT_SECONDS = 60;
/** Hidden tabs and locked screens use the same 60-second away lease. */
export const CHAT_BACKGROUND_TIMEOUT_SECONDS = 60;

export function getPartnerTimeoutSeconds(partnerIsHidden: boolean) {
  return partnerIsHidden ? CHAT_BACKGROUND_TIMEOUT_SECONDS : CHAT_DISCONNECT_TIMEOUT_SECONDS;
}

export function createRoomCode() {
  const digits = randomInt(0, 1_000_000_000).toString().padStart(9, "0");
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isFormattedRoomCode(code: string | null): code is string {
  return Boolean(code && /^\d{3}-\d{3}-\d{3}$/.test(code));
}

/** Safety net: messages of a closed room are always wiped. */
const MAX_MESSAGES_PER_ROOM = 300;
export const MAX_MESSAGE_LENGTH = 500;

export type AnimalDefinition = {
  key: string;
  name: string;
  emoji: string;
  color: string;
};

/** Every animal has its own fixed colour, chosen to stay legible on dark UI. */
export const ANIMALS: AnimalDefinition[] = [
  { key: "civciv", name: "Civciv", emoji: "🐥", color: "#FFD34E" },
  { key: "domuz", name: "Domuz", emoji: "🐷", color: "#FF9BC2" },
  { key: "tilki", name: "Tilki", emoji: "🦊", color: "#FF8A4C" },
  { key: "panda", name: "Panda", emoji: "🐼", color: "#C9D4E3" },
  { key: "penguen", name: "Penguen", emoji: "🐧", color: "#7FC8FF" },
  { key: "aslan", name: "Aslan", emoji: "🦁", color: "#F5B544" },
  { key: "kedi", name: "Kedi", emoji: "🐱", color: "#B79BFF" },
  { key: "kopek", name: "Köpek", emoji: "🐶", color: "#D8A87C" },
  { key: "kurbaga", name: "Kurbağa", emoji: "🐸", color: "#7BE58B" },
  { key: "balik", name: "Balık", emoji: "🐠", color: "#4FE3D0" },
  { key: "baykus", name: "Baykuş", emoji: "🦉", color: "#E8C48F" },
  { key: "kaplumbaga", name: "Kaplumbağa", emoji: "🐢", color: "#9ADB8F" },
  { key: "ari", name: "Arı", emoji: "🐝", color: "#FFE066" },
  { key: "tavsan", name: "Tavşan", emoji: "🐰", color: "#FFC2E2" },
  { key: "maymun", name: "Maymun", emoji: "🐵", color: "#E0A86A" },
  { key: "koala", name: "Koala", emoji: "🐨", color: "#A8C0D8" },
  { key: "zurafa", name: "Zürafa", emoji: "🦒", color: "#F0C15B" },
  { key: "ahtapot", name: "Ahtapot", emoji: "🐙", color: "#FF7BA9" },
  { key: "yunus", name: "Yunus", emoji: "🐬", color: "#6FD3F5" },
  { key: "kertenkele", name: "Kertenkele", emoji: "🦎", color: "#9EE37D" },
  { key: "fil", name: "Fil", emoji: "🐘", color: "#A7B2C5" },
  { key: "ayi", name: "Ayı", emoji: "🐻", color: "#C68E67" },
  { key: "kurt", name: "Kurt", emoji: "🐺", color: "#A9B2BF" },
  { key: "kaplan", name: "Kaplan", emoji: "🐯", color: "#FF9B54" },
  { key: "at", name: "At", emoji: "🐴", color: "#C99B72" },
  { key: "geyik", name: "Geyik", emoji: "🦌", color: "#D2AA7F" },
  { key: "zebra", name: "Zebra", emoji: "🦓", color: "#DCE4F0" },
  { key: "kanguru", name: "Kanguru", emoji: "🦘", color: "#E28D68" },
  { key: "kirpi", name: "Kirpi", emoji: "🦔", color: "#E0BC93" },
  { key: "sincap", name: "Sincap", emoji: "🐿️", color: "#DDAA73" },
  { key: "yarasa", name: "Yarasa", emoji: "🦇", color: "#A99ADB" },
  { key: "papagan", name: "Papağan", emoji: "🦜", color: "#79DDA5" },
  { key: "tavus_kusu", name: "Tavus Kuşu", emoji: "🦚", color: "#78CFC2" },
  { key: "ordek", name: "Ördek", emoji: "🦆", color: "#F7D45C" },
  { key: "flamingo", name: "Flamingo", emoji: "🦩", color: "#FF9DB8" },
  { key: "kartal", name: "Kartal", emoji: "🦅", color: "#C9A777" },
  { key: "balina", name: "Balina", emoji: "🐋", color: "#7799D9" },
  { key: "kopekbaligi", name: "Köpekbalığı", emoji: "🦈", color: "#8DC6E8" },
  { key: "fok", name: "Fok", emoji: "🦭", color: "#B3D8EA" },
  { key: "su_samuru", name: "Su Samuru", emoji: "🦦", color: "#B99070" },
  { key: "yengec", name: "Yengeç", emoji: "🦀", color: "#FF7A70" },
  { key: "istakoz", name: "Istakoz", emoji: "🦞", color: "#F06E65" },
  { key: "karides", name: "Karides", emoji: "🦐", color: "#FFAF8A" },
  { key: "deniz_anasi", name: "Denizanası", emoji: "🪼", color: "#C69FFF" },
  { key: "salyangoz", name: "Salyangoz", emoji: "🐌", color: "#B9A7D4" },
  { key: "kelebek", name: "Kelebek", emoji: "🦋", color: "#FF8FC1" },
  { key: "ugur_bocegi", name: "Uğur Böceği", emoji: "🐞", color: "#F07C75" },
  { key: "lama", name: "Lama", emoji: "🦙", color: "#D4A887" },
  { key: "deve", name: "Deve", emoji: "🐪", color: "#E2B675" },
  { key: "goril", name: "Goril", emoji: "🦍", color: "#A7A3B6" },
  { key: "orangutan", name: "Orangutan", emoji: "🦧", color: "#E18C55" },
  { key: "kuzu", name: "Kuzu", emoji: "🐑", color: "#D9D6CE" },
  { key: "keci", name: "Keçi", emoji: "🐐", color: "#C9B89E" },
  { key: "inek", name: "İnek", emoji: "🐮", color: "#ECE6D8" },
  { key: "fare", name: "Fare", emoji: "🐭", color: "#C8B9C7" },
  { key: "karga", name: "Karga", emoji: "🐦‍⬛", color: "#9FA8B6" },
];

export function chooseAnimal(excludeAnimalKey?: unknown): AnimalDefinition {
  const excluded = typeof excludeAnimalKey === "string" ? excludeAnimalKey : null;
  const available = excluded ? ANIMALS.filter(animal => animal.key !== excluded) : ANIMALS;
  const choices = available.length > 0 ? available : ANIMALS;
  return choices[randomInt(0, choices.length)];
}

export type ChatStatus = "idle" | "waiting" | "chatting" | "partner_left" | "connection_lost";

export type Identity = {
  animalKey: string;
  name: string;
  emoji: string;
  color: string;
};

export type ChatMessage = {
  id: number;
  clientId: string | null;
  body: string;
  mine: boolean;
  senderName: string;
  senderEmoji: string;
  senderColor: string;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
};

export type ChatState = {
  token: string;
  status: ChatStatus;
  roomId: number | null;
  roomCode: string | null;
  roomCard: { animals: [Identity, Identity]; code: string } | null;
  me: Identity;
  partner: Identity | null;
  partnerPresence: "online" | "disconnected" | null;
  messages: ChatMessage[];
  counters: { online: number; activeChats: number };
  serverTime: string;
};

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type ParticipantRow = typeof participants.$inferSelect;

async function db(): Promise<Db> {
  const instance = await getDb();
  if (!instance) throw new Error("database_unavailable");
  return instance;
}

function identityOf(row: ParticipantRow): Identity {
  return {
    animalKey: row.animalKey,
    name: row.displayName,
    emoji: row.emoji,
    color: row.color,
  };
}

function nowSecondsAgo(seconds: number) {
  return sql`DATE_SUB(NOW(), INTERVAL ${seconds} SECOND)`;
}

function cleanBody(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

export async function startSession(rawToken: unknown, rawAvoidAnimalKey?: unknown): Promise<ParticipantRow> {
  const d = await db();
  const token =
    typeof rawToken === "string" && rawToken.length >= 16 && rawToken.length <= 64 ? rawToken : null;

  if (token) {
    const existing = await d.select().from(participants).where(eq(participants.token, token)).limit(1);
    if (existing.length > 0) {
      // Existing chatting sessions are renewed only after their lease has been
      // validated by getState; session bootstrap must not revive an expired room.
      return existing[0];
    }
  }

  const animal = chooseAnimal(rawAvoidAnimalKey);
  const newToken = token ?? nanoid(24);

  await d.insert(participants).values({
    token: newToken,
    animalKey: animal.key,
    displayName: animal.name,
    emoji: animal.emoji,
    color: animal.color,
    status: "idle",
  });

  const [created] = await d
    .select()
    .from(participants)
    .where(eq(participants.token, newToken))
    .limit(1);

  return created;
}

async function findByToken(d: Db, token: string): Promise<ParticipantRow | null> {
  if (!token) return null;
  const rows = await d.select().from(participants).where(eq(participants.token, token)).limit(1);
  return rows[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Rooms                                                                      */
/* -------------------------------------------------------------------------- */

/** All room participants are locked by ascending id before locking the room. */
async function lockRoomParticipants(tx: Tx, roomId: number, includeParticipantId?: number, lock = true) {
  const roomFilter = includeParticipantId
    ? or(eq(participants.roomId, roomId), eq(participants.id, includeParticipantId))
    : eq(participants.roomId, roomId);
  const query = tx
    .select()
    .from(participants)
    .where(roomFilter)
    .orderBy(asc(participants.id));
  return lock ? query.for("update") : query;
}

/**
 * Must be called inside a transaction. The room row is the serialization point
 * shared with sendMessage, so a concurrent send either commits before closure
 * (and is then deleted) or sees the closed room and is rejected.
 * A connection timeout marks both participants as connection-lost; deliberate
 * leaves still reset the leaver and notify only the other participant.
 */
async function closeRoom(
  tx: Tx,
  roomId: number,
  leavingId: number,
  connectionLost = false
): Promise<void> {
  // Keep a single lock order across all close/send/state paths.
  await lockRoomParticipants(tx, roomId);
  const [room] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).for("update").limit(1);

  // Idempotent: a concurrent leave/timeout may already have closed this room.
  if (!room || room.status !== "active") {
    await tx.update(rooms).set({ publicCode: null }).where(eq(rooms.id, roomId));
    await tx.delete(messages).where(eq(messages.roomId, roomId));
    return;
  }

  await tx
    .update(rooms)
    .set({ status: "closed", publicCode: null, lastActivity: sql`NOW()` })
    .where(and(eq(rooms.id, roomId), eq(rooms.status, "active")));
  await tx.delete(messages).where(eq(messages.roomId, roomId));

  if (connectionLost) {
    // Keep isHidden as a short-lived marker so later state reads distinguish a timeout from a deliberate leave.
    await tx
      .update(participants)
      .set({ status: "partner_left", roomId: null, queuedAt: null, isHidden: true })
      .where(eq(participants.roomId, roomId));
    return;
  }

  const otherSide = [eq(participants.roomId, roomId)];
  if (leavingId > 0) {
    await tx
      .update(participants)
      .set({ status: "idle", roomId: null, queuedAt: null, isHidden: false })
      .where(and(eq(participants.id, leavingId), eq(participants.roomId, roomId)));
    otherSide.push(ne(participants.id, leavingId));
  }

  // Every still-present peer sees the exit notice; no second exit is required.
  await tx
    .update(participants)
    .set({ status: "partner_left", roomId: null, queuedAt: null, isHidden: false })
    .where(and(...otherSide));
}

/** Locks both queue rows in id order and claims them in the same transaction. */
async function tryMatch(d: Db, meId: number): Promise<number | null> {
  const candidates = await d
    .select({ id: participants.id })
    .from(participants)
    .where(
      and(
        eq(participants.status, "waiting"),
        ne(participants.id, meId),
        isNull(participants.roomId),
        gt(participants.lastSeen, nowSecondsAgo(QUEUE_WINDOW_SECONDS))
      )
    )
    .orderBy(asc(participants.queuedAt))
    .limit(5);

  for (const candidate of candidates) {
    const roomId = await d.transaction(async tx => {
      const ids = [meId, candidate.id].sort((a, b) => a - b);
      const locked = await tx
        .select()
        .from(participants)
        .where(
          and(
            inArray(participants.id, ids),
            eq(participants.status, "waiting"),
            isNull(participants.roomId),
            gt(participants.lastSeen, nowSecondsAgo(QUEUE_WINDOW_SECONDS))
          )
        )
        .orderBy(asc(participants.id))
        .for("update");

      if (locked.length !== 2) return null;

      const inserted = await tx.insert(rooms).values({ status: "active", publicCode: createRoomCode() });
      const createdRoomId = Number(inserted[0].insertId);
      const claimed = await tx
        .update(participants)
        .set({
          status: "chatting",
          roomId: createdRoomId,
          queuedAt: null,
          lastSeen: sql`NOW()`,
        })
        .where(inArray(participants.id, ids));

      if (claimed[0].affectedRows !== 2) throw new Error("match_claim_failed");
      return createdRoomId;
    });

    if (roomId) return roomId;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

export async function joinQueue(token: string, rotateAnimal = false): Promise<void> {
  const d = await db();
  const me = await findByToken(d, token);
  if (!me) return;

  if (me.status === "chatting" && me.roomId) return;

  const shouldSearch = await d.transaction(async tx => {
    const [current] = await tx
      .select()
      .from(participants)
      .where(eq(participants.id, me.id))
      .for("update")
      .limit(1);
    if (!current || (current.status === "chatting" && current.roomId)) return false;

    const nextAnimal = rotateAnimal && current.status !== "waiting"
      ? chooseAnimal(current.animalKey)
      : null;
    await tx
      .update(participants)
      .set({
        ...(nextAnimal
          ? {
              animalKey: nextAnimal.key,
              displayName: nextAnimal.name,
              emoji: nextAnimal.emoji,
              color: nextAnimal.color,
            }
          : {}),
        status: "waiting",
        queuedAt: sql`NOW()`,
        roomId: null,
        lastSeen: sql`NOW()`,
        isHidden: false,
      })
      .where(eq(participants.id, me.id));
    return true;
  });

  if (shouldSearch) await tryMatch(d, me.id);
}

export async function leaveChat(token: string, rotateAnimal = false): Promise<void> {
  const d = await db();
  for (;;) {
    const snapshot = await findByToken(d, token);
    if (!snapshot) return;

    const retry = await d.transaction(async tx => {
      // If already in a room, lock both participants in deterministic order
      // before the room. If no room is visible yet, lock self so a concurrent
      // matcher either loses the queue claim or becomes visible on reread.
      const locked = snapshot.roomId
        ? await tx
            .select()
            .from(participants)
            .where(or(eq(participants.roomId, snapshot.roomId), eq(participants.id, snapshot.id)))
            .orderBy(asc(participants.id))
            .for("update")
        : await tx
            .select()
            .from(participants)
            .where(eq(participants.id, snapshot.id))
            .for("update")
            .limit(1);
      const current = locked.find(row => row.id === snapshot.id);
      if (!current) return false;

      // A matcher won between the unlocked snapshot and our participant lock.
      // Release this transaction and retry with the newly visible room id.
      if (current.roomId && current.roomId !== snapshot.roomId) return true;

      if (current.roomId) await closeRoom(tx, current.roomId, current.id);
      const nextAnimal = rotateAnimal && current.status !== "waiting"
        ? chooseAnimal(current.animalKey)
        : null;
      await tx
        .update(participants)
        .set({
          ...(nextAnimal
            ? {
                animalKey: nextAnimal.key,
                displayName: nextAnimal.name,
                emoji: nextAnimal.emoji,
                color: nextAnimal.color,
              }
            : {}),
          status: "idle",
          roomId: null,
          queuedAt: null,
          isHidden: false,
        })
        .where(eq(participants.id, current.id));
      return false;
    });

    if (!retry) return;
  }
}

/** Page exit is different from leaving a conversation: remove tab presence at once. */
export async function endSession(token: string): Promise<void> {
  const d = await db();
  for (;;) {
    const snapshot = await findByToken(d, token);
    if (!snapshot) return;

    const retry = await d.transaction(async tx => {
      const locked = snapshot.roomId
        ? await tx
            .select()
            .from(participants)
            .where(or(eq(participants.roomId, snapshot.roomId), eq(participants.id, snapshot.id)))
            .orderBy(asc(participants.id))
            .for("update")
        : await tx
            .select()
            .from(participants)
            .where(eq(participants.id, snapshot.id))
            .for("update")
            .limit(1);
      const current = locked.find(row => row.id === snapshot.id);
      if (!current) return false;
      if (current.roomId && current.roomId !== snapshot.roomId) return true;

      if (current.roomId) await closeRoom(tx, current.roomId, current.id);
      await tx.delete(participants).where(eq(participants.id, current.id));
      return false;
    });

    if (!retry) return;
  }
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function allowMessage(token: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(token);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(token, { count: 1, resetAt: now + 10_000 });
    return true;
  }
  if (bucket.count >= 15) return false;
  bucket.count += 1;
  return true;
}

export async function sendMessage(
  token: string,
  rawBody: unknown,
  rawClientId: unknown
): Promise<{ ok: boolean; error?: string }> {
  const body = cleanBody(rawBody);
  if (!body) return { ok: false, error: "empty_message" };
  const clientId = typeof rawClientId === "string" && /^[A-Za-z0-9_-]{16,36}$/.test(rawClientId)
    ? rawClientId
    : null;
  if (!clientId) return { ok: false, error: "invalid_message_id" };

  const d = await db();
  const inserted = await d.transaction(async tx => {
    const [snapshot] = await tx
      .select()
      .from(participants)
      .where(and(eq(participants.token, token), eq(participants.status, "chatting")))
      .limit(1);
    if (!snapshot || !snapshot.roomId) return false;

    // Match closeRoom's ascending participant-id then room lock order. This
    // makes a send and timeout/leave mutually serializable without stale peers.
    const lockedMembers = await lockRoomParticipants(tx, snapshot.roomId, snapshot.id);
    const current = lockedMembers.find(row => row.id === snapshot.id);
    if (!current || current.status !== "chatting" || current.roomId !== snapshot.roomId) return false;
    const roomId = current.roomId;
    const liveMembers = await tx
      .select({ id: participants.id })
      .from(participants)
      .where(and(
        eq(participants.roomId, roomId),
        eq(participants.status, "chatting"),
        sql`((participants.isHidden = 0 AND participants.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)})
          OR (participants.isHidden = 1 AND participants.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)}))`
      ))
      .limit(2);
    if (lockedMembers.filter(row => row.roomId === roomId && row.status === "chatting").length !== 2 || liveMembers.length !== 2) {
      await closeRoom(tx, roomId, -1, true);
      return false;
    }

    const duplicate = await tx
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.senderId, current.id), eq(messages.clientId, clientId)))
      .limit(1);
    if (duplicate.length > 0) return "sent" as const;
    if (!allowMessage(token)) return "too_fast" as const;

    // Updating the active room serializes this validated send against closure.
    const roomTouch = await tx
      .update(rooms)
      .set({ lastActivity: sql`NOW()` })
      .where(and(eq(rooms.id, roomId), eq(rooms.status, "active")));

    if (Number(roomTouch[0].affectedRows) !== 1) {
      await tx
        .update(participants)
        .set({ status: "partner_left", roomId: null, queuedAt: null })
        .where(and(eq(participants.id, current.id), eq(participants.roomId, roomId)));
      return false;
    }

    // The locked row passed the 30-second lease predicate above, so a
    // successful foreground action may safely extend the sender's lease.
    await tx.update(participants).set({ lastSeen: sql`NOW()` }).where(eq(participants.id, current.id));

    const insertedMessage = await tx.insert(messages).values({ roomId, senderId: current.id, clientId, body });

    // Keep a single room bounded; older rows of the live room are dropped too.
    // Prune periodically instead of making every message wait for a nested delete.
    if (Number(insertedMessage[0].insertId) % 50 === 0) {
      await tx.execute(
        sql`DELETE FROM messages WHERE roomId = ${roomId} AND id NOT IN (
          SELECT id FROM (
            SELECT id FROM messages WHERE roomId = ${roomId} ORDER BY id DESC LIMIT ${MAX_MESSAGES_PER_ROOM}
          ) AS keep_rows
        )`
      );
    }
    return "sent" as const;
  });

  if (inserted === "too_fast") return { ok: false, error: "too_fast" };
  return inserted === "sent" ? { ok: true } : { ok: false, error: "chat_closed" };
}


/** Visibility is a separate hint; hidden clients get the same 30-second lease. */
export async function setVisibility(
  token: string,
  isHidden: boolean,
  version: number
): Promise<void> {
  const d = await db();
  const retry = await d.transaction(async tx => {
    const [snapshot] = await tx.select().from(participants).where(eq(participants.token, token)).limit(1);
    if (!snapshot) return false;
    const locked = snapshot.roomId
      ? await lockRoomParticipants(tx, snapshot.roomId, snapshot.id)
      : await tx.select().from(participants).where(eq(participants.id, snapshot.id)).for("update").limit(1);
    const current = locked.find(row => row.id === snapshot.id);
    if (!current || current.visibilityVersion >= version || current.status === "partner_left") return false;
    if (current.roomId !== snapshot.roomId) return current.status === "chatting" && current.roomId !== null;

    if (current.status === "chatting" && current.roomId) {
      const members = locked.filter(row => row.roomId === current.roomId && row.status === "chatting");
      const [room] = await tx.select().from(rooms).where(eq(rooms.id, current.roomId)).for("update").limit(1);
      if (!room || room.status !== "active") {
        await closeRoom(tx, current.roomId, -1, true);
        return false;
      }
      const freshness = await tx
        .select({
          id: participants.id,
          fresh: sql<number>`CASE WHEN participants.isHidden = 1
            THEN participants.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)}
            ELSE participants.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)} END`,
        })
        .from(participants)
        .where(eq(participants.roomId, current.roomId));
      if (members.length !== 2 || freshness.length !== 2 || freshness.some(row => !Number(row.fresh))) {
        await closeRoom(tx, current.roomId, -1, true);
        return false;
      }
    }

    // A fresh return is allowed; an expired chatting lease is closed above and
    // never has its hidden marker or lastSeen renewed by this request.
    await tx.update(participants)
      .set({ isHidden, visibilityVersion: version, lastSeen: sql`NOW()` })
      .where(and(eq(participants.id, current.id), sql`${participants.visibilityVersion} < ${version}`));
    return false;
  });
  if (retry) await setVisibility(token, isHidden, version);
}

/* -------------------------------------------------------------------------- */
/* Housekeeping                                                               */
/* -------------------------------------------------------------------------- */

let lastSweep = 0;

/** Revalidates freshness under the same participant locks used by room closure. */
async function closeRoomIfStale(tx: Tx, roomId: number): Promise<void> {
  await lockRoomParticipants(tx, roomId);
  const freshParticipants = await tx
    .select({ id: participants.id })
    .from(participants)
    .where(
      and(
        eq(participants.roomId, roomId),
        sql`(
          (participants.isHidden = 0 AND participants.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)})
          OR (participants.isHidden = 1 AND participants.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)})
        )`
      )
    )
    .limit(1);
  if (freshParticipants.length > 0) return;
  await closeRoom(tx, roomId, -1, true);
}

/** Removes abandoned rooms, their messages, and long-gone visitors. */
export async function sweep(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastSweep < 10_000) return;
  lastSweep = now;

  const d = await db();

  // A fully timed-out room is closed and both returning participants receive
  // the connection-lost notice; quiet-but-connected chats are never touched.
  const [staleRows] = await d.execute(
    sql`SELECT r.id AS id FROM rooms r
        WHERE r.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM participants p
            WHERE p.roomId = r.id AND (
              (p.isHidden = 0 AND p.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)})
              OR (p.isHidden = 1 AND p.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)})
            )
          )
        LIMIT 50`
  );
  const staleRooms = staleRows as unknown as Array<{ id: number }>;

  for (const room of staleRooms) {
    await d.transaction(tx => closeRoomIfStale(tx, Number(room.id)));
  }

  // Safety net: never keep messages of a closed room.
  await d.execute(
    sql`DELETE m FROM messages m JOIN rooms r ON r.id = m.roomId WHERE r.status = 'closed'`
  );

  // Forget visitors that are long gone (identity is re-assigned on return).
  await d.delete(participants).where(
    and(isNull(participants.roomId), sql`participants.lastSeen < ${nowSecondsAgo(600)}`)
  );
}

/* -------------------------------------------------------------------------- */
/* State                                                                      */
/* -------------------------------------------------------------------------- */

let countersCache: { expiresAt: number; value: { online: number; activeChats: number } } | null = null;

async function readCounters(d: Db) {
  if (countersCache && countersCache.expiresAt > Date.now()) return countersCache.value;
  const [onlineRow] = await d
    .select({ total: sql<number>`COUNT(*)` })
    .from(participants)
    .where(sql`(
      (participants.isHidden = 0 AND participants.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)})
      OR (participants.isHidden = 1 AND participants.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)})
    )`);

  const [chatRow] = await d
    .select({ total: sql<number>`COUNT(*)` })
    .from(rooms)
    .where(
      and(
        eq(rooms.status, "active"),
        sql`EXISTS (
          SELECT 1 FROM participants p
          WHERE p.roomId = rooms.id AND (
            (p.isHidden = 0 AND p.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)})
            OR (p.isHidden = 1 AND p.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)})
          )
        )`
      )
    );

  const value = {
    online: Number(onlineRow?.total ?? 0),
    activeChats: Number(chatRow?.total ?? 0),
  };
  countersCache = { expiresAt: Date.now() + 750, value };
  return value;
}

export async function getState(token: string): Promise<ChatState | null> {
  const d = await db();
  let me = await findByToken(d, token);
  if (!me) return null;

  if (me.status !== "chatting") {
    await d.update(participants).set({ lastSeen: sql`NOW()` }).where(eq(participants.id, me.id));
    me = (await findByToken(d, token)) ?? me;
  }

  let status: ChatStatus = me.status === "partner_left" && me.isHidden ? "connection_lost" : me.status;
  let partner: Identity | null = null;
  let partnerPresence: "online" | "disconnected" | null = null;
  let rows: ChatMessage[] = [];
  let roomCode: string | null = null;
  let roomCard: ChatState["roomCard"] = null;

  if (me.roomId) {
    const roomId = me.roomId;
    const snapshot = await d.transaction(async tx => {
      const lockedMembers = await lockRoomParticipants(tx, roomId, me!.id);
      const current = lockedMembers.find(row => row.id === me!.id);
      if (!current || current.roomId !== roomId || current.status !== "chatting") {
        if (current?.status === "chatting" && current.roomId) {
          return {
            status: "chatting" as const,
            partner: null,
            partnerPresence: null,
            roomCode: null,
            roomCard: null,
            messages: [] as ChatMessage[],
            retry: true,
          };
        }
        return {
          status: current?.status === "partner_left"
            ? (current.isHidden ? ("connection_lost" as const) : ("partner_left" as const))
            : ("idle" as const),
          partner: null,
          partnerPresence: null,
          roomCode: null,
          roomCard: null,
          messages: [] as ChatMessage[],
          retry: false,
        };
      }

      const [room] = await tx
        .select()
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .for("update")
        .limit(1);

      if (!room || room.status !== "active") {
        await tx.update(rooms).set({ publicCode: null }).where(eq(rooms.id, roomId));
        await tx.delete(messages).where(eq(messages.roomId, roomId));
        await tx
          .update(participants)
          .set({ status: "partner_left", roomId: null, queuedAt: null, isHidden: true })
          .where(eq(participants.roomId, roomId));
        return { status: "connection_lost" as const, partner: null, partnerPresence: null, roomCode: null, roomCard: null, messages: [] as ChatMessage[], retry: false };
      }

      let sharedCode = room.publicCode;
      if (!isFormattedRoomCode(sharedCode)) {
        sharedCode = createRoomCode();
        await tx.update(rooms).set({ publicCode: sharedCode }).where(eq(rooms.id, roomId));
      }
      const sharedAnimals = lockedMembers
        .filter(row => row.roomId === roomId && row.status === "chatting")
        .sort((a, b) => a.id - b.id)
        .map(identityOf);
      if (sharedAnimals.length !== 2) {
        await closeRoom(tx, roomId, current.id, true);
        return { status: "connection_lost" as const, partner: null, partnerPresence: null, roomCode: null, roomCard: null, messages: [] as ChatMessage[], retry: false };
      }

      const partnerRows = await tx
        .select({
          ...getTableColumns(participants),
          freshVisible: sql<number>`(participants.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)})`,
          freshHidden: sql<number>`(participants.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)})`,
        })
        .from(participants)
        .where(and(eq(participants.roomId, roomId), ne(participants.id, current.id)))
        .limit(1);
      const partnerRow = partnerRows[0];
      const partnerTimeoutSeconds = getPartnerTimeoutSeconds(Boolean(partnerRow?.isHidden));
      const partnerFresh = partnerRow
        ? Number(
            partnerTimeoutSeconds === CHAT_BACKGROUND_TIMEOUT_SECONDS
              ? partnerRow.freshHidden
              : partnerRow.freshVisible
          )
        : 0;

      if (!partnerRow || !partnerFresh) {
        // A timeout is reported separately from a deliberate leave on both sides.
        await closeRoom(tx, roomId, partnerRow?.id ?? -1, true);
        return { status: "connection_lost" as const, partner: null, partnerPresence: null, roomCode: null, roomCard: null, messages: [] as ChatMessage[], retry: false };
      }

      const currentFreshRows = await tx
        .select({ fresh: sql<number>`CASE WHEN participants.isHidden = 1
          THEN participants.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)}
          ELSE participants.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)} END` })
        .from(participants)
        .where(eq(participants.id, current.id))
        .limit(1);
      if (!Number(currentFreshRows[0]?.fresh)) {
        await closeRoom(tx, roomId, current.id, true);
        return { status: "connection_lost" as const, partner: null, partnerPresence: null, roomCode: null, roomCard: null, messages: [] as ChatMessage[], retry: false };
      }
      if (!current.isHidden) {
        await tx.update(participants).set({ lastSeen: sql`NOW()` }).where(eq(participants.id, current.id));
      }

      const peerMessages = and(eq(messages.roomId, roomId), ne(messages.senderId, current.id));
      if (!current.isHidden) {
        await tx
          .update(messages)
          .set({
            deliveredAt: sql`COALESCE(${messages.deliveredAt}, NOW())`,
            readAt: sql`COALESCE(${messages.readAt}, NOW())`,
          })
          .where(and(peerMessages, or(isNull(messages.deliveredAt), isNull(messages.readAt))));
      } else {
        await tx
          .update(messages)
          .set({ deliveredAt: sql`COALESCE(${messages.deliveredAt}, NOW())` })
          .where(and(peerMessages, isNull(messages.deliveredAt)));
      }

      const messageRows = await tx
        .select({
          id: messages.id,
          clientId: messages.clientId,
          body: messages.body,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
          senderName: participants.displayName,
          senderEmoji: participants.emoji,
          senderColor: participants.color,
          deliveredAt: messages.deliveredAt,
          readAt: messages.readAt,
        })
        .from(messages)
        .innerJoin(participants, eq(participants.id, messages.senderId))
        .where(eq(messages.roomId, roomId))
        .orderBy(asc(messages.id))
        .limit(MAX_MESSAGES_PER_ROOM);

      return {
        status: "chatting" as const,
        partner: identityOf(partnerRow),
        partnerPresence: partnerRow.isHidden ? ("disconnected" as const) : ("online" as const),
        roomCode: sharedCode,
        roomCard: {
          animals: [sharedAnimals[0], sharedAnimals[1]] as [Identity, Identity],
          code: sharedCode,
        },
        retry: false,
        messages: messageRows.map(row => ({
          id: row.id,
          clientId: row.clientId,
          body: row.body,
          mine: row.senderId === current.id,
          senderName: row.senderName,
          senderEmoji: row.senderEmoji,
          senderColor: row.senderColor,
          createdAt: row.createdAt.toISOString(),
          deliveredAt: row.deliveredAt?.toISOString() ?? null,
          readAt: row.readAt?.toISOString() ?? null,
        })),
      };
    });

    status = snapshot.status;
    partner = snapshot.partner;
    partnerPresence = snapshot.partnerPresence;
    roomCode = snapshot.roomCode;
    roomCard = snapshot.roomCard;
    rows = snapshot.messages;
    me = (await findByToken(d, token)) ?? me;
    if (snapshot.retry) return getState(token);
  } else if (status === "chatting") {
    // A chat without an active room is treated as ended, never restored.
    await d
      .update(participants)
      .set({ status: "partner_left", roomId: null, queuedAt: null, isHidden: true })
      .where(eq(participants.id, me.id));
    status = "connection_lost";
    me = (await findByToken(d, token)) ?? me;
  }

  if (status === "waiting") {
    // Keep looking for a partner on every poll.
    await tryMatch(d, me.id);
    const refreshed = await findByToken(d, token);
    if (refreshed) {
      me = refreshed;
      status = refreshed.status;
      if (refreshed.status === "chatting") {
        return getState(token);
      }
    }
  }

  const counters = await readCounters(d);

  return {
    token: me.token,
    status,
    roomId: status === "chatting" ? me.roomId : null,
    roomCode: status === "chatting" ? roomCode : null,
    roomCard: status === "chatting" ? roomCard : null,
    me: identityOf(me),
    partner: partner ? { animalKey: partner.animalKey, name: partner.name, emoji: partner.emoji, color: partner.color } : null,
    partnerPresence,
    messages: rows,
    counters,
    serverTime: new Date().toISOString(),
  };
}

/** Fast message poll: batch receipt writes before returning the same snapshot. */
export async function getMessages(token: string): Promise<{
  messages: ChatMessage[];
  partnerPresence: "online" | "disconnected";
} | null> {
  const d = await db();
  const sender = alias(participants, "message_sender");
  const peer = alias(participants, "message_partner");

  // Only unread inbound rows are written. The participant subquery is evaluated
  // by MySQL at update time, so a hidden/expired session cannot mark messages read.
  await d.execute(sql`UPDATE messages m
    JOIN participants p ON p.roomId = m.roomId AND p.token = ${token} AND p.status = 'chatting'
    SET m.deliveredAt = COALESCE(m.deliveredAt, NOW()),
        m.readAt = IF(p.isHidden = 0, COALESCE(m.readAt, NOW()), m.readAt)
    WHERE m.senderId <> p.id
      AND ((p.isHidden = 0 AND p.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)})
        OR (p.isHidden = 1 AND p.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)}))
      AND EXISTS (SELECT 1 FROM participants peer
        WHERE peer.roomId = p.roomId AND peer.id <> p.id AND peer.status = 'chatting'
          AND ((peer.isHidden = 0 AND peer.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)})
            OR (peer.isHidden = 1 AND peer.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)})))
      AND (m.deliveredAt IS NULL OR (p.isHidden = 0 AND m.readAt IS NULL))`);

  const rows = await d
    .select({
      id: messages.id,
      clientId: messages.clientId,
      body: messages.body,
      senderId: messages.senderId,
      meId: participants.id,
      meFresh: sql<number>`CASE WHEN participants.isHidden = 1
        THEN participants.lastSeen > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)}
        ELSE participants.lastSeen > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)} END`,
      peerId: peer.id,
      peerHidden: peer.isHidden,
      peerFresh: sql<number>`CASE WHEN ${peer.isHidden} = 1
        THEN ${peer.lastSeen} > ${nowSecondsAgo(CHAT_BACKGROUND_TIMEOUT_SECONDS)}
        ELSE ${peer.lastSeen} > ${nowSecondsAgo(CHAT_DISCONNECT_TIMEOUT_SECONDS)} END`,
      createdAt: messages.createdAt,
      senderName: sender.displayName,
      senderEmoji: sender.emoji,
      senderColor: sender.color,
      deliveredAt: messages.deliveredAt,
      readAt: messages.readAt,
    })
    .from(participants)
    .leftJoin(messages, eq(messages.roomId, participants.roomId))
    .leftJoin(sender, eq(sender.id, messages.senderId))
    .leftJoin(peer, and(eq(peer.roomId, participants.roomId), ne(peer.id, participants.id)))
    .where(and(eq(participants.token, token), eq(participants.status, "chatting")))
    .orderBy(asc(messages.id))
    .limit(MAX_MESSAGES_PER_ROOM);

  const messageRows = rows.filter(row => row.id !== null);
  if (rows.length === 0) return null;
  if (!Number(rows[0].meFresh) || rows[0].peerId === null || !Number(rows[0].peerFresh)) {
    await getState(token);
    return null;
  }

  return {
    messages: messageRows.map(row => ({
      id: row.id as number,
      clientId: row.clientId,
      body: row.body ?? "",
      mine: row.senderId === row.meId,
      senderName: row.senderName ?? "",
      senderEmoji: row.senderEmoji ?? "",
      senderColor: row.senderColor ?? "",
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
      deliveredAt: row.deliveredAt?.toISOString() ?? null,
      readAt: row.readAt?.toISOString() ?? null,
    })),
    partnerPresence: rows[0].peerHidden ? "disconnected" : "online",
  };
}
