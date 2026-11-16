import { SessionManager, SessionNotFoundError } from "../../src/services/sessionManager";
import type { Message } from "../../src/types";

const UUID_V4_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function userMessage(text: string): Message {
	return { role: "user", content: [{ text }] };
}

describe("SessionManager", () => {
	let manager: SessionManager;

	beforeEach(() => {
		manager = new SessionManager();
	});

	describe("createSession", () => {
		it("ID 없이 생성하면 uuid로 ID를 발급한다", () => {
			const session = manager.createSession();

			expect(session.id).toMatch(UUID_V4_REGEX);
		});

		it("기본 title과 생성/수정 시각을 설정한다", () => {
			const session = manager.createSession();

			expect(session.title).toBe("새 대화");
			expect(session.createdAt).toBeInstanceOf(Date);
			expect(session.updatedAt).toBeInstanceOf(Date);
			expect(session.updatedAt.getTime()).toBe(session.createdAt.getTime());
		});

		it("title과 metadata를 지정하여 생성한다", () => {
			const session = manager.createSession({
				title: "날씨 문의",
				metadata: { source: "web" },
			});

			expect(session.title).toBe("날씨 문의");
			expect(session.metadata).toEqual({ source: "web" });
		});

		it("ID를 직접 지정하면 해당 ID로 생성한다", () => {
			const session = manager.createSession({ id: "custom-id" });

			expect(session.id).toBe("custom-id");
		});
	});

	describe("getSession", () => {
		it("존재하는 세션을 조회한다", () => {
			const created = manager.createSession({ title: "테스트" });

			const found = manager.getSession(created.id);

			expect(found).toEqual(created);
		});

		it("존재하지 않는 세션은 undefined를 반환한다", () => {
			expect(manager.getSession("missing")).toBeUndefined();
		});
	});

	describe("listSessions", () => {
		it("생성된 모든 세션을 반환한다", () => {
			const a = manager.createSession({ title: "A" });
			const b = manager.createSession({ title: "B" });

			const sessions = manager.listSessions();

			expect(sessions).toHaveLength(2);
			expect(sessions.map((s) => s.id).sort()).toEqual([a.id, b.id].sort());
		});

		it("세션이 없으면 빈 배열을 반환한다", () => {
			expect(manager.listSessions()).toEqual([]);
		});
	});

	describe("updateSession", () => {
		it("title을 수정하고 updatedAt을 갱신한다", async () => {
			const created = manager.createSession({ title: "원래 제목" });
			await new Promise((resolve) => setTimeout(resolve, 5));

			const updated = manager.updateSession(created.id, { title: "새 제목" });

			expect(updated.title).toBe("새 제목");
			expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
		});

		it("존재하지 않는 세션을 수정하면 SessionNotFoundError를 던진다", () => {
			expect(() => manager.updateSession("missing", { title: "x" })).toThrow(
				SessionNotFoundError,
			);
		});
	});

	describe("deleteSession", () => {
		it("세션을 삭제하면 true를 반환하고 조회되지 않는다", () => {
			const created = manager.createSession();

			expect(manager.deleteSession(created.id)).toBe(true);
			expect(manager.getSession(created.id)).toBeUndefined();
		});

		it("존재하지 않는 세션 삭제는 false를 반환한다", () => {
			expect(manager.deleteSession("missing")).toBe(false);
		});
	});

	describe("addMessage / getMessages", () => {
		it("메시지를 추가한 순서대로 조회한다", () => {
			const session = manager.createSession();

			manager.addMessage(session.id, userMessage("안녕"));
			manager.addMessage(session.id, userMessage("반가워"));

			const messages = manager.getMessages(session.id);

			expect(messages).toHaveLength(2);
			expect(messages[0].content[0].text).toBe("안녕");
			expect(messages[1].content[0].text).toBe("반가워");
		});

		it("메시지를 추가하면 세션의 updatedAt이 갱신된다", async () => {
			const session = manager.createSession();
			await new Promise((resolve) => setTimeout(resolve, 5));

			manager.addMessage(session.id, userMessage("안녕"));

			const updated = manager.getSession(session.id);
			expect(updated?.updatedAt.getTime()).toBeGreaterThan(session.updatedAt.getTime());
		});

		it("존재하지 않는 세션에 메시지를 추가하면 SessionNotFoundError를 던진다", () => {
			expect(() => manager.addMessage("missing", userMessage("안녕"))).toThrow(
				SessionNotFoundError,
			);
		});

		it("존재하지 않는 세션의 메시지를 조회하면 SessionNotFoundError를 던진다", () => {
			expect(() => manager.getMessages("missing")).toThrow(SessionNotFoundError);
		});

		it("maxMessages 옵션으로 가장 최근 메시지만 반환한다", () => {
			const session = manager.createSession();
			for (let i = 1; i <= 5; i++) {
				manager.addMessage(session.id, userMessage(`메시지${i}`));
			}

			const messages = manager.getMessages(session.id, { maxMessages: 2 });

			expect(messages).toHaveLength(2);
			expect(messages[0].content[0].text).toBe("메시지4");
			expect(messages[1].content[0].text).toBe("메시지5");
		});

		it("maxTokens 옵션으로 토큰 예산 내 최근 메시지만 반환한다", () => {
			const session = manager.createSession();
			// 각 메시지 텍스트 길이 40자 -> 추정 토큰 ceil(40/4) = 10
			const text = "a".repeat(40);
			manager.addMessage(session.id, userMessage(text));
			manager.addMessage(session.id, userMessage(text));
			manager.addMessage(session.id, userMessage(text));

			// 토큰 예산 15: 마지막 메시지(10)만 들어가고, 그 앞 메시지를 더하면 20으로 초과
			const messages = manager.getMessages(session.id, { maxTokens: 15 });

			expect(messages).toHaveLength(1);
		});
	});
});
