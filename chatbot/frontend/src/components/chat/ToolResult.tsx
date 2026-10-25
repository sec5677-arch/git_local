import type { ToolCall } from "../../types";

const TOOL_LABELS: Record<string, string> = {
	get_weather: "날씨 조회",
};

const STATUS_STYLES: Record<string, string> = {
	pending: "bg-gray-300",
	running: "bg-yellow-400 animate-pulse",
	success: "bg-green-500",
	error: "bg-red-500",
};

interface ToolResultProps {
	toolCall: ToolCall;
}

export function ToolResult({ toolCall }: ToolResultProps) {
	const label = TOOL_LABELS[toolCall.name] ?? toolCall.name;
	const statusStyle = STATUS_STYLES[toolCall.status] ?? STATUS_STYLES.success;

	return (
		<div className="mt-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
			<div className="flex items-center gap-2 font-medium">
				<span className={`inline-block h-2 w-2 rounded-full ${statusStyle}`} />
				<span>{label}</span>
			</div>
			{toolCall.result && (
				<p className="mt-1 whitespace-pre-wrap text-gray-600">
					{toolCall.result}
				</p>
			)}
		</div>
	);
}
