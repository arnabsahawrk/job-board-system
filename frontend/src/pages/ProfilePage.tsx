import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { User, Lock, Camera, Upload, Eye, EyeOff } from 'lucide-react';

type ProfileTab = 'profile' | 'password';

interface ProfileFormData {
  full_name: string;
  phone: string;
  bio: string;
  skills: string;
}

interface PasswordFormData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.profile?.phone_number || '',
      bio: user?.profile?.bio || '',
      skills: user?.profile?.skills || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('full_name', data.full_name);
      if (data.phone) formData.append('phone', data.phone);
      if (data.bio) formData.append('bio', data.bio);
      if (data.skills) formData.append('skills', data.skills);

      const avatarFile = avatarRef.current?.files?.[0];
      if (avatarFile) formData.append('avatar', avatarFile);

      const resumeFile = resumeRef.current?.files?.[0];
      if (resumeFile) formData.append('resume', resumeFile);

      const response = await authApi.updateProfile(formData);
      setUser(response.data);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
      });
      toast.success('Password changed successfully!');
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-fit">
          {[
            { id: 'profile' as ProfileTab, label: 'Profile', icon: User },
            { id: 'password' as ProfileTab, label: 'Password', icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="card p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 overflow-hidden">
                  {avatarPreview || user?.profile?.avatar ? (
                    <img src={avatarPreview || user?.profile?.avatar || ''} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-bold">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
                >
                  <Camera size={14} />
                </button>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{user?.full_name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                <span className="badge badge-primary text-xs mt-1">{user?.role}</span>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  {...profileForm.register('full_name', { required: true })}
                  className="input"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  {...profileForm.register('phone')}
                  className="input"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea
                {...profileForm.register('bio')}
                className="input min-h-[100px] resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="label">Skills (comma separated)</label>
              <input
                {...profileForm.register('skills')}
                className="input"
                placeholder="React, TypeScript, Node.js..."
              />
            </div>

            {user?.role === 'seeker' && (
              <div>
                <label className="label">Resume</label>
                <div
                  onClick={() => resumeRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:border-primary-400 transition-colors text-center"
                >
                  <Upload size={20} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {resumeRef.current?.files?.[0]?.name || (user?.profile?.resume ? 'Replace resume (PDF)' : 'Upload resume (PDF)')}
                  </p>
                </div>
                <input ref={resumeRef} type="file" accept=".pdf" className="hidden" onChange={() => profileForm.trigger()} />
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="card p-6 space-y-4">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input
                  {...passwordForm.register('old_password', { required: true })}
                  type={showOldPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  {...passwordForm.register('new_password', { required: true, minLength: 6 })}
                  type={showNewPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                {...passwordForm.register('confirm_password', { required: true })}
                type="password"
                className="input"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
