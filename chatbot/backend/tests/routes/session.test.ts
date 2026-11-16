import request from "supertest";
import { createApp } from "../../src/app";
import { sessionManager } from "../../src/services/sessionManager";
import { sharedMessageHistory } from "../../src/services/messageHistory";

describe("세션 CRUD API", () => {
	describe("POST /api/sessions", () => {
		it("세션을 생성하고 201을 반환한다", async () => {
			const response = await request(createApp())
				.post("/api/sessions")
				.send({ title: "날씨 문의" });

			expect(response.status).toBe(201);
			expect(response.body.title).toBe("날씨 문의");
			expect(typeof response.body.id).toBe("string");
		});
	});

	describe("GET /api/sessions", () => {
		it("생성된 세션 목록을 반환한다", async () => {
			const app = createApp();
			await request(app).post("/api/sessions").send({ title: "A" });
			await request(app).post("/api/sessions").send({ title: "B" });

			const response = await request(app).get("/api/sessions");

			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("GET /api/sessions/:id", () => {
		it("존재하는 세션을 조회한다", async () => {
			const created = sessionManager.createSession({ title: "조회 테스트" });

			const response = await request(createApp()).get(`/api/sessions/${created.id}`);

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(created.id);
		});

		it("존재하지 않는 세션은 404를 반환한다", async () => {
			const response = await request(createApp()).get("/api/sessions/missing-id");

			expect(response.status).toBe(404);
		});
	});

	describe("PATCH /api/sessions/:id", () => {
		it("세션의 title을 수정한다", async () => {
			const created = sessionManager.createSession({ title: "원래 제목" });

			const response = await request(createApp())
				.patch(`/api/sessions/${created.id}`)
				.send({ title: "새 제목" });

			expect(response.status).toBe(200);
			expect(response.body.title).toBe("새 제목");
		});

		it("존재하지 않는 세션 수정은 404를 반환한다", async () => {
			const response = await request(createApp())
				.patch("/api/sessions/missing-id")
				.send({ title: "x" });

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /api/sessions/:id", () => {
		it("세션과 메시지 히스토리를 함께 삭제한다", async () => {
			const created = sessionManager.createSession({ title: "삭제 테스트" });
			sharedMessageHistory.add(created.id, { role: "user", content: [{ text: "안녕" }] });

			const app = createApp();
			const deleteResponse = await request(app).delete(`/api/sessions/${created.id}`);

			expect(deleteResponse.status).toBe(204);
			expect(sessionManager.getSession(created.id)).toBeUndefined();
			expect(sharedMessageHistory.get(created.id)).toEqual([]);

			const getResponse = await request(app).get(`/api/sessions/${created.id}`);
			expect(getResponse.status).toBe(404);
		});

		it("존재하지 않는 세션 삭제는 404를 반환한다", async () => {
			const response = await request(createApp()).delete("/api/sessions/missing-id");

			expect(response.status).toBe(404);
		});
	});

	describe("GET /api/sessions/:id/messages", () => {
		it("세션의 메시지 히스토리를 조회한다", async () => {
			const created = sessionManager.createSession({ title: "메시지 조회" });
			sharedMessageHistory.add(created.id, { role: "user", content: [{ text: "안녕" }] });
			sharedMessageHistory.add(created.id, {
				role: "assistant",
				content: [{ text: "반가워요" }],
			});

			const response = await request(createApp()).get(`/api/sessions/${created.id}/messages`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveLength(2);
			expect(response.body[0].content[0].text).toBe("안녕");
			expect(response.body[1].content[0].text).toBe("반가워요");
		});

		it("존재하지 않는 세션은 404를 반환한다", async () => {
			const response = await request(createApp()).get("/api/sessions/missing-id/messages");

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /api/sessions/:id/messages", () => {
		it("세션은 유지한 채 메시지 히스토리만 삭제한다", async () => {
			const created = sessionManager.createSession({ title: "메시지만 삭제" });
			sharedMessageHistory.add(created.id, { role: "user", content: [{ text: "안녕" }] });

			const app = createApp();
			const response = await request(app).delete(`/api/sessions/${created.id}/messages`);

			expect(response.status).toBe(204);
			expect(sharedMessageHistory.get(created.id)).toEqual([]);
			expect(sessionManager.getSession(created.id)).toBeDefined();
		});

		it("존재하지 않는 세션은 404를 반환한다", async () => {
			const response = await request(createApp()).delete("/api/sessions/missing-id/messages");

			expect(response.status).toBe(404);
		});
	});
});
