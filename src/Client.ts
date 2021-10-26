import EventEmitter from "events";
import WebSocket from "ws";
import Rest from "./rest";
import type { APIGatewayInfo } from "discord-api-types/v9";
import { Routes } from "discord-api-types/v9";
import type { ClientOptions, HeartbeatInfo, Intents } from ".";

/**
 * A Discord client
 */
export class Client extends EventEmitter {
	/**
	 * Data about an heartbeat
	 */
	heartbeatInfo: HeartbeatInfo = {
		first: true,
		acknowledged: false,
	};

	/**
	 * Intents used by this client
	 */
	intents: Intents;

	/**
	 * Total number of members where the gateway will stop sending offline members in the guild member list
	 */
	largeThreshold: number;

	/**
	 * The rest manager of this client
	 */
	rest = new Rest(this);

	/**
	 * The token used by this client
	 */
	token = process.env.DISCORD_TOKEN;

	/**
	 * The user agent to append to requests to the API
	 */
	userAgent?: string;

	/**
	 * The websocket of this client
	 */
	ws?: WebSocket;

	/**
	 * @param options - Options for the client
	 */
	constructor({ intents, token, largeThreshold, userAgent }: ClientOptions) {
		super();

		this.intents = intents;
		this.largeThreshold = largeThreshold ?? 50;
		this.token = token;
		this.userAgent = userAgent;
	}

	/**
	 * Connect this client to the websocket.
	 */
	async connect() {
		this.ws = new WebSocket(`${await this.getGateway()}?v=9&encoding=json`);
		this.ws.on("open", () => {});
	}

	/**
	 * Get the gateway url.
	 * @returns The gateway url
	 */
	getGateway() {
		return this.rest
			.request<APIGatewayInfo>(Routes.gateway(), "GET")
			.then((info) => info.url);
	}

	/**
	 * Send an identify payload
	 */
	async identify() {
		// const payload = {
		// 	token: this.token,
		// 	properties: {
		// 		$os: process.platform,
		// 		$browser: "erebus",
		// 		$device: "erebus",
		// 	},
		// 	large_threshold: this.largeThreshold,
		// 	intents: this.intents,
		// };
	}
}

export default Client;
