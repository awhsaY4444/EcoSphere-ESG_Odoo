import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Leaf, Users, Shield, Trophy, FileText, Settings, LogOut, Bell, Earth, Info, X, Brain, Fingerprint, Compass, ShieldCheck, TrendingUp } from 'lucide-react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasNotification, setHasNotification] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      if (res.data && res.data.length > 0) {
        setHasNotification(true);
      } else {
        setHasNotification(false);
      }
    } catch (e) {
      console.error("Failed to fetch notifications");
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications/');
      toast("All notifications cleared", 'info');
      fetchNotifications();
    } catch (e) {
      toast("Failed to clear notifications", 'error');
    }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent clicking the notification body
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      toast("Failed to delete notification", 'error');
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUserProfile(res.data);
    } catch (e) {
      console.error("Failed to fetch profile");
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchProfile();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setHasNotification(false);
    }
  };

  const [toastMsg, setToastMsg] = useState<{message: string, type: string} | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToastMsg({ message: e.detail.message, type: e.detail.type });
      setTimeout(() => setToastMsg(null), 4000);
    };
    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  const handleNotificationClick = (notification: any) => {
    let path = '/dashboard';
    switch (notification.type) {
      case 'BadgeUnlock':
      case 'Gamification':
        path = '/gamification';
        break;
      case 'Approval':
        path = '/social';
        break;
      case 'Compliance':
      case 'Governance':
        path = '/governance';
        break;
      case 'Environmental':
        path = '/environmental';
        break;
      default:
        path = '/dashboard';
    }
    setShowNotifications(false);
    navigate(path);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Environmental', path: '/environmental', icon: <Leaf size={18} /> },
    { name: 'EcoTwin Simulation', path: '/ecotwin', icon: <Brain size={18} /> },
    { name: 'Carbon DNA Lineage', path: '/carbon-dna', icon: <Fingerprint size={18} /> },
    { name: 'EcoPilot Assistant', path: '/ecopilot', icon: <Compass size={18} /> },
    { name: 'GreenShield AI', path: '/greenshield', icon: <ShieldCheck size={18} /> },
    { name: 'EcoOptimizer', path: '/ecooptimizer', icon: <TrendingUp size={18} /> },
    { name: 'Social', path: '/social', icon: <Users size={18} /> },
    { name: 'Governance', path: '/governance', icon: <Shield size={18} /> },
    { name: 'Gamification', path: '/gamification', icon: <Trophy size={18} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-gray-200 font-sans selection:bg-orange-500/30">
      
      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`glass-panel px-6 py-4 rounded-xl border flex items-center gap-3 shadow-2xl ${
            toastMsg.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 
            toastMsg.type === 'error' ? 'border-red-500/30 bg-red-500/10' : 
            'border-blue-500/30 bg-blue-500/10'
          }`}>
            {toastMsg.type === 'success' && <span className="text-green-400">✓</span>}
            {toastMsg.type === 'error' && <span className="text-red-400">✕</span>}
            {toastMsg.type === 'info' && <span className="text-blue-400">ℹ</span>}
            <p className="text-sm font-medium text-white">{toastMsg.message}</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="w-64 glass-panel border-r border-white/5 flex flex-col z-10 relative">
        {/* Subtle background glow behind sidebar */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none"></div>
        
        <div className="p-6 relative z-10">
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-500 to-blue-500 flex items-center justify-center shadow-lg shadow-green-500/20 text-white">
              <Earth size={18} />
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">EcoSphere</span>
          </h1>
          <h2 className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.2em] font-semibold">ESG Management</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 relative z-10">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive 
                    ? 'bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500 text-orange-400 font-medium' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <span className={`${isActive ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
                {/* Simulated sub-navigation */}
                {isActive && item.name === 'Environmental' && (
                  <div className="ml-10 mt-1 mb-2 space-y-1 text-[13px] text-gray-500">
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Emission Factors'}}))} className="py-1.5 hover:text-orange-400 cursor-pointer transition-colors">Emission Factors</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Product ESG Profiles'}}))} className="py-1.5 hover:text-orange-400 cursor-pointer transition-colors">Product ESG Profiles</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Carbon Transactions'}}))} className="py-1.5 hover:text-orange-400 cursor-pointer transition-colors">Carbon Transactions</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Environmental Goals'}}))} className="py-1.5 hover:text-orange-400 cursor-pointer transition-colors text-gray-300">Environmental Goals</div>
                  </div>
                )}
                {isActive && item.name === 'Gamification' && (
                  <div className="ml-10 mt-1 mb-2 space-y-1 text-[13px] text-gray-500">
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Challenges'}}))} className="py-1.5 hover:text-orange-400 cursor-pointer transition-colors text-gray-300">Challenges</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Participation'}}))} className="py-1.5 hover:text-orange-400 cursor-pointer transition-colors">Challenge Participation</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Badges'}}))} className="py-1.5 hover:text-orange-400 cursor-pointer transition-colors">Badges</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Leaderboard'}}))} className="py-1.5 hover:text-orange-400 cursor-pointer transition-colors">Leaderboard</div>
                  </div>
                )}
                {isActive && item.name === 'Social' && (
                  <div className="ml-10 mt-1 mb-2 space-y-1 text-[13px] text-gray-500">
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'CSR Activities'}}))} className="py-1.5 hover:text-blue-400 cursor-pointer transition-colors text-gray-300">CSR Activities</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Employee Participation'}}))} className="py-1.5 hover:text-blue-400 cursor-pointer transition-colors">Employee Participation</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Diversity Dashboard'}}))} className="py-1.5 hover:text-blue-400 cursor-pointer transition-colors">Diversity Dashboard</div>
                  </div>
                )}
                {isActive && item.name === 'Governance' && (
                  <div className="ml-10 mt-1 mb-2 space-y-1 text-[13px] text-gray-500">
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Policies'}}))} className="py-1.5 hover:text-purple-400 cursor-pointer transition-colors text-gray-300">Policies</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Policy Acknowledgements'}}))} className="py-1.5 hover:text-purple-400 cursor-pointer transition-colors">Policy Acknowledgements</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Audits'}}))} className="py-1.5 hover:text-purple-400 cursor-pointer transition-colors">Audits</div>
                    <div onClick={() => window.dispatchEvent(new CustomEvent('change-tab', {detail: {tab: 'Compliance Issues'}}))} className="py-1.5 hover:text-purple-400 cursor-pointer transition-colors">Compliance Issues</div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-white/5 relative z-10">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors group"
          >
            <LogOut size={16} className="group-hover:text-red-400 transition-colors" /> Logout
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none translate-y-1/3"></div>
        
        {/* Top Header */}
        <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="text-gray-400 text-sm font-medium">
            Good morning, <span className="text-white">{userProfile ? userProfile.name : 'Loading...'}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={async () => {
                try {
                  const res = await api.post('/notifications/check-overdue');
                  toast(res.data.message, 'success');
                  await fetchNotifications(); // Refresh notifications
                } catch (err) {
                  toast("Failed to run system checks", 'error');
                }
              }}
              className="px-4 py-1.5 text-xs font-medium border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/5 transition-all shadow-sm"
            >
              Run System Checks
            </button>
            <div className="relative" ref={dropdownRef}>
              <div 
                className={`relative cursor-pointer transition-colors group ${showNotifications ? 'text-orange-400' : 'text-gray-400 hover:text-orange-400'}`}
                onClick={handleBellClick}
              >
                <Bell size={20} className="group-hover:animate-swing" />
                {/* Notification dot indicator */}
                {hasNotification && !showNotifications && (
                  <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] ring-2 ring-[#09090b]"></span>
                )}
              </div>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={clearAllNotifications}
                          className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/10"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {notifications.map((n, i) => (
                          <div 
                            key={i} 
                            className="p-4 hover:bg-white/5 transition-colors cursor-pointer group relative"
                            onClick={() => handleNotificationClick(n)}
                          >
                            <button 
                              onClick={(e) => deleteNotification(n.id, e)}
                              className="absolute top-2 right-2 p-1 rounded-md text-gray-500 hover:text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={14} />
                            </button>
                            <div className="flex gap-3">
                              <div className="mt-0.5 text-orange-400">
                                <Info size={16} />
                              </div>
                              <div className="pr-4">
                                <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{n.message}</p>
                                <span className="text-xs text-gray-500 mt-1 block">
                                  {new Date(n.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        No new notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/profile" className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 p-[2px] cursor-pointer shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-[#18181b] border-2 border-transparent overflow-hidden flex items-center justify-center">
                  <span className="text-orange-500 text-xs font-bold">{userProfile ? userProfile.name.charAt(0).toUpperCase() : 'A'}</span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto flex flex-col relative z-0">
          
          <div className="flex-1 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
