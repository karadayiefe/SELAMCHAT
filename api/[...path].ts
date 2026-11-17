import express from "express";
import { registerChatRoutes } from "../server/routes/chat";
import { publicPlatformScript } from "../server/_core/publicConfig";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/platform/config.js", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.type("application/javascript").send(publicPlatformScript());
});

registerChatRoutes(app);

export default app;