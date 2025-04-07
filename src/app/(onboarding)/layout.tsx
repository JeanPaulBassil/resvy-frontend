'use client';

import { Inter } from 'next/font/google';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} antialiased bg-[#75CAA6] min-h-screen`}>
      {children}
    </div>
  );
} 