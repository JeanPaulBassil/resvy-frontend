'use client';

import Image from 'next/image';
import React from 'react';
import { useSearchParams } from 'next/navigation';

import LoginForm from './LoginForm';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-end overflow-hidden bg-content1 p-2 sm:p-4 lg:p-8 relative">
      <Image
        src="/images/auth/loginBg.png"
        alt="Login background"
        fill
        priority
        className="object-cover z-0"
      />

      <div className="absolute left-10 top-10 z-10">
        <div className="flex items-center">
        </div>
      </div>

      <div className="absolute bottom-10 left-10 hidden md:block z-10">
        <p className="max-w-xl text-white/70 leading-relaxed">
          <span className="font-medium">"</span>
          Great dining experiences start with seamless reservations
          <span className="font-medium">"</span>
        </p>
      </div>

      <div className="z-10 w-full max-w-md md:max-w-sm lg:max-w-md">
        <div className="flex flex-col gap-4">
        <LoginForm reason={reason} />
        </div>
      </div>
    </div>
  );
}

// Export a default component that doesn't use client hooks directly
export default function LoginPage() {
  return <LoginPageContent />;
}
