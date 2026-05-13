import React, { useState } from 'react';
import { User, Shield, Mail, Calendar, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/UI';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Settings() {
  const { profile, user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        updatedAt: new Date().toISOString()
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Error updating profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500">Manage your profile and account preferences</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center text-blue-700 text-3xl font-bold mb-4">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
              {profile?.role}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Calendar size={14} />
              Joined {new Date(profile?.createdAt || '').toLocaleDateString()}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Full Name" 
              name="name" 
              defaultValue={profile?.name} 
              required 
            />
            <div className="space-y-1.5 opacity-60">
              <label className="text-sm font-medium text-slate-700">Email Address (Locked)</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                <Mail size={16} />
                {profile?.email}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Your Permissions</p>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                As a <span className="font-bold">{profile?.role}</span>, you have access to 
                {profile?.role === 'admin' ? ' all system features including user management and data deletion.' : 
                 profile?.role === 'manager' ? ' inventory, vendor, and customer management.' : 
                 ' basic record keeping for sales and purchases.'}
              </p>
            </div>
          </div>

          {message && (
            <p className={cn(
              "text-sm font-medium text-center py-2 rounded-lg",
              message.includes('Error') ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
            )}>
              {message}
            </p>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={isUpdating}>
              <Save size={20} />
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-red-50 rounded-2xl border border-red-100 p-8">
        <h3 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-700 mb-6">
          Once you sign out, you will need to re-authenticate with Google. 
          For security reasons, some sessions might expire periodically.
        </p>
        <Button variant="danger" onClick={() => window.location.href = '/login'}>
          Account Log Out
        </Button>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
