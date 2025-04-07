import { Button, Divider, Link } from '@heroui/react';
import { Icon } from '@iconify/react';
import React, { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  error: string | null;
  children: ReactNode;
  loading: boolean;
  onGoogleClick: () => void;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export function AuthCard({
  title,
  error,
  children,
  loading,
  onGoogleClick,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
      <p className="text-xl font-medium">{title}</p>
      <p className="text-red-500 text-sm h-[20px]">{error || ''}</p>

      {children}

      <div className="flex items-center gap-4 py-2">
        <Divider className="flex-1" />
        <p className="shrink-0 text-tiny text-default-500">OR</p>
        <Divider className="flex-1" />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          startContent={<Icon icon="flat-color-icons:google" width={24} />}
          variant="bordered"
          onPress={onGoogleClick}
          isLoading={loading}
          disabled={loading}
        >
          Continue with Google
        </Button>
      </div>

      <p className="text-center text-small">
        {footerText}&nbsp;
        <Link href={footerLinkHref} size="sm">
          {footerLinkText}
        </Link>
      </p>
    </div>
  );
}
