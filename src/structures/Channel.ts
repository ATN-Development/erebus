import type { ChannelType, APIChannel, Snowflake } from "discord-api-types/v9";
import { Base } from "./Base";
import type Client from "../Client";

/**
 * A Discord channel
 */
export class Channel extends Base<APIChannel> {
	/**
	 * The ID of the channel
	 */
	id: Snowflake;

	/**
	 * The type of the channel
	 */
	type: ChannelType;

	/**
	 * @param data - The payload of the channel
	 */
	constructor(client: Client, data: APIChannel) {
		super(client);

		this.id = data.id;
		this.type = data.type;
	}
}

export default Channel;
