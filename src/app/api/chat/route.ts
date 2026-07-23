import { NextResponse } from 'next/server';
import { keyRotator } from '@/utils/keyRotator';
import { getProviderForKey, getModelName, ARIA_SYSTEM_PROMPT } from '@/utils/models';

export async function POST(req: Request) {
  try {
    const { messages, engine } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const provider = getProviderForKey(engine);
    const modelName = getModelName(engine);

    // TODO: No implementes facturación/consumo todavía.
    // TEMPORAL - este endpoint está abierto sin control de pago para pruebas internas.
    // Antes de lanzar a producción, debe quedar bloqueado detrás de un sistema de pago real (Stripe u otro)
    // y/o límite de uso gratuito controlado, o cualquier usuario podría consumir las keys propias de arIA sin pagar.
    // Aquí iría el registro de consumo en Supabase.

    // Prepare text prompt from messages (simple stringification for this example)
    const prompt = messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';

    let responseText = '';
    const MAX_RETRIES = 3;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      attempts++;

      let keyToUse = '';
      try {
        keyToUse = keyRotator.getNextKey(provider);
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error occurred while getting key';
        const isConfigError = errorMsg.includes('No server keys configured for provider');
        return NextResponse.json(
          { error: errorMsg },
          { status: isConfigError ? 500 : 429 }
        );
      }

      if (provider === 'gemini') {
        // Direct call to Gemini API using fetch
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${keyToUse}`;

        const geminiBody = {
          system_instruction: {
            parts: [{ text: ARIA_SYSTEM_PROMPT }]
          },
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          // Note: Activating google_search incurs additional costs per query.
          // The model decides autonomously when to execute a search.
          tools: [{ google_search: {} }]
        };

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
        });

        if (res.status === 429) {
          keyRotator.markKeyInCooldown('gemini', keyToUse);
          if (attempts < MAX_RETRIES) {
            continue; // Try next key
          }
          return NextResponse.json({ error: 'Todos los servidores de Gemini están saturados (Rate Limit). Intenta de nuevo en un minuto.' }, { status: 429 });
        }

        if (!res.ok) {
          const err = await res.text();
          console.error(`Gemini API Error (Status ${res.status}) FULL BODY:`, err);
          throw new Error(`Gemini API error: ${res.status} ${res.statusText} - ${err}`);
        }

        const data = await res.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        break; // Success, exit retry loop

      } else if (provider === 'groq') {
         // Direct call to Groq API using fetch
         const groqUrl = `https://api.groq.com/openai/v1/chat/completions`;

         const groqMessages = messages.map((m: { role: string; content: string }) => ({
           role: m.role,
           content: m.content
         }));

         groqMessages.unshift({ role: 'system', content: ARIA_SYSTEM_PROMPT });

         const groqPayload = {
           model: modelName,
           messages: groqMessages,
         };

         const groqPayloadStr = JSON.stringify(groqPayload);

         const systemPromptSize = new TextEncoder().encode(ARIA_SYSTEM_PROMPT).length;
         const messagesSize = new TextEncoder().encode(JSON.stringify(groqMessages)).length;
         const toolsSize = ('tools' in groqPayload) ? new TextEncoder().encode(JSON.stringify((groqPayload as any).tools)).length : 0;

         console.log(`[route.ts] Groq Payload Breakdown: System=${systemPromptSize}b, Messages=${messagesSize}b, Tools=${toolsSize}b`);

         const payloadBytes = new TextEncoder().encode(groqPayloadStr).length;
         console.log(`[route.ts] Groq keyToUse length: ${keyToUse.length} chars`);
         console.log(`[route.ts] SYSTEM PROMPT length: ${ARIA_SYSTEM_PROMPT.length}, messages length: ${JSON.stringify(groqMessages).length}`);
         console.log(`[route.ts] Groq payload size (bytes): ${payloadBytes}, length (chars): ${groqPayloadStr.length}`);

         const headers = {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${keyToUse}`
           };

         console.log(`[route.ts] Groq Full Headers: `, { ...headers, Authorization: `Bearer [REDACTED - length ${keyToUse.length}]` });

         const res = await fetch(groqUrl, {
           method: 'POST',
           headers: headers,
           body: groqPayloadStr,
         });

         if (res.status === 429) {
           keyRotator.markKeyInCooldown('groq', keyToUse);
           if (attempts < MAX_RETRIES) {
             continue; // Try next key
           }
           return NextResponse.json({ error: 'Todos los servidores de Groq están saturados (Rate Limit). Intenta de nuevo en un minuto.' }, { status: 429 });
         }

         if (!res.ok) {
           const err = await res.text();
           console.error(`Groq API Error (Status ${res.status}):`, err);
           throw new Error(`Groq API error: ${res.status} ${res.statusText} - ${err}`);
         }

         const data = await res.json();
         responseText = data.choices?.[0]?.message?.content || '';
         break; // Success, exit retry loop
      }
    }

    return NextResponse.json({ role: 'assistant', content: responseText });

  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
