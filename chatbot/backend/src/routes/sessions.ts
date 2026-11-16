import { Router, type Request, type Response } from "express";
import { sessionManager } from "../services/sessionManager";
import { sharedMessageHistory } from "../services/messageHistory";

const router = Router();

function sendSessionNotFound(res: Response): void {
	res.status(404).json({ error: { code: "SESSION_NOT_FOUND", message: "세션을 찾을 수 없습니다." } });
}

router.post("/", (req: Request, res: Response) => {
	const { id, title, metadata } = req.body as {
		id?: string;
		title?: string;
		metadata?: Record<string, unknown>;
	};

	const session = sessionManager.createSession({ id, title, metadata });
	res.status(201).json(session);
});

router.get("/", (_req: Request, res: Response) => {
	res.json(sessionManager.listSessions());
});

router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
	const session = sessionManager.getSession(req.params.id);
	if (!session) {
		sendSessionNotFound(res);
		return;
	}

	res.json(session);
});

router.patch("/:id", (req: Request<{ id: string }>, res: Response) => {
	const session = sessionManager.getSession(req.params.id);
	if (!session) {
		sendSessionNotFound(res);
		return;
	}

	const { title, metadata } = req.body as { title?: string; metadata?: Record<string, unknown> };
	const updated = sessionManager.updateSession(req.params.id, { title, metadata });
	res.json(updated);
});

router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
	const session = sessionManager.getSession(req.params.id);
	if (!session) {
		sendSessionNotFound(res);
		return;
	}

	sessionManager.deleteSession(req.params.id);
	sharedMessageHistory.delete(req.params.id);
	res.status(204).send();
});

router.get("/:id/messages", (req: Request<{ id: string }>, res: Response) => {
	const session = sessionManager.getSession(req.params.id);
	if (!session) {
		sendSessionNotFound(res);
		return;
	}

	res.json(sharedMessageHistory.get(req.params.id));
});

router.delete("/:id/messages", (req: Request<{ id: string }>, res: Response) => {
	const session = sessionManager.getSession(req.params.id);
	if (!session) {
		sendSessionNotFound(res);
		return;
	}

	sharedMessageHistory.delete(req.params.id);
	res.status(204).send();
});

export default router;
