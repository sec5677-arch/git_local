import { Router, type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { BedrockService } from "../services/bedrock";
import { sharedMessageHistory } from "../services/messageHistory";
import type { Message } from "../types";

const router = Router();
const bedrockService = new BedrockService();

function sendEvent(res: Response, event: string, data: unknown): void {
	res.write(`event: ${event}\n`);
	res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.post("/", async (req: Request, res: Response) => {
	const { sessionId: requestedSessionId, message } = req.body as {
		sessionId?: string;
		message?: string;
	};

	if (!message) {
		res.status(400).json({ error: { code: "INVALID_REQUEST", message: "message가 필요합니다." } });
		return;
	}

	const sessionId = requestedSessionId ?? uuidv4();

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.flushHeaders();

	sharedMessageHistory.add(sessionId, {
		role: "user",
		content: [{ text: message }],
	});

	let assistantText = "";

	try {
		for await (const event of bedrockService.converseStream({
			messages: sharedMessageHistory.get(sessionId),
		})) {
			switch (event.type) {
				case "text_delta":
					if (event.text) {
						assistantText += event.text;
						sendEvent(res, "text", { text: event.text });
					}
					break;
				case "tool_use_start":
					sendEvent(res, "tool_start", {
						toolUseId: event.toolUseId,
						toolName: event.toolName,
					});
					break;
				case "message_complete": {
					const assistantMessage: Message = {
						role: "assistant",
						content: [{ text: assistantText }],
					};
					sharedMessageHistory.add(sessionId, assistantMessage);
					sendEvent(res, "done", { sessionId, usage: event.usage });
					break;
				}
				case "error":
					sendEvent(res, "error", { message: event.error ?? "알 수 없는 오류가 발생했습니다." });
					break;
				default:
					// tool_use_delta(부분 JSON 입력), tool_result는 이 라우트의 SSE 계약(text/tool_start/done/error)에 없어 전달하지 않는다
					break;
			}
		}
	} catch (error) {
		sendEvent(res, "error", {
			message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
		});
	} finally {
		res.end();
	}
});

export default router;
