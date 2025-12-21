import { REST, Routes } from 'discord.js';
import { getCommandsJSON } from './commands.js';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

/**
 * Register slash commands
 */
export async function registerCommands() {
  if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
    console.error('❌ DISCORD_TOKEN or DISCORD_CLIENT_ID not set');
    return false;
  }

  try {
    console.log('🔄 Registering Discord slash commands...');

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    const commands = getCommandsJSON();

    console.log(`📝 Registering ${commands.length} commands...`);

    await rest.put(
      Routes.applicationCommands(DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Discord commands registered successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to register commands:', error);
    return false;
  }
}

/**
 * Register commands for specific guild (faster for testing)
 */
export async function registerGuildCommands(guildId) {
  if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
    console.error('❌ DISCORD_TOKEN or DISCORD_CLIENT_ID not set');
    return false;
  }

  try {
    console.log(`🔄 Registering commands for guild ${guildId}...`);

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    const commands = getCommandsJSON();

    await rest.put(
      Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId),
      { body: commands }
    );

    console.log('✅ Guild commands registered successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to register guild commands:', error);
    return false;
  }
}