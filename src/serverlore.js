import { PermissionFlagsBits } from 'discord.js';

export async function searchServer(client, guild, query, { perChannel = 50, maxChannels = 40, maxHits = 20 } = {}) {
  const queryLower = query.toLowerCase();
  const matches = [];
  const channels = guild.channels.cache
    .filter(
      (c) =>
        c.type === 0 &&
        c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.ViewChannel)
    )
    .first(maxChannels);

  for (const channel of channels) {
    if (matches.length >= maxHits * 2) break;
    try {
      const messages = await channel.messages.fetch({ limit: perChannel });
      for (const msg of messages.values()) {
        if (msg.author.bot) continue;
        const content = msg.content;
        if (!content) continue;
        if (!content.toLowerCase().includes(queryLower)) continue;
        matches.push({
          channel: channel.name,
          author: msg.author.username,
          content: content.slice(0, 600),
          timestamp: msg.createdTimestamp,
        });
      }
    } catch {
      /* skip channels that error */
    }
  }

  matches.sort((a, b) => b.timestamp - a.timestamp);
  return matches.slice(0, maxHits);
}

export function memberProfile(member) {
  const roles = member.roles.cache
    .filter((r) => r.id !== member.guild.id)
    .map((r) => r.name);
  const status = member.presence?.status || 'offline';
  const activities = (member.presence?.activities || [])
    .filter((a) => a.type === 0 || a.type === 4)
    .map((a) => a.name);
  return {
    tag: member.user.tag,
    displayName: member.displayName,
    id: member.id,
    bot: member.user.bot,
    joinedGuild: member.joinedAt ? member.joinedAt.toISOString() : null,
    joinedDiscord: member.user.createdAt ? member.user.createdAt.toISOString() : null,
    status,
    activities,
    roles: roles.slice(0, 10),
    topRole: member.roles.highest?.name || 'none',
  };
}
