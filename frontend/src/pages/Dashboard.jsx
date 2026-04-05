import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddIcon from '@mui/icons-material/Add';
import WavingHandIcon from '@mui/icons-material/WavingHand';

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => (
  <Link to={to} className={`card flex items-center gap-4 hover:shadow-md transition-shadow ${color}`}>
    <div className="text-3xl text-gray-600"><Icon sx={{ fontSize: 40 }} /></div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </Link>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">Good day, {user?.name?.split(' ')[0]} <WavingHandIcon sx={{ fontSize: 28, color: '#3b82f6' }} /></h1>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={PeopleIcon} label="Total Members" value={stats?.totalMembers} to="/members" />
          <StatCard icon={CheckCircleIcon} label="Today's Service" value={stats?.todayAttendanceCount}
            sub={stats?.todayService ? stats.todayService.serviceType : 'No service yet'} to="/attendance" />
          <StatCard icon={FavoriteBorderIcon} label="New Visitors" value={stats?.recentVisitors?.length} to="/visitors" />
          <StatCard icon={PersonAddIcon} label="New This Month" value={stats?.newMembersThisMonth} sub="members joined" to="/members" />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><CampaignIcon sx={{ fontSize: 24 }} /> Announcements</h2>
            <Link to="/announcements" className="text-xs text-brand hover:underline font-medium">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : stats?.latestAnnouncements?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {stats?.latestAnnouncements?.map(a => (
                <div key={a._id} className={`p-3 rounded-lg border-l-4 ${a.priority === 'urgent' ? 'border-red-500 bg-red-50' : 'border-brand bg-blue-50'}`}>
                  <p className="font-semibold text-sm text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Visitors */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><FavoriteBorderIcon sx={{ fontSize: 24 }} /> Recent Visitors</h2>
            <Link to="/visitors" className="text-xs text-brand hover:underline font-medium">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : stats?.recentVisitors?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No recent visitors.</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentVisitors?.map(v => (
                <div key={v._id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center text-sm font-bold text-brand">
                      {v.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{v.name}</p>
                      <p className="text-xs text-gray-400">{v.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(v.firstVisitDate).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-5">
        <h2 className="font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Member', icon: AddIcon, to: '/members' },
            { label: 'Mark Attendance', icon: CheckCircleIcon, to: '/attendance' },
            { label: 'Add Visitor', icon: FavoriteBorderIcon, to: '/visitors' },
            { label: 'Post Announcement', icon: CampaignIcon, to: '/announcements' },
          ].map(action => {
            const IconComponent = action.icon;
            return (
              <Link key={action.label} to={action.to}
                className="card text-center hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer p-4">
                <div className="text-2xl mb-1 text-gray-600"><IconComponent sx={{ fontSize: 32 }} /></div>
                <p className="text-xs font-semibold text-gray-700">{action.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
