'use client';

import AuthButton from './SessionProviderWrapper';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthButton>
      {children}
    </AuthButton>
  );
}