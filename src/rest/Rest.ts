import { AsyncQueue } from "@sapphire/async-queue";
import { Client } from "../Client";
import {
	RateLimitHandler,
	Json,
	Path,
	RequestMethod,
	RequestOptions,
	RateLimitResponse,
} from "../types";
import APIRequest from "./APIRequest";
import { setTimeout as setPromiseTimeout } from "timers/promises";
import { DiscordError } from "./DiscordError";

export class Rest {
	client: Client;
	requests: APIRequest[] = [];
	requestsPerSec = 0;
	invalidRequests = 0;
	rateLimits: RateLimitHandler[] = [];
	queue = new AsyncQueue();
	constructor(client: Client) {
		this.client = client;
		setInterval(() => {
			this.requestsPerSec = 0;
		}, 1_000).unref();
		setInterval(() => {
			this.invalidRequests = 0;
		}, 600_000).unref();
	}

	/**
	 * Make a request to the API.
	 * @param path The path to request
	 * @param method The method of the request
	 * @param options Other options for this request
	 * @returns The JSON data received from the API or null if no data was received
	 */
	request<T = Json | null>(
		path: Path,
		method: "GET",
		options?: Omit<RequestOptions, "attachments" | "body">,
		retry?: boolean
	): Promise<T>;
	request<T = Json | null>(
		path: Path,
		method: Exclude<RequestMethod, "GET">,
		options?: RequestOptions,
		retry?: boolean
	): Promise<T>;
	async request(
		path: Path,
		method: RequestMethod,
		options: RequestOptions,
		retry = true
	) {
		await this.queue.wait();

		const request = new APIRequest(this, path, method, options);
		const { route } = request;
		const rateLimitHandler = this.rateLimits.find((handler) =>
			handler.routes.includes(`${method} ${route}`)
		);

		this.requests.push(request);
		this.requestsPerSec++;
		while (
			this.requestsPerSec >= 50 ||
			this.invalidRequests >= 10_000 ||
			(rateLimitHandler && rateLimitHandler.remaining <= 0)
		);

		const res = await request.send();
		let data;
		const bucket = res.headers["x-ratelimit-bucket"] as string | undefined;
		const limit = Number(
			res.headers["x-ratelimit-limit"] as string | undefined
		);

		if ([401, 403, 429].includes(res.statusCode)) this.invalidRequests++;
		if (res.statusCode === 429) {
			const data = JSON.parse(res.data!) as RateLimitResponse;

			await setPromiseTimeout(data.retry_after * 1000);
			this.queue.shift();
			if (!data.global) {
				if (bucket && limit)
					this.handleBucket(
						bucket,
						method,
						route,
						limit,
						Date.now() +
							Number(
								res.headers["x-ratelimit-reset-after"] as string | undefined
							) *
								1000
					);
			}
			return this.request(path, method as any, options);
		}
		if (bucket && limit)
			this.handleBucket(
				bucket,
				method,
				route,
				limit,
				Number(res.headers["x-ratelimit-reset"] as string | undefined) * 1000,
				Number(res.headers["x-ratelimit-remaining"] as string | undefined)
			);
		if (res.statusCode >= 200 && res.statusCode < 300)
			data =
				res.headers["content-type"] === "application/json"
					? JSON.parse(res.data!)
					: res.data;
		else if (res.statusCode >= 300 && res.statusCode < 400) data = null;
		else if (res.statusCode >= 500 && retry) {
			this.queue.shift();
			return this.request(path, method as any, options, false);
		}
		this.queue.shift();
		if (data) return data;
		throw new DiscordError(request, res);
	}

	private handleBucket(
		bucket: string,
		method: RequestMethod,
		route: `/${string}`,
		limit: number,
		reset?: number,
		remaining?: number
	) {
		let rateLimit = this.rateLimits.find(
			({ bucket: rateLimitBucket }) => rateLimitBucket === bucket
		);

		if (rateLimit) {
			if (!rateLimit.routes.includes(`${method} ${route}`))
				rateLimit.routes.push(`${method} ${route}`);
			rateLimit.limit = limit;
			rateLimit.remaining = remaining ?? rateLimit.remaining - 1;
		} else {
			rateLimit = {
				bucket,
				limit,
				remaining: remaining ?? limit,
				routes: [`${method} ${route}`],
			};
			this.rateLimits.push(rateLimit);
		}
		if (!rateLimit.reset && reset) {
			rateLimit.reset = reset;
			setTimeout(() => {
				rateLimit!.remaining = rateLimit!.limit;
			}, reset - Date.now()).unref();
		}
	}
}
