import FormData from "form-data";
import { OutgoingHttpHeaders } from "node:http";
import { Agent, request } from "node:https";
import { URL, URLSearchParams } from "node:url";
import {
	APIPrefix,
	APIUrl,
	RequestMethod,
	Path,
	Attachment,
	Json,
	Token,
	RequestOptions,
} from "./types";

const baseUrl = (apiPrefix?: APIPrefix, version: number = 9): APIUrl =>
	`https://${apiPrefix ? `${apiPrefix}.` : ""}discord.com/api/v${version}`;
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
	private _chunk?: string | FormData;
	constructor(
		// rest: RESTManager,
		path: Path,
		method: RequestMethod,
		token: Token,
		options: RequestOptions = {}
	) {
		const {
			apiPrefix,
			userAgent,
			version,
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

		this.url = new URL(baseUrl(apiPrefix, version) + path);
		this.url.search = query.toString();

		this.headers = {
			...headers,
			"User-Agent": `DiscordBot (https://github.com/NotReallyEight/erebus, 1.0.0)${
				userAgent ? ` ${userAgent}` : ""
			}`,
			"Authorization": `Bot ${token}`,
		};

		if (userAgent) this.userAgent = userAgent;

		if (attachments.length) {
			this._chunk = new FormData();
			for (const { data, name } of attachments) this._chunk.append(name, data);
			if (body != null)
				this._chunk.append("payload_json", JSON.stringify(body));
			this.headers = {
				...this.headers,
				...this._chunk.getHeaders(),
			};
		} else if (body != null) {
			this._chunk = JSON.stringify(body);
			this.headers = {
				...this.headers,
				"Content-Type": "application/json",
				"Content-Length": this._chunk.length,
			};
		}
	}

	/**
	 * Send the request to the api.
	 * @returns A promise with the data received from the API or null if there is no data
	 */
	send() {
		let response = "";

		const controller = new AbortController();
		const timeout = setTimeout(() => {
			controller.abort();
		}, 5_000).unref();
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
			if (this._chunk) req.write(this._chunk);
			req.end();
		});
	}
}

export default APIRequest;
