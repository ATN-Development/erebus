export default {
  endpoints: {
    baseURL: "https://discord.com/api/",
  },
  gatewayVersion: "v9",
  intents: {
    guilds: 1 << 0,
    guildMembers: 1 << 1,
    guildBans: 1 << 2,
    guildEmojisAndStickers: 1 << 3,
    guildIntegrations: 1 << 4,
    guildWebhooks: 1 << 5,
    guildInvites: 1 << 6,
    guildVoiceStates: 1 << 7,
    guildPresences: 1 << 8,
    guildMessages: 1 << 9,
    guildMessageReactions: 1 << 10,
    guildMessageTyping: 1 << 11,
    directMessages: 1 << 12,
    directMessageReactions: 1 << 13,
    directMessageTyping: 1 << 14,
  },
};
