/**
 * Cloudflare Pages Functions - Companion Bridge Endpoint (/api/companion/action)
 * Handles external Custom Gemini / ChatGPT Actions authenticated with ephemeral AGNT-GRANT tokens.
 */

interface Env {
  ENVIRONMENT?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || !token.startsWith('AGNT-GRANT-')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Missing or invalid AGNT-GRANT token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = await request.json() as any;
    const action = payload.action;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Missing "action" parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Dispatch supported companion actions
    let result: any = {};
    if (action === 'morning_briefing') {
      result = {
        briefing: "Good morning Andrew. Weather in Hoeilaart is 20°C and mild. Active projects: Eve Assistant v2 and AuricPass.",
        timestamp: Date.now()
      };
    } else if (action === 'stage_calendar') {
      if (!payload.event?.title) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'Missing event title' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      result = {
        staged: true,
        event: {
          id: 'ext-' + Date.now(),
          title: payload.event.title,
          dateStr: payload.event.dateStr || 'Upcoming',
          stagedBy: 'companion_api'
        }
      };
    } else if (action === 'query_memory') {
      result = {
        matches: [
          { type: 'person', text: 'Celine (Partner / Co-parent. French communication.)' },
          { type: 'location', text: 'Hoeilaart, Belgium (Residence)' }
        ]
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Implemented', message: `Unknown action: ${action}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, action, result, timestamp: Date.now() }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
