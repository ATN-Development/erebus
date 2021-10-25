import EventEmitter from "events";
import WebSocket from "ws";
import { Rest } from "./rest/Rest";
import { APIGatewayInfo, Routes } from "discord-api-types/v9";
import { ClientOptions, HeartbeatInfo, Intents } from "./types";

/**
 * A Discord client
 */
export class Client extends EventEmitter {
	/**
	 * The websocket of this client
	 */
	ws?: WebSocket;

	/**
	 * The token used by this client
	 */
	token: string;

	/**
	 * Total number of members where the gateway will stop sending offline members in the guild member list
	 */
	largeThreshold: number;

	/**
	 * Data about an heartbeat
	 */
	heartbeatInfo: HeartbeatInfo;

	/**
	 * The rest manager of this client
	 */
	rest: Rest;

	/**
	 * Intents used by this client
	 */
	intents: Intents;

	/**
	 * @param options - Options for the client
	 */
	constructor(options: ClientOptions) {
		super();
		this.ws = undefined;
		this.token = options.token;
		this.largeThreshold = options.largeThreshold ? options.largeThreshold : 50;
		this.heartbeatInfo = {
			first: true,
			acknowledged: false,
		};
		this.rest = new Rest(this);
		this.intents = options.intents;
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
