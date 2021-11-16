import Base from "./Base";
import type { APIUnavailableGuild } from "discord-api-types/v9";
import type { Client } from "../Client";

/**
 * An unavailable guild
 */
export class UnavailableGuild extends Base<APIUnavailableGuild> {
	/**
	 * The ID of the guild
	 */
	id: string;

	/**
	 * Whether the guild is unavailable or not
	 */
	unavailable: boolean;

	/**
	 *
	 * @param payload - The payload for the unavailable guild
	 * @param client - The client that instantiated this class
	 */
	constructor(client: Client, payload: APIUnavailableGuild) {
		super(client);

		this.id = payload.id;
		this.unavailable = payload.unavailable;
	}

	/**
	 * @param data - The payload of the guild
	 * @returns {UnavailableGuild} - The updated class
	 */
	update(data: APIUnavailableGuild): this {
		this.id = data.id;
		this.unavailable = data.unavailable;
		return this;
	}
}

export default UnavailableGuild;
