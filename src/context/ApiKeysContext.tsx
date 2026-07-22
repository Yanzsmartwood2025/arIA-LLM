'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// TODO: persistencia real vía Supabase con cifrado del lado del servidor (PBKDF2 + AES-256), ver /docs/blueprint.md sección 7 — nunca implementar persistencia en el navegador sin cifrado real equivalente.

interface ApiKeysContextType {
  geminiKey: string;
  setGeminiKey: (key: string) => void;
  groqKey: string;
  setGroqKey: (key: string) => void;
  julesKey: string;
  setJulesKey: (key: string) => void;
  useAriaKeys: boolean;
  setUseAriaKeys: (val: boolean) => void;
}

const ApiKeysContext = createContext<ApiKeysContextType | undefined>(undefined);

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [julesKey, setJulesKey] = useState('');
  const [useAriaKeys, setUseAriaKeys] = useState(false);

  // Load useAriaKeys from localStorage on initial render
  useEffect(() => {
    const stored = localStorage.getItem('useAriaKeys');
    if (stored === 'true') {
      // Defer the state update to avoid synchronous React 18 strict mode warnings
      setTimeout(() => setUseAriaKeys(true), 0);
    }
  }, []);

  // Update localStorage when useAriaKeys changes
  const handleSetUseAriaKeys = (val: boolean) => {
    setUseAriaKeys(val);
    localStorage.setItem('useAriaKeys', String(val));
  };

  return (
    <ApiKeysContext.Provider value={{
      geminiKey, setGeminiKey,
      groqKey, setGroqKey,
      julesKey, setJulesKey,
      useAriaKeys, setUseAriaKeys: handleSetUseAriaKeys
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
