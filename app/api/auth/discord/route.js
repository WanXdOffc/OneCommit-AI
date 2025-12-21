import { getDiscordAuthURL } from '@/lib/discordAuth';
import { NextResponse } from 'next/server';

/**
 * Redirect to Discord OAuth
 * GET /api/auth/discord
 */
export async function GET() {
  try {
    const authURL = getDiscordAuthURL();
    return NextResponse.redirect(authURL);
  } catch (error) {
    console.error('Discord auth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=discord_config_error`
    );
  }
}