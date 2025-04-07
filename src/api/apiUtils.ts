import { AxiosResponse } from 'axios';

/**
 * Extracts data from an API response
 * @param response The Axios response object
 * @returns The extracted data with the specified type
 */
export const extractData = <T>(response: AxiosResponse): T => {
  // Check if response has a payload property
  console.log('response in extractData', response);
  if (response.data && response.data.payload !== undefined) {
    return response.data.payload as T;
  }
  // Otherwise return the data directly
  return response.data as T;
}; 