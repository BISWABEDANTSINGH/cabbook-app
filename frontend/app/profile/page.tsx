// src/app/profile/page.tsx
"use client";

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRide } from '../../hooks/useRide';
import Button from '../../components/Button';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { rideHistory, fetchHistory, isLoading } = useRide();

  // Fetch the user's ride history as soon as the component loads
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  // Helper function to format the PostgreSQL timestamp into a readable date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Helper to color-code the ride status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Completed</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Cancelled</span>;
      case 'requested': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold uppercase">Searching</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">{status}</span>;
    }
  };

  if (!isUserLoaded) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- Profile Header Section --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <img 
            src={user?.imageUrl || 'https://via.placeholder.com/150'} 
            alt="Profile" 
            className="w-24 h-24 rounded-full border-4 border-gray-50 shadow-md"
          />
          <div className="text-center md:text-left flex-grow">
            <h1 className="text-3xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
            <p className="text-gray-500 mt-1">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <Button variant="outline" className="w-full">Edit Profile</Button>
          </div>
        </div>

        {/* --- Ride History Section --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Ride History</h2>
            <span className="text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full text-sm">
              {rideHistory.length} Total Rides
            </span>
          </div>

          <div className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                Loading your trips...
              </div>
            ) : rideHistory.length === 0 ? (
              <div className="text-center py-20 px-6">
                <div className="text-5xl mb-4">🚕</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No rides yet</h3>
                <p className="text-gray-500 mb-6">You haven't booked any rides with us yet. Ready to go somewhere?</p>
                <Link href="/dashboard">
                  <Button>Book a Ride Now</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {rideHistory.map((ride) => (
                  <li key={ride.id} className="p-6 hover:bg-gray-50 transition duration-150">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Locations & Date */}
                      <div className="flex-grow space-y-3">
                        <div className="flex items-center justify-between md:justify-start gap-4">
                          <span className="text-sm text-gray-500 font-medium">{formatDate(ride.created_at)}</span>
                          {getStatusBadge(ride.status)}
                        </div>
                        
                        <div className="relative pl-6 space-y-4">
                          {/* Timeline vertical line */}
                          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                          
                          <div className="relative flex items-center gap-3">
                            <div className="absolute -left-6 w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                            <p className="font-semibold text-gray-900">{ride.pickup_address}</p>
                          </div>
                          <div className="relative flex items-center gap-3">
                            <div className="absolute -left-6 w-2.5 h-2.5 rounded-none bg-black"></div>
                            <p className="font-semibold text-gray-900">{ride.dropoff_address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Fare & Details */}
                      <div className="flex flex-row md:flex-col justify-between items-end border-t md:border-t-0 border-gray-200 pt-4 md:pt-0">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">${parseFloat(ride.estimated_fare).toFixed(2)}</p>
                          <p className="text-sm text-gray-500 capitalize">{ride.ride_type} • {parseFloat(ride.distance).toFixed(1)} mi</p>
                        </div>
                        <Button variant="outline" size="sm" className="mt-2 hidden md:block">View Receipt</Button>
                      </div>

                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}