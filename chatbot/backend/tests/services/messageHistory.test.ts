import { MessageHistory, messageHistory } from "../../src/services/messageHistory";
import type { Message } from "../../src/types";

function userMessage(text: string): Message {
	return { role: "user", content: [{ text }] };
}

describe("MessageHistory", () => {
	describe("truncate - 옵션 없음", () => {
		it("제한이 없으면 모든 메시지를 그대로 반환한다", () => {
			const history = new MessageHistory();
			const messages = [userMessage("a"), userMessage("b"), userMessage("c")];

			expect(history.truncate(messages)).toEqual(messages);
		});

		it("빈 배열을 전달하면 빈 배열을 반환한다", () => {
			const history = new MessageHistory({ maxMessages: 2, maxTokens: 100 });

			expect(history.truncate([])).toEqual([]);
		});
	});

	describe("truncate - maxMessages", () => {
		it("생성자에 지정된 maxMessages만큼 최근 메시지만 남긴다", () => {
			const history = new MessageHistory({ maxMessages: 2 });
			const messages = [userMessage("1"), userMessage("2"), userMessage("3")];

			const result = history.truncate(messages);

			expect(result).toHaveLength(2);
			expect(result[0].content[0].text).toBe("2");
			expect(result[1].content[0].text).toBe("3");
		});
	});

	describe("truncate - maxTokens", () => {
		it("4자 당 1토큰으로 추정하여 예산 내 최근 메시지만 남긴다", () => {
			const history = new MessageHistory({ maxTokens: 15 });
			const text = "a".repeat(40); // ceil(40/4) = 10 tokens

			const messages = [userMessage(text), userMessage(text), userMessage(text)];

			// 마지막 메시지(10)만 포함, 그 앞을 더하면 20으로 예산 초과
			const result = history.truncate(messages);

			expect(result).toHaveLength(1);
			expect(result[0]).toBe(messages[2]);
		});
	});

	describe("truncate - maxMessages와 maxTokens 동시 적용", () => {
		it("maxMessages로 먼저 자른 뒤 maxTokens로 추가로 자른다", () => {
			const history = new MessageHistory({ maxMessages: 2, maxTokens: 5 });
			const text = "a".repeat(40); // 10 tokens
			const messages = [userMessage(text), userMessage(text), userMessage(text)];

			// maxMessages=2 -> 뒤에서 2개([2],[3]) 남음 -> maxTokens=5는 10짜리 메시지 하나도 못 담아 0개
			const result = history.truncate(messages);

			expect(result).toHaveLength(0);
		});
	});

	describe("truncate - 호출 시 옵션 오버라이드", () => {
		it("호출 인자로 전달한 옵션이 생성자 옵션보다 우선한다", () => {
			const history = new MessageHistory({ maxMessages: 1 });
			const messages = [userMessage("1"), userMessage("2"), userMessage("3")];

			const overridden = history.truncate(messages, { maxMessages: 2 });
			expect(overridden).toHaveLength(2);

			// 오버라이드는 해당 호출에만 적용되고 인스턴스 기본값은 그대로 유지된다
			const defaultResult = history.truncate(messages);
			expect(defaultResult).toHaveLength(1);
		});
	});

	describe("싱글턴 인스턴스", () => {
		it("messageHistory는 MessageHistory의 인스턴스다", () => {
			expect(messageHistory).toBeInstanceOf(MessageHistory);
		});
	});
});

describe("MessageHistory with limits", () => {
	describe("maxMessages 제한", () => {
		it("제한 초과 시 가장 오래된 user-assistant 쌍을 제거한다", () => {
			const history = new MessageHistory({ maxMessages: 4 });

			// 6개 메시지 추가 (user, assistant, user, assistant, user, assistant)
			history.add("session-1", {
				role: "user",
				content: [{ text: "Message 1" }],
			});
			history.add("session-1", {
				role: "assistant",
				content: [{ text: "Reply 1" }],
			});
			history.add("session-1", {
				role: "user",
				content: [{ text: "Message 2" }],
			});
			history.add("session-1", {
				role: "assistant",
				content: [{ text: "Reply 2" }],
			});
			history.add("session-1", {
				role: "user",
				content: [{ text: "Message 3" }],
			});
			history.add("session-1", {
				role: "assistant",
				content: [{ text: "Reply 3" }],
			});

			const messages = history.get("session-1");

			// 첫 번째 쌍(Message 1, Reply 1) 제거 -> 4개 남음
			expect(messages).toHaveLength(4);
			expect(messages[0].content[0].text).toBe("Message 2");
		});

		it("트리밍 시 user-assistant 쌍 단위를 유지한다", () => {
			const history = new MessageHistory({ maxMessages: 3 });

			// 5개 메시지 추가 (user, assistant, user, assistant, user)
			history.add("session-1", { role: "user", content: [{ text: "U1" }] });
			history.add("session-1", {
				role: "assistant",
				content: [{ text: "A1" }],
			});
			history.add("session-1", { role: "user", content: [{ text: "U2" }] });
			history.add("session-1", {
				role: "assistant",
				content: [{ text: "A2" }],
			});
			history.add("session-1", { role: "user", content: [{ text: "U3" }] });

			const messages = history.get("session-1");

			// 쌍 단위 제거로 U1+A1 제거 -> 3개 남음
			expect(messages).toHaveLength(3);
			expect(messages[0].role).toBe("user");
			expect(messages[0].content[0].text).toBe("U2");
		});
	});

	describe("getWithLimit", () => {
		it("최근 N개의 메시지만 반환한다", () => {
			const history = new MessageHistory();

			history.add("session-1", { role: "user", content: [{ text: "M1" }] });
			history.add("session-1", {
				role: "assistant",
				content: [{ text: "M2" }],
			});
			history.add("session-1", { role: "user", content: [{ text: "M3" }] });
			history.add("session-1", {
				role: "assistant",
				content: [{ text: "M4" }],
			});

			const messages = history.getWithLimit("session-1", 2);

			expect(messages).toHaveLength(2);
			expect(messages[0].content[0].text).toBe("M3");
			expect(messages[1].content[0].text).toBe("M4");
		});
	});

	describe("delete", () => {
		it("저장된 세션의 메시지를 모두 삭제하고 true를 반환한다", () => {
			const history = new MessageHistory();
			history.add("session-1", { role: "user", content: [{ text: "M1" }] });

			expect(history.delete("session-1")).toBe(true);
			expect(history.get("session-1")).toEqual([]);
		});

		it("저장된 적 없는 세션을 삭제하면 false를 반환한다", () => {
			const history = new MessageHistory();

			expect(history.delete("missing")).toBe(false);
		});
	});
});