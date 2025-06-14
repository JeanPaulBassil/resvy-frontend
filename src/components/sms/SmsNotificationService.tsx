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
  reservationConfirmed: `Dear {{guestName}}, your reservation has been confirmed on {{dayName}}, {{monthName}} {{dayNumber}}, {{year}} at {{time}} {{ampm}} for {{numberOfGuests}} {{guestPlural}}.`,
  
  reservationReminder: `Hi {{guestName}}, this is a reminder for your reservation at {{restaurantName}} today at {{reservationTime}} for {{numberOfGuests}} guests. See you soon!`,
  
  reservationCancelled: `Dear {{guestName}}, your reservation at {{restaurantName}} on {{reservationDate}} at {{reservationTime}} has been cancelled. We apologize for any inconvenience.`,
  
  reservationModified: `Dear {{guestName}}, your reservation at {{restaurantName}} has been updated to {{reservationDate}} at {{reservationTime}} for {{numberOfGuests}} guests. Thank you!`,
};

export class SmsNotificationService {
  private static formatReservationDateTime(startTime: string): {
    dayName: string;
    monthName: string;
    dayNumber: string;
    year: string;
    time: string;
    ampm: string;
  } {
    const date = new Date(startTime);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const dayNumber = date.getDate().toString();
    const year = date.getFullYear().toString();
    
    // Format time in 12-hour format
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const time = `${hours}:${minutes.toString().padStart(2, '0')}`;
    
    return {
      dayName,
      monthName, 
      dayNumber,
      year,
      time,
      ampm
    };
  }
  
  private static replaceTemplateVariables(
    template: string,
    options: SmsNotificationOptions
  ): string {
    // Get formatted date/time components
    const dateTimeFormatted = this.formatReservationDateTime(options.reservationTime);
    
    // Determine guest plural
    const guestPlural = options.numberOfGuests === 1 ? 'guest' : 'guests';
    
    return template
      .replace(/{{guestName}}/g, options.guestName)
      .replace(/{{guestPhone}}/g, options.guestPhone)
      .replace(/{{restaurantName}}/g, options.restaurantName)
      .replace(/{{reservationDate}}/g, options.reservationDate)
      .replace(/{{reservationTime}}/g, options.reservationTime)
      .replace(/{{numberOfGuests}}/g, options.numberOfGuests.toString())
      .replace(/{{tableNumber}}/g, options.tableNumber || 'N/A')
      .replace(/{{additionalInfo}}/g, options.additionalInfo || '')
      // New formatted date/time replacements
      .replace(/{{dayName}}/g, dateTimeFormatted.dayName)
      .replace(/{{monthName}}/g, dateTimeFormatted.monthName)
      .replace(/{{dayNumber}}/g, dateTimeFormatted.dayNumber)
      .replace(/{{year}}/g, dateTimeFormatted.year)
      .replace(/{{time}}/g, dateTimeFormatted.time)
      .replace(/{{ampm}}/g, dateTimeFormatted.ampm)
      .replace(/{{guestPlural}}/g, guestPlural);
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