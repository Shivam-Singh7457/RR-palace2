import express from "express";
import { chatWithAI, streamChatWithAI } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post("/chat", chatWithAI);
aiRouter.post("/chat/stream", streamChatWithAI);

export default aiRouter;
