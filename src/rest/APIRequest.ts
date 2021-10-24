// TODO: Uncomment lines with rest when its ready
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
	RequestStatus,
	Response,
} from "../types";

const { homepage, version } = require("../../package.json");
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
	 * The rest manager that instantiated this
	 */
	// rest: RESTManager;
	/**
	 * The status of this request
	 */
	status = RequestStatus.Created;
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
	userAgent: string | null = null;

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
		// this.rest = rest;
		this.token = token;

		this.attachments = attachments;
		this.body = body;
		this.query = query;

		this.url = new URL(url + path);
		this.url.search = query.toString();

		this.headers = {
			...headers,
			"User-Agent": `DiscordBot (${homepage}, ${version})${
				userAgent ? ` ${userAgent}` : ""
			}`,
			"Authorization": `Bot ${token}`,
		};

		if (userAgent) this.userAgent = userAgent;
	}

	/**
	 * The route of this request
	 */
	get route() {
		return this.path.replace(/(?<=\/)\d{17,19}/g, ":id");
	}

	/**
	 * Send the request to the api.
	 * @returns A promise with the data received from the API or null if there is no data
	 */
	send() {
		let chunk: string | FormData;
		let data = "";

		const controller = new AbortController();
		const timeout = setTimeout(() => {
			controller.abort();
		}, 5_000).unref();

		if (this.attachments.length) {
			if (this.method === "GET")
				throw new TypeError(
					`Cannot send attachments data to ${this.path} path with method GET`
				);
			chunk = new FormData();
			for (const { data, name } of this.attachments) chunk.append(name, data);
			if (this.body != null)
				chunk.append("payload_json", JSON.stringify(this.body));
			this.headers = {
				...this.headers,
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

			const req = request(
				this.url,
				{
					abort: controller.signal,
					agent,
					headers: this.headers,
					method: this.method,
				},
				(res) => {
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
							code: res.statusCode!,
							headers: res.headers,
							message: res.statusMessage!,
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
