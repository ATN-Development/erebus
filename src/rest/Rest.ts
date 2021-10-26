import { AsyncQueue } from "@sapphire/async-queue";
import { promisify } from "util";
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
import { DiscordError } from "./DiscordError";

const setPromiseTimeout = promisify(setTimeout);

/**
 * A rest manager for the client
 */
export class Rest {
	/**
	 * The client that instantiated this
	 */
	client: Client;

	/**
	 * Number of invalid requests done in the last 10 minutes
	 */
	invalidRequests = 0;

	/**
	 * A queue for the requests
	 */
	queue = new AsyncQueue();

	/**
	 * An array of all the rate limit data received from the API
	 */
	rateLimits: RateLimitHandler[] = [];

	/**
	 * All requests that have been made so far
	 */
	requests: APIRequest[] = [];

	/**
	 * Number of requests done in the last second
	 */
	requestsPerSec = 0;

	/**
	 * @param client - The client that instantiated this
	 */
	constructor(client: Client) {
		this.client = client;

		// Reset the request per second every second
		setInterval(() => {
			this.requestsPerSec = 0;
		}, 1_000).unref();

		// Resey invalid requests every 10 minutes
		setInterval(() => {
			this.invalidRequests = 0;
		}, 600_000).unref();
	}

	/**
	 * Make a request to the API.
	 * @param path - The path to request
	 * @param method - The method of the request
	 * @param options - Other options for this request
	 * @returns - The JSON data received from the API or null if no data was received
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
		// Check if there is already data about ratelimits for this endpoint
		const rateLimitHandler = this.rateLimits.find((handler) =>
			handler.routes.includes(`${method} ${route}`)
		);

		this.requests.push(request);

		// If we already passed the limit wait until all parameters are ok
		while (
			this.requestsPerSec >= 50 ||
			this.invalidRequests >= 10_000 ||
			(rateLimitHandler && rateLimitHandler.remaining <= 0)
		);
		this.requestsPerSec++;

		let data;
		const res = await request.send();
		const bucket = res.headers["x-ratelimit-bucket"] as string | undefined;
		const limit = Number(
			res.headers["x-ratelimit-limit"] as string | undefined
		);

		// Check if it's an invalid request
		if ([401, 403, 429].includes(res.statusCode)) this.invalidRequests++;
		if (res.statusCode === 429) {
			const data = JSON.parse(res.data!) as RateLimitResponse;

			// If we encountered a ratelimit, use the retryAfter data
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
			// If the request is ok parse the data received
			data =
				res.headers["content-type"] === "application/json"
					? JSON.parse(res.data!)
					: res.data;
		else if (res.statusCode >= 300 && res.statusCode < 400)
			// In this case we have no data
			data = null;
		else if (res.statusCode >= 500 && retry) {
			// If there's a server error retry just one time
			this.queue.shift();
			return this.request(path, method as any, options, false);
		}

		this.queue.shift();
		if (data !== undefined) return data;

		// If we didn't receive a succesful response, throw an error
		throw new DiscordError(request, res);
	}

	/**
	 *
	 * @param bucket - The unique bucket string received from Discord
	 * @param method - The method used for the request
	 * @param route - The route of the request
	 * @param limit - The limit of requests for this bucket
	 * @param reset - When this ratelimit will reset
	 * @param remaining - How many requests remained
	 */
	private handleBucket(
		bucket: string,
		method: RequestMethod,
		route: `/${string}`,
		limit: number,
		reset?: number,
		remaining?: number
	) {
		// Find if this bucket is already saved
		let rateLimit = this.rateLimits.find(
			({ bucket: rateLimitBucket }) => rateLimitBucket === bucket
		);

		if (rateLimit) {
			if (!rateLimit.routes.includes(`${method} ${route}`))
				// Add this route and request if it isn't already added
				rateLimit.routes.push(`${method} ${route}`);

			// Update other properties
			rateLimit.limit = limit;
			rateLimit.remaining = remaining ?? rateLimit.remaining - 1;
		} else {
			// Create a new rate limit handler
			rateLimit = {
				bucket,
				limit,
				remaining: remaining ?? limit,
				routes: [`${method} ${route}`],
			};
			this.rateLimits.push(rateLimit);
		}

		// Handle the reset of this bucket if it wasn't already
		if (!rateLimit.reset && reset) {
			rateLimit.reset = reset;
			setTimeout(
				(rateLimit) => {
					rateLimit.remaining = rateLimit.limit;
				},
				reset - Date.now(),
				rateLimit
			).unref();
		}
	}
}

export default Rest;
