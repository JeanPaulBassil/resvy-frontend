import axiosInstance from './axios';

export interface SmsConfig {
  enabled: boolean;
  username: string;
  password: string;
  senderId: string;
  confirmationEnabled?: boolean;
  cancellationEnabled?: boolean;
}

export interface SendSmsRequest {
  numbers: string | string[];
  message: string;
  textType?: 'text' | 'unicode';
  scheduledTime?: Date;
}

export interface SmsResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface SmsSenderIdsResponse {
  senderIds: string[];
  success: boolean;
}

export interface UpdateSmsConfigRequest {
  enabled?: boolean;
  username?: string;
  password?: string;
  senderId?: string;
  confirmationEnabled?: boolean;
  cancellationEnabled?: boolean;
}

export interface RequestSenderIdRequest {
  senderId: string;
  countryCode: string;
}

export const smsApi = {
  // Send SMS message
  sendSms: async (restaurantId: string, data: SendSmsRequest): Promise<SmsResponse> => {
    console.log('sendSms', restaurantId, data);
    const response = await axiosInstance.post(`/sms/${restaurantId}/send`, data);
    
    // Handle payload wrapper - check if response is wrapped in payload
    let actualData = response.data;
    if (response.data && response.data.payload) {
      actualData = response.data.payload;
    }
    
    return actualData;
  },

  // Get available sender IDs
  getSenderIds: async (restaurantId: string): Promise<SmsSenderIdsResponse> => {
    try {
      console.log('Making getSenderIds API call for restaurant:', restaurantId);
      const response = await axiosInstance.get(`/sms/${restaurantId}/sender-ids`, {
        timeout: 30000, // 30 second timeout
      });
      console.log('getSenderIds API response:', response.data);
      
      // Handle payload wrapper - check if response is wrapped in payload
      let actualData = response.data;
      if (response.data && response.data.payload) {
        actualData = response.data.payload;
      }
      
      console.log('Processed sender IDs data:', actualData);
      return actualData;
    } catch (error) {
      console.error('getSenderIds API error:', error);
      
      // Return a safe default response structure
      return {
        senderIds: [],
        success: false,
      };
    }
  },

  // Request a new sender ID
  requestSenderId: async (
    restaurantId: string,
    data: RequestSenderIdRequest
  ): Promise<SmsResponse> => {
    const response = await axiosInstance.post(`/sms/${restaurantId}/request-sender-id`, data);
    return response.data;
  },

  // Update SMS configuration
  updateConfig: async (
    restaurantId: string,
    config: UpdateSmsConfigRequest
  ): Promise<SmsConfig> => {
    const response = await axiosInstance.put(`/sms/${restaurantId}/config`, config);
    
    // Handle payload wrapper - check if response is wrapped in payload
    let actualData = response.data;
    if (response.data && response.data.payload) {
      actualData = response.data.payload;
    }
    
    return actualData;
  },

  // Test SMS configuration
  testConfig: async (restaurantId: string): Promise<SmsResponse> => {
    const response = await axiosInstance.post(`/sms/${restaurantId}/test`);
    return response.data;
  },

  // Get current SMS configuration
  getConfig: async (restaurantId: string): Promise<SmsConfig> => {
    try {
      const response = await axiosInstance.get(`/sms/${restaurantId}/config`);
      
      // Handle payload wrapper - check if response is wrapped in payload
      let actualData = response.data;
      if (response.data && response.data.payload) {
        actualData = response.data.payload;
      }
      
      return actualData;
    } catch (error) {
      console.warn('Failed to load SMS config, using defaults:', error);

      // Don't let the error bubble up to axios interceptors which could cause redirects
      // Instead, return a safe default configuration
      return {
        enabled: false,
        username: '',
        password: '',
        senderId: '',
        confirmationEnabled: true,
        cancellationEnabled: true,
      };
    }
  },
};
