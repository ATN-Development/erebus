import EventEmitter from "events";
import WebSocket from "ws";
import { Rest } from "./rest/Rest";
import { Routes } from "discord-api-types/v9";

export interface ClientOptions {
	token: string;
	largeThreshold?: number;
	intents: Intents;
}

export interface HeartbeatInfo {
	first: boolean;
	acknowledged: boolean;
}

export enum Intents {
	guilds = 1,
	guildMembers = 2,
	guildBans = 4,
	guildEmojis = 8,
	guildIntegrations = 16,
	guildWebhooks = 32,
	guildInvites = 64,
	guildVoiceStates = 128,
	guildPresences = 256,
	guildMessages = 512,
	guildMessageReactions = 1024,
	guildMessageTyping = 2048,
	directMessages = 4096,
	directMessageReactions = 8192,
	directMessageTyping = 16384,
}

export class Client extends EventEmitter {
	ws?: WebSocket;
	token: string;
	largeThreshold: number;
	heartbeatInfo: HeartbeatInfo;
	rest: Rest;
	intents: Intents;
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

	async connect(): Promise<any> {
		let url = await this.getGateway();

		if (!url.endsWith("/")) {
			url = url + "/";
		}

		this.ws = new WebSocket(`${url}?v=9&encoding=json`);

		this.ws.on("open", () => {});
	}

	async getGateway(): Promise<string> {
		const response = await this.rest.request<any>(Routes.gateway(), "GET");
		return response.url;
	}

	// private async identify(): Promise<any> {
	// 	const payload = {
	// 		token: this.token,
	// 		properties: {
	// 			$os: process.platform,
	// 			$browser: "erebus",
	// 			$device: "erebus",
	// 		},
	// 		large_threshold: this.largeThreshold,
	// 		intents: this.intents,
	// 	};
	// }
}
