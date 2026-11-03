import { Redis } from "@upstash/redis";

export default async function handler(request: Request): Promise<Response> {
	if (request.method !== "POST") {
		return Response.json(
			{ error: "Method not allowed" },
			{ status: 405, headers: { Allow: "POST" } },
		);
	}

	try {
		const count = await Redis.fromEnv().incr("my-calendar:visitor-count");
		return Response.json({ count });
	} catch (error) {
		console.error("Unable to increment visitor count", error);
		return Response.json(
			{ error: "Unable to update visitor count" },
			{ status: 500 },
		);
	}
}
