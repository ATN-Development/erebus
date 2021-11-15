import type {
	APIApplication,
	ApplicationFlags,
	Snowflake,
} from "discord-api-types/v9";
import User from "./User";
import type { Client, PartialStructure } from "..";
import Base from "./Base";
import Team from "./Team";

/**
 * An application
 */
export class Application extends Base<
	APIApplication | Pick<APIApplication, "flags" | "id">
> {
	/**
	 * The flags of the application
	 */
	flags: ApplicationFlags;

	/**
	 * The id of the application
	 */
	id: string;

	/**
	 * The name of the application
	 */
	name?: string;

	/**
	 * The icon of the application
	 */
	icon?: string | null;

	/**
	 * The description of the application
	 */
	description?: string;

	/**
	 * If the application is public
	 */
	public?: boolean;

	/**
	 * If the application requires full oauth2 code grant flow
	 */
	requireCodeGrant?: boolean;

	/**
	 * The url of the application's terms of service
	 */
	termsOfServiceURL?: string;

	/**
	 * The url of the application's privacy policy
	 */
	privacyPolicyURL?: string;

	/**
	 * The owner of the application
	 */
	owner?: User;

	/**
	 * The summary field for the store page
	 * * Only available for games
	 */
	summary?: string;

	/**
	 * The key for verification in interactions and the GameSDK's GetTicket function
	 * * Only available for games
	 */
	verifyKey?: string;

	/**
	 * The team of the application
	 * TODO: Create a team class
	 */
	team?: Team;

	/**
	 * The guild to which the application has been linked
	 * * Only available for games
	 */
	guildId?: Snowflake;

	/**
	 * The "Game SKU" id of the application
	 * * Only available for games
	 */
	skuId?: Snowflake;

	/**
	 * The URL slug that links to the store page
	 * * Only available for games
	 */
	slug?: string;

	/**
	 * The hash of the application's cover image
	 * * Only available for games
	 */
	cover?: string;

	/**
	 * @param client - The client that instantiated the application
	 * @param data - The data for the application
	 */
	constructor(
		client: Client,
		data: APIApplication | Pick<APIApplication, "flags" | "id">
	) {
		super(client);

		this.flags = data.flags;
		this.id = data.id;

		if ("name" in data) this.name = data.name;
		if ("icon" in data && data.icon != null) this.icon = data.icon;
		if ("description" in data) this.description = data.description;
		if ("bot_public" in data) this.public = data.bot_public;
		if ("bot_require_code_grant" in data)
			this.requireCodeGrant = data.bot_require_code_grant;
		if ("terms_of_service_url" in data && data.terms_of_service_url != null)
			this.termsOfServiceURL = data.terms_of_service_url;
		if ("privacy_policy_url" in data && data.privacy_policy_url != null)
			this.privacyPolicyURL = data.privacy_policy_url;
		if ("owner" in data && data.owner != null)
			this.owner = new User(this.client, data.owner);
		if ("summary" in data) this.summary = data.summary;
		if ("verify_key" in data) this.verifyKey = data.verify_key;
		if ("team" in data && data.team != null)
			this.team = new Team(this.client, data.team);
		if ("guild_id" in data && data.guild_id != null)
			this.guildId = data.guild_id;
		if ("primary_sku_id" in data && data.primary_sku_id != null)
			this.skuId = data.primary_sku_id;
		if ("slug" in data && data.slug != null) this.slug = data.slug;
		if ("cover_image" in data && data.cover_image != null)
			this.cover = data.cover_image;
	}

	update(data: Partial<APIApplication | Pick<APIApplication, "flags" | "id">>) {
		super.update(data);

		if (data.flags != null) this.flags = data.flags;
		if (data.id != null) this.id = data.id;

		if ("name" in data) this.name = data.name;
		if ("icon" in data && data.icon != null) this.icon = data.icon;
		if ("description" in data) this.description = data.description;
		if ("bot_public" in data) this.public = data.bot_public;
		if ("bot_require_code_grant" in data)
			this.requireCodeGrant = data.bot_require_code_grant;
		if ("terms_of_service_url" in data && data.terms_of_service_url != null)
			this.termsOfServiceURL = data.terms_of_service_url;
		if ("privacy_policy_url" in data && data.privacy_policy_url != null)
			this.privacyPolicyURL = data.privacy_policy_url;
		if ("owner" in data && data.owner != null)
			this.owner = new User(this.client, data.owner);
		if ("summary" in data) this.summary = data.summary;
		if ("verify_key" in data) this.verifyKey = data.verify_key;
		if ("team" in data && data.team != null)
			this.team = new Team(this.client, data.team);
		if ("guild_id" in data && data.guild_id != null)
			this.guildId = data.guild_id;
		if ("primary_sku_id" in data && data.primary_sku_id != null)
			this.skuId = data.primary_sku_id;
		if ("slug" in data && data.slug != null) this.slug = data.slug;
		if ("cover_image" in data && data.cover_image != null)
			this.cover = data.cover_image;

		return this;
	}

	/**
	 * Checks if the application is a game.
	 */
	isGame(): this is Required<Pick<this, "summary">> {
		return this.summary != null;
	}

	/**
	 * Checks if this application is partial.
	 */
	isPartial(): this is PartialStructure<this, "flags" | "id"> {
		return this.name == null;
	}
}
