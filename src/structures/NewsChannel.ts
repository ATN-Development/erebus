import type { APITextChannel } from "..";
import TextChannel from "./TextChannel";

export class NewsChannel extends TextChannel {
	update(data: APITextChannel): this {
		return super.update(data);
	}
}
