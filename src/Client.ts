import type {
	APIGatewayBotInfo,
	APIUser,
	GatewayDispatchPayload,
	GatewayHeartbeat,
	GatewayIdentify,
	GatewayPresenceUpdateData,
	GatewayReceivePayload,
	GatewayResume,
	Snowflake,
} from "discord-api-types/v9";
import {
	GatewayDispatchEvents,
	GatewayOpcodes,
	GatewayVersion,
	Routes,
} from "discord-api-types/v9";
import EventEmitter from "events";
import WebSocket from "ws";
import type {
	AdvancedHeartbeatInfo,
	ClientEvents,
	ClientOptions,
	Intents,
} from ".";
import Rest from "./rest";
import { Application, UnavailableGuild, User } from "./structures";
import { ClientStatus } from "./types";
import { setPromiseTimeout } from "./Util";

export interface Client extends EventEmitter {
	on<T extends keyof ClientEvents>(
		event: T,
		listener: (...args: ClientEvents[T]) => void
	): this;
	once<T extends keyof ClientEvents>(
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
	application?: Application;

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
	seq: number | null = null;

	/**
	 * The session ID of this client
	 */
	sessionId?: string;

	/**
	 * The status of the connection of this client
	 */
	status = ClientStatus.Disconnected;

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
		if (token != null) this.token = token;
		this.userAgent = userAgent;
	}

	/**
	 * Connect this client to the websocket.
	 */
	async connect(): Promise<void> {
		if (this.status === ClientStatus.Disconnected) {
			this.status = ClientStatus.Connecting;
			this.ws = new WebSocket(await this.getGatewayUrl());
			this.ws.on("message", (data: Buffer) => {
				const payload = JSON.parse(data.toString()) as GatewayReceivePayload;

				switch (payload.op) {
					case GatewayOpcodes.Dispatch:
						this._handleEvent(payload);
						break;
					case GatewayOpcodes.Heartbeat:
						this._sendHeartbeat();
						break;
					case GatewayOpcodes.Reconnect:
						this.ws!.close(5000, "Reconnecting");
						void this.connect();
						break;
					case GatewayOpcodes.InvalidSession:
						if (payload.d) this._resume();
						if (this.status === ClientStatus.Resuming)
							setTimeout(() => {
								this._identify();
							}, 1_000);
						break;
					case GatewayOpcodes.Hello:
						this.heartbeatInfo.intervalTime = payload.d.heartbeat_interval;
						this._sendHeartbeat();
						this._heartbeat();
						break;
					case GatewayOpcodes.HeartbeatAck:
						this.heartbeatInfo.acknowledged = true;
						if (this.heartbeatInfo.first) {
							this._identify();
							this.heartbeatInfo.first = false;
						}
						break;
					default:
						console.log(`Unknown opcode: ${(payload as { op: number }).op}`);
						break;
				}
			});
		} else if (this.status === ClientStatus.Connected)
			throw new Error("Already connected");
		else {
			this.ws = new WebSocket(await this.getGatewayUrl());
			this.ws.on("open", () => {
				this._resume();
			});
		}
	}

	/**
	 * Get the gateway url.
	 * @returns The gateway url
	 */
	async getGatewayUrl(): Promise<string> {
		const info = await this.rest.request<APIGatewayBotInfo>(
			Routes.gatewayBot(),
			"GET"
		);
		if (info.session_start_limit.remaining <= 0)
			await setPromiseTimeout(info.session_start_limit.reset_after);
		return `${info.url}/?v=${GatewayVersion}&encoding=json`;
	}

	/**
	 * Handle an event from the WebSocket
	 */
	private _handleEvent(payload: GatewayDispatchPayload) {
		switch (payload.t) {
			case GatewayDispatchEvents.Ready:
				this.status = ClientStatus.Connected;
				this.user = new User(this, payload.d.user);
				for (const guild of payload.d.guilds)
					this.guilds.set(guild.id, new UnavailableGuild(this, guild));
				this.sessionId = payload.d.session_id;
				this.application = new Application(this, payload.d.application);
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
			if (!this.heartbeatInfo.acknowledged) {
				this.ws?.close(1002, "Heartbeat not acknowledged");
				if (this.heartbeatInfo.interval)
					clearInterval(this.heartbeatInfo.interval);
				this.status = ClientStatus.Reconnecting;
				return this.connect();
			}
			this._sendHeartbeat();
			return undefined;
		}, this.heartbeatInfo.intervalTime);
	}

	/**
	 * Send an identify payload
	 */
	private _identify(presence?: GatewayPresenceUpdateData) {
		if (this.token == null) throw new Error("Cannot identify without a token");
		const payload: GatewayIdentify = {
			op: GatewayOpcodes.Identify,
			d: {
				presence,
				token: this.token,
				properties: {
					$os: process.platform,
					$browser: "erebus",
					$device: "erebus",
				},
				large_threshold: this.largeThreshold,
				intents: this.intents,
			},
		};

		if (!this.ws) throw new Error("No websocket available");
		this.ws.send(JSON.stringify(payload));
	}

	/**
	 * Send a resume payload
	 */
	private _resume() {
		if (this.token == null || this.sessionId == null || this.seq == null)
			throw new Error(
				"Cannot resume without a token, session ID and sequence number"
			);
		const resumePayload: GatewayResume = {
			op: GatewayOpcodes.Resume,
			d: {
				token: this.token,
				session_id: this.sessionId,
				seq: this.seq,
			},
		};
		this.status = ClientStatus.Resuming;
		if (this.ws) this.ws.send(JSON.stringify(resumePayload));
		else throw new Error("Cannot resume without a WebSocket");
	}

	/**
	 * Send a heartbeat to the gateway
	 */
	private _sendHeartbeat() {
		const heartbeat: GatewayHeartbeat = {
			op: GatewayOpcodes.Heartbeat,
			d: this.seq,
		};
		this.heartbeatInfo.acknowledged = false;
		if (this.ws) this.ws.send(JSON.stringify(heartbeat));
		else throw new Error("Cannot send heartbeat without a WebSocket");
	}
}

export default Client;
