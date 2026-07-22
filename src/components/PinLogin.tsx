'use client';

import { useState } from 'react';
import Image from 'next/image';

// TEMPORAL - reemplazar por Supabase Auth en sesión futura, no usar en producción
export function PinLogin({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = process.env.NEXT_PUBLIC_DEV_PIN || '3838';

    if (pin === correctPin) {
      setError(false);
      onLogin();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-[#111] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/branding/aria-logo-source.png"
            alt="arIA Logo"
            width={160}
            height={60}
            className="mb-4 object-contain"
            priority
          />
          <p className="text-sm text-gray-400">Acceso de desarrollo</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="pin" className="sr-only">
              PIN de acceso
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/[^0-9]/g, ''));
                setError(false);
              }}
              placeholder="••••"
              className={`w-full rounded-lg bg-[#222] px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none transition-colors focus:ring-2 ${
                error ? 'border border-red-500 focus:ring-red-500/50' : 'border border-gray-700 focus:border-blue-500 focus:ring-blue-500/50'
              }`}
              required
            />
            {error && (
              <p className="mt-2 text-center text-sm text-red-500">PIN incorrecto. Intenta de nuevo.</p>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition-colors hover:bg-gray-200 active:bg-gray-300"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
