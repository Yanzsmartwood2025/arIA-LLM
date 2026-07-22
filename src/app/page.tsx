'use client';

import { useState } from 'react';
import { PinLogin } from '@/components/PinLogin';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <PinLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <main className="flex flex-col gap-8 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold">arIA Shell</h1>
        <p className="text-gray-500 max-w-md">
          Sesión autenticada. El layout principal y los módulos se implementarán en la siguiente etapa.
        </p>
      </main>
    </div>
  );
}
