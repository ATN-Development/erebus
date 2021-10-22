import FormData from "form-data";
import { OutgoingHttpHeaders } from "node:http";
import { Agent, request } from "node:https";
import { URL, URLSearchParams } from "node:url";
import Constants from "../Constants";
import {
	RequestMethod,
	Path,
	Attachment,
	Json,
	Token,
	RequestOptions,
} from "../types";

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
	 * TODO: The rest manager that instantiated this
	 */
	// rest: RESTManager;
	/**
	 * Token used for the request
	 */
	token: Token;
	/**
	 * The full URL object of this request
	 */
	url: URL;
	/**
	 * The user agent added for this request
	 */
	userAgent?: string;

	constructor(
		// rest: RESTManager,
		path: Path,
		method: "GET",
		token: Token,
		options?: Omit<RequestOptions, "attachments" | "body">
	);
	constructor(
		// rest: RESTManager,
		path: Path,
		method: Exclude<RequestMethod, "GET">,
		token: Token,
		options?: RequestOptions
	);
	constructor(
		// rest: RESTManager,
		path: Path,
		method: RequestMethod,
		token: Token,
		options: RequestOptions = {}
	) {
		const {
			userAgent,
			url = Constants.endpoints.api,
			query = new URLSearchParams(),
			headers,
			attachments = [],
			body,
		} = options;

		this.method = method;
		this.path = path;
		// TODO: this.rest = rest;
		this.token = token;

		this.attachments = attachments;
		this.body = body;
		this.query = query;

		this.url = new URL(url + path);
		this.url.search = query.toString();

		this.headers = {
			...headers,
			"User-Agent": `DiscordBot (https://github.com/NotReallyEight/erebus, 1.0.0)${
				userAgent ? ` ${userAgent}` : ""
			}`,
			"Authorization": `Bot ${token}`,
		};

		if (userAgent) this.userAgent = userAgent;
	}

	/**
	 * Send the request to the api.
	 * @returns A promise with the data received from the API or null if there is no data
	 */
	send() {
		let chunk: string | FormData;
		let response = "";

		const controller = new AbortController();
		const timeout = setTimeout(() => {
			controller.abort();
		}, 5_000).unref();

		if (this.attachments.length) {
			chunk = new FormData();
			for (const { data, name } of this.attachments) chunk.append(name, data);
			if (this.body != null)
				chunk.append("payload_json", JSON.stringify(this.body));
			this.headers = {
				...this.headers,
				...chunk.getHeaders(),
			};
		} else if (this.body != null) {
			chunk = JSON.stringify(this.body);
			this.headers = {
				...this.headers,
				"Content-Type": "application/json",
				"Content-Length": chunk.length,
			};
		}

		return new Promise<string | null>((resolve, reject) => {
			const req = request(
				this.url,
				{
					abort: controller.signal,
					agent,
					headers: this.headers,
					method: this.method,
				},
				(res) => {
					res.on("data", (d) => (response += d));
					res.once("end", () => {
						clearTimeout(timeout);
						resolve(response || null);
					});
				}
			);

			req.once("error", (error) =>
				reject(
					new Error(
						`Request to ${this.url.href} failed with reason: ${error.message}`
					)
				)
			);
			if (chunk) req.write(chunk);
			req.end();
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
}

export default APIRequest;
