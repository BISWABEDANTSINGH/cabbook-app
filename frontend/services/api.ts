// src/services/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Helper function to attach the Clerk Bearer token to headers
 */
const getHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

export const api = {
  // ==============================
  // USER ENDPOINTS
  // ==============================
  syncUser: async (token: string, userData: { firstName: string | null; lastName: string | null; email: string; profileImage?: string }) => {
    const response = await axios.post(`${API_URL}/users/sync`, userData, getHeaders(token));
    return response.data;
  },
  
  getUserProfile: async (token: string) => {
    const response = await axios.get(`${API_URL}/users/profile`, getHeaders(token));
    return response.data;
  },
  
  updateUserProfile: async (token: string, data: any) => {
    const response = await axios.put(`${API_URL}/users/profile`, data, getHeaders(token));
    return response.data;
  },

  // ==============================
  // RIDE ENDPOINTS
  // ==============================
  requestRide: async (token: string, rideData: any) => {
    const response = await axios.post(`${API_URL}/rides/request`, rideData, getHeaders(token));
    return response.data;
  },
  
  getRideHistory: async (token: string) => {
    const response = await axios.get(`${API_URL}/rides/history`, getHeaders(token));
    return response.data;
  },
  
  updateRideStatus: async (token: string, rideId: string, status: 'accepted' | 'in_progress' | 'completed' | 'cancelled') => {
    const response = await axios.put(`${API_URL}/rides/${rideId}/status`, { status }, getHeaders(token));
    return response.data;
  },

  // ==============================
  // PAYMENT ENDPOINTS
  // ==============================
  createPaymentIntent: async (token: string, rideId: string) => {
    const response = await axios.post(`${API_URL}/payments/create-intent`, { rideId }, getHeaders(token));
    return response.data;
  }
};