import type {
	APIGatewayInfo,
	APIUser,
	GatewayDispatchPayload,
	GatewayReceivePayload,
	GatewayResume,
	Snowflake,
} from "discord-api-types/v9";
import {
	GatewayDispatchEvents,
	GatewayOpcodes,
	Routes,
} from "discord-api-types/v9";
import EventEmitter from "events";
import WebSocket from "ws";
import type {
	AdvancedHeartbeatInfo,
	ClientEvents,
	ClientOptions,
	Intents,
	PartialAPIApplication,
} from ".";
import { ClientStatus } from "./types";
import Rest from "./rest";
import { UnavailableGuild, User } from "./structures";

export interface Client extends EventEmitter {
	on<T extends keyof ClientEvents>(
		event: T,
		listener: (...args: ClientEvents[T]) => void
	): this;
	emit<T extends keyof ClientEvents>(
		event: T,
		...args: ClientEvents[T]
	): boolean;
}

/**
 * A Discord client
 */
export class Client extends EventEmitter {
	/**
	 * The client's application
	 */
	application?: PartialAPIApplication;

	/**
	 * The guilds the client is in
	 */
	guilds = new Map<Snowflake, UnavailableGuild>();

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
	seq = 0;

	/**
	 * The session ID of this client
	 */
	sessionId?: string;

	/**
	 * The status of the connection of this client
	 */
	status = ClientStatus.disconnected;

	/**
	 * The token used by this client
	 */
	token = process.env.DISCORD_CLIENT_TOKEN;

	/**
	 * The client user
	 */
	user?: APIUser;

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
		if (this.status === ClientStatus.disconnected) {
			this.ws = new WebSocket(`${await this.getGateway()}?v=9&encoding=json`);
			this.ws.on("open", () => {
				this._identify();
			});
			this.ws.on("message", (data: Buffer) => {
				const payload = JSON.parse(data.toString()) as GatewayReceivePayload;
				switch (payload.op) {
					case GatewayOpcodes.Dispatch:
						this._handleEvent(payload);
						break;

					case GatewayOpcodes.Heartbeat:
						if (this.heartbeatInfo.first) {
							this.heartbeatInfo.acknowledged = true;
							this.heartbeatInfo.first = false;
							this._heartbeat();
						} else if (!this.heartbeatInfo.acknowledged)
							throw new Error("Received heartbeat before acknowledgement");
						else if (this.heartbeatInfo.interval) this._heartbeat();
						else throw new Error("Received heartbeat before heartbeat");
						break;

					case GatewayOpcodes.Reconnect:
						this.ws!.close(5000, "Reconnecting");
						void this.connect();
						break;

					case GatewayOpcodes.InvalidSession:
						this.sessionId = undefined;
						if (this.status === ClientStatus.resuming)
							setTimeout(() => {
								this._identify();
							}, 5000);
						else this._resume();
						this.status = ClientStatus.resuming;
						break;

					case GatewayOpcodes.Hello:
						this.heartbeatInfo.intervalTime = payload.d.heartbeat_interval;
						this._heartbeat();
						break;

					case GatewayOpcodes.HeartbeatAck:
						this.heartbeatInfo.acknowledged = true;
						break;
					default:
						break;
				}
				this.status = ClientStatus.connected;
			});
		} else if (this.status === ClientStatus.connected)
			throw new Error("Already connected");
		else {
			this.ws = new WebSocket(`${await this.getGateway()}?v=9&encoding=json`);
			this.ws.on("open", () => {
				this._resume();
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
	 * Handle an event from the WebSocket
	 */
	private _handleEvent(payload: GatewayDispatchPayload) {
		switch (payload.t) {
			case GatewayDispatchEvents.Ready:
				this.user = new User(this, payload.d.user);
				for (const guild of payload.d.guilds)
					this.guilds.set(guild.id, new UnavailableGuild(this, guild));
				this.sessionId = payload.d.session_id;
				this.application = payload.d.application;
				this.emit("ready", this);
				break;

			case GatewayDispatchEvents.Resumed:
				this.emit("resumed");
				break;
			default:
				break;
		}
	}

	/**
	 * Create an interval for the heartbeat.
	 */
	private _heartbeat() {
		if (this.heartbeatInfo.interval) clearInterval(this.heartbeatInfo.interval);
		this.heartbeatInfo.interval = setInterval(() => {
			this._sendHeartbeat();
		}, this.heartbeatInfo.intervalTime);
	}

	/**
	 * Send an identify payload
	 */
	private _identify() {
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

		if (!this.ws) throw new Error("No websocket");
		this.ws.send(JSON.stringify({ op: GatewayOpcodes.Identify, d: payload }));
	}

	/**
	 * Send a resume payload
	 */
	private _resume() {
		if (this.token == null || this.sessionId == null)
			throw new Error("Cannot resume without a token and session ID");
		const resumePayload: GatewayResume = {
			op: GatewayOpcodes.Resume,
			d: {
				token: this.token,
				session_id: this.sessionId,
				seq: this.seq,
			},
		};
		if (this.ws) this.ws.send(JSON.stringify(resumePayload));
		else throw new Error("Cannot resume without a WebSocket");
	}

	/**
	 * Send a heartbeat to the gateway
	 */
	private _sendHeartbeat() {
		const heartbeat = {
			op: 1,
			d: this.seq ? this.seq : null,
		};
		this.ws?.send(JSON.stringify(heartbeat));
	}
}

export default Client;
