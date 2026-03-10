// src/app/driver/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '../../lib/supabase';
import Map from '../../components/Map';
import Button from '../../components/Button';

export default function DriverDashboard() {
  const { isLoaded, userId } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [incomingRides, setIncomingRides] = useState<any[]>([]);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (userId && isOnline) {
      fetchRides();
      fetchEarnings();
      
      const interval = setInterval(fetchRides, 5000);
      return () => clearInterval(interval);
    }
  }, [userId, isOnline]);

  const fetchRides = async () => {
    try {
      // RELIABLE: Just fetch rides assigned directly to THIS driver
      const { data, error } = await supabase
        .from('rides')
        .select('*, user:rider_id(first_name, last_name, profile_image, rating)')
        .eq('driver_id', userId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncomingRides(data || []);
      
      if (data && data.length > 0 && !selectedRide) {
        setSelectedRide(data[0]);
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
    }
  };

  const fetchEarnings = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('distance')
        .eq('driver_id', userId)
        .eq('status', 'completed');

      if (error) throw error;
      
      if (data) {
        const sum = data.reduce((acc, ride) => acc + (ride.distance * 2.5), 0);
        setTotalEarnings(sum);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'accepted' })
        .eq('id', rideId);

      if (error) throw error;
      
      const updatedRides = incomingRides.map(r => r.id === rideId ? { ...r, status: 'accepted' } : r);
      setIncomingRides(updatedRides);
      setSelectedRide({ ...selectedRide, status: 'accepted' });
      
    } catch (error) {
      console.error("Failed to accept ride", error);
      alert("Something went wrong accepting the ride.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRide = async (rideId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'completed' })
        .eq('id', rideId);

      if (error) throw error;
      
      alert("Ride Completed! Earnings added to your account.");
      setSelectedRide(null);
      fetchRides(); 
      fetchEarnings(); 
      
    } catch (error) {
      console.error("Failed to complete ride", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const pickupCoords = selectedRide?.pickup_location?.coordinates ? { lat: selectedRide.pickup_location.coordinates[1], lng: selectedRide.pickup_location.coordinates[0] } : null;
  const dropoffCoords = selectedRide?.dropoff_location?.coordinates ? { lat: selectedRide.dropoff_location.coordinates[1], lng: selectedRide.dropoff_location.coordinates[0] } : null;

  return (
    <div className="flex-grow flex flex-col md:flex-row bg-gray-50 h-[calc(100vh-4rem)]">
      
      {/* LEFT PANEL */}
      <div className="w-full md:w-1/3 lg:w-[420px] bg-white border-r border-gray-200 shadow-xl z-10 flex flex-col h-full">
        
        <div className="p-6 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold">Driver Terminal</h2>
            <p className="text-sm text-slate-400 mt-1">{isOnline ? 'Looking for rides...' : 'You are offline'}</p>
          </div>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isOnline ? 'bg-blue-500' : 'bg-slate-600'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${isOnline ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>

        {isOnline && (
          <div className="px-6 pt-6 pb-2">
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-5 text-white shadow-lg flex justify-between items-center animate-in fade-in duration-500">
              <div>
                <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">Total Earned</p>
                <h3 className="text-3xl font-extrabold">${totalEarnings.toFixed(2)}</h3>
              </div>
              <div className="text-right">
                {selectedRide?.status === 'accepted' ? (
                  <>
                    <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">Current Ride</p>
                    <p className="text-xl font-bold text-white">+${(selectedRide.distance * 2.5).toFixed(2)}</p>
                  </>
                ) : (
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl shadow-inner">
                    💰
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
          {!isOnline ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="text-6xl mb-4">💤</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Go online to earn</h3>
              <p>Turn on your availability to start receiving ride requests in your area.</p>
            </div>
          ) : incomingRides.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Finding Passengers</h3>
              <p>Stay on this screen. We will notify you when a ride is requested.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Requests</h3>
              
              {incomingRides.map((ride) => (
                <div 
                  key={ride.id} 
                  onClick={() => setSelectedRide(ride)}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer ${selectedRide?.id === ride.id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-lg">
                        {ride.user?.profile_image ? <img src={ride.user.profile_image} alt="Rider" /> : '👤'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{ride.user?.first_name || 'Passenger'}</p>
                        <p className="text-xs text-yellow-500 font-bold">★ {ride.user?.rating || '5.0'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-green-600 text-lg">${(ride.distance * 2.5).toFixed(2)}</p>
                      <p className="text-xs text-gray-500 font-bold">{ride.distance} mi</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="truncate">{ride.pickup_location?.address || 'Pinned Location'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-none bg-black"></div>
                      <span className="truncate">{ride.dropoff_location?.address || 'Pinned Location'}</span>
                    </div>
                  </div>

                  {ride.status === 'accepted' && (
                     <div className="mt-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 rounded-md inline-block">
                       Ride in Progress
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isOnline && selectedRide && (
          <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
            {selectedRide.status === 'accepted' ? (
              <Button className="w-full py-5 text-lg bg-black hover:bg-gray-800" isLoading={isLoading} onClick={() => handleCompleteRide(selectedRide.id)}>
                Complete Dropoff
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 py-4 border-red-200 text-red-600 hover:bg-red-50">Decline</Button>
                <Button className="flex-[2] py-4 text-lg shadow-lg" isLoading={isLoading} onClick={() => handleAcceptRide(selectedRide.id)}>
                  Accept Ride
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-grow relative hidden md:block h-full bg-gray-100">
        {!isOnline ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 backdrop-blur-sm z-10">
            <p className="text-gray-500 font-bold text-xl bg-white px-6 py-3 rounded-full shadow-sm">Map is offline</p>
          </div>
        ) : null}
        
        <Map pickupCoords={pickupCoords} dropoffCoords={dropoffCoords} />
      </div>

    </div>
  );
}