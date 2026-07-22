import { NextResponse } from 'next/server';
import { keyRotator, Provider } from '@/utils/keyRotator';

export async function POST(req: Request) {
  try {
    const { messages, engine } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Determine the provider based on the selected engine
    // Assuming 'aria-flash' or 'aria-nucleo' maps to Gemini, and others map to Groq, etc.
    // For now, let's map 'arIA Flash' to gemini and 'arIA Núcleo' to groq as an example.
    let provider: Provider = 'gemini'; // Default
    let modelName = 'gemini-flash-latest';

    if (engine === 'arIA Flash') {
      provider = 'gemini';
      modelName = 'gemini-flash-latest';
    } else if (engine === 'arIA Núcleo') {
      provider = 'groq';
      modelName = 'llama-3.1-8b-instant';
    } else if (engine === 'arIA Visión') {
      provider = 'gemini';
      modelName = 'gemini-2.5-pro';
    } else if (engine === 'arIA Órbita') {
      provider = 'groq';
      modelName = 'llama-3.3-70b-versatile';
    }

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
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
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
