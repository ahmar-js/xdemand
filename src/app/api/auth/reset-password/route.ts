import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log('Reset password request:', body);
    
    // Send request to your backend API
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://172.178.121.203:3000'}/auth/reset-password`,
      body,
      {
        headers: { "Content-Type": "application/json" }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Password reset request failed:', error);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      return NextResponse.json(
        error.response.data || { message: 'Server error' }, 
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    );
  }
}