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

	/**
	 *
	 * @param data - The payload of the channel
	 * @returns {Channel} - The updated class
	 */
	update(data: APIChannel): this {
		if (data.id) this.id = data.id;
		if (data.type) this.type = data.type;
		return this;
	}
}

export default Channel;
