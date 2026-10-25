import "dotenv/config";
import {
	BedrockRuntimeClient,
	ConverseCommand,
	ConverseStreamCommand,
	AccessDeniedException,
	ResourceNotFoundException,
	ThrottlingException,
	type Message as AwsMessage,
	type ContentBlock as AwsContentBlock,
} from "@aws-sdk/client-bedrock-runtime";
import type { DocumentType } from "@smithy/types";
import type {
	ConversationRequest,
	ConversationResponse,
	Message,
	ContentBlock,
	StreamEvent,
} from "../types";
import type { ToolOrchestrator } from "./toolOrchestrator";

export class BedrockServiceError extends Error {
	readonly code: string;
	readonly retryable: boolean;

	constructor(code: string, message: string, retryable = false) {
		super(message);
		this.name = "BedrockServiceError";
		this.code = code;
		this.retryable = retryable;
	}
}

export interface BedrockServiceConfig {
	region?: string;
	modelId?: string;
}

export class BedrockService {
	private readonly client: BedrockRuntimeClient;
	private readonly modelId: string;
	private orchestrator?: ToolOrchestrator;

	constructor(config: BedrockServiceConfig = {}) {
		const region = config.region ?? process.env.AWS_REGION;
		const modelId = config.modelId ?? process.env.BEDROCK_MODEL_ID;
		if (!region) {
			throw new Error("AWS_REGION is not set");
		}
		if (!modelId) {
			throw new Error("BEDROCK_MODEL_ID is not set");
		}

		this.client = new BedrockRuntimeClient({ region });
		this.modelId = modelId;
	}

	setToolOrchestrator(orchestrator: ToolOrchestrator): void {
		this.orchestrator = orchestrator;
	}

	async converse(request: ConversationRequest): Promise<ConversationResponse> {
		try {
			const response = await this.client.send(
				new ConverseCommand(this.buildInput(request.messages, request)),
			);

			return {
				content: this.fromAwsContent(response.output?.message?.content),
				stopReason: response.stopReason ?? "",
				usage: {
					inputTokens: response.usage?.inputTokens ?? 0,
					outputTokens: response.usage?.outputTokens ?? 0,
				},
			};
		} catch (error) {
			throw this.toServiceError(error);
		}
	}

	async *converseStream(request: ConversationRequest): AsyncGenerator<StreamEvent> {
		let messages = request.messages;

		while (true) {
			let stream;
			try {
				const response = await this.client.send(
					new ConverseStreamCommand(this.buildInput(messages, request)),
				);
				stream = response.stream;
			} catch (error) {
				yield { type: "error", error: this.toServiceError(error).message };
				return;
			}

			if (!stream) {
				yield { type: "error", error: "No stream returned from Bedrock" };
				return;
			}

			let toolUseId: string | undefined;
			let toolName: string | undefined;
			let toolInputBuffer = "";
			let stopReason: string | undefined;
			let usage: { inputTokens: number; outputTokens: number } | undefined;

			for await (const event of stream) {
				const toolUseStart = event.contentBlockStart?.start?.toolUse;
				if (toolUseStart) {
					toolUseId = toolUseStart.toolUseId;
					toolName = toolUseStart.name;
					toolInputBuffer = "";
					yield { type: "tool_use_start", toolUseId, toolName };
					continue;
				}

				const text = event.contentBlockDelta?.delta?.text;
				if (text !== undefined) {
					yield { type: "text_delta", text };
					continue;
				}

				const toolInput = event.contentBlockDelta?.delta?.toolUse?.input;
				if (toolInput !== undefined) {
					toolInputBuffer += toolInput;
					continue;
				}

				if (event.messageStop) {
					stopReason = event.messageStop.stopReason;
					continue;
				}

				if (event.metadata?.usage) {
					usage = {
						inputTokens: event.metadata.usage.inputTokens ?? 0,
						outputTokens: event.metadata.usage.outputTokens ?? 0,
					};
				}
			}

			if (stopReason === "tool_use" && toolUseId && toolName && this.orchestrator) {
				const input = toolInputBuffer ? JSON.parse(toolInputBuffer) : {};
				const result = await this.orchestrator.execute(toolName, input);
				yield { type: "tool_result", toolUseId, toolResult: result };

				messages = [
					...messages,
					{
						role: "assistant",
						content: [{ toolUse: { toolUseId, name: toolName, input } }],
					},
					{
						role: "user",
						content: [{ toolResult: { toolUseId, content: result } }],
					},
				];
				continue;
			}

			yield { type: "message_complete", usage };
			return;
		}
	}

	private buildInput(messages: Message[], request: ConversationRequest) {
		return {
			modelId: this.modelId,
			messages: this.toAwsMessages(messages),
			system: request.systemPrompt ? [{ text: request.systemPrompt }] : undefined,
			inferenceConfig:
				request.maxTokens !== undefined || request.temperature !== undefined
					? { maxTokens: request.maxTokens, temperature: request.temperature }
					: undefined,
			toolConfig: this.orchestrator?.getToolConfig(),
		};
	}

	private toAwsMessages(messages: Message[]): AwsMessage[] {
		return messages.map((message) => ({
			role: message.role,
			content: message.content.map((block): AwsContentBlock => {
				if (block.text !== undefined) {
					return { text: block.text };
				}
				if (block.toolUse) {
					return {
						toolUse: {
							toolUseId: block.toolUse.toolUseId,
							name: block.toolUse.name,
							input: block.toolUse.input as DocumentType,
						},
					};
				}
				if (block.toolResult) {
					return {
						toolResult: {
							toolUseId: block.toolResult.toolUseId,
							content: [{ text: block.toolResult.content }],
						},
					};
				}
				throw new Error("Invalid content block: missing text, toolUse, or toolResult");
			}),
		}));
	}

	private fromAwsContent(blocks?: AwsContentBlock[]): ContentBlock[] {
		return (blocks ?? []).map((block) => {
			if (block.text !== undefined) {
				return { text: block.text };
			}
			if (block.toolUse) {
				return {
					toolUse: {
						toolUseId: block.toolUse.toolUseId ?? "",
						name: block.toolUse.name ?? "",
						input: (block.toolUse.input as Record<string, unknown>) ?? {},
					},
				};
			}
			return {};
		});
	}

	private toServiceError(error: unknown): Error {
		if (error instanceof AccessDeniedException) {
			return new BedrockServiceError(
				"ACCESS_DENIED",
				"ACCESS_DENIED: Bedrock model access denied. Check IAM permissions and model access.",
				false,
			);
		}
		if (error instanceof ResourceNotFoundException) {
			return new BedrockServiceError(
				"MODEL_NOT_FOUND",
				"MODEL_NOT_FOUND: Requested Bedrock model was not found. Check BEDROCK_MODEL_ID.",
				false,
			);
		}
		if (error instanceof ThrottlingException) {
			return new BedrockServiceError(
				"THROTTLED",
				"THROTTLED: Bedrock request rate exceeded. Retry with backoff.",
				true,
			);
		}
		if (error instanceof Error) {
			return error;
		}
		return new Error(String(error));
	}
}
