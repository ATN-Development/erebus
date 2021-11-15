import type { APITeam, Snowflake } from "discord-api-types/v9";
import type Client from "../Client";
import Base from "./Base";
import TeamMember from "./TeamMember";

/**
 * A discord team
 */
export class Team extends Base<APITeam> {
	/**
	 * The team icon hash
	 */
	icon?: string;

	/**
	 * The team id
	 */
	id: Snowflake;

	/**
	 * The team members
	 * TODO: Create a TeamMember class
	 */
	members: Map<Snowflake, TeamMember>;

	/**
	 * The name of the team
	 */
	name: string;

	/**
	 * The owner's id of the team
	 */
	ownerId: string;

	/**
	 * @param client - The client that instantiated the team
	 * @param data - The data for the team
	 */
	constructor(client: Client, data: APITeam) {
		super(client);

		this.id = data.id;
		this.members = new Map(
			data.members.map((m) => [m.user.id, new TeamMember(this.client, m, this)])
		);
		this.name = data.name;
		this.ownerId = data.owner_user_id;

		if (data.icon != null) this.icon = data.icon;
	}

	update(data: Partial<APITeam>): this {
		super.update(data);

		if (data.icon != null) this.icon = data.icon;
		if (data.id != null) this.id = data.id;
		if (data.members != null)
			this.members = new Map(
				data.members.map((m) => [
					m.user.id,
					new TeamMember(this.client, m, this),
				])
			);
		if (data.name != null) this.name = data.name;
		if (data.owner_user_id != null) this.ownerId = data.owner_user_id;

		return this;
	}
}

export default Team;
