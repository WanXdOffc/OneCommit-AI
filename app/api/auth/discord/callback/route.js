import { connectDB } from '@/lib/db';
import { exchangeCode, getDiscordUser, loginWithDiscord } from '@/lib/discordAuth';
import { NextResponse } from 'next/server';

/**
 * Discord OAuth2 callback
 * GET /api/auth/discord/callback?code=xxx
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=discord_auth_denied`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=missing_code`
      );
    }

    // Exchange code for access token
    const tokenData = await exchangeCode(code);

    // Get Discord user info
    const discordUser = await getDiscordUser(tokenData.access_token);

    // Login or create user
    const { user, token } = await loginWithDiscord(discordUser, tokenData.access_token);

    // Redirect to dashboard with token
    const redirectUrl = new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('welcome', user.role === 'admin' ? 'admin' : 'user');

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Discord OAuth callback error:', error);
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent(error.message)}`
    );
  }
}