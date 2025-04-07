import { Metadata } from 'next';
import Image from 'next/image';
import React from 'react';

import SignUpForm from './SignUpForm';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Resvy account and start optimizing your apps.',
  keywords: ['Sign Up', 'Resvy', 'App Store Optimization', 'ASO Platform', 'Mobile Growth'],
  alternates: {
    canonical: 'https://resvy.com/signup',
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Sign Up for Resvy',
    description: 'Create an account to access AI-powered App Store Optimization tools.',
    url: 'https://resvy.com/signup',
    siteName: 'Resvy',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Resvy Sign Up Page',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-full items-center justify-start overflow-hidden bg-content1 p-2 sm:p-4 lg:p-8 relative">
      <Image
        src="/images/auth/signupBg.png"
        alt="Sign up background"
        fill
        priority
        className="object-cover z-0"
      />

      <div className="absolute bottom-10 left-10 hidden md:block z-10">
        <p className="max-w-xl text-white/70 leading-relaxed">
          <span className="font-medium">"</span>
          Join hundreds of restaurants who are leveraging Resvy to optimize their reservations and drive sustainable growth.
          <span className="font-medium">"</span>
        </p>
      </div>

      <div className="z-10 w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  );
}
