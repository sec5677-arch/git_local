import type { NextFunction, Request, Response } from "express";
import { BedrockServiceError } from "../services/bedrock";

const STATUS_BY_CODE: Record<string, number> = {
	ACCESS_DENIED: 403,
	MODEL_NOT_FOUND: 404,
	THROTTLED: 429,
};

interface ErrorWithStatusCode {
	statusCode: number;
}

function hasStatusCode(err: unknown): err is ErrorWithStatusCode {
	return (
		typeof err === "object" &&
		err !== null &&
		"statusCode" in err &&
		typeof (err as ErrorWithStatusCode).statusCode === "number"
	);
}

export function errorHandler(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	if (res.headersSent) {
		next(err);
		return;
	}

	console.error(`[error] ${req.method} ${req.originalUrl}`, err);

	if (err instanceof BedrockServiceError) {
		res.status(STATUS_BY_CODE[err.code] ?? 500).json({
			error: { code: err.code, message: "AI 응답 처리 중 오류가 발생했습니다." },
		});
		return;
	}

	const statusCode = hasStatusCode(err) ? err.statusCode : 500;
	const message = err instanceof Error ? err.message : "서버 오류가 발생했습니다.";

	res.status(statusCode).json({
		error: { code: "INTERNAL_ERROR", message },
	});
}
