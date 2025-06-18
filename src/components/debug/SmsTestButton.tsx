'use client';

import { Button } from '@heroui/react';
import { MessageSquare } from 'lucide-react';

export default function SmsTestButton() {
  const handleTest = () => {
    console.log('SMS Test Button clicked - placeholder function');
    // This is a placeholder component
    // You can implement SMS testing functionality here if needed
  };

  return (
    <Button
      color="secondary"
      variant="flat"
      size="sm"
      startContent={<MessageSquare className="h-4 w-4" />}
      onPress={handleTest}
      className="text-xs"
    >
      SMS Test
    </Button>
  );
} 