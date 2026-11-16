import request from "supertest";
import { mockClient } from "aws-sdk-client-mock";
import {
	BedrockRuntimeClient,
	ConverseStreamCommand,
	type ConverseStreamOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { createApp } from "../../src/app";
import { sharedMessageHistory } from "../../src/services/messageHistory";

const bedrockMock = mockClient(BedrockRuntimeClient);

function streamOf(events: ConverseStreamOutput[]) {
	return {
		[Symbol.asyncIterator]: async function* () {
			for (const event of events) {
				yield event;
			}
		},
	};
}

interface SseEvent {
	event: string;
	data: Record<string, unknown>;
}

function parseSse(raw: string): SseEvent[] {
	return raw
		.split("\n\n")
		.filter((chunk) => chunk.trim().length > 0)
		.map((chunk) => {
			const lines = chunk.split("\n");
			const event = lines.find((line) => line.startsWith("event: "))?.slice("event: ".length) ?? "";
			const dataLine = lines.find((line) => line.startsWith("data: "))?.slice("data: ".length) ?? "{}";
			return { event, data: JSON.parse(dataLine) };
		});
}

describe("POST /api/chat", () => {
	beforeEach(() => {
		bedrockMock.reset();
	});

	it("스트리밍 텍스트를 text 이벤트로 전달하고 done으로 마무리한다", async () => {
		bedrockMock.on(ConverseStreamCommand).resolves({
			stream: streamOf([
				{ contentBlockDelta: { contentBlockIndex: 0, delta: { text: "안녕" } } },
				{ contentBlockDelta: { contentBlockIndex: 0, delta: { text: "하세요" } } },
				{ messageStop: { stopReason: "end_turn" } },
					{
					metadata: {
						usage: { inputTokens: 5, outputTokens: 3, totalTokens: 8 },
						metrics: { latencyMs: 100 },
					},
				},
			]) as never,
		});

		const response = await request(createApp())
			.post("/api/chat")
			.send({ sessionId: "s1", message: "안녕" });

		const events = parseSse(response.text);

		expect(events.filter((e) => e.event === "text").map((e) => e.data.text)).toEqual([
			"안녕",
			"하세요",
		]);
		expect(events.some((e) => e.event === "done")).toBe(true);
	});

	it("대화 히스토리를 sharedMessageHistory에 사용자/어시스턴트 메시지로 저장한다", async () => {
		bedrockMock.on(ConverseStreamCommand).resolves({
			stream: streamOf([
				{ contentBlockDelta: { contentBlockIndex: 0, delta: { text: "응답" } } },
				{ messageStop: { stopReason: "end_turn" } },
				{
					metadata: {
						usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
						metrics: { latencyMs: 50 },
					},
				},
			]) as never,
		});

		await request(createApp()).post("/api/chat").send({ sessionId: "s2", message: "질문" });

		const history = sharedMessageHistory.get("s2");

		expect(history).toHaveLength(2);
		expect(history[0]).toEqual({ role: "user", content: [{ text: "질문" }] });
		expect(history[1]).toEqual({ role: "assistant", content: [{ text: "응답" }] });
	});

	it("message가 없으면 400을 반환하고 스트리밍을 시작하지 않는다", async () => {
		const response = await request(createApp()).post("/api/chat").send({ sessionId: "s3" });

		expect(response.status).toBe(400);
		expect(bedrockMock.commandCalls(ConverseStreamCommand)).toHaveLength(0);
	});

	it("sessionId가 없으면 서버가 새로 생성해 done 이벤트에 포함한다", async () => {
		bedrockMock.on(ConverseStreamCommand).resolves({
			stream: streamOf([
				{ messageStop: { stopReason: "end_turn" } },
				{
					metadata: {
						usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
						metrics: { latencyMs: 50 },
					},
				},
			]) as never,
		});

		const response = await request(createApp()).post("/api/chat").send({ message: "안녕" });

		const doneEvent = parseSse(response.text).find((e) => e.event === "done");
		expect(typeof doneEvent?.data.sessionId).toBe("string");
		expect((doneEvent?.data.sessionId as string).length).toBeGreaterThan(0);
	});

	it("도구 호출 시작을 tool_start 이벤트로 전달한다", async () => {
		bedrockMock.on(ConverseStreamCommand).resolves({
			stream: streamOf([
				{
					contentBlockStart: {
						contentBlockIndex: 0,
						start: { toolUse: { toolUseId: "t1", name: "get_weather" } },
					},
				},
				{ messageStop: { stopReason: "end_turn" } },
				{
					metadata: {
						usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
						metrics: { latencyMs: 50 },
					},
				},
			]) as never,
		});

		const response = await request(createApp())
			.post("/api/chat")
			.send({ sessionId: "s4", message: "날씨 알려줘" });

		const toolStart = parseSse(response.text).find((e) => e.event === "tool_start");
		expect(toolStart?.data).toEqual({ toolUseId: "t1", toolName: "get_weather" });
	});

	it("Bedrock 호출이 실패하면 error 이벤트를 전달한다", async () => {
		bedrockMock.on(ConverseStreamCommand).rejects(new Error("boom"));

		const response = await request(createApp())
			.post("/api/chat")
			.send({ sessionId: "s5", message: "안녕" });

		const events = parseSse(response.text);
		expect(events.some((e) => e.event === "error")).toBe(true);
	});
});
