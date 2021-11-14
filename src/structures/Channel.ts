import type { ChannelType, APIChannel, Snowflake } from "discord-api-types/v9";
import type Client from "../Client";

/**
 * A Discord channel
 */
export class Channel {
  /**
   * The client that instantiated this class
   */
  client: Client
  /**
   * The ID of the channel
   */
  id: Snowflake

  /**
   * The type of the channel
   */
  type: ChannelType

   /**
    * @param payload - The payload of the channel
    */
   constructor(client: Client, payload: APIChannel) {
     this.id = payload.id;
     this.type = payload.type;
     this.client = client;
   }
}

export default Channel;