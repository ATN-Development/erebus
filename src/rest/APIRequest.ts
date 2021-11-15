import { RouteBases } from "discord-api-types/v9";
import FormData from "form-data";
import type { OutgoingHttpHeaders } from "http";
import { Agent, request } from "https";
import { URL, URLSearchParams } from "url";
import type {
	RequestMethod,
	Path,
	Attachment,
	Json,
	RequestOptions,
	Response,
} from "..";
import { RequestStatus } from "../types";
import type Rest from "./Rest";

const { homepage, version } = require("../../package.json") as {
	homepage: string;
	version: string;
};
const agent = new Agent({ keepAlive: true });

/**
 * A class representing a request to the API
 */
export class APIRequest {
	/**
	 * A list of attachments to send
	 */
	attachments: Attachment[];

	/**
	 * The base url of this request
	 */
	baseUrl: string;

	/**
	 * The JSON body to send
	 */
	body?: Json;

	/**
	 * Headers to be sent in the request
	 */
	headers: OutgoingHttpHeaders;

	/**
	 * Method used for this request
	 */
	method: RequestMethod;

	/**
	 * The path of this request
	 */
	path: Path;

	/**
	 * Query applied to the request
	 */
	query: URLSearchParams;

	/**
	 * The rest manager that instantiated this
	 */
	rest: Rest;

	/**
	 * The status of this request
	 */
	status = RequestStatus.Pending;

	/**
	 * @param rest - The rest that instantiated this
	 * @param path - The path to request
	 * @param method - The method of the request
	 * @param options - Options for this request
	 */
	constructor(
		rest: Rest,
		path: Path,
		method: RequestMethod,
		options: RequestOptions = {}
	) {
		const {
			url = RouteBases.api,
			query = new URLSearchParams(),
			headers,
			attachments = [],
			body,
		} = options;

		if (rest.client.token == null)
			throw new TypeError(
				"No token was provided in the client initialization and process.env.DISCORD_CLIENT_TOKEN wasn't set or the Client#token property was manually removed!"
			);

		this.method = method;
		this.path = path;
		this.rest = rest;

		this.attachments = attachments;
		this.baseUrl = url;
		this.body = body;
		this.query = query;

		this.headers = {
			...headers,
			// https://discord.com/developers/docs/reference#user-agent
			"User-Agent": `DiscordBot (${homepage}, ${version})${
				rest.client.userAgent != null ? ` ${rest.client.userAgent}` : ""
			}`,
			// Use a bot token to authenticate the request
			"Authorization": rest.client.token.startsWith("Bot ") ? rest.client.token : `Bot ${rest.client.token}`,
		};
	}

	/**
	 * The full URL of this request
	 */
	get url() {
		const url = new URL(this.baseUrl + this.path);

		url.search = this.query.toString();
		return url;
	}

	/**
	 * The route of this request
	 */
	get route() {
		return this.path.replace(/(?<=\/)\d{17,19}/g, ":id") as Path;
	}

	/**
	 * Send the request to the api.
	 * @returns A promise with the data received from the API or null if there is no data
	 */
	send() {
		let chunk: FormData | string;

		if (this.attachments.length) {
			if (this.method === "GET")
				throw new TypeError(
					`Cannot send attachments data to ${this.path} path with method GET`
				);

			chunk = new FormData();
			// Append all the attachments to the data
			for (const { data, name } of this.attachments) chunk.append(name, data);
			if (this.body != null)
				// If there is a json body too we'll use the payload_json property
				chunk.append("payload_json", JSON.stringify(this.body));
			this.headers = {
				...this.headers,
				// Add headers related to the form data
				...chunk.getHeaders(),
			};
		} else if (this.body != null) {
			if (this.method === "GET")
				throw new TypeError(
					`Cannot send JSON data to ${this.path} path with method GET`
				);
			chunk = JSON.stringify(this.body);
			this.headers = {
				...this.headers,
				"Content-Type": "application/json",
				"Content-Length": chunk.length,
			};
		}

		return new Promise<Response>((resolve, reject) => {
			this.status = RequestStatus.InProgress;
			this.make(resolve, reject, chunk);
		});
	}

	/**
	 * Add some attachments to this request
	 * @param attachments - Attachments to add
	 * @returns The new request
	 */
	addAttachments(...attachments: NonNullable<RequestOptions["attachments"]>) {
		this.attachments.push(...attachments);
		return this;
	}

	/**
	 * Remove some attachments from this request
	 * @param attachments - Attachments to remove
	 * @returns The new request
	 */
	removeAttachments(...attachments: string[]) {
		this.attachments = this.attachments.filter(
			(att) => !attachments.includes(att.name)
		);
		return this;
	}

	/**
	 * Edit headers for this request
	 * @param headers - Headers to add/remove
	 * @returns The new request
	 */
	editHeaders(headers: RequestOptions["headers"]) {
		this.headers = { ...this.headers, ...headers };
		return this;
	}

	/**
	 * Make the request to the API.
	 * @param resolve A function to resolve the promise
	 * @param reject A function to reject the promise
	 * @param chunk The chunk to send
	 */
	private make(
		resolve: (value: PromiseLike<Response> | Response) => void,
		reject: (reason?: any) => void,
		chunk?: FormData | string
	) {
		// This is the data we'll receive
		let data = "";
		const timeout = setTimeout(() => {
			// Abort the request if it takes more than 5 sec
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			req.destroy(
				new Error(
					`Request to path ${this.path} took more than 5 seconds and was aborted before ending.`
				)
			);
		}, 5_000).unref();
		const req = request(
			this.url,
			{
				agent,
				headers: this.headers,
				method: this.method,
			},
			(res) => {
				// Handle a possible redirect
				if (
					[301, 302].includes(res.statusCode!) &&
					res.headers.location != null
				) {
					this.url.href = res.headers.location;
					this.url.search = this.query.toString();
					this.make(resolve, reject, chunk);
					return;
				}

				// Handle the data received
				res.on("data", (d) => {
					data += d;
				});
				res.once("end", () => {
					if (!res.complete)
						throw new Error(
							`Request to path ${this.path} ended before all data was transferred.`
						);
					clearTimeout(timeout);
					resolve({
						data: data || null,
						statusCode: res.statusCode!,
						headers: res.headers,
						status: res.statusMessage!,
						request: this,
					});
					this.status = RequestStatus.Finished;
				});
			}
		);

		req.once("error", (error) => {
			reject(
				new Error(
					`Request to ${this.url.href} failed with reason: ${error.message}`
				)
			);
			this.status = RequestStatus.Failed;
		});
		// Send the data, if present
		if (chunk != null) req.write(chunk);
		req.end();
	}
}

export default APIRequest;
