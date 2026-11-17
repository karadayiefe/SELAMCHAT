import { and, asc, eq, getTableColumns, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { messages, participants, rooms } from "../drizzle/schema.js";
import { getDb } from "./db.js";

/**
 * MUKALCHAT server logic.
 *
 * Design notes:
 * - No accounts, no profiles. A visitor is a row with a random animal identity
 *   and a secret token kept in the browser.
 * - Presence is a heartbeat (`lastSeen`). Only fresh rows are counted, so the
 *   live counters always reflect real connected students.
 * - Messages live only while a room is active. Every exit path (button, tab
 *   close, crash, sweeper) deletes the room's messages immediately.
 */

/** Tolerate transient network and serverless latency before declaring a tab gone. */
export const PRESENCE_TIMEOUT_SECONDS = 20;
const ONLINE_WINDOW_SECONDS = PRESENCE_TIMEOUT_SECONDS;
/** Only participants with a live heartbeat can be matched or kept in a room. */
const MATCH_WINDOW_SECONDS = PRESENCE_TIMEOUT_SECONDS;
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

export type ChatStatus = "idle" | "waiting" | "chatting" | "partner_left";

export type Identity = {
  animalKey: string;
  name: string;
  emoji: string;
  color: string;
};

export type ChatMessage = {
  id: number;
  body: string;
  mine: boolean;
  senderName: string;
  senderEmoji: string;
  senderColor: string;
  createdAt: string;
};

export type ChatState = {
  token: string;
  status: ChatStatus;
  roomId: number | null;
  me: Identity;
  partner: Identity | null;
  partnerTyping: boolean;
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

export async function startSession(rawToken: unknown): Promise<ParticipantRow> {
  const d = await db();
  const token =
    typeof rawToken === "string" && rawToken.length >= 16 && rawToken.length <= 64 ? rawToken : null;

  if (token) {
    const existing = await d.select().from(participants).where(eq(participants.token, token)).limit(1);
    if (existing.length > 0) {
      await d
        .update(participants)
        .set({ lastSeen: sql`NOW()` })
        .where(eq(participants.id, existing[0].id));
      return existing[0];
    }
  }

  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
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
async function lockRoomParticipants(tx: Tx, roomId: number, includeParticipantId?: number) {
  const roomFilter = includeParticipantId
    ? or(eq(participants.roomId, roomId), eq(participants.id, includeParticipantId))
    : eq(participants.roomId, roomId);
  return tx
    .select()
    .from(participants)
    .where(roomFilter)
    .orderBy(asc(participants.id))
    .for("update");
}

/**
 * Must be called inside a transaction. The room row is the serialization point
 * shared with sendMessage, so a concurrent send either commits before closure
 * (and is then deleted) or sees the closed room and is rejected.
 * `leavingId` is -1 for a timeout where the vanished participant row is missing.
 */
async function closeRoom(tx: Tx, roomId: number, leavingId: number): Promise<void> {
  // Keep a single lock order across all close/send/state paths.
  await lockRoomParticipants(tx, roomId);
  const [room] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).for("update").limit(1);

  // Idempotent: a concurrent leave/timeout may already have closed this room.
  if (!room || room.status !== "active") {
    await tx.delete(messages).where(eq(messages.roomId, roomId));
    return;
  }

  await tx
    .update(rooms)
    .set({ status: "closed", lastActivity: sql`NOW()` })
    .where(and(eq(rooms.id, roomId), eq(rooms.status, "active")));
  await tx.delete(messages).where(eq(messages.roomId, roomId));

  const otherSide = [eq(participants.roomId, roomId)];
  if (leavingId > 0) {
    await tx
      .update(participants)
      .set({ status: "idle", roomId: null, queuedAt: null, typingAt: null })
      .where(and(eq(participants.id, leavingId), eq(participants.roomId, roomId)));
    otherSide.push(ne(participants.id, leavingId));
  }

  // Every still-present peer sees the exit notice; no second exit is required.
  await tx
    .update(participants)
    .set({ status: "partner_left", roomId: null, queuedAt: null, typingAt: null })
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
        gt(participants.lastSeen, nowSecondsAgo(MATCH_WINDOW_SECONDS))
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
            gt(participants.lastSeen, nowSecondsAgo(MATCH_WINDOW_SECONDS))
          )
        )
        .orderBy(asc(participants.id))
        .for("update");

      if (locked.length !== 2) return null;

      const inserted = await tx.insert(rooms).values({ status: "active" });
      const createdRoomId = Number(inserted[0].insertId);
      const claimed = await tx
        .update(participants)
        .set({ status: "chatting", roomId: createdRoomId, queuedAt: null, typingAt: null })
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

export async function joinQueue(token: string): Promise<void> {
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

    await tx
      .update(participants)
      .set({
        status: "waiting",
        queuedAt: sql`NOW()`,
        roomId: null,
        typingAt: null,
        lastSeen: sql`NOW()`,
      })
      .where(eq(participants.id, me.id));
    return true;
  });

  if (shouldSearch) await tryMatch(d, me.id);
}

