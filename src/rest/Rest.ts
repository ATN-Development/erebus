// TODO: Remove petitio and this file when the rest is ready
import petitio from "petitio";
import { Client } from "../Client";
import Constants from "../Constants";

export class Rest {
	_client: Client;
	constructor(client: Client) {
		this._client = client;
	}

	async request(
		url: string,
		method: petitio.HTTPMethod,
		authorization: boolean
	): Promise<any> {
		let request = await petitio(
			`${Constants.endpoints.api}${Constants.gatewayVersion}/${url}`,
			method
		).header("Content-Type", "application/json");
		if (authorization) {
			request = request.header(
				"Authorization",
				this._client.token.startsWith("Bot ")
					? this._client.token
					: `Bot ${this._client.token}`
			);
		}

		let response = await request.send();

		if (
			response.headers["x-ratelimit-remaining"] &&
			parseInt(response.headers["x-ratelimit-remaining"]) < 1
		) {
			setTimeout(() => {
				this.request(url, method, authorization);
			}, response.headers["x-ratelimit-reset"] * 1000);
		}

		return response.body.toString();
	}
}
