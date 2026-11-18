import type { NextFunction, Request, Response } from "express";

export interface ApiError extends Error {
	statusCode?: number;
	code?: string;
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

	const apiError = err instanceof Error ? (err as ApiError) : undefined;
	const statusCode = apiError?.statusCode ?? 500;
	const message = apiError?.message ?? "서버 오류가 발생했습니다.";

	res.status(statusCode).json({
		error: { message, code: apiError?.code },
	});
}
