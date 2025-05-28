import { Button, Link } from '@heroui/react';
import React, { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  error: string | null;
  children: ReactNode;
  loading: boolean;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export function AuthCard({
  title,
  error,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
      <p className="text-xl font-medium">{title}</p>
      <p className="text-red-500 text-sm h-[20px]">{error || ''}</p>

      {children}

      <p className="text-center text-small">
        {footerText}&nbsp;
        <Link href={footerLinkHref} size="sm">
          {footerLinkText}
        </Link>
      </p>
    </div>
  );
}
