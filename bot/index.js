import { createDiscordClient, startDiscordBot } from './client.js';
import { 
  handlePing, 
  handleHelp, 
  handleEvent, 
  handleLeaderboard,
  handleStats,
  handleEventsList
} from './handlers.js';

/**
 * Setup interaction handler
 */
export function setupInteractionHandler() {
  const client = createDiscordClient();

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    try {
      switch (commandName) {
        case 'ping':
          await handlePing(interaction);
          break;

        case 'help':
          await handleHelp(interaction);
          break;

        case 'event':
          const eventId = options.getString('id');
          await handleEvent(interaction, eventId);
          break;

        case 'leaderboard':
          const leaderboardEvent = options.getString('event');
          const limit = options.getInteger('limit') || 10;
          await handleLeaderboard(interaction, leaderboardEvent, limit);
          break;

        case 'stats':
          await handleStats(interaction);
          break;

        case 'events':
          const status = options.getString('status');
          await handleEventsList(interaction, status);
          break;

        case 'mystats':
          await interaction.reply({
            content: '🚧 This command is under development. Use `/stats` for platform statistics.',
            ephemeral: true
          });
          break;

        case 'link':
          await interaction.reply({
            content: '🚧 Account linking is under development. Stay tuned!',
            ephemeral: true
          });
          break;

        case 'commit':
          await interaction.reply({
            content: '🚧 Commit details command is under development.',
            ephemeral: true
          });
          break;

        case 'createevent':
          await interaction.reply({
            content: '🚧 Event creation via Discord is under development. Use the web interface.',
            ephemeral: true
          });
          break;

        case 'startevent':
          await interaction.reply({
            content: '🚧 Event management via Discord is under development. Use the web interface.',
            ephemeral: true
          });
          break;

        case 'finishevent':
          await interaction.reply({
            content: '🚧 Event management via Discord is under development. Use the web interface.',
            ephemeral: true
          });
          break;

        default:
          await interaction.reply({
            content: '❌ Unknown command.',
            ephemeral: true
          });
      }
    } catch (error) {
      console.error(`Error handling command ${commandName}:`, error);
      
      const errorMessage = {
        content: '❌ An error occurred while executing this command.',
        ephemeral: true
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  });
}

/**
 * Initialize Discord bot
 */
export async function initializeBot() {
  try {
    const success = await startDiscordBot();
    
    if (success) {
      setupInteractionHandler();
      console.log('✅ Discord bot initialized');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to initialize Discord bot:', error);
    return false;
  }
}

export { startDiscordBot, stopDiscordBot } from './client.js';
export { getDiscordClient, sendChannelMessage, sendEmbed, createEmbed } from './client.js';