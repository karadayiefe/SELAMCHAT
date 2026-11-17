import type { Express, Request, Response } from "express";
import { Router } from "express";
import {
  getState,
  joinQueue,
  leaveChat,
  sendMessage,
  setTyping,
  startSession,
  sweep,
} from "../chat";

function noStore(res: Response) {
  res.set("Cache-Control", "no-store, max-age=0");
  res.set("Pragma", "no-cache");
}

function readToken(req: Request): string {
  const body = (req.body ?? {}) as Record<string, unknown>;
  return typeof body.token === "string" ? body.token.slice(0, 64) : "";
}

/**
 * Plain JSON endpoints (no WebSocket, no long-lived connection) so the app runs
 * on the standard stateless backend and stays free to host.
 */
export function registerChatRoutes(app: Express) {
  const router = Router();

  const respond = async (req: Request, res: Response, handler: () => Promise<unknown>) => {
    noStore(res);
    try {
      const payload = await handler();
      res.json(payload);
    } catch (error) {
      console.error("[chat]", error);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  };

  router.post("/session", (req, res) =>
    respond(req, res, async () => {
      await sweep();
      const participant = await startSession(readToken(req));
      const state = await getState(participant.token);
      return { ok: true, token: participant.token, state };
    })
  );

  router.post("/state", (req, res) =>
    respond(req, res, async () => {
      const token = readToken(req);
      if (!token) return { ok: false, error: "no_token" };
      await sweep();
      const state = await getState(token);
      if (!state) return { ok: false, error: "no_session" };
      return { ok: true, state };
    })
  );

  router.post("/join", (req, res) =>
    respond(req, res, async () => {
      const token = readToken(req);
      if (!token) return { ok: false, error: "no_token" };
      await joinQueue(token);
      const state = await getState(token);
      if (!state) return { ok: false, error: "no_session" };
      return { ok: true, state };
    })
  );

  router.post("/leave", (req, res) =>
    respond(req, res, async () => {
      const token = readToken(req);
      if (!token) return { ok: false, error: "no_token" };
      await leaveChat(token);
      const state = await getState(token);
      if (!state) return { ok: false, error: "no_session" };
      return { ok: true, state };
    })
  );

  router.post("/message", (req, res) =>
    respond(req, res, async () => {
      const token = readToken(req);
      if (!token) return { ok: false, error: "no_token" };
      const body = (req.body ?? {}) as Record<string, unknown>;
      const result = await sendMessage(token, body.body);
      const state = await getState(token);
      return { ...result, state };
    })
  );

  router.post("/typing", (req, res) =>
    respond(req, res, async () => {
      const token = readToken(req);
      if (!token) return { ok: false, error: "no_token" };
      await setTyping(token);
      return { ok: true };
    })
  );

  // Beacon target for tab close / page hide.
  router.post("/bye", (req, res) =>
    respond(req, res, async () => {
      const token = readToken(req);
      if (!token) return { ok: false, error: "no_token" };
      await leaveChat(token);
      return { ok: true };
    })
  );

  app.use("/api/chat", router);
}
