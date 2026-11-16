import express, { type Express } from "express";
import cors from "cors";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";

export function createApp(): Express {
	const app = express();

	app.use(cors());
	app.use(express.json());
	app.use(requestLogger);

	app.use("/api", routes);

	app.use(errorHandler);

	return app;
}
