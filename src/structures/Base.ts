import { Client } from "../Client";

/**
 * The base class for all structures
 */
export class Base {
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
}

export default Base;
