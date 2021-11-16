import type { APITextChannel } from "..";
import TextChannel from "./TextChannel";

export class NewsChannel extends TextChannel {
	/**
	 *
	 * @param data - The payload of the channel
	 * @returns {NewsChannel} - The updated class
	 */
	update(data: APITextChannel): this {
		return super.update(data);
	}
}

export default NewsChannel;
