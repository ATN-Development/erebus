import EventEmitter from "events";
import WebSocket from "ws";
import Rest from "./rest";
import type { APIGatewayInfo } from "discord-api-types/v9";
import {
	Routes,
	GatewayReceivePayload,
	GatewayOpcodes,
	GatewayResume,
} from "discord-api-types/v9";
import { ClientOptions, HeartbeatInfo, Intents } from ".";

interface AdvancedHeartbeatInfo extends HeartbeatInfo {
	intervalTime: number;
	interval: NodeJS.Timeout | null;
}

/**
 * A Discord client
 */
export class Client extends EventEmitter {
	/**
	 * Data about an heartbeat
	 */
	heartbeatInfo: AdvancedHeartbeatInfo = {
		first: true,
		acknowledged: false,
		intervalTime: 0,
		interval: null,
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
	 * The last sequence number received from the WebSocket server
	 */
	seq: number = 0;

	/**
	 * The session ID of this client
	 */
	sessionId?: string;

	/**
	 * The status of the connection of this client
	 */
	status: "connected" | "disconnected" | "reconnecting" | "resuming" =
		"disconnected";

	/**
	 * The token used by this client
	 */
	token = process.env.DISCORD_CLIENT_TOKEN;

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
	async connect(): Promise<void> {
		if (this.status === "disconnected") {
			this.ws = new WebSocket(`${await this.getGateway()}?v=9&encoding=json`);
			this.ws.on("open", () => {
				this._identify();
			});
			this.ws.on("message", async (data: Buffer) => {
				let payload: GatewayReceivePayload = JSON.parse(data.toString());
				switch (payload.op) {
					case GatewayOpcodes.Heartbeat:
						if (this.heartbeatInfo.first) {
							this.heartbeatInfo.acknowledged = true;
							this.heartbeatInfo.first = false;
							this._heartbeat();
						} else if (!this.heartbeatInfo.acknowledged) {
							throw new Error("Received heartbeat before acknowledgement");
						} else if (this.heartbeatInfo.interval) {
							this._heartbeat();
							clearInterval(this.heartbeatInfo.interval);
							setInterval(() => {
								this._sendHeartbeat();
							}, this.heartbeatInfo.intervalTime);
						} else {
							throw new Error("Received heartbeat before heartbeat");
						}
						break;

					case GatewayOpcodes.Reconnect:
						this.ws?.close(5000, "Reconnecting");
						this.connect();
						break;

					case GatewayOpcodes.InvalidSession:
						this.sessionId = undefined;
						if (this.status === "resuming") {
							setTimeout(() => {
								this._identify();
							}, 5000);
						} else {

						}
						this.status = "reconnecting";
						break;
				}
				this.status = "connected";
			});
		} else if (this.status === "connected") {
			throw new Error("Already connected");
		} else {
			this.ws = new WebSocket(`${await this.getGateway()}?v=9&encoding=json`);
			this.ws.on("open", () => {
				if (!this.token || !this.sessionId) {
					throw new Error("Cannot resume without a token and session ID");
				}
				const resumePayload: GatewayResume = {
					op: 6,
					d: {
						token: this.token,
						session_id: this.sessionId,
						seq: this.seq,
					},
				};
				this.ws?.send(JSON.stringify(resumePayload));
			});
		}
	}

	/**
	 * Get the gateway url.
	 * @returns The gateway url
	 */
	async getGateway(): Promise<string> {
		const info = await this.rest.request<APIGatewayInfo>(
			Routes.gateway(),
			"GET"
		);
		return info.url;
	}

	/**
	 * Send an identify payload
	 */
	private async _identify(): Promise<void> {
		const payload = {
			token: this.token,
			properties: {
				$os: process.platform,
				$browser: "erebus",
				$device: "erebus",
			},
			large_threshold: this.largeThreshold,
			intents: this.intents,
		};

		this.ws?.send(
			JSON.stringify({
				op: 2,
				d: payload,
			})
		);
	}

	private async _heartbeat(): Promise<void> {
		this.heartbeatInfo.interval = setInterval(() => {
			this._sendHeartbeat();
		}, this.heartbeatInfo.intervalTime);
	}

	private async _sendHeartbeat(): Promise<void> {
		const heartbeat = {
			op: 1,
			d: this.seq ? this.seq : null,
		};
		this.ws?.send(JSON.stringify(heartbeat));
	}
}

export default Client;
