import axios from 'axios';
import { generateToken } from './auth';
import User from '@/models/User';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord/callback`;
const ADMIN_DISCORD_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
const ALLOWED_GUILD_ID = process.env.DISCORD_GUILD_ID;

/**
 * Get Discord OAuth2 URL
 */
export function getDiscordAuthURL() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds',
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange code for access token
 */
export async function exchangeCode(code) {
  try {
    const response = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to exchange code:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Discord');
  }
}

/**
 * Get Discord user info
 */
export async function getDiscordUser(accessToken) {
  try {
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get Discord user:', error.message);
    throw new Error('Failed to get Discord user info');
  }
}

/**
 * Get user guilds
 */
export async function getUserGuilds(accessToken) {
  try {
    const response = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get user guilds:', error.message);
    return [];
  }
}

/**
 * Check if user is in allowed server
 */
export async function isUserInAllowedGuild(accessToken) {
  if (!ALLOWED_GUILD_ID) {
    return true; // No restriction
  }

  const guilds = await getUserGuilds(accessToken);
  return guilds.some(guild => guild.id === ALLOWED_GUILD_ID);
}

/**
 * Check if user is admin
 */
export function isAdmin(discordId) {
  return ADMIN_DISCORD_IDS.includes(discordId);
}

/**
 * Login or create user from Discord
 */
export async function loginWithDiscord(discordUser, accessToken) {
  // Check if in allowed server
  const inGuild = await isUserInAllowedGuild(accessToken);
  if (!inGuild) {
    throw new Error('You must be a member of the authorized Discord server');
  }

  // Find or create user
  let user = await User.findOne({ discordId: discordUser.id });

  if (!user) {
    // Create new user
    const role = isAdmin(discordUser.id) ? 'admin' : 'participant';

    user = await User.create({
      name: discordUser.username,
      email: discordUser.email || `${discordUser.id}@discord.user`,
      password: 'discord-oauth', // Not used for Discord auth
      discordId: discordUser.id,
      avatar: discordUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
      role,
      isActive: true,
    });

    console.log('✅ New user created from Discord:', user.email);
  } else {
    // Update existing user
    user.name = discordUser.username;
    user.avatar = discordUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : user.avatar;
    user.lastLogin = new Date();
    
    // Update role if in admin list
    if (isAdmin(discordUser.id) && user.role !== 'admin') {
      user.role = 'admin';
      console.log('✅ User promoted to admin:', user.email);
    }

    await user.save();
    console.log('✅ User logged in:', user.email);
  }

  // Generate JWT token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role,
    discordId: user.discordId,
  });

  return { user, token };
}