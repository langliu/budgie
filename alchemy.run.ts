import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { Worker } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "./apps/web/.env" });
config({ path: "./apps/server/.env" });

const app = await alchemy("budgie");

const db = await D1Database("database", {
	migrationsDir: "packages/db/src/migrations",
});

export const web = await TanStackStart("web", {
	cwd: "apps/web",
	bindings: {
		VITE_SERVER_URL: process.env.VITE_SERVER_URL || "",
	},
	dev: {
		command: "pnpm run dev",
	},
});

export const server = await Worker("server", {
	cwd: "apps/server",
	entrypoint: "src/index.ts",
	compatibility: "node",
	bindings: {
		DB: db,
		CORS_ORIGIN: process.env.CORS_ORIGIN || "",
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "",
		GOOGLE_GENERATIVE_AI_API_KEY: alchemy.secret(
			process.env.GOOGLE_GENERATIVE_AI_API_KEY,
		),
	},
	dev: {
		port: 3000,
	},
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
