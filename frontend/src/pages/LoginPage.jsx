import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Visibility, VisibilityOff } from '@mui/icons-material';

export default function LoginPage() {
  const { login, selectBranch } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      
      // If result has selectBranch property, show branch selection screen
      if (result?.selectBranch && result?.branches) {
        setBranches(result.branches);
        return;
      }
      
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = (branchId) => {
    selectBranch(branchId);
    navigate('/');
  };

  // Branch Selection Screen
  if (branches) {
    return (
      <div className="min-h-screen bg-brand flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full" />
        </div>

        <div className="relative w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-accent rounded-2xl text-3xl mb-4 shadow-lg">
              ✝️
            </div>
            <h1 className="text-2xl font-bold text-white">Select Branch</h1>
            <p className="text-blue-200 text-sm mt-1">Choose a branch to manage</p>
          </div>

          {/* Branch Grid */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map(branch => (
                <button
                  key={branch._id}
                  onClick={() => handleSelectBranch(branch._id)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    selectedBranch === branch._id
                      ? 'border-brand-accent bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-brand hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{branch.name}</h3>
                      {branch.email && <p className="text-sm text-gray-600">{branch.email}</p>}
                      {branch.phone && <p className="text-sm text-gray-600">{branch.phone}</p>}
                    </div>
                    {selectedBranch === branch._id && (
                      <CheckCircle sx={{ color: '#3b82f6' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleSelectBranch(selectedBranch || branches[0]._id)}
              disabled={!selectedBranch && !branches.length}
              className="btn-primary w-full py-3 text-base mt-6"
            >
              Continue
            </button>

            <button
              onClick={() => {
                setBranches(null);
                setForm({ email: '', password: '' });
              }}
              className="w-full py-2 text-gray-600 hover:text-gray-800 mt-2"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login Screen
  return (
    <div className="min-h-screen bg-brand flex flex-col items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white rounded-full" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-accent rounded-2xl text-3xl mb-4 shadow-lg">
            ✝️
          </div>
          <h1 className="text-2xl font-bold text-white">Church CMS</h1>
          <p className="text-blue-200 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="admin@church.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          Contact your administrator to get access
        </p>
      </div>
    </div>
  );
}
