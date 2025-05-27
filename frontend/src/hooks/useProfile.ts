import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getProfile, updateProfile, type UserProfile } from '../api/users';

export const useProfile = () => {
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProfile();
      setProfile(data);
      setUser(data);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      setError(null);
      const updatedProfile = await updateProfile(data);
      setProfile(updatedProfile);
      setUser(updatedProfile);
      return { success: true };
    } catch (err) {
      const errorMessage = 'Failed to update profile';
      setError(errorMessage);
      console.error('Error updating profile:', err);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateUserProfile,
    refetch: fetchProfile,
  };
}; 