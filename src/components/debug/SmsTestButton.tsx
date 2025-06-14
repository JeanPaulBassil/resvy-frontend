'use client';

import axiosInstance from '@/api/axios';
import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@heroui/react';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function SmsTestButton() {
  const { currentRestaurant } = useRestaurant();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const testConfirmationSms = async () => {
    if (!currentRestaurant?.id) {
      toast.error('No restaurant selected');
      return;
    }

    setIsLoading(true);
    try {
      const testData = {
        guestName: 'John Doe',
        guestPhone: '96170766858', // Your phone number
        restaurantName: currentRestaurant.name,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        numberOfGuests: 2,
        tableNumber: 'Table 5',
      };

      console.log('Testing confirmation SMS with data:', testData);

      const response = await axiosInstance.post(
        `/sms/${currentRestaurant.id}/test-reservation-confirmation`,
        testData
      );

      console.log('SMS test response:', response.data);

      if (response.data.success) {
        toast.success('Test confirmation SMS sent successfully!');
      } else {
        toast.error(`SMS test failed: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('SMS test error:', error);
      toast.error(`SMS test error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCancellationSms = async () => {
    if (!currentRestaurant?.id) {
      toast.error('No restaurant selected');
      return;
    }

    setIsLoading(true);
    try {
      const testData = {
        guestName: 'John Doe',
        guestPhone: '96170766858', // Your phone number
        restaurantName: currentRestaurant.name,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        numberOfGuests: 2,
        tableNumber: 'Table 5',
      };

      console.log('Testing cancellation SMS with data:', testData);

      const response = await axiosInstance.post(
        `/sms/${currentRestaurant.id}/test-reservation-cancellation`,
        testData
      );

      console.log('SMS test response:', response.data);

      if (response.data.success) {
        toast.success('Test cancellation SMS sent successfully!');
      } else {
        toast.error(`SMS test failed: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('SMS test error:', error);
      toast.error(`SMS test error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={testConfirmationSms}
        isLoading={isLoading}
        color="primary"
        variant="ghost"
        startContent={<MessageSquare size={16} />}
        size="sm"
      >
        Test Confirmation SMS
      </Button>
      <Button
        onClick={testCancellationSms}
        isLoading={isLoading}
        color="danger"
        variant="ghost"
        startContent={<MessageSquare size={16} />}
        size="sm"
      >
        Test Cancellation SMS
      </Button>
    </div>
  );
}
