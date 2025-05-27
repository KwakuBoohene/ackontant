import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import DashboardLayout from '../layouts/DashboardLayout';
import { useProfile } from '../hooks/useProfile';

const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isLoading, error: profileError, updateProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const result = await updateProfile({
      first_name: profile.first_name,
      last_name: profile.last_name
    });

    if (result.success) {
      setSuccess('Profile updated successfully');
    } else {
      setError(result.error || 'Failed to update profile');
    }

    setIsSaving(false);
  };

  if (isLoading || !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Profile Settings</h1>

        {(error || profileError) && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
            {error || profileError}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1e293b] rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-700 rounded-md text-white disabled:opacity-50"
                />
                {!profile.is_email_verified && (
                  <p className="mt-1 text-sm text-yellow-500">
                    Please verify your email address
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-400 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={profile.first_name}
                  onChange={(e) => profile && updateProfile({ ...profile, first_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-400 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  value={profile.last_name}
                  onChange={(e) => profile && updateProfile({ ...profile, last_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="base_currency" className="block text-sm font-medium text-gray-400 mb-1">
                  Base Currency
                </label>
                <input
                  type="text"
                  id="base_currency"
                  value={profile.base_currency ? `${profile.base_currency.code} - ${profile.base_currency.name}` : 'Not set'}
                  disabled
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-700 rounded-md text-white disabled:opacity-50"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Base currency can only be changed by an administrator
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettingsPage; 