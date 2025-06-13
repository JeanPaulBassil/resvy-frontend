'use client';

import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { useToast } from '@/contexts/ToastContext';
import { smsApi } from '@/api/sms';

export interface SmsTemplates {
  reservationConfirmed: string;
  reservationReminder: string;
  reservationCancelled: string;
  reservationModified: string;
}

export interface SmsNotificationOptions {
  guestName: string;
  guestPhone: string;
  restaurantName: string;
  reservationDate: string;
  reservationTime: string;
  numberOfGuests: number;
  tableNumber?: string;
  additionalInfo?: string;
}

// Default SMS templates
export const defaultSmsTemplates: SmsTemplates = {
  reservationConfirmed: `Dear {{guestName}}, your reservation at {{restaurantName}} on {{reservationDate}} at {{reservationTime}} for {{numberOfGuests}} guests has been confirmed. Thank you!`,
  
  reservationReminder: `Hi {{guestName}}, this is a reminder for your reservation at {{restaurantName}} today at {{reservationTime}} for {{numberOfGuests}} guests. See you soon!`,
  
  reservationCancelled: `Dear {{guestName}}, your reservation at {{restaurantName}} on {{reservationDate}} at {{reservationTime}} has been cancelled. We apologize for any inconvenience.`,
  
  reservationModified: `Dear {{guestName}}, your reservation at {{restaurantName}} has been updated to {{reservationDate}} at {{reservationTime}} for {{numberOfGuests}} guests. Thank you!`,
};

export class SmsNotificationService {
  private static replaceTemplateVariables(
    template: string,
    options: SmsNotificationOptions
  ): string {
    return template
      .replace(/{{guestName}}/g, options.guestName)
      .replace(/{{guestPhone}}/g, options.guestPhone)
      .replace(/{{restaurantName}}/g, options.restaurantName)
      .replace(/{{reservationDate}}/g, options.reservationDate)
      .replace(/{{reservationTime}}/g, options.reservationTime)
      .replace(/{{numberOfGuests}}/g, options.numberOfGuests.toString())
      .replace(/{{tableNumber}}/g, options.tableNumber || 'N/A')
      .replace(/{{additionalInfo}}/g, options.additionalInfo || '');
  }

  static async sendReservationConfirmation(
    restaurantId: string,
    options: SmsNotificationOptions
  ): Promise<boolean> {
    try {
      const message = this.replaceTemplateVariables(
        defaultSmsTemplates.reservationConfirmed,
        options
      );

      const response = await smsApi.sendSms(restaurantId, {
        numbers: options.guestPhone,
        message,
        textType: 'text',
      });

      return response.success;
    } catch (error) {
      console.error('Failed to send reservation confirmation SMS:', error);
      return false;
    }
  }

  static async sendReservationReminder(
    restaurantId: string,
    options: SmsNotificationOptions
  ): Promise<boolean> {
    try {
      const message = this.replaceTemplateVariables(
        defaultSmsTemplates.reservationReminder,
        options
      );

      const response = await smsApi.sendSms(restaurantId, {
        numbers: options.guestPhone,
        message,
        textType: 'text',
      });

      return response.success;
    } catch (error) {
      console.error('Failed to send reservation reminder SMS:', error);
      return false;
    }
  }

  static async sendReservationCancellation(
    restaurantId: string,
    options: SmsNotificationOptions
  ): Promise<boolean> {
    try {
      const message = this.replaceTemplateVariables(
        defaultSmsTemplates.reservationCancelled,
        options
      );

      const response = await smsApi.sendSms(restaurantId, {
        numbers: options.guestPhone,
        message,
        textType: 'text',
      });

      return response.success;
    } catch (error) {
      console.error('Failed to send reservation cancellation SMS:', error);
      return false;
    }
  }

  static async sendReservationModification(
    restaurantId: string,
    options: SmsNotificationOptions
  ): Promise<boolean> {
    try {
      const message = this.replaceTemplateVariables(
        defaultSmsTemplates.reservationModified,
        options
      );

      const response = await smsApi.sendSms(restaurantId, {
        numbers: options.guestPhone,
        message,
        textType: 'text',
      });

      return response.success;
    } catch (error) {
      console.error('Failed to send reservation modification SMS:', error);
      return false;
    }
  }
}

// React hook for SMS notifications
export function useSmsNotifications() {
  const { currentRestaurant } = useRestaurant();
  const toast = useToast();

  const sendConfirmation = async (options: SmsNotificationOptions) => {
    if (!currentRestaurant?.id) {
      console.error('No restaurant selected');
      return false;
    }

    const success = await SmsNotificationService.sendReservationConfirmation(
      currentRestaurant.id,
      options
    );

    if (success) {
      toast.success('Confirmation SMS sent successfully');
    } else {
      toast.error('Failed to send confirmation SMS');
    }

    return success;
  };

  const sendReminder = async (options: SmsNotificationOptions) => {
    if (!currentRestaurant?.id) {
      console.error('No restaurant selected');
      return false;
    }

    const success = await SmsNotificationService.sendReservationReminder(
      currentRestaurant.id,
      options
    );

    if (success) {
      toast.success('Reminder SMS sent successfully');
    } else {
      toast.error('Failed to send reminder SMS');
    }

    return success;
  };

  const sendCancellation = async (options: SmsNotificationOptions) => {
    if (!currentRestaurant?.id) {
      console.error('No restaurant selected');
      return false;
    }

    const success = await SmsNotificationService.sendReservationCancellation(
      currentRestaurant.id,
      options
    );

    if (success) {
      toast.success('Cancellation SMS sent successfully');
    } else {
      toast.error('Failed to send cancellation SMS');
    }

    return success;
  };

  const sendModification = async (options: SmsNotificationOptions) => {
    if (!currentRestaurant?.id) {
      console.error('No restaurant selected');
      return false;
    }

    const success = await SmsNotificationService.sendReservationModification(
      currentRestaurant.id,
      options
    );

    if (success) {
      toast.success('Modification SMS sent successfully');
    } else {
      toast.error('Failed to send modification SMS');
    }

    return success;
  };

  return {
    sendConfirmation,
    sendReminder,
    sendCancellation,
    sendModification,
  };
} 