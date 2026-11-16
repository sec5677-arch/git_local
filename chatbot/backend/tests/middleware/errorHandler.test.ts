import type { NextFunction, Request, Response } from "express";
import { errorHandler } from "../../src/middleware/errorHandler";
import { BedrockServiceError } from "../../src/services/bedrock";

function createRequest(): Request {
	return { method: "GET", originalUrl: "/api/chat" } as Request;
}

function createResponse(headersSent = false): Response & { status: jest.Mock; json: jest.Mock } {
	const res = {
		headersSent,
		status: jest.fn(),
		json: jest.fn(),
	};
	res.status.mockReturnValue(res);
	res.json.mockReturnValue(res);
	return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
}

describe("errorHandler", () => {
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	it("statusCode가 없는 일반 에러는 500 상태와 에러 메시지를 반환한다", () => {
		const res = createResponse();
		const next = jest.fn() as NextFunction;

		errorHandler(new Error("boom"), createRequest(), res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: { code: "INTERNAL_ERROR", message: "boom" },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("커스텀 statusCode가 있는 에러는 해당 상태 코드를 반환한다", () => {
		const res = createResponse();
		const next = jest.fn() as NextFunction;
		const error = Object.assign(new Error("잘못된 요청입니다"), { statusCode: 400 });

		errorHandler(error, createRequest(), res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: { code: "INTERNAL_ERROR", message: "잘못된 요청입니다" },
		});
	});

	it("Error가 아닌 값도 500으로 처리한다", () => {
		const res = createResponse();
		const next = jest.fn() as NextFunction;

		errorHandler("문자열 에러", createRequest(), res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." },
		});
	});

	it.each([
		["ACCESS_DENIED", 403],
		["MODEL_NOT_FOUND", 404],
		["THROTTLED", 429],
	] as const)("BedrockServiceError(%s)는 %i로 응답한다", (code, status) => {
		const res = createResponse();
		const next = jest.fn() as NextFunction;

		errorHandler(new BedrockServiceError(code, "내부 메시지"), createRequest(), res, next);

		expect(res.status).toHaveBeenCalledWith(status);
		expect(res.json).toHaveBeenCalledWith({
			error: { code, message: "AI 응답 처리 중 오류가 발생했습니다." },
		});
	});

	it("매핑되지 않은 code의 BedrockServiceError는 500으로 응답한다", () => {
		const res = createResponse();
		const next = jest.fn() as NextFunction;

		errorHandler(
			new BedrockServiceError("UNKNOWN_CODE", "내부 메시지"),
			createRequest(),
			res,
			next,
		);

		expect(res.status).toHaveBeenCalledWith(500);
	});

	it("헤더가 이미 전송된 경우 응답하지 않고 next(err)로 위임한다", () => {
		const res = createResponse(true);
		const next = jest.fn() as NextFunction;
		const error = new Error("boom");

		errorHandler(error, createRequest(), res, next);

		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(error);
	});

	it("에러를 콘솔에 로깅한다", () => {
		const res = createResponse();
		const next = jest.fn() as NextFunction;
		const error = new Error("boom");

		errorHandler(error, createRequest(), res, next);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("GET /api/chat"),
			error,
		);
	});
});
