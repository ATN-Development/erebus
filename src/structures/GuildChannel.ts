import type { APIGuildChannel, Overwrite } from "..";
import type Client from "../Client";
import Channel from "./Channel";

export class GuildChannel extends Channel {
	/**
	 * The client that instantiated this class
	 */
	client: Client;

  /**
   * The ID of the guild
   */
	guildId: string;

  /**
   * The position of the channel
   */
  position: number;

  /**
   * Explicit permission overwrites for members and roles
   */
  permissionOverwrites: Overwrite[];

  /**
   *
   * @param client - The client that instantiated this class
   * @param payload - The payload of the channel
   */
	constructor(client: Client, payload: APIGuildChannel) {
		super(client, payload);
		this.client = client;
    this.guildId = payload.guild_id;
    this.position = payload.position;
    this.permissionOverwrites = payload.permission_overwrites;
	}
}
