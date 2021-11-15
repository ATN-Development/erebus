import { config } from "dotenv";
import { Client } from ".";

config();
const client = new Client({
	intents: 7,
	token: process.env.DISCORD_CLIENT_TOKEN as any,
});

client.on("ready", console.log);

void client.connect();
