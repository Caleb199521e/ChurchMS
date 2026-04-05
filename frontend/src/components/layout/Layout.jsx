import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CampaignIcon from '@mui/icons-material/Campaign';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChurchIcon from '@mui/icons-material/Church';

const navItems = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, exact: true },
  { to: '/members', label: 'Members', icon: PeopleIcon },
  { to: '/attendance', label: 'Attendance', icon: CheckCircleIcon },
  { to: '/announcements', label: 'Announcements', icon: CampaignIcon },
  { to: '/visitors', label: 'Visitors', icon: FavoriteBorderIcon },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center text-xl">
            <ChurchIcon sx={{ fontSize: 24, color: 'white' }} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Church CMS</p>
            <p className="text-xs text-blue-200">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-brand font-semibold shadow-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <IconComponent sx={{ fontSize: 20 }} />
              {item.label}
            </NavLink>
          );
        })}
        {isAdmin && (
          <NavLink
            to="/users"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-white text-brand font-semibold' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <SettingsIcon sx={{ fontSize: 20 }} />
            Users
          </NavLink>
        )}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-blue-300 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full text-left text-xs text-blue-300 hover:text-white transition-colors flex items-center gap-2 px-1 py-1">
          <LogoutIcon sx={{ fontSize: 16 }} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-brand flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-brand flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <MenuIcon sx={{ fontSize: 24 }} />
          </button>
          <div className="flex items-center gap-2">
            <ChurchIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
            <span className="font-bold text-brand text-sm">Church CMS</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
