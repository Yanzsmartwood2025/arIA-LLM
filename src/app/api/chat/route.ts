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

    let keyToUse = '';
    try {
      keyToUse = keyRotator.getNextKey(provider);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Rate limit exceeded';
      return NextResponse.json({ error: errorMsg }, { status: 429 });
    }

    // Prepare text prompt from messages (simple stringification for this example)
    const prompt = messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';

    let responseText = '';

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
        return NextResponse.json({ error: 'Rate limit on Gemini. Try again to rotate key.' }, { status: 429 });
      }

      if (!res.ok) {
        const err = await res.text();
        console.error('Gemini API Error:', err);
        throw new Error(`Gemini API error: ${res.statusText}`);
      }

      const data = await res.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } else if (provider === 'groq') {
       // Direct call to Groq API using fetch
       const groqUrl = `https://api.groq.com/openai/v1/chat/completions`;

       const groqMessages = messages.map((m: { role: string; content: string }) => ({
         role: m.role,
         content: m.content
       }));

       groqMessages.unshift({ role: 'system', content: ARIA_SYSTEM_PROMPT });

       const res = await fetch(groqUrl, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${keyToUse}`
         },
         body: JSON.stringify({
           model: modelName,
           messages: groqMessages,
         }),
       });

       if (res.status === 429) {
         keyRotator.markKeyInCooldown('groq', keyToUse);
         return NextResponse.json({ error: 'Rate limit on Groq. Try again to rotate key.' }, { status: 429 });
       }

       if (!res.ok) {
         const err = await res.text();
         console.error('Groq API Error:', err);
         throw new Error(`Groq API error: ${res.statusText}`);
       }

       const data = await res.json();
       responseText = data.choices?.[0]?.message?.content || '';
    }

    return NextResponse.json({ role: 'assistant', content: responseText });

  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
