'use client';

import { AuthProvider } from '@/context/AuthContext';
import { Providers } from '@/store/provider';
import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <Suspense>
      <SessionProvider>
        <AuthProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </AuthProvider>
      </SessionProvider>
    </Suspense>
  );
}