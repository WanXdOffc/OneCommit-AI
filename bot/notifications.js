import { sendEmbed, isBotReady } from './client.js';

/**
 * Send commit notification
 */
export async function notifyNewCommit(channelId, commit, user, repo) {
  if (!isBotReady() || !channelId) return false;

  try {
    const embedOptions = {
      title: '📝 New Commit',
      color: commit.aiAnalysis.isSpam ? '#ef4444' : '#10b981',
      fields: [
        { name: 'Author', value: user.name, inline: true },
        { name: 'Repository', value: repo.repoName, inline: true },
        { name: 'Score', value: `${commit.score.total} points`, inline: true },
        { name: 'Message', value: commit.message.substring(0, 200), inline: false },
        { name: 'Changes', value: `+${commit.stats.additions} -${commit.stats.deletions}`, inline: true },
        { name: 'Files', value: commit.stats.filesChanged.toString(), inline: true }
      ],
      url: commit.url,
      footer: `SHA: ${commit.sha.substring(0, 7)}`
    };

    if (commit.aiAnalysis.processed) {
      embedOptions.fields.push({
        name: '🤖 AI Quality',
        value: `${commit.aiAnalysis.qualityScore}/100`,
        inline: true
      });
    }

    return await sendEmbed(channelId, embedOptions);
  } catch (error) {
    console.error('Error sending commit notification:', error);
    return false;
  }
}

/**
 * Send event start notification
 */
export async function notifyEventStart(channelId, event) {
  if (!isBotReady() || !channelId) return false;

  try {
    const embedOptions = {
      title: '🚀 Event Started!',
      description: `**${event.name}** has officially started!`,
      color: '#10b981',
      fields: [
        { name: 'Duration', value: `${event.duration} hours`, inline: true },
        { name: 'Participants', value: event.currentParticipants.toString(), inline: true },
        { name: 'End Time', value: new Date(event.endTime).toLocaleString(), inline: false }
      ],
      footer: `Event ID: ${event._id}`
    };

    return await sendEmbed(channelId, embedOptions);
  } catch (error) {
    console.error('Error sending event start notification:', error);
    return false;
  }
}

/**
 * Send event finish notification
 */
export async function notifyEventFinish(channelId, event, leaderboard) {
  if (!isBotReady() || !channelId) return false;

  try {
    const medals = ['🥇', '🥈', '🥉'];
    const topThree = leaderboard.slice(0, 3).map((entry, index) => 
      `${medals[index]} **${entry.user.name}** - ${entry.stats.totalScore} points`
    ).join('\n');

    const embedOptions = {
      title: '🏁 Event Finished!',
      description: `**${event.name}** has ended!\n\n**Top 3:**\n${topThree}`,
      color: '#f59e0b',
      fields: [
        { name: 'Total Commits', value: event.totalCommits.toString(), inline: true },
        { name: 'Participants', value: event.currentParticipants.toString(), inline: true }
      ],
      footer: `Event ID: ${event._id}`
    };

    return await sendEmbed(channelId, embedOptions);
  } catch (error) {
    console.error('Error sending event finish notification:', error);
    return false;
  }
}

/**
 * Send achievement notification
 */
export async function notifyAchievement(channelId, user, achievement) {
  if (!isBotReady() || !channelId) return false;

  try {
    const achievementNames = {
      first_commit: '🎯 First Blood',
      speed_demon: '⚡ Speed Demon',
      quality_master: '👑 Quality Master',
      night_owl: '🦉 Night Owl',
      early_bird: '🐦 Early Bird',
      consistency_king: '📊 Consistency King',
      bug_hunter: '🐛 Bug Hunter'
    };

    const embedOptions = {
      title: '🎉 Achievement Unlocked!',
      description: `**${user.name}** earned: ${achievementNames[achievement.type] || achievement.type}`,
      color: '#9333ea',
      fields: [
        { name: 'Bonus', value: '+50 points', inline: true }
      ]
    };

    return await sendEmbed(channelId, embedOptions);
  } catch (error) {
    console.error('Error sending achievement notification:', error);
    return false;
  }
}

/**
 * Send leaderboard update notification
 */
export async function notifyLeaderboardUpdate(channelId, eventId, topThree) {
  if (!isBotReady() || !channelId) return false;

  try {
    const medals = ['🥇', '🥈', '🥉'];
    const leaderboardText = topThree.map((entry, index) => 
      `${medals[index]} **${entry.user.name}** - ${entry.stats.totalScore} pts`
    ).join('\n');

    const embedOptions = {
      title: '📊 Leaderboard Update',
      description: `Current top 3:\n\n${leaderboardText}`,
      color: '#0ea5e9',
      footer: 'Keep pushing! 🚀'
    };

    return await sendEmbed(channelId, embedOptions);
  } catch (error) {
    console.error('Error sending leaderboard notification:', error);
    return false;
  }
}

/**
 * Send welcome message
 */
export async function sendWelcomeMessage(channelId) {
  if (!isBotReady() || !channelId) return false;

  try {
    const embedOptions = {
      title: '👋 Welcome to OneCommit AI!',
      description: 'I\'m your hackathon monitoring bot. Here\'s what I can do:',
      color: '#0ea5e9',
      fields: [
        { name: '📊 Track Commits', value: 'Real-time commit tracking with AI analysis' },
        { name: '🏆 Leaderboards', value: 'Live rankings and scores' },
        { name: '🎯 Achievements', value: 'Unlock achievements and earn bonuses' },
        { name: '📝 Commands', value: 'Use `/help` to see all available commands' }
      ],
      footer: 'Type /help to get started!'
    };

    return await sendEmbed(channelId, embedOptions);
  } catch (error) {
    console.error('Error sending welcome message:', error);
    return false;
  }
}