import VoiceChannel from "./VoiceChannel";
import type Client from "../Client";
import type { APIStageChannel } from "..";

/**
 * A guild's stage channel
 */
export class StageChannel extends VoiceChannel {
	/**
	 * The channel topic
	 */
	topic?: string;

	/**
	 *
	 * @param client - The client that instantiated the class
	 * @param data - The payload of the channel
	 */
	constructor(client: Client, data: APIStageChannel) {
		super(client, data);
		this.topic = data.topic ?? undefined;
	}

	/**
	 * @param data - The data of the channel
	 * @returns {StageChannel} - The updated class
	 */
	update(data: APIStageChannel): this {
		if (data.topic != null) this.topic = data.topic;
		super.update(data);
		return this;
	}
}

export default StageChannel;
