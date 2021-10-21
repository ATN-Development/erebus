// TODO: Create a global types file for the project
import { OutgoingHttpHeaders } from "node:http";
import { URLSearchParams } from "node:url";

export type APIUrl = `https://${string}discord.com/api/v${number}`;
export type APIPrefix = "ptb" | "canary";
export type Attachment = { name: string; data: Buffer };
export type Json =
	| Json[]
	| boolean
	| number
	| string
	| { [property: string]: Json };
export type Path = `/${string}`;
export type RequestMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export type RequestOptions = {
	version?: number;
	apiPrefix?: APIPrefix;
	userAgent?: string;
	query?: URLSearchParams;
	headers?: OutgoingHttpHeaders;
	attachments?: Attachment[];
	body?: Json;
};
export type Token = `${string}.${string}.${string}`;
