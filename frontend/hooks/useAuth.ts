// frontend/src/hooks/useAuth.ts
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';

export const useAuth = () => {
  const { isLoaded: isAuthLoaded, userId, isSignedIn } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  return {
    isLoaded: isAuthLoaded && isUserLoaded,
    isSignedIn,
    userId,
    user,
  };
};