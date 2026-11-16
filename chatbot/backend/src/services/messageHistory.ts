import type { Message, MessageHistoryOptions } from "../types";

export class MessageHistory {
	private readonly store = new Map<string, Message[]>();

	constructor(private readonly options: MessageHistoryOptions = {}) {}

	/** 세션에 메시지를 추가한다. maxMessages를 넘으면 가장 오래된 user-assistant 쌍을 통째로 제거해 턴 구조를 유지한다 */
	add(sessionId: string, message: Message): void {
		const messages = this.store.get(sessionId) ?? [];
		messages.push(message);

		while (this.options.maxMessages !== undefined && messages.length > this.options.maxMessages) {
			messages.splice(0, 2);
		}

		this.store.set(sessionId, messages);
	}

	get(sessionId: string): Message[] {
		return this.store.get(sessionId) ?? [];
	}

	getWithLimit(sessionId: string, limit: number): Message[] {
		return this.get(sessionId).slice(-limit);
	}

	delete(sessionId: string): boolean {
		return this.store.delete(sessionId);
	}

	truncate(messages: Message[], overrides: MessageHistoryOptions = {}): Message[] {
		const options: MessageHistoryOptions = { ...this.options, ...overrides };

		let result = messages;
		if (options.maxMessages !== undefined) {
			result = result.slice(-options.maxMessages);
		}
		if (options.maxTokens !== undefined) {
			result = this.truncateByTokens(result, options.maxTokens);
		}

		return result;
	}

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

	/** 실제 토크나이저 없이 "4자 ≈ 1토큰"으로 근사한다 */
	private estimateTokens(message: Message): number {
		const text = message.content.map((block) => block.text ?? "").join("");
		return Math.ceil(text.length / 4);
	}
}

export const messageHistory = new MessageHistory({ maxMessages: 20, maxTokens: 4000 });
export { messageHistory as sharedMessageHistory };