export async function leaveChat(token: string): Promise<void> {
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
      await tx
        .update(participants)
        .set({ status: "idle", roomId: null, queuedAt: null, typingAt: null })
        .where(eq(participants.id, current.id));
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
  rawBody: unknown
): Promise<{ ok: boolean; error?: string }> {
  const body = cleanBody(rawBody);
  if (!body) return { ok: false, error: "empty_message" };
  if (!allowMessage(token)) return { ok: false, error: "too_fast" };

  const d = await db();
  const me = await findByToken(d, token);
  if (!me) return { ok: false, error: "no_session" };
  if (me.status !== "chatting" || !me.roomId) return { ok: false, error: "not_in_chat" };

  const roomId = me.roomId;
  const inserted = await d.transaction(async tx => {
    const roomMembers = await lockRoomParticipants(tx, roomId, me.id);
    const current = roomMembers.find(
      row => row.id === me.id && row.roomId === roomId && row.status === "chatting"
    );
    if (!current) return false;

    const [room] = await tx
      .select()
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .for("update")
      .limit(1);

    if (!room || room.status !== "active") {
      await tx
        .update(participants)
        .set({ status: "partner_left", roomId: null, queuedAt: null, typingAt: null })
        .where(and(eq(participants.id, me.id), eq(participants.roomId, roomId)));
      return false;
    }

    await tx.insert(messages).values({ roomId, senderId: me.id, body });
    await tx
      .update(rooms)
      .set({ lastActivity: sql`NOW()` })
      .where(and(eq(rooms.id, roomId), eq(rooms.status, "active")));
    await tx
      .update(participants)
      .set({ typingAt: null, lastSeen: sql`NOW()` })
      .where(eq(participants.id, me.id));

    // Keep a single room bounded; older rows of the live room are dropped too.
    await tx.execute(
      sql`DELETE FROM messages WHERE roomId = ${roomId} AND id NOT IN (
        SELECT id FROM (
          SELECT id FROM messages WHERE roomId = ${roomId} ORDER BY id DESC LIMIT ${MAX_MESSAGES_PER_ROOM}
        ) AS keep_rows
      )`
    );
    return true;
  });

  return inserted ? { ok: true } : { ok: false, error: "chat_closed" };
}

export async function setTyping(token: string): Promise<void> {
  const d = await db();
  const me = await findByToken(d, token);
  if (!me || me.status !== "chatting" || !me.roomId) return;
  await d
    .update(participants)
    .set({ typingAt: sql`NOW()`, lastSeen: sql`NOW()` })
    .where(eq(participants.id, me.id));
}

/* -------------------------------------------------------------------------- */
/* Housekeeping                                                               */
/* -------------------------------------------------------------------------- */

let lastSweep = 0;

/** Removes abandoned rooms, their messages, and long-gone visitors. */
export async function sweep(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastSweep < 10_000) return;
  lastSweep = now;

  const d = await db();

  // A fully timed-out room is closed and both returning participants receive
  // the leave notice; quiet-but-connected chats are never touched.
  const [staleRows] = await d.execute(
    sql`SELECT r.id AS id FROM rooms r
        WHERE r.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM participants p
            WHERE p.roomId = r.id AND p.lastSeen > ${nowSecondsAgo(ONLINE_WINDOW_SECONDS)}
          )
        LIMIT 50`
  );
  const staleRooms = staleRows as unknown as Array<{ id: number }>;

  for (const room of staleRooms) {
    await d.transaction(tx => closeRoom(tx, Number(room.id), -1));
  }

  // Safety net: never keep messages of a closed room.
  await d.execute(
    sql`DELETE m FROM messages m JOIN rooms r ON r.id = m.roomId WHERE r.status = 'closed'`
  );

  // Forget visitors that are long gone (identity is re-assigned on return).
  await d.delete(participants).where(sql`participants.lastSeen < ${nowSecondsAgo(600)}`);
}

