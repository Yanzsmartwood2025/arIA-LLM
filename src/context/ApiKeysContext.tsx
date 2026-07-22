'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// TODO: persistencia real vía Supabase con cifrado del lado del servidor (PBKDF2 + AES-256), ver /docs/blueprint.md sección 7 — nunca implementar persistencia en el navegador sin cifrado real equivalente.

interface ApiKeysContextType {
  geminiKey: string;
  setGeminiKey: (key: string) => void;
  groqKey: string;
  setGroqKey: (key: string) => void;
  julesKey: string;
  setJulesKey: (key: string) => void;
}

const ApiKeysContext = createContext<ApiKeysContextType | undefined>(undefined);

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [julesKey, setJulesKey] = useState('');

  return (
    <ApiKeysContext.Provider value={{
      geminiKey, setGeminiKey,
      groqKey, setGroqKey,
      julesKey, setJulesKey
    }}>
      {children}
    </ApiKeysContext.Provider>
  );
}

export function useApiKeys() {
  const context = useContext(ApiKeysContext);
  if (context === undefined) {
    throw new Error('useApiKeys must be used within an ApiKeysProvider');
  }
  return context;
}
