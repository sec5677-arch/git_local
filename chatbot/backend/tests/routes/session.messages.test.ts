import request from "supertest";
import { createApp } from "../../src/app";
import { sessionManager } from "../../src/services/sessionManager";
import { sharedMessageHistory } from "../../src/services/messageHistory";

describe("세션 메시지 API", () => {
	describe("GET /api/sessions/:id/messages", () => {
		it("새 세션은 빈 메시지 배열을 반환한다", async () => {
			const session = sessionManager.createSession({ title: "새 세션" });

			const response = await request(createApp()).get(`/api/sessions/${session.id}/messages`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
		});

		it("존재하지 않는 세션은 404를 반환한다", async () => {
			const response = await request(createApp()).get("/api/sessions/missing-id/messages");

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /api/sessions/:id/messages", () => {
		it("메시지를 초기화하면 204를 반환한다", async () => {
			const session = sessionManager.createSession({ title: "초기화 테스트" });
			sharedMessageHistory.add(session.id, { role: "user", content: [{ text: "안녕" }] });

			const app = createApp();
			const response = await request(app).delete(`/api/sessions/${session.id}/messages`);

			expect(response.status).toBe(204);
			expect(sharedMessageHistory.get(session.id)).toEqual([]);

			const getResponse = await request(app).get(`/api/sessions/${session.id}/messages`);
			expect(getResponse.body).toEqual([]);
		});

		it("존재하지 않는 세션은 404를 반환한다", async () => {
			const response = await request(createApp()).delete("/api/sessions/missing-id/messages");

			expect(response.status).toBe(404);
		});
	});
});
