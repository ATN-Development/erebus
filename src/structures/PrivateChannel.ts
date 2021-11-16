import type Client from "../Client";
import type { APIChannel, Snowflake } from "discord-api-types/v9";
import Channel from "./Channel";
import User from "./User";

/**
 * A private channel
 */
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

	constructor(client: Client, payload: APIChannel) {
		super(client, payload);
		this.client = client;
		this.lastMessageId = payload.last_message_id;
		this.recipients = payload.recipients?.map(
			(recipient) => new User(client, recipient)
		);
	}

	/**
	 * @param data - The payload of the channel
	 * @returns {PrivateChannel} - The updated class
	 */
	update(data: APIChannel): this {
		if (data.last_message_id != null) this.lastMessageId = data.last_message_id;
		if (data.recipients)
			this.recipients = data.recipients.map(
				(recipient) => new User(this.client, recipient)
			);
		return this;
	}
}

export default PrivateChannel;
