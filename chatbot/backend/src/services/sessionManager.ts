import { v4 as uuidv4 } from "uuid";
import type {
	CreateSessionRequest,
	Message,
	MessageHistoryOptions,
	Session,
	UpdateSessionRequest,
} from "../types";

export class SessionNotFoundError extends Error {
	constructor(sessionId: string) {
		super(`Session not found: ${sessionId}`);
		this.name = "SessionNotFoundError";
	}
}

const DEFAULT_TITLE = "새 대화";

export class SessionManager {
	private readonly sessions = new Map<string, Session>();
	private readonly messages = new Map<string, Message[]>();

	createSession(request: CreateSessionRequest = {}): Session {
		const now = new Date();
		const session: Session = {
			id: request.id ?? uuidv4(),
			title: request.title ?? DEFAULT_TITLE,
			createdAt: now,
			updatedAt: now,
			metadata: request.metadata,
		};

		this.sessions.set(session.id, session);
		this.messages.set(session.id, []);

		return session;
	}

	getSession(sessionId: string): Session | undefined {
		return this.sessions.get(sessionId);
	}

	listSessions(): Session[] {
		return [...this.sessions.values()];
	}

	updateSession(sessionId: string, request: UpdateSessionRequest): Session {
		const session = this.requireSession(sessionId);
		const updated: Session = {
			...session,
			title: request.title ?? session.title,
			metadata: request.metadata ?? session.metadata,
			updatedAt: new Date(),
		};

		this.sessions.set(sessionId, updated);
		return updated;
	}

	deleteSession(sessionId: string): boolean {
		this.messages.delete(sessionId);
		return this.sessions.delete(sessionId);
	}

	addMessage(sessionId: string, message: Message): void {
		const messages = this.messages.get(sessionId);
		if (!messages) {
			throw new SessionNotFoundError(sessionId);
		}

		messages.push(message);
		this.touchSession(sessionId);
	}

	getMessages(sessionId: string, options?: MessageHistoryOptions): Message[] {
		const messages = this.messages.get(sessionId);
		if (!messages) {
			throw new SessionNotFoundError(sessionId);
		}

		let result = messages;
		if (options?.maxMessages !== undefined) {
			result = result.slice(-options.maxMessages);
		}
		if (options?.maxTokens !== undefined) {
			result = this.truncateByTokens(result, options.maxTokens);
		}

		return result;
	}

	private touchSession(sessionId: string): void {
		const session = this.requireSession(sessionId);
		this.sessions.set(sessionId, { ...session, updatedAt: new Date() });
	}

	private requireSession(sessionId: string): Session {
		const session = this.sessions.get(sessionId);
		if (!session) {
			throw new SessionNotFoundError(sessionId);
		}
		return session;
	}

	/** 실제 토크나이저 없이 "4자 ≈ 1토큰"으로 근사해 최근 메시지 위주로 예산 내에서 자른다 */
	private truncateByTokens(messages: Message[], maxTokens: number): Message[] {
		const selected: Message[] = [];
		let total = 0;

		for (let i = messages.length - 1; i >= 0; i--) {
			const tokens = this.estimateTokens(messages[i]);
			if (total + tokens > maxTokens) {
				break;
			}
			total += tokens;
			selected.unshift(messages[i]);
		}

		return selected;
	}

	private estimateTokens(message: Message): number {
		const text = message.content.map((block) => block.text ?? "").join("");
		return Math.ceil(text.length / 4);
	}
}

export const sessionManager = new SessionManager();
