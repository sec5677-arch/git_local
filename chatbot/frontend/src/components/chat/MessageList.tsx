import { useEffect, useRef } from "react";
import type { Message } from "../../types";
import { ToolResult } from "./ToolResult";

interface MessageListProps {
	messages: Message[];
	isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	if (messages.length === 0 && !isLoading) {
		return (
			<div className="flex h-full items-center justify-center p-4 text-gray-500">
				<p>대화를 시작해보세요</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 overflow-y-auto p-4">
			{messages.map((message) => {
				const isUser = message.role === "user";

				return (
					<article
						key={message.id}
						className={`flex ${isUser ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[80%] rounded-2xl px-4 py-2 ${
								isUser
									? "bg-primary text-white"
									: "bg-secondary text-gray-900"
							}`}
						>
							<p className="whitespace-pre-wrap">{message.content}</p>
							{message.toolCalls?.map((toolCall) => (
								<ToolResult key={toolCall.id} toolCall={toolCall} />
							))}
						</div>
					</article>
				);
			})}

			{isLoading && (
				<div className="flex justify-start">
					<div className="animate-pulse rounded-2xl bg-secondary px-4 py-2 text-gray-500">
						응답 생성 중...
					</div>
				</div>
			)}

			<div ref={bottomRef} />
		</div>
	);
}
