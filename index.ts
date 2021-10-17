// import petitio from "petitio";
// import WebSocket from "ws";
// import EventEmitter from "events";

// export interface GetGatewayResponse {
//   url: string;
// }

// export interface ClientOptions {
//   token: string;
//   largeThreshold?: number;
// }

// class Client extends EventEmitter {
//   ws?: WebSocket;
//   token: string;
//   largeThreshold: number;
//   isHeartbeatAcknowledged: boolean
//   constructor(options: ClientOptions) {
//     super();
//     this.ws = undefined;
//     this.token = options.token.startsWith("Bot ")
//       ? options.token
//       : `Bot ${options.token}`;
//     this.largeThreshold = options.largeThreshold ?? 50;
//     this.isHeartbeatAcknowledged = false
//   }

//   async getGateway(): Promise<string> {
//     const request: GetGatewayResponse = await petitio(
//       "https://discord.com/api/v9/gateway"
//     ).json();
//     return request.url;
//   }

//   async connect(): Promise<void> {
//     let url = await this.getGateway();

//     if (!url.endsWith("/")) {
//       url = url.concat("/");
//     }
//     this.ws = new WebSocket(`${url}?v=9&encoding=json`);

//     this.ws.on("open", () => {
//       const identifyPayload = {
//         token: this.token,
//         properties: {
//           $os: process.platform,
//           $browser: "erebus",
//           $device: "erebus",
//         },
//         large_threshold: this.largeThreshold,
//         intents: [],
//       };
//       this.ws?.send(JSON.stringify(identifyPayload));
//     });

//     this.ws.on("message", (data) => {
//       const receivedData = JSON.parse(data.toString());

//       switch (receivedData.op) {
//         case 1:
//           const immediateHeartbeat = {
//             op: 1,
//             d: receivedData.s ? receivedData.s : null,
//           };
//           setInterval(() => {
//             this.ws?.send(JSON.stringify(immediateHeartbeat));
//           }, receivedData.d.heartbeat_interval)
//           break;
//         case 10:
//           const heartbeat = {
//             op: 1,
//             d: receivedData.s ? receivedData.s : null,
//           };
//           setInterval(() => {
//             this.ws?.send(JSON.stringify(heartbeat));
//           }, receivedData.d.heartbeat_interval)
//           break;
//         case 11:
//           console.log("yes")
//       }
//     });
//   }
// }

// const client = new Client({
//   token: "Bot ODY2MzYyMTA2ODg2MjI1OTIw.YPRclg.LNZl6CaztiH0ttYNx8rBhpu_ZsY",
// });

// client.connect();


import { Client } from "./src/Client";

const client = new Client({
  token: "Bot ODY2MzYyMTA2ODg2MjI1OTIw.YPRclg.LNZl6CaztiH0ttYNx8rBhpu_ZsY",
})

