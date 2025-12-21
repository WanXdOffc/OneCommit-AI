import { createEmbed } from './client.js';

/**
 * Handle ping command
 */
export async function handlePing(interaction) {
  const uptime = Math.floor(interaction.client.uptime / 1000);
  const ping = interaction.client.ws.ping;

  const embed = createEmbed({
    title: '🏓 Pong!',
    color: '#10b981',
    fields: [
      { name: 'Latency', value: `${ping}ms`, inline: true },
      { name: 'Uptime', value: `${uptime}s`, inline: true }
    ]
  });

  await interaction.reply({ embeds: [embed] });
}

/**
 * Handle help command
 */
export async function handleHelp(interaction) {
  const embed = createEmbed({
    title: '📚 OneCommit AI - Commands',
    description: 'Here are all available commands:',
    color: '#0ea5e9',
    fields: [
      {
        name: '📊 General',
        value: '`/ping` - Check bot status\n`/help` - Show this help\n`/stats` - Platform statistics\n`/events` - List all events'
      },
      {
        name: '🎯 Event',
        value: '`/event [id]` - Event details\n`/leaderboard <event>` - Show rankings\n`/commit <sha>` - Commit details'
      },
      {
        name: '👤 User',
        value: '`/link <email>` - Link Discord account\n`/mystats` - Your statistics'
      },
      {
        name: '⚙️ Admin',
        value: '`/createevent` - Create event\n`/startevent` - Start event\n`/finishevent` - Finish event'
      }
    ],
    footer: 'OneCommit AI - Powered by Next.js & Discord.js'
  });

  await interaction.reply({ embeds: [embed] });
}

/**
 * Handle event command
 */
export async function handleEvent(interaction, eventId) {
  try {
    await interaction.deferReply();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    if (!eventId) {
      // Show active events
      const response = await fetch(`${baseUrl}/api/event/list?status=running&limit=5`);
      const data = await response.json();

      if (!data.success || data.events.length === 0) {
        await interaction.editReply('No active events found.');
        return;
      }

      const eventsList = data.events.map(e => 
        `**${e.name}**\n- ID: \`${e._id}\`\n- Participants: ${e.currentParticipants}/${e.maxParticipants}\n- Status: ${e.status}`
      ).join('\n\n');

      const embed = createEmbed({
        title: '🎪 Active Events',
        description: eventsList,
        color: '#0ea5e9'
      });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Show specific event
    const response = await fetch(`${baseUrl}/api/event/${eventId}`);
    const data = await response.json();

    if (!data.success) {
      await interaction.editReply('Event not found.');
      return;
    }

    const event = data.event;
    const embed = createEmbed({
      title: `🎪 ${event.name}`,
      description: event.description || 'No description',
      color: event.status === 'running' ? '#10b981' : event.status === 'finished' ? '#ef4444' : '#f59e0b',
      fields: [
        { name: 'Status', value: event.status.toUpperCase(), inline: true },
        { name: 'Participants', value: `${event.currentParticipants}/${event.maxParticipants}`, inline: true },
        { name: 'Duration', value: `${event.duration}h`, inline: true },
        { name: 'Total Commits', value: event.totalCommits.toString(), inline: true },
        { name: 'Start Time', value: event.startTime ? new Date(event.startTime).toLocaleString() : 'Not started', inline: false }
      ],
      footer: `Event ID: ${event._id}`
    });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error handling event command:', error);
    await interaction.editReply('Failed to fetch event details.');
  }
}

/**
 * Handle leaderboard command
 */
export async function handleLeaderboard(interaction, eventId, limit = 10) {
  try {
    await interaction.deferReply();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/event/leaderboard?eventId=${eventId}&limit=${limit}`);
    const data = await response.json();

    if (!data.success || data.leaderboard.length === 0) {
      await interaction.editReply('No leaderboard data available.');
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const leaderboardText = data.leaderboard.map((entry, index) => {
      const medal = index < 3 ? medals[index] : `${index + 1}.`;
      return `${medal} **${entry.user.name}** - ${entry.stats.totalScore} pts (${entry.stats.totalCommits} commits)`;
    }).join('\n');

    const embed = createEmbed({
      title: '🏆 Leaderboard',
      description: leaderboardText,
      color: '#f59e0b',
      footer: `Total participants: ${data.leaderboard.length}`
    });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error handling leaderboard command:', error);
    await interaction.editReply('Failed to fetch leaderboard.');
  }
}

/**
 * Handle stats command
 */
export async function handleStats(interaction) {
  try {
    await interaction.deferReply();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/stats`);
    const data = await response.json();

    if (!data.success) {
      await interaction.editReply('Failed to fetch statistics.');
      return;
    }

    const stats = data.stats;
    const embed = createEmbed({
      title: '📊 Platform Statistics',
      color: '#0ea5e9',
      fields: [
        { name: 'Total Users', value: stats.users.toString(), inline: true },
        { name: 'Total Events', value: stats.events.total.toString(), inline: true },
        { name: 'Total Commits', value: stats.commits.total.toString(), inline: true },
        { name: 'Running Events', value: stats.events.running.toString(), inline: true },
        { name: 'Waiting Events', value: stats.events.waiting.toString(), inline: true },
        { name: 'Finished Events', value: stats.events.finished.toString(), inline: true },
        { name: 'Valid Commits', value: stats.commits.valid.toString(), inline: true },
        { name: 'Spam Detected', value: stats.commits.spam.toString(), inline: true },
        { name: 'Pending Analysis', value: stats.commits.unprocessed.toString(), inline: true }
      ]
    });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error handling stats command:', error);
    await interaction.editReply('Failed to fetch statistics.');
  }
}

/**
 * Handle events list command
 */
export async function handleEventsList(interaction, status) {
  try {
    await interaction.deferReply();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = status 
      ? `${baseUrl}/api/event/list?status=${status}&limit=10`
      : `${baseUrl}/api/event/list?limit=10`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.success || data.events.length === 0) {
      await interaction.editReply('No events found.');
      return;
    }

    const eventsList = data.events.map(e => {
      const statusEmoji = e.status === 'running' ? '🟢' : e.status === 'finished' ? '🔴' : '🟡';
      return `${statusEmoji} **${e.name}**\n` +
             `   ID: \`${e._id}\`\n` +
             `   Participants: ${e.currentParticipants}/${e.maxParticipants}\n` +
             `   Duration: ${e.duration}h`;
    }).join('\n\n');

    const embed = createEmbed({
      title: status ? `🎪 ${status.toUpperCase()} Events` : '🎪 All Events',
      description: eventsList,
      color: '#0ea5e9',
      footer: `Total: ${data.events.length} events`
    });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error handling events list:', error);
    await interaction.editReply('Failed to fetch events.');
  }
}