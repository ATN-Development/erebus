import type { APIVoiceChannel } from "..";
import type { VideoQualityMode } from "discord-api-types/v9";
import type Client from "../Client";
import GuildChannel from "./GuildChannel";

/**
 * A guild's voice channel
 */
export class VoiceChannel extends GuildChannel {
	/**
	 * The bitrate of the voice channel
	 */
	bitrate: number;

	/**
	 * Voice region id for the voice or stage channel, automatic when set to `null`
	 */
	rtcRegion: string | null;

	/**
	 * The user limit of the voice channel
	 */
	userLimit: number;

	/**
	 * The camera video quality mode of the voice channel, `1` when not present
	 */
	videoQualityMode: VideoQualityMode;

	/**
	 *
	 * @param client - The client that instantiated the class
	 * @param data - The data of the channel
	 */
	constructor(client: Client, data: APIVoiceChannel) {
		super(client, data);
		this.bitrate = data.bitrate;
		this.rtcRegion = data.rtc_region;
		this.userLimit = data.user_limit;
		this.videoQualityMode = data.video_quality_mode;
	}

	/**
	 * @param data - The payload of the channel
	 * @returns {VoiceChannel} - The updated class
	 */
	update(data: APIVoiceChannel): this {
		if (data.bitrate) this.bitrate = data.bitrate;
		if (data.rtc_region != null) this.rtcRegion = data.rtc_region;
		if (data.user_limit) this.userLimit = data.user_limit;
		this.videoQualityMode = data.video_quality_mode;
		return this;
	}
}

export default VoiceChannel;
