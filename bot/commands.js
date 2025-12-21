import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

/**
 * Define slash commands
 */
export const commands = [
  // Ping command
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if bot is responsive'),

  // Event info command
  new SlashCommandBuilder()
    .setName('event')
    .setDescription('Get event information')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Event ID')
        .setRequired(false)
    ),

  // Leaderboard command
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show event leaderboard')
    .addStringOption(option =>
      option
        .setName('event')
        .setDescription('Event ID')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Number of entries to show')
        .setMinValue(1)
        .setMaxValue(25)
        .setRequired(false)
    ),

  // Stats command
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show platform statistics'),

  // User stats command
  new SlashCommandBuilder()
    .setName('mystats')
    .setDescription('Show your statistics')
    .addStringOption(option =>
      option
        .setName('email')
        .setDescription('Your email (if linked)')
        .setRequired(false)
    ),

  // Link account command
  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord to OneCommit account')
    .addStringOption(option =>
      option
        .setName('email')
        .setDescription('Your OneCommit email')
        .setRequired(true)
    ),

  // Commit info command
  new SlashCommandBuilder()
    .setName('commit')
    .setDescription('Get commit details')
    .addStringOption(option =>
      option
        .setName('sha')
        .setDescription('Commit SHA (short or full)')
        .setRequired(true)
    ),

  // Help command
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands and usage'),

  // Admin: Create event
  new SlashCommandBuilder()
    .setName('createevent')
    .setDescription('Create a new hackathon event (Admin only)')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Event name')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Duration in hours')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(720)
    )
    .addIntegerOption(option =>
      option
        .setName('participants')
        .setDescription('Max participants')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Event description')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Admin: Start event
  new SlashCommandBuilder()
    .setName('startevent')
    .setDescription('Start an event (Admin only)')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Event ID')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Admin: Finish event
  new SlashCommandBuilder()
    .setName('finishevent')
    .setDescription('Finish an event (Admin only)')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Event ID')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // List events
  new SlashCommandBuilder()
    .setName('events')
    .setDescription('List all events')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices(
          { name: 'Waiting', value: 'waiting' },
          { name: 'Running', value: 'running' },
          { name: 'Finished', value: 'finished' }
        )
    )
];

/**
 * Convert commands to JSON for registration
 */
export function getCommandsJSON() {
  return commands.map(command => command.toJSON());
}