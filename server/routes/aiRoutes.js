import express from "express";
import { chatWithAI, streamChatWithAI, checkAIHealth } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.get("/health", checkAIHealth);
aiRouter.post("/chat", chatWithAI);
aiRouter.post("/chat/stream", streamChatWithAI);

export default aiRouter;

