// src/app/onboarding/page.tsx
"use client";

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // SMART ROUTING: Check if they already have a role when the page loads
  useEffect(() => {
    const checkExistingRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('clerk_id', user.id)
          .single();

        if (data?.role === 'driver') {
          router.push('/driver');
        } else if (data?.role === 'rider') {
          router.push('/dashboard');
        } else {
          setIsCheckingRole(false);
        }
      } catch (error) {
        setIsCheckingRole(false);
      }
    };

    if (isLoaded && user) {
      checkExistingRole();
    }
  }, [user, isLoaded, router]);

  const handleSelectRole = async (selectedRole: 'rider' | 'driver') => {
    if (!user) return;
    setIsUpdating(true);

    try {
      const userEmail = user.primaryEmailAddress?.emailAddress || '';
      
      // 👑 THE MASTER KEY: Change this to your actual email address!
      const isSuperAdmin = userEmail === 'biswabedantsingh001@gmail.com'; 
      
      // If it's your email, force the role to 'admin'. Otherwise, use the button they clicked.
      const finalRole = isSuperAdmin ? 'admin' : selectedRole;

      const { error } = await supabase.from('users').upsert({
        id: user.id,         
        clerk_id: user.id,
        first_name: user.firstName || 'User',
        last_name: user.lastName || 'Account',
        email: userEmail,
        profile_image: user.imageUrl || '',
        role: finalRole 
      }, { onConflict: 'clerk_id' });

      if (error) {
        alert(`Failed to save user: ${error.message}`);
        throw error;
      }

      // Smart Routing: Send admins straight to the Admin Control Panel
      if (isSuperAdmin) {
        router.push('/admin');
      } else if (finalRole === 'driver') {
        router.push('/driver');
      } else {
        router.push('/dashboard');
      }
      
    } catch (error) {
      console.error("Failed to set role:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isLoaded || isCheckingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CabBook!</h1>
        <p className="text-gray-500 mb-8">How would you like to use our platform today?</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-gray-200 hover:border-blue-500 rounded-xl p-6 cursor-pointer transition flex flex-col items-center group" onClick={() => handleSelectRole('rider')}>
            <div className="text-6xl mb-4 group-hover:scale-110 transition">🚕</div>
            <h2 className="text-xl font-bold text-gray-900">I need a ride</h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">Book rides, track drivers, and manage your trips.</p>
            <Button className="w-full mt-auto" disabled={isUpdating}>Continue as Rider</Button>
          </div>

          <div className="border-2 border-gray-200 hover:border-green-500 rounded-xl p-6 cursor-pointer transition flex flex-col items-center group" onClick={() => handleSelectRole('driver')}>
            <div className="text-6xl mb-4 group-hover:scale-110 transition">👨🏽‍✈️</div>
            <h2 className="text-xl font-bold text-gray-900">I want to drive</h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">Accept rides, earn money, and manage your vehicle.</p>
            <Button className="w-full mt-auto bg-green-600 hover:bg-green-700" disabled={isUpdating}>Continue as Driver</Button>
          </div>
        </div>
      </div>
    </div>
  );
}