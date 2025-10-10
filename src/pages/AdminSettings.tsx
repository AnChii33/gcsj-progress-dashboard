import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Lock, Mail, AlertCircle, CheckCircle, Users } from 'lucide-react';

export function AdminSettings() {
  const { currentAdminEmail, changeCredentials, getCoreTeamCredentials, updateCoreTeamCredentials } = useAuth();
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState(currentAdminEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [coreTeamEmail, setCoreTeamEmail] = useState('');
  const [newCoreTeamEmail, setNewCoreTeamEmail] = useState('');
  const [newCoreTeamPassword, setNewCoreTeamPassword] = useState('');
  const [coreTeamError, setCoreTeamError] = useState('');
  const [coreTeamSuccess, setCoreTeamSuccess] = useState(false);
  const [coreTeamLoading, setCoreTeamLoading] = useState(false);

  useEffect(() => {
    const fetchCoreTeamCreds = async () => {
      const creds = await getCoreTeamCredentials();
      if (creds) {
        setCoreTeamEmail(creds.email);
        setNewCoreTeamEmail(creds.email);
      }
    };
    fetchCoreTeamCreds();
  }, [getCoreTeamCredentials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!newEmail.trim()) {
      setError('Email is required');
      return;
    }

    if (!newPassword) {
      setError('Password is required');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const result = await changeCredentials(
      currentAdminEmail!,
      newEmail.trim(),
      newPassword
    );

    if (result) {
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } else {
      setError('Failed to update credentials. Please try again.');
    }

    setLoading(false);
  };

  const handleCoreTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCoreTeamError('');
    setCoreTeamSuccess(false);

    if (!newCoreTeamEmail.trim()) {
      setCoreTeamError('Email is required');
      return;
    }

    if (!newCoreTeamPassword) {
      setCoreTeamError('Password is required');
      return;
    }

    if (newCoreTeamPassword.length < 8) {
      setCoreTeamError('Password must be at least 8 characters long');
      return;
    }

    setCoreTeamLoading(true);

    const result = await updateCoreTeamCredentials(
      coreTeamEmail,
      newCoreTeamEmail.trim(),
      newCoreTeamPassword
    );

    if (result) {
      setCoreTeamSuccess(true);
      setNewCoreTeamPassword('');
      setCoreTeamEmail(newCoreTeamEmail.trim());

      setTimeout(() => {
        setCoreTeamSuccess(false);
      }, 3000);
    } else {
      setCoreTeamError('Failed to update Core Team credentials. Please try again.');
    }

    setCoreTeamLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Settings</h1>
            <p className="text-sm text-slate-600 mt-1">
              Update your admin and core team credentials
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Change Admin Credentials</h2>
            <p className="text-slate-600 text-sm">
              Update your email and password. You will need to log in again after changing credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="current-email" className="block text-sm font-medium text-slate-700 mb-2">
                Current Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="current-email"
                  type="email"
                  value={currentAdminEmail || ''}
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-email" className="block text-sm font-medium text-slate-700 mb-2">
                New Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="admin@stcet.edu.in"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Enter new password (min 8 characters)"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Credentials updated successfully!</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Credentials'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Important:</strong> After updating your credentials, you will remain logged in during this session.
              The new credentials will be required for your next login.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Change Core Team Credentials</h2>
            <p className="text-slate-600 text-sm">
              Update the email and password for the Core Team user role.
            </p>
          </div>

          <form onSubmit={handleCoreTeamSubmit} className="space-y-6">
            <div>
              <label htmlFor="core-team-email" className="block text-sm font-medium text-slate-700 mb-2">
                New Core Team Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="core-team-email"
                  type="email"
                  value={newCoreTeamEmail}
                  onChange={(e) => setNewCoreTeamEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  placeholder="coreteam@stcet.edu.in"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="core-team-password" className="block text-sm font-medium text-slate-700 mb-2">
                New Core Team Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="core-team-password"
                  type="password"
                  value={newCoreTeamPassword}
                  onChange={(e) => setNewCoreTeamPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  placeholder="Enter new password (min 8 characters)"
                  required
                />
              </div>
            </div>

            {coreTeamError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{coreTeamError}</span>
              </div>
            )}

            {coreTeamSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Core Team credentials updated successfully!</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={coreTeamLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {coreTeamLoading ? 'Updating...' : 'Update Core Team Credentials'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}