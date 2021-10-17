import petitio from "petitio";
import { Client } from "../Client";
export declare class Rest {
    _client: Client;
    constructor(client: Client);
    request(url: string, method: petitio.HTTPMethod, authorization: boolean): Promise<any>;
}
