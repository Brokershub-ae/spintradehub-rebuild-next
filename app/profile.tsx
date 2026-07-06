'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { userService } from '@/lib/firebase-service';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await userService.getUserProfile(user.uid);
        setProfile(profileData);
        setFormData(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (authLoading || loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/feed" className="text-blue-600 hover:underline">
            ← Back to Feed
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-4xl">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-600">@{profile.username}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {profile.role} | {profile.region}
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto p-4 grid grid-cols-3 gap-4">
        {/* Main Profile Info */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Account Details</h2>

            {isEditing ? (
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Full Name</label>
                    <input
                      type="text"
                      value={formData?.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Username</label>
                    <input
                      type="text"
                      value={formData?.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Phone</label>
                    <input
                      type="tel"
                      value={formData?.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Region</label>
                    <input
                      type="text"
                      value={formData?.region || ''}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(profile);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await userService.updateProfile(user!.uid, formData);
                        setProfile(formData);
                        setIsEditing(false);
                      } catch (error) {
                        console.error('Error updating profile:', error);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Email</p>
                  <p className="font-semibold">{profile.email}</p>
                </div>
                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Phone</p>
                  <p className="font-semibold">{profile.phone}</p>
                </div>
                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Region</p>
                  <p className="font-semibold">{profile.region}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Role</p>
                  <p className="font-semibold capitalize">{profile.role}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <Link href="/messages" className="block px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-center">
              Messages
            </Link>
            <Link href="/network" className="block px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-center">
              Network
            </Link>
            <Link href="/dashboard" className="block px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-center">
              Dashboard
            </Link>
            <Link href="/settings" className="block px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-center">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
