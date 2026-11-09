import dotenv from "dotenv";
import { BedrockService } from "../../src/services/bedrock";

dotenv.config();

async function main() {
	const service = new BedrockService();
	const modelId =
		process.env.BEDROCK_MODEL_ID || "global.anthropic.claude-sonnet-4-6";

	console.log("스트리밍 응답 테스트...\n");
	console.log("응답: ");

	for await (const event of service.converseStream({
		messages: [
			{
				role: "user",
				content: [{ text: "1부터 5까지 세어줘. 짧게." }],
			},
		],
	})) {
		switch (event.type) {
			case "text_delta":
				process.stdout.write(event.text ?? "");
				break;
			case "message_complete":
				console.log("\n\n토큰 사용량:");
				console.log(`  - 입력: ${event.usage?.inputTokens}`);
				console.log(`  - 출력: ${event.usage?.outputTokens}`);
				break;
		}
	}
}

main().catch(console.error);
