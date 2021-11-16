import GuildChannel from "./GuildChannel";
import type Client from "../Client";
import type { APIThreadChannel } from "..";
import type {
	APIThreadMember,
	APIThreadMetadata,
	Snowflake,
} from "discord-api-types/v9";

/**
 * A guild's thread channel
 */
export class ThreadChannel extends GuildChannel {
	/**
	 * The ID of the last message sent in the channel (may not point to an existing or valid message)
	 */
	lastMessageId: Snowflake | null;

	/**
	 * The client user's member for the thread, only included in select endpoints
	 */
	member?: APIThreadMember;

	/**
	 * An approximate count of users in a thread, stops counting at 50
	 */
	memberCount: number;

	/**
	 * An approximate count of messages in a thread, stops counting at 50
	 */
	messageCount: number;

	/**
	 * ID of the creator of the thread
	 */
	ownerId: Snowflake;

	/**
	 * Amount of seconds a user has to wait before sending another message
	 */
	rateLimitPerUser: number;

	/**
	 * Thread-specific fields not needed by other channels
	 */
	threadMetadata: APIThreadMetadata;

	/**
	 *
	 * @param client - The client that instantiated the class
	 * @param data - The payload of the channel
	 */
	constructor(client: Client, data: APIThreadChannel) {
		super(client, data);
		this.client = client;
		if (data.last_message_id != null) this.lastMessageId = data.last_message_id;
		else this.lastMessageId = null;
		if (data.member != null) this.member = data.member;
		this.memberCount = data.member_count;
		this.messageCount = data.message_count;
		this.ownerId = data.owner_id;
		if (data.rate_limit_per_user != null)
			this.rateLimitPerUser = data.rate_limit_per_user;
		else this.rateLimitPerUser = 0;
		this.threadMetadata = data.thread_metadata;
	}

	/**
	 *
	 * @param data - The payload of the channel
	 * @returns {ThreadChannel} - The updated class
	 */
	update(data: APIThreadChannel): this {
		if (data.last_message_id != null) this.lastMessageId = data.last_message_id;
		else this.lastMessageId = null;
		if (data.member != null) this.member = data.member;
		if (data.member_count) this.memberCount = data.member_count;
		if (data.message_count) this.messageCount = data.message_count;
		if (data.owner_id) this.ownerId = data.owner_id;
		if (data.rate_limit_per_user != null)
			this.rateLimitPerUser = data.rate_limit_per_user;
		else this.rateLimitPerUser = 0;
		this.threadMetadata = data.thread_metadata;

		return this;
	}
}

export default ThreadChannel;