/* -------------------------------------------------------------------------- */
/* State                                                                      */
/* -------------------------------------------------------------------------- */

async function readCounters(d: Db) {
  const [onlineRow] = await d
    .select({ total: sql<number>`COUNT(*)` })
    .from(participants)
    .where(gt(participants.lastSeen, nowSecondsAgo(ONLINE_WINDOW_SECONDS)));

  const [chatRow] = await d
    .select({ total: sql<number>`COUNT(*)` })
    .from(rooms)
    .where(
      and(
        eq(rooms.status, "active"),
        sql`EXISTS (
          SELECT 1 FROM participants p
          WHERE p.roomId = rooms.id AND p.lastSeen > ${nowSecondsAgo(ONLINE_WINDOW_SECONDS)}
        )`
      )
    );

  return {
    online: Number(onlineRow?.total ?? 0),
    activeChats: Number(chatRow?.total ?? 0),
  };
}

export async function getState(token: string): Promise<ChatState | null> {
  const d = await db();
  let me = await findByToken(d, token);
  if (!me) return null;

  await d
    .update(participants)
    .set({ lastSeen: sql`NOW()` })
    .where(eq(participants.id, me.id));
  me = (await findByToken(d, token)) ?? me;

  let status: ChatStatus = me.status;
  let partner: (Identity & { typing: boolean }) | null = null;
  let rows: ChatMessage[] = [];

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
            messages: [] as ChatMessage[],
            retry: true,
          };
        }
        return {
          status: current?.status === "partner_left" ? ("partner_left" as const) : ("idle" as const),
          partner: null,
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
        await tx.delete(messages).where(eq(messages.roomId, roomId));
        await tx
          .update(participants)
          .set({ status: "partner_left", roomId: null, queuedAt: null, typingAt: null })
          .where(eq(participants.roomId, roomId));
        return { status: "partner_left" as const, partner: null, messages: [] as ChatMessage[], retry: false };
      }

      const partnerRows = await tx
        .select({
          ...getTableColumns(participants),
          fresh: sql<number>`(participants.lastSeen > ${nowSecondsAgo(MATCH_WINDOW_SECONDS)})`,
          typing: sql<number>`(participants.typingAt IS NOT NULL AND participants.typingAt > ${nowSecondsAgo(6)})`,
        })
        .from(participants)
        .where(and(eq(participants.roomId, roomId), ne(participants.id, current.id)))
        .limit(1);
      const partnerRow = partnerRows[0];

      if (!partnerRow || !Number(partnerRow.fresh)) {
        // Heartbeat timeout is treated exactly like a deliberate leave.
        await closeRoom(tx, roomId, partnerRow?.id ?? -1);
        return { status: "partner_left" as const, partner: null, messages: [] as ChatMessage[], retry: false };
      }

      const messageRows = await tx
        .select({
          id: messages.id,
          body: messages.body,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
          senderName: participants.displayName,
          senderEmoji: participants.emoji,
          senderColor: participants.color,
        })
        .from(messages)
        .innerJoin(participants, eq(participants.id, messages.senderId))
        .where(eq(messages.roomId, roomId))
        .orderBy(asc(messages.id))
        .limit(MAX_MESSAGES_PER_ROOM);

      return {
        status: "chatting" as const,
        partner: { ...identityOf(partnerRow), typing: Boolean(Number(partnerRow.typing)) },
        retry: false,
        messages: messageRows.map(row => ({
          id: row.id,
          body: row.body,
          mine: row.senderId === current.id,
          senderName: row.senderName,
          senderEmoji: row.senderEmoji,
          senderColor: row.senderColor,
          createdAt: row.createdAt.toISOString(),
        })),
      };
    });

    status = snapshot.status;
    partner = snapshot.partner;
    rows = snapshot.messages;
    me = (await findByToken(d, token)) ?? me;
    if (snapshot.retry) return getState(token);
  } else if (status === "chatting") {
    // A chat without an active room is treated as ended, never restored.
    await d
      .update(participants)
      .set({ status: "partner_left", roomId: null, queuedAt: null, typingAt: null })
      .where(eq(participants.id, me.id));
    status = "partner_left";
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
    me: identityOf(me),
    partner: partner ? { animalKey: partner.animalKey, name: partner.name, emoji: partner.emoji, color: partner.color } : null,
    partnerTyping: partner?.typing ?? false,
    messages: rows,
    counters,
    serverTime: new Date().toISOString(),
  };
}
