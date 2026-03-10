// frontend/src/hooks/useRide.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth as useClerkAuth } from '@clerk/nextjs';

interface LocationDetails {
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
}

interface RideRequestData {
  pickupLocation: LocationDetails;
  dropoffLocation: LocationDetails;
  rideType: 'economy' | 'premium' | 'suv';
  distance: number;
}

export const useRide = () => {
  const { userId } = useClerkAuth(); // Clerk ID
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRide, setCurrentRide] = useState<any | null>(null);
  const [rideHistory, setRideHistory] = useState<any[]>([]);

  // 1. Request a new ride
  const requestNewRide = async (rideData: RideRequestData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userId) throw new Error('Not logged in');

      // Step A: Get internal Postgres UUID using the Clerk ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (userError) throw userError;

      // Calculate a basic fare (e.g., $5 base + $2 per mile)
      const estimatedFare = 5 + (rideData.distance * 2);

      // Step B: Insert the ride
      const { data: newRide, error: rideError } = await supabase
        .from('rides')
        .insert({
          rider_id: userData.id,
          pickup_address: rideData.pickupLocation.address,
          pickup_lat: rideData.pickupLocation.coordinates[1],
          pickup_lng: rideData.pickupLocation.coordinates[0],
          dropoff_address: rideData.dropoffLocation.address,
          dropoff_lat: rideData.dropoffLocation.coordinates[1],
          dropoff_lng: rideData.dropoffLocation.coordinates[0],
          ride_type: rideData.rideType,
          distance: rideData.distance,
          estimated_fare: estimatedFare
        })
        .select()
        .single();

      if (rideError) throw rideError;

      setCurrentRide(newRide);
      return newRide;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch user's ride history
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!userId) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (!userData) return;

      // Fetch rides and automatically join driver details if a driver accepted it!
      const { data: rides, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id (first_name, last_name, profile_image, rating)
        `)
        .eq('rider_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRideHistory(rides || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return { isLoading, error, currentRide, rideHistory, requestNewRide, fetchHistory };
};