'use client';

import { useState } from 'react';
import { PinLogin } from '@/components/PinLogin';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <PinLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return <MainLayout />;
}
