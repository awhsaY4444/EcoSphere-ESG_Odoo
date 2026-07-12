import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Leaf, Users, Shield, Trophy, FileText, Settings, LogOut } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Environmental', path: '/environmental', icon: <Leaf size={18} /> },
    { name: 'Social', path: '/social', icon: <Users size={18} /> },
    { name: 'Governance', path: '/governance', icon: <Shield size={18} /> },
    { name: 'Gamification', path: '/gamification', icon: <Trophy size={18} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-[#121212] text-gray-200 font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-[#1e1e1e] border-r border-gray-800 flex flex-col">
        <div className="p-4 py-6">
          <h1 className="text-xl font-bold text-white tracking-wide">EcoSphere: <span className="text-gray-400 font-normal">ESG Management Platform</span></h1>
          <h2 className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Sidebar Navigation</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-gray-800 text-green-500 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
                {/* Simulated sub-navigation for Environmental and others if active */}
                {isActive && item.name === 'Environmental' && (
                  <div className="ml-9 mt-1 space-y-1 text-sm text-gray-500">
                    <div className="py-1 hover:text-white cursor-pointer">Emission Factors</div>
                    <div className="py-1 hover:text-white cursor-pointer">Product ESG Profiles</div>
                    <div className="py-1 hover:text-white cursor-pointer">Carbon Transactions</div>
                    <div className="py-1 hover:text-white cursor-pointer text-gray-300">Environmental Goals</div>
                  </div>
                )}
                {isActive && item.name === 'Social' && (
                  <div className="ml-9 mt-1 space-y-1 text-sm text-gray-500">
                    <div className="py-1 hover:text-white cursor-pointer text-gray-300">CSR Activities</div>
                    <div className="py-1 hover:text-white cursor-pointer">Employee Participation</div>
                    <div className="py-1 hover:text-white cursor-pointer">Diversity Dashboard</div>
                  </div>
                )}
                 {isActive && item.name === 'Governance' && (
                  <div className="ml-9 mt-1 space-y-1 text-sm text-gray-500">
                    <div className="py-1 hover:text-white cursor-pointer">Policies</div>
                    <div className="py-1 hover:text-white cursor-pointer">Policy Acknowledgements</div>
                    <div className="py-1 hover:text-white cursor-pointer text-gray-300">Audits</div>
                    <div className="py-1 hover:text-white cursor-pointer">Compliance Issues</div>
                  </div>
                )}
                {isActive && item.name === 'Gamification' && (
                  <div className="ml-9 mt-1 space-y-1 text-sm text-gray-500">
                    <div className="py-1 hover:text-white cursor-pointer text-gray-300">Challenges</div>
                    <div className="py-1 hover:text-white cursor-pointer">Challenge Participation</div>
                    <div className="py-1 hover:text-white cursor-pointer">Badges</div>
                    <div className="py-1 hover:text-white cursor-pointer">Rewards</div>
                    <div className="py-1 hover:text-white cursor-pointer">Leaderboard</div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 rounded hover:bg-gray-800 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
