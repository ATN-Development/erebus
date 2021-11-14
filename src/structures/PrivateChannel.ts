import type Client from "../Client";
import type {
	APIChannel,
	Snowflake,
} from "../../node_modules/discord-api-types/v9";
import { Channel } from "./Channel";
import User from "./User";

export class PrivateChannel extends Channel {
	/**
	 * The client that instantiated this class
	 */
	client: Client;

	/**
	 * The ID of the last message sent in the channel
	 */
	lastMessageId: Snowflake | null | undefined;

	/**
	 * The recipients of the channel
	 */
	recipients?: User[];

	constructor(payload: APIChannel, client: Client) {
		super(payload, client);
		this.client = client;
		this.lastMessageId = payload.last_message_id;
		this.recipients = payload.recipients?.map(
			(recipient) => new User(recipient, client)
		);
	}
}
