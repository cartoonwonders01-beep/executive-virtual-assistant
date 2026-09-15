/**
 * Cloudflare Pages Functions - Edge LLM Proxy (/api/chat)
 * Decouples client applications from raw API keys.
 * Secrets are securely injected from Cloudflare Pages Environment Variables (env.GROQ_API_KEY).
 */

interface Env {
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ENVIRONMENT?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const apiKey = env.GROQ_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server edge missing GROQ_API_KEY binding' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientPayload = await request.json() as any;
    const isStream = Boolean(clientPayload.stream);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientPayload)
    });

    if (!groqResponse.ok) {
      return new Response(await groqResponse.text(), {
        status: groqResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (isStream && groqResponse.body) {
      return new Response(groqResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    const data = await groqResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Edge Proxy Failure', message: String(err) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
