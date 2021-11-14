import type { OutgoingHttpHeaders } from "http";
import type { Attachment, Json, Path, RequestMethod, Response } from "..";
import type APIRequest from "./APIRequest";
import type {
	DiscordError as DiscordAPIError,
	DiscordErrorData,
	DiscordErrorFieldInformation,
	DiscordErrorGroupWrapper,
} from "discord-api-types/v8";

/**
 * A class representing a Discord error
 */
export class DiscordError extends Error {
	/**
	 * The attachments sent in the request
	 */
	attachments?: Attachment[];

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
	query?: string;

	/**
	 * The status message received from the API
	 */
	status: string;

	/**
	 * The status code received for this request
	 */
	statusCode: number;

	/**
	 * @param request - The request sent
	 * @param res - The response received
	 */
	constructor(request: APIRequest, res: Response) {
		let error: string;
		const query = request.query.toString();

		if (res.data != null) {
			// Parse any JSON error data
			const errorData = JSON.parse(res.data) as DiscordAPIError;

			error =
				errorData.errors != null
					? DiscordError.handleErrors(
							errorData.errors,
							`${errorData.message}\n`
					  ).trim()
					: errorData.message;
		} else error = res.status;
		super(error);

		if (query) this.query = query;

		if (request.attachments.length) this.attachments = request.attachments;
		if (request.body != null) this.body = request.body;

		this.headers = request.headers;
		this.method = request.method;
		this.path = request.path;
		this.status = res.status;
		this.statusCode = res.statusCode;
	}

	/**
	 * Resolve a JSON error data received from the API.
	 * @param errorData - The error data received from the API
	 * @param error - The error string to use
	 * @returns The resolved error
	 */
	private static handleErrors(errorData: DiscordErrorData, error = "") {
		// If the error data is just a string, add it to the error
		if (typeof errorData === "string") error += `${errorData}\n`;
		else if (this.isFieldInformation(errorData))
			// If it's a field information, use the message property
			error += `${errorData.message}\n`;
		else if (this.isGroupWrapper(errorData))
			// If it's a group wrapper add all the errors received
			error += `${errorData._errors.map((err) => err.message).join(" ")}\n`;
		// If it's a custom error parse it
		else
			Object.entries(errorData).forEach(
				([k, v]) => (error = this.handleObject(k, v, error))
			);

		return error;
	}

	/**
	 * Resolve an object error data.
	 * @param k - The key
	 * @param v - The value
	 * @param error - The error string to use
	 * @returns The resolved error
	 */
	private static handleObject(k: string, v: DiscordErrorData, error: string) {
		// Check if the key is from an array
		const isArray = !isNaN(Number(k));

		// If it's an array, put the key in brackets
		error += `${isArray ? `[${k}]` : k}`;

		if (
			typeof v === "string" ||
			this.isFieldInformation(v) ||
			this.isGroupWrapper(v)
		)
			// If it's a normal error message, use the default resolver
			error += `: ${this.handleErrors(v)}`;
		else {
			const splitted = error.split("\n");

			// Do this again until all nested objects are parsed
			Object.entries(v).forEach(
				([k1, v1], i) =>
					(error = this.handleObject(
						k1,
						v1,
						`${error}${i ? splitted[splitted.length - 1]! : ""}${
							isArray ? "" : "."
						}`
					))
			);
		}

		return error;
	}

	/**
	 * Check if an error is a field information.
	 * @param errorData - The error data received
	 * @returns If the error is a field information
	 */
	private static isFieldInformation(
		errorData: Exclude<DiscordErrorData, string>
	): errorData is DiscordErrorFieldInformation {
		return "code" in errorData;
	}

	/**
	 * Check if an error is a group wrapper.
	 * @param errorData - The error data received
	 * @returns If the error is a group wrapper
	 */
	private static isGroupWrapper(
		errorData: Exclude<DiscordErrorData, string>
	): errorData is DiscordErrorGroupWrapper {
		return "_errors" in errorData;
	}
}

export default DiscordError;
