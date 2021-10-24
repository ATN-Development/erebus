import { IncomingHttpHeaders, OutgoingHttpHeaders } from "node:http";
import { URLSearchParams } from "node:url";
import APIRequest from "./rest/APIRequest";

/**
 * An attachment to send to the API
 */
export interface Attachment {
	/**
	 * The name of this attachment
	 */
	name: string;
	/**
	 * The data for this buffer
	 */
	data: Buffer;
}
/**
 * Data about ratelimits related to a bucket
 */
export interface RateLimitHandler {
	/**
	 * A unique string denoting the rate limit being encountered
	 */
	bucket: string;
	/**
	 * The number of requests that can be made
	 */
	limit: number;
	/**
	 * The number of remaining requests that can be made
	 */
	remaining: number;
	/**
	 * Epoch time (seconds) at which the rate limit resets
	 */
	reset?: number;
	/**
	 * Routes that share the same bucket
	 */
	routes: { method: RequestMethod; route: Path }[];
}
/**
 * A JSON response from the API with a 429 status code
 */
export interface RateLimitResponse {
	/**
	 * A value indicating if you are being globally rate limited or not
	 */
	global: boolean;
	/**
	 * A message saying you are being rate limited
	 */
	message: string;
	/**
	 * The number of seconds to wait before submitting another request.
	 */
	retry_after: number;
}
/**
 * Any JSON data
 */
export type Json =
	| Json[]
	| boolean
	| number
	| string
	| { [property: string]: Json };
/**
 * The path for a request to the API
 */
export type Path = `/${string}`;
/**
 * The method of a request to the API
 */
export type RequestMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
/**
 * The options for this request
 */
export interface RequestOptions {
	/**
	 * The base url for this request
	 */
	url?: string;
	/**
	 * The user agent used for this request
	 */
	userAgent?: string;
	/**
	 * The query of this request
	 */
	query?: URLSearchParams;
	/**
	 * Headers to be sent for this request
	 */
	headers?: OutgoingHttpHeaders;
	/**
	 * Attachments to add to the body of this request
	 */
	attachments?: Attachment[];
	/**
	 * The JSON body of this request
	 */
	body?: Json;
}
/**
 * The status of a request to the API
 */
export enum RequestStatus {
	Pending,
	InProgress,
	Finished,
	Failed,
}
/**
 * A response received from the API
 */
export interface Response {
	/**
	 * The received data
	 */
	data: string | null;
	/**
	 * The status code received for this request
	 */
	statusCode: number;
	/**
	 * Headers received from the API
	 */
	headers: IncomingHttpHeaders;
	/**
	 * The status message received for this request
	 */
	status: string;
	/**
	 * The APIRequest object that instantiated this
	 */
	request: APIRequest;
}
/**
 * A valid token for the API
 */
export type Token = `${string}.${string}.${string}`;
