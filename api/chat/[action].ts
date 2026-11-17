import express from "express";
import { registerChatRoutes } from "../../server/routes/chat.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
registerChatRoutes(app);

export default app;