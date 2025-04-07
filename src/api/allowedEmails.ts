import axiosInstance from './axios';

// Function to get all allowed emails
export const getAllowedEmails = async (): Promise<string[]> => {
  try {
    const response = await axiosInstance.get('/allowed-emails');
    
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(item => item.email);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching allowed emails:', error);
    return [];
  }
};
