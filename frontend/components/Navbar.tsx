// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; 

export default function Navbar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser(); 
  
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (user?.id) {
        try {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (data) {
            setRole(data.role); 
          }
        } catch (error) {
          console.error("Error fetching role for navbar:", error);
        }
      }
    };
    fetchRole();
  }, [user?.id]);

  // LOGICAL ROUTING: Build the navigation links based ONLY on their role
  const navLinks = [];
  
  if (role === 'rider') {
    navLinks.push({ name: 'Book a Ride', href: '/dashboard' });
    navLinks.push({ name: 'Help & Support', href: '/support' }); // Only Riders get this!
  } else if (role === 'driver') {
    navLinks.push({ name: 'Driver Terminal', href: '/driver' });
  } else if (role === 'admin') {
    navLinks.push({ name: 'Admin Control', href: '/admin' });
  }

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              CabBook
            </span>
            {role && (
              <span className="hidden md:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                {role} Mode
              </span>
            )}
          </Link>

          {/* Navigation Links & Auth */}
          <div className="flex items-center gap-6">
            
            {isLoaded && isSignedIn && (
              <>
                <div className="hidden md:flex items-center gap-6 mr-4">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link 
                        key={link.name} 
                        href={link.href} 
                        className={`text-sm font-bold transition-colors duration-200 ${
                          isActive 
                            ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
                <UserButton /> 
              </>
            )}

            {isLoaded && !isSignedIn && (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-600 hover:text-blue-600 transition cursor-pointer">
                    Log in
                  </button>
                </SignInButton>
                
                <SignUpButton mode="modal">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-full transition shadow-md hover:shadow-lg cursor-pointer ml-4">
                    Sign up
                  </button>
                </SignUpButton>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}