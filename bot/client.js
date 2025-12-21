import { Client, GatewayIntentBits, EmbedBuilder, ActivityType } from 'discord.js';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

let client = null;
let isReady = false;

/**
 * Create Discord client
 */
export function createDiscordClient() {
  if (client) {
    return client;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  // Ready event
  client.once('ready', () => {
    isReady = true;
    console.log('✅ Discord bot ready');
    console.log(`👤 Logged in as ${client.user.tag}`);
    console.log(`🔢 Guild count: ${client.guilds.cache.size}`);
    
    // Set activity
    client.user.setActivity('hackathons 🚀', { type: ActivityType.Watching });
  });

  // Error handling
  client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
  });

  return client;
}

/**
 * Start Discord bot
 */
export async function startDiscordBot() {
  if (!DISCORD_TOKEN) {
    console.warn('⚠️ DISCORD_TOKEN not set, Discord bot disabled');
    return false;
  }

  try {
    const bot = createDiscordClient();
    
    if (isReady) {
      console.log('⚠️ Discord bot already running');
      return true;
    }

    console.log('🤖 Starting Discord bot...');
    await bot.login(DISCORD_TOKEN);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to start Discord bot:', error.message);
    return false;
  }
}

/**
 * Stop Discord bot
 */
export async function stopDiscordBot() {
  if (!client || !isReady) {
    return;
  }

  try {
    await client.destroy();
    client = null;
    isReady = false;
    console.log('✅ Discord bot stopped');
  } catch (error) {
    console.error('❌ Error stopping Discord bot:', error);
  }
}

/**
 * Check if bot is ready
 */
export function isBotReady() {
  return isReady && client !== null;
}

/**
 * Get Discord client
 */
export function getDiscordClient() {
  if (!isBotReady()) {
    throw new Error('Discord bot not ready');
  }
  return client;
}

/**
 * Send message to channel
 */
export async function sendChannelMessage(channelId, content) {
  try {
    const bot = getDiscordClient();
    const channel = await bot.channels.fetch(channelId);
    
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel');
    }

    await channel.send(content);
    return true;
  } catch (error) {
    console.error('❌ Failed to send message:', error.message);
    return false;
  }
}

/**
 * Create embed message
 */
export function createEmbed(options) {
  const embed = new EmbedBuilder()
    .setColor(options.color || '#0ea5e9')
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.url) embed.setURL(options.url);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) embed.setFooter({ text: options.footer });
  if (options.author) embed.setAuthor(options.author);
  
  if (options.fields) {
    options.fields.forEach(field => {
      embed.addFields({
        name: field.name,
        value: field.value,
        inline: field.inline || false
      });
    });
  }

  return embed;
}

/**
 * Send embed to channel
 */
export async function sendEmbed(channelId, embedOptions) {
  try {
    const embed = createEmbed(embedOptions);
    const bot = getDiscordClient();
    const channel = await bot.channels.fetch(channelId);
    
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel');
    }

    await channel.send({ embeds: [embed] });
    return true;
  } catch (error) {
    console.error('❌ Failed to send embed:', error.message);
    return false;
  }
}