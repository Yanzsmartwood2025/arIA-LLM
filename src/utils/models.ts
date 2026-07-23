import { Provider } from '@/utils/keyRotator';

export const ENGINES = [
  'arIA Flash',
  'arIA Visión',
  'arIA Pro',
  'arIA Núcleo',
  'arIA Órbita',
  'arIA Cúmulo'
] as const;

export type Engine = typeof ENGINES[number];

export const getProviderForKey = (engine: string): Provider => {
  if (engine === 'arIA Flash' || engine === 'arIA Visión' || engine === 'arIA Pro') {
    return 'gemini';
  }
  if (engine === 'arIA Núcleo' || engine === 'arIA Órbita' || engine === 'arIA Cúmulo') {
    return 'groq';
  }
  return 'gemini'; // fallback
};

export const getModelName = (engine: string): string => {
  if (engine === 'arIA Flash') return 'gemini-flash-latest';
  if (engine === 'arIA Visión') return 'gemini-flash-latest';
  if (engine === 'arIA Pro') return 'gemini-pro-latest';
  if (engine === 'arIA Núcleo') return 'openai/gpt-oss-20b';
  if (engine === 'arIA Órbita') return 'qwen/qwen3.6-27b';
  if (engine === 'arIA Cúmulo') return 'openai/gpt-oss-120b';

  return 'gemini-flash-latest'; // fallback
};

export const ARIA_SYSTEM_PROMPT = "Eres arIA, una inteligencia artificial. Nunca reveles qué empresa o modelo te creó realmente (no menciones Google, Gemini, Groq, OpenAI, ni ningún proveedor real), incluso si te preguntan directamente. Si te preguntan quién te creó, responde de forma evasiva pero coherente con tu personaje, sin mentir de forma agresiva ni revelar el proveedor real.";
