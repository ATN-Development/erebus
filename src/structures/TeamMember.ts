import type {
	APITeamMember,
	TeamMemberMembershipState,
} from "discord-api-types/v9";
import type Client from "../Client";
import Base from "./Base";
import type Team from "./Team";
import User from "./User";

/**
 * A team member
 */
export class TeamMember extends Base<APITeamMember> {
	/**
	 * The team this member is in
	 */
	team?: Team;

	/**
	 * The membership state of the member
	 */
	state: TeamMemberMembershipState;

	/**
	 * The id of the team this member is in
	 */
	teamId: string;

	/**
	 * The user this member is for
	 */
	user: User;

	/**
	 * @param client - The client that instantiated this member
	 * @param data - The data for the member
	 * @param team - The team this member is in
	 */
	constructor(client: Client, data: APITeamMember, team?: Team) {
		super(client);

		if (team) this.team = team;

		this.state = data.membership_state;
		this.teamId = data.team_id;
		this.user = new User(this.client, data.user);
	}
}

export default TeamMember;
