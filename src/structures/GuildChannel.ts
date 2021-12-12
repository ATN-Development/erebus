import type { Snowflake } from "discord-api-types/v9";
import type { APIGuildChannel, Overwrite } from "..";
import type Client from "../Client";
import Channel from "./Channel";

/**
 * A guild channel
 */
export class GuildChannel extends Channel {
	/**
	 * The ID of the guild
	 */
	guildId: Snowflake;

	/**
	 * The position of the channel
	 */
	position: number;

	/**
	 * Explicit permission overwrites for members and roles
	 */
	permissionOverwrites: Overwrite[];

	/**
	 * @param client - The client that instantiated this class
	 * @param data - The payload of the channel
	 */
	constructor(client: Client, data: APIGuildChannel) {
		super(client, data);
		this.client = client;
		this.guildId = data.guild_id;
		this.position = data.position;
		this.permissionOverwrites = data.permission_overwrites;
	}

	update(data: APIGuildChannel): this {
		if (data.guild_id) this.guildId = data.guild_id;
		if (data.position) this.position = data.position;
		this.permissionOverwrites = data.permission_overwrites;
		return this;
	}
}

export default GuildChannel;
