import {
	BedrockService,
	BedrockServiceError,
} from "../../src/services/bedrock";

import {
	BedrockRuntimeClient,
	ConverseCommand,
	ConverseStreamCommand,
	AccessDeniedException,
	ResourceNotFoundException,
	ThrottlingException,
} from "@aws-sdk/client-bedrock-runtime";
import { mockClient } from "aws-sdk-client-mock";
import { StreamEvent } from "../../src/types";

const bedrockMock = mockClient(BedrockRuntimeClient);

describe("BedrockService", () => {
	beforeEach(() => {
		bedrockMock.reset();
	});

	describe("생성자", () => {
		it("기본 설정으로 인스턴스를 생성한다", () => {
			const service = new BedrockService();
			expect(service).toBeInstanceOf(BedrockService);
		});

		it("리전을 직접 지정하여 인스턴스를 생성한다", () => {
			const service = new BedrockService({ region: "us-west-2" });
			expect(service).toBeInstanceOf(BedrockService);
		});

		it("모델 ID를 직접 지정하여 인스턴스를 생성한다", () => {
			const service = new BedrockService({
				modelId: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
			});
			expect(service).toBeInstanceOf(BedrockService);
		});
	});

	// converse 메서드 테스트
	describe("converse - 단일 응답", () => {
		it("메시지를 전송하고 응답을 받는다", async () => {
			bedrockMock.on(ConverseCommand).resolves({
				output: {
					message: {
						role: "assistant",
						content: [{ text: "안녕하세요! 무엇을 도와드릴까요?" }],
					},
				},
				stopReason: "end_turn",
				usage: {
					inputTokens: 10,
					outputTokens: 15,
					totalTokens: 25,
				},
			});

			const service = new BedrockService();
			const response = await service.converse({
				messages: [
					{
						role: "user",
						content: [{ text: "안녕하세요" }],
					},
				],
			});

			expect(response.content).toHaveLength(1);
			expect(response.content[0].text).toBe("안녕하세요! 무엇을 도와드릴까요?");
			expect(response.stopReason).toBe("end_turn");
			expect(response.usage.inputTokens).toBe(10);
			expect(response.usage.outputTokens).toBe(15);
		});

		it("시스템 프롬프트가 제공되면 포함한다", async () => {
			bedrockMock.on(ConverseCommand).resolves({
				output: {
					message: {
						role: "assistant",
						content: [{ text: "저는 친절한 AI입니다." }],
					},
				},
				stopReason: "end_turn",
				usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 },
			});

			const service = new BedrockService();
			const response = await service.converse({
				messages: [{ role: "user", content: [{ text: "당신은 누구인가요?" }] }],
				systemPrompt: "당신은 친절한 AI 어시스턴트입니다.",
			});

			expect(response.content[0].text).toBe("저는 친절한 AI입니다.");
		});

		it("API 호출 실패 시 에러를 던진다", async () => {
			bedrockMock.on(ConverseCommand).rejects(new Error("API Error"));

			const service = new BedrockService();

			await expect(
				service.converse({
					messages: [{ role: "user", content: [{ text: "안녕" }] }],
				}),
			).rejects.toThrow("API Error");
		});
	});

	describe("converseStream - 스트리밍 응답", () => {
		it("텍스트 응답을 스트리밍한다", async () => {
			// Bedrock ConverseStream API가 반환하는 이벤트 시퀀스를 모킹
			// 실제로는 네트워크를 통해 하나씩 도착하지만, 테스트에서는 즉시 yield
			const mockStream = {
				[Symbol.asyncIterator]: async function* () {
					yield { messageStart: { role: "assistant" } };
					yield { contentBlockStart: { start: {} } };
					yield { contentBlockDelta: { delta: { text: "안녕" } } };
					yield { contentBlockDelta: { delta: { text: "하세요" } } };
					yield { contentBlockDelta: { delta: { text: "!" } } };
					yield { contentBlockStop: {} };
					yield { messageStop: { stopReason: "end_turn" } };
					yield { metadata: { usage: { inputTokens: 10, outputTokens: 5 } } };
				},
			};

			bedrockMock.on(ConverseStreamCommand).resolves({
				stream: mockStream as any,
			});

			const service = new BedrockService();
			const events: StreamEvent[] = [];

			// AsyncGenerator로 이벤트를 하나씩 수신
			for await (const event of service.converseStream({
				messages: [{ role: "user", content: [{ text: "안녕" }] }],
			})) {
				events.push(event);
			}

			// 텍스트 조각이 순서대로 3개 도착했는지 확인
			const textEvents = events.filter((e) => e.type === "text_delta");
			expect(textEvents).toHaveLength(3);
			expect(textEvents[0].text).toBe("안녕");
			expect(textEvents[1].text).toBe("하세요");
			expect(textEvents[2].text).toBe("!");

			// 스트림 끝에 토큰 사용량이 포함된 완료 이벤트가 있는지 확인
			const completeEvent = events.find((e) => e.type === "message_complete");
			expect(completeEvent).toBeDefined();
			expect(completeEvent?.usage?.inputTokens).toBe(10);
			expect(completeEvent?.usage?.outputTokens).toBe(5);
		});
	});

	describe("converseStream tool use 처리", () => {
		it("스트리밍에서 tool use 이벤트를 처리한다", async () => {
			const mockTool = {
				definition: {
					toolSpec: {
						name: "get_current_time",
						description: "현재 시간 조회",
						inputSchema: {
							json: { type: "object" as const, properties: {} },
						},
					},
				},
				execute: async () => "2026-02-23 15:30:00",
			};
			const { ToolOrchestrator } = await import(
				"../../src/services/toolOrchestrator"
			);
			const orchestrator = new ToolOrchestrator([mockTool]);

			// 첫 번째 스트림: tool_use 요청
			const mockStream1 = {
				[Symbol.asyncIterator]: async function* () {
					yield {
						contentBlockStart: {
							start: {
								toolUse: { toolUseId: "t1", name: "get_current_time" },
							},
						},
					};
					yield {
						contentBlockDelta: {
							delta: { toolUse: { input: '{"timezone":"Asia/Seoul"}' } },
						},
					};
					yield { contentBlockStop: {} };
					yield { messageStop: { stopReason: "tool_use" } };
				},
			};

			// 두 번째 스트림: 최종 텍스트 응답
			const mockStream2 = {
				[Symbol.asyncIterator]: async function* () {
					yield { contentBlockStart: { start: {} } };
					yield {
						contentBlockDelta: {
							delta: { text: "현재 시간은 15:30입니다." },
						},
					};
					yield { contentBlockStop: {} };
					yield { messageStop: { stopReason: "end_turn" } };
					yield {
						metadata: { usage: { inputTokens: 20, outputTokens: 10 } },
					};
				},
			};

			bedrockMock
				.on(ConverseStreamCommand)
				.resolvesOnce({ stream: mockStream1 as any })
				.resolvesOnce({ stream: mockStream2 as any });

			const service = new BedrockService();
			service.setToolOrchestrator(orchestrator);
			const events: StreamEvent[] = [];

			for await (const event of service.converseStream({
				messages: [{ role: "user", content: [{ text: "지금 몇 시야?" }] }],
			})) {
				events.push(event);
			}

			// tool_use_start 이벤트가 있는지 확인
			const toolStartEvent = events.find((e) => e.type === "tool_use_start");
			expect(toolStartEvent).toBeDefined();
			expect(toolStartEvent?.toolName).toBe("get_current_time");

			// tool_result 이벤트가 있는지 확인
			const toolResultEvent = events.find((e) => e.type === "tool_result");
			expect(toolResultEvent).toBeDefined();
			expect(toolResultEvent?.toolResult).toBe("2026-02-23 15:30:00");

			// 최종 텍스트 응답이 있는지 확인
			const textEvents = events.filter((e) => e.type === "text_delta");
			expect(textEvents).toHaveLength(1);
			expect(textEvents[0].text).toBe("현재 시간은 15:30입니다.");

			// ConverseStreamCommand가 2번 호출되었는지 확인
			expect(bedrockMock.commandCalls(ConverseStreamCommand)).toHaveLength(2);
		});

		it("orchestrator가 설정되면 toolConfig를 포함한다", async () => {
			const mockTool = {
				definition: {
					toolSpec: {
						name: "test_tool",
						description: "테스트",
						inputSchema: {
							json: { type: "object" as const, properties: {} },
						},
					},
				},
				execute: async () => "result",
			};
			const { ToolOrchestrator } = await import(
				"../../src/services/toolOrchestrator"
			);
			const orchestrator = new ToolOrchestrator([mockTool]);

			const mockStream = {
				[Symbol.asyncIterator]: async function* () {
					yield { contentBlockStart: { start: {} } };
					yield { contentBlockDelta: { delta: { text: "응답" } } };
					yield { contentBlockStop: {} };
					yield { messageStop: { stopReason: "end_turn" } };
					yield {
						metadata: { usage: { inputTokens: 5, outputTokens: 3 } },
					};
				},
			};

			bedrockMock
				.on(ConverseStreamCommand)
				.resolves({ stream: mockStream as any });

			const service = new BedrockService();
			service.setToolOrchestrator(orchestrator);

			const events: StreamEvent[] = [];
			for await (const event of service.converseStream({
				messages: [{ role: "user", content: [{ text: "안녕" }] }],
			})) {
				events.push(event);
			}

			const call = bedrockMock.commandCalls(ConverseStreamCommand)[0];
			expect(call.args[0].input.toolConfig).toBeDefined();
		});
	});

	describe("에러 처리", () => {
		it("접근 거부 에러를 처리한다", async () => {
			bedrockMock.on(ConverseCommand).rejects(
				new AccessDeniedException({
					message: "Access denied",
					$metadata: {},
				}),
			);

			const service = new BedrockService();

			await expect(
				service.converse({
					messages: [{ role: "user", content: [{ text: "안녕" }] }],
				}),
			).rejects.toThrow("ACCESS_DENIED");
		});

		it("모델을 찾을 수 없는 에러를 처리한다", async () => {
			bedrockMock.on(ConverseCommand).rejects(
				new ResourceNotFoundException({
					message: "Model not found",
					$metadata: {},
				}),
			);

			const service = new BedrockService();

			await expect(
				service.converse({
					messages: [{ role: "user", content: [{ text: "안녕" }] }],
				}),
			).rejects.toThrow("MODEL_NOT_FOUND");
		});

		it("스로틀링 에러를 재시도 가능으로 처리한다", async () => {
			bedrockMock.on(ConverseCommand).rejects(
				new ThrottlingException({
					message: "Rate exceeded",
					$metadata: {},
				}),
			);

			const service = new BedrockService();

			try {
				await service.converse({
					messages: [{ role: "user", content: [{ text: "안녕" }] }],
				});
			} catch (error) {
				expect(error).toBeInstanceOf(BedrockServiceError);
				expect((error as BedrockServiceError).retryable).toBe(true);
			}
		});
	});
});