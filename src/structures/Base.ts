import type { Client } from "../Client";

/**
 * The base class for all structures
 */
export class Base<T> {
	/**
	 * The client that instantiated this structure
	 */
	client: Client;

	/**
	 * @param client - The client that instantiated this structure
	 */
	constructor(client: Client) {
		this.client = client;
	}

	/**
	 * Updates this structure with new data.
	 */
	update(_data: Partial<T>): this {
		return this;
	}
}

export default Base;
