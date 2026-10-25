import type { Tool, ToolConfiguration } from "@aws-sdk/client-bedrock-runtime";

export interface OrchestratedTool {
	definition: Tool;
	execute: (input: Record<string, unknown>) => Promise<string>;
}

export class ToolOrchestrator {
	constructor(private readonly tools: OrchestratedTool[]) {}

	getToolConfig(): ToolConfiguration {
		return { tools: this.tools.map((tool) => tool.definition) };
	}

	async execute(name: string, input: Record<string, unknown>): Promise<string> {
		const tool = this.tools.find((t) => t.definition.toolSpec?.name === name);
		if (!tool) {
			throw new Error(`Unknown tool: ${name}`);
		}
		return tool.execute(input);
	}
}
