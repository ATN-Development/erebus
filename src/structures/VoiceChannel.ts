import type { APIVoiceChannel } from "..";
import type { VideoQualityMode } from "discord-api-types/v9";
import type Client from "../Client";
import GuildChannel from "./GuildChannel";

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

	constructor(client: Client, data: APIVoiceChannel) {
		super(client, data);
		this.bitrate = data.bitrate;
		this.rtcRegion = data.rtc_region;
		this.userLimit = data.user_limit;
		this.videoQualityMode = data.video_quality_mode;
	}
}

export default VoiceChannel;
