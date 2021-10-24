import { OutgoingHttpHeaders } from "node:http";
import { URLSearchParams } from "node:url";
import { Attachment, Json, Path, RequestMethod, Response } from "../types";
import APIRequest from "./APIRequest";

/**
 * A class representing a Discord error
 */
export class DiscordError extends Error {
	/**
	 * The attachments sent in the request
	 */
	attachments: Attachment[];
	/**
	 * The body sent in the request, if any
	 */
	body?: Json;
	/**
	 * Headers sent in the request
	 */
	headers: OutgoingHttpHeaders;
	/**
	 * Method used in the request
	 */
	method: RequestMethod;
	/**
	 * Path of the request
	 */
	path: Path;
	/**
	 * The query of the request
	 */
	query: URLSearchParams;
	/**
	 * The status code received for this request
	 */
	statusCode: number;

	/**
	 * @param request The request sent
	 * @param res The response received
	 */
	constructor(request: APIRequest, res: Response) {
		super(res.status);
		if (request.body) this.body = request.body;
		this.attachments = request.attachments;
		this.path = request.path;
		this.headers = request.headers;
		this.method = request.method;
		this.query = request.query;
		this.statusCode = res.statusCode;
	}
}
