/// <reference types="node" />
import EventEmitter from "events";
import WebSocket from "ws";
export interface ClientOptions {
    token: string;
    largeThreshold?: number;
    intents: number | IntentsDefinition[];
}
export interface HeartbeatInfo {
    first: boolean;
    acknowledged: boolean;
}
export interface Intents {
    guilds: 1;
    guildMembers: 2;
    guildBans: 4;
    guildEmojis: 8;
    guildIntegrations: 16;
    guildWebhooks: 32;
    guildInvites: 64;
    guildVoiceStates: 128;
    guildPresences: 256;
    guildMessages: 512;
    guildMessageReactions: 1024;
    guildMessageTyping: 2048;
    directMessages: 4096;
    directMessageReactions: 8192;
    directMessageTyping: 16384;
}
export declare type IntentsDefinition = keyof Intents;
export declare class Client extends EventEmitter {
    ws?: WebSocket;
    token: string;
    largeThreshold: number;
    heartbeatInfo: HeartbeatInfo;
    private _rest;
    intents: number | IntentsDefinition[];
    constructor(options: ClientOptions);
    connect(): Promise<any>;
    getGateway(): Promise<string>;
    private identify;
}
