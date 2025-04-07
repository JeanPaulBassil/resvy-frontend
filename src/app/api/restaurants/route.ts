import { NextRequest, NextResponse } from 'next/server';

import { getAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the authentication token from the request
    const token = await getAuthToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      );
    }

    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Get the user ID from the token
    // 2. Make a request to your backend API to create a new restaurant
    // 3. Return the created restaurant data

    // For now, we'll return a mock response
    // TODO: Replace with actual API call to backend
    const mockRestaurant = {
      id: 'rest_' + Date.now(),
      name: body.name,
      description: body.description || '',
      location: body.location,
      phone: body.phone || '',
      email: body.email || '',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(mockRestaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    );
  }
} 