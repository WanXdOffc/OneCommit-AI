import { isBotReady, sendChannelMessage } from '@/bot/client';

/**
 * Test Discord bot
 * GET /api/discord/test
 */
export async function GET() {
  try {
    if (!isBotReady()) {
      return Response.json({
        success: false,
        message: 'Discord bot not ready',
        hint: 'Check DISCORD_TOKEN in .env'
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Discord bot is ready',
      status: 'online'
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Send test message
 * POST /api/discord/test
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { channelId, message } = body;

    if (!channelId || !message) {
      return Response.json(
        { error: 'channelId and message are required' },
        { status: 400 }
      );
    }

    if (!isBotReady()) {
      return Response.json(
        { error: 'Discord bot not ready' },
        { status: 500 }
      );
    }

    const sent = await sendChannelMessage(channelId, message);

    if (sent) {
      return Response.json({
        success: true,
        message: 'Message sent successfully'
      });
    } else {
      return Response.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}