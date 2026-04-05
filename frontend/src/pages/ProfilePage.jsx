import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import { toast } from '../components/common/Toaster';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';

export default function ProfilePage() {
  const { user } = useAuth();
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!passwordForm.currentPassword.trim()) {
      setError('Current password is required');
      return;
    }
    if (!passwordForm.newPassword.trim()) {
      setError('New password is required');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordModalOpen(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to change password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PageHeader
          title="My Profile"
          subtitle="Manage your account settings"
        />

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <AccountCircleIcon sx={{ fontSize: 64, color: '#3b82f6' }} />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{user?.name}</h2>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <EmailIcon sx={{ fontSize: 18 }} />
                  <span>{user?.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Role:</span>
                  <span className="capitalize px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {user?.role?.replace('-', ' ')}
                  </span>
                </p>
                {user?.branchId && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Branch:</span>
                    <span>Assigned to branch</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <LockIcon sx={{ fontSize: 20, color: '#ca8a04' }} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Password & Security</h3>
                <p className="text-sm text-gray-500">Manage your password</p>
              </div>
            </div>
            <button
              onClick={() => {
                setError('');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setChangePasswordModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Change Password
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Keep your account secure by using a strong, unique password.
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Account Type:</span> {user?.role === 'super-admin' ? 'Administrator' : 'Staff Member'}
          </p>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        title="Change Password"
      >
        <form onSubmit={handleSubmitPassword} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label">Current Password *</label>
            <input
              type="password"
              name="currentPassword"
              className="input"
              placeholder="Enter your current password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div>
            <label className="label">New Password *</label>
            <input
              type="password"
              name="newPassword"
              className="input"
              placeholder="Enter new password (min. 6 characters)"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div>
            <label className="label">Confirm New Password *</label>
            <input
              type="password"
              name="confirmPassword"
              className="input"
              placeholder="Confirm your new password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Password Requirements:</span>
              <ul className="list-disc list-inside mt-1 text-xs">
                <li>Minimum 6 characters</li>
                <li>Must be different from current password</li>
                <li>Passwords must match</li>
              </ul>
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setChangePasswordModalOpen(false)}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
