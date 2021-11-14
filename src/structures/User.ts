import {
	APIUser,
	Snowflake,
	UserFlags,
	UserPremiumType,
} from "discord-api-types/v9";
import { Client } from "../Client";
import Base from "./Base";

/**
 * A Discord user
 */
export class User extends Base {
	/**
	 * Id of the user
	 */
	id: Snowflake;

	/**
	 * Username of the user
	 */
	username: string;

	/**
	 * 4-digit Discord tag of the user
	 */
	discriminator: string;

	/**
	 * Avatar hash of the user
	 */
	avatar: string | null;

	/**
	 * Whether the user belongs to an OAuth2 application
	 */
	bot?: boolean;

	/**
	 * Whether the user is an official Discord system user
	 */
	system?: boolean;

	/**
	 * Whether the user has two factor enabled on their account
	 */
	mfaEnabled?: boolean;

	/**
	 * Banner hash of the user
	 */
	banner?: string | null;

	/**
	 * The banner color encoded as an integer representation of hexadecimal color code
	 */
	accentColor?: number | null;

	/**
	 * The chosen language option of the user
	 */
	locale?: string;

	/**
	 * Whether the email of the user has been verified
	 */
	verified?: boolean;

	/**
	 * The email of the user
	 */
	email?: string | null;

	/**
	 * The flags on a user's account
	 */
	flags?: UserFlags;

	/**
	 * The type of Nitro subscription on a user's account
	 */
	premiumType?: UserPremiumType;

	/**
	 * The public flags on a user's account
	 */
	publicFlags?: UserFlags;

	/**
	 * @param {APIUser} payload - The payload for the user
	 * @param {Client} client - The client that instantiated this class
	 */
	constructor(payload: APIUser, client: Client) {
		super(client);
		this.id = payload.id;
		this.username = payload.username;
		this.discriminator = payload.discriminator;
		this.avatar = payload.avatar;
		this.bot = payload.bot;
		this.system = payload.system;
		this.mfaEnabled = payload.mfa_enabled;
		this.banner = payload.banner;
		this.accentColor = payload.accent_color;
		this.locale = payload.locale;
		this.verified = payload.verified;
		this.email = payload.email;
		this.flags = payload.flags;
		this.premiumType = payload.premium_type;
		this.publicFlags = payload.public_flags;
	}

	public update(data: APIUser): void {
		if (data.username) this.username = data.username;
		if (data.discriminator) this.discriminator = data.discriminator;
		if (data.avatar) this.avatar = data.avatar;
		if (data.bot) this.bot = data.bot;
		if (data.system) this.system = data.system;
		if (data.mfa_enabled) this.mfaEnabled = data.mfa_enabled;
		if (data.banner) this.banner = data.banner;
		if (data.accent_color) this.accentColor = data.accent_color;
		if (data.locale) this.locale = data.locale;
		if (data.verified) this.verified = data.verified;
		if (data.email) this.email = data.email;
		if (data.flags) this.flags = data.flags;
		if (data.premium_type) this.premiumType = data.premium_type;
		if (data.public_flags) this.publicFlags = data.public_flags;
	}
}

export default User;
