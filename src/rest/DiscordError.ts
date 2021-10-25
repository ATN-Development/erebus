import { OutgoingHttpHeaders } from "node:http";
import { Attachment, Json, Path, RequestMethod, Response } from "../types";
import APIRequest from "./APIRequest";
import {
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
	attachments: Attachment[];
	/**
	 * The body sent in the request, if any
	 */
	body?: Json;
	/**
	 * The error received from the API
	 */
	error: string;
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
	query: string;
	/**
	 * The status message received from the API
	 */
	status: string;
	/**
	 * The status code received for this request
	 */
	statusCode: number;

	/**
	 * @param request The request sent
	 * @param res The response received
	 */
	constructor(request: APIRequest, res: Response) {
		let error: string;

		if (res.data) {
			const errorData = JSON.parse(res.data) as DiscordAPIError;

			error = errorData.errors
				? DiscordError.handleErrors(
						errorData.errors,
						`${errorData.message}\n`
				  ).trim()
				: errorData.message;
		} else error = res.status;
		super(error);

		this.attachments = request.attachments;
		this.body = request.body;
		this.error = error;
		this.headers = request.headers;
		this.method = request.method;
		this.name = this.constructor.name;
		this.path = request.path;
		this.query = request.query.toString();
		this.status = res.status;
		this.statusCode = res.statusCode;
	}

	/**
	 * Resolve a JSON error data received from the API.
	 * @param errorData The error data received from the API
	 * @param error The error string to use
	 * @returns The resolved error
	 */
	private static handleErrors(errorData: DiscordErrorData, error = "") {
		if (typeof errorData === "string") error += `${errorData}\n`;
		else if (this.isFieldInformation(errorData))
			error += `${errorData.message}\n`;
		else if (this.isGroupWrapper(errorData))
			error += `${errorData._errors.map((err) => err.message).join(" ")}\n`;
		else
			Object.entries(errorData).forEach(
				([k, v]) => (error = this.handleObject(k, v, error))
			);

		return error;
	}

	/**
	 * Resolve an object error data.
	 * @param k The key
	 * @param v The value
	 * @param error The error string to use
	 * @returns The resolved error
	 */
	private static handleObject(k: string, v: DiscordErrorData, error: string) {
		const isArray = !isNaN(+k);

		error += `${error.at(-1) !== "\n" && !isArray ? "." : ""}${
			isArray ? `[${k}]` : k
		}`;
		if (
			typeof v === "string" ||
			this.isFieldInformation(v) ||
			this.isGroupWrapper(v)
		)
			error += `: ${this.handleErrors(v)}`;
		else {
			let prop: string | string[] = error.split("\n");
			prop = prop.at(-1) ?? prop.at(-2)!;
			Object.entries(v).forEach(
				([k1, v1], i) =>
					(error = this.handleObject(k1, v1, `${error}${i ? prop : ""}`))
			);
		}

		return error;
	}

	/**
	 * Check if an error is a group wrapper.
	 * @param errorData The error data received
	 * @returns If the error is a group wrapper
	 */
	private static isGroupWrapper(
		errorData: Exclude<DiscordErrorData, string>
	): errorData is DiscordErrorGroupWrapper {
		return "_errors" in errorData;
	}

	/**
	 * Check if an error is a field information.
	 * @param errorData The error data received
	 * @returns If the error is a field information
	 */
	private static isFieldInformation(
		errorData: Exclude<DiscordErrorData, string>
	): errorData is DiscordErrorFieldInformation {
		return "code" in errorData;
	}
}
