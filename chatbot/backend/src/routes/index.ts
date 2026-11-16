import { Router } from "express";
import chatRouter from "./chat";
import sessionsRouter from "./sessions";

const router = Router();

router.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

router.use("/chat", chatRouter);
router.use("/sessions", sessionsRouter);

export default router;
