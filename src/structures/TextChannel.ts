import type { APITextChannel } from "..";
import type { Snowflake } from "discord-api-types/v9";
import type Client from "../Client";
import GuildChannel from "./GuildChannel";

/**
 * A guild's text channel
 */
export class TextChannel extends GuildChannel {
	/**
	 * The ID of the last message sent in this channel
	 */
	lastMessageId: Snowflake | null;

	/**
	 * When the last pinned message was pinned
	 */
	lastPinTimestamp: Date | null;

	/**
	 * Amount of seconds a user has to wait before sending another message
	 */
	rateLimitPerUser: number;

	/**
	 * The channel topic
	 */
	topic?: string | null;

	/**
	 * @param client - The client that instantiated this class
	 * @param data - The payload of the channel
	 */
	constructor(client: Client, data: APITextChannel) {
		super(client, data);
		this.lastMessageId = data.last_message_id;
		if (data.last_pin_timestamp != null)
			this.lastPinTimestamp = new Date(data.last_pin_timestamp);
		else this.lastPinTimestamp = null;
		if (data.rate_limit_per_user != null)
			this.rateLimitPerUser = data.rate_limit_per_user;
		else this.rateLimitPerUser = 0;
		if (data.topic != null) this.topic = data.topic;
		else this.topic = null;
	}

	/**
	 * @param data - The payload of the channel
	 * @returns {TextChannel} - The updated class
	 */
	update(data: APITextChannel): this {
		if (data.last_message_id != null) this.lastMessageId = data.last_message_id;
		if (data.last_pin_timestamp != null)
			this.lastPinTimestamp = new Date(data.last_pin_timestamp);
		else this.lastPinTimestamp = null;
		if (data.rate_limit_per_user != null)
			this.rateLimitPerUser = data.rate_limit_per_user;
		else this.rateLimitPerUser = 0;
		if (data.topic != null) this.topic = data.topic;
		else this.topic = null;
		return this;
	}
}

export default TextChannel;
