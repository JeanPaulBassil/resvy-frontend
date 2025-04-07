'use client';

import { Button } from '@heroui/react';
import { WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConnectionErrorPageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ConnectionErrorPage({ 
  message = "We couldn't connect to our servers. Please check your internet connection and try again.",
  onRetry 
}: ConnectionErrorPageProps) {
  const router = useRouter();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default behavior: refresh the page
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-4">
      <div className="max-w-md w-full text-center p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <WifiOff size={32} className="text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Connection Error</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            color="primary"
            onClick={handleRetry}
          >
            Retry Connection
          </Button>
          <Button
            variant="flat"
            onClick={() => router.push('/')}
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
} 