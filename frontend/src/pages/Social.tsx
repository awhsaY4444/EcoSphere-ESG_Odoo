import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Social() {
  const [activeTab, setActiveTab] = useState('CSR Activities');
  const [mockActivities, setActivities] = useState<any[]>([]);
  const [mockApprovals, setApprovals] = useState<any[]>([]);

  const fetchData = () => {
    api.get('/social/activities')
      .then(res => setActivities(res.data))
      .catch(err => console.error(err));
      
    api.get('/social/approvals')
      .then(res => setApprovals(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchData();
    
    const handleTabChange = (e: any) => {
      const tab = e.detail.tab;
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  const handleJoinActivity = (activityId: number) => {
    api.post(`/social/activities/${activityId}/join`)
      .then(() => {
        toast('Joined activity successfully!', 'success');
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to join activity.', 'error'));
  };

  const handleApprove = (participationId: number) => {
    api.post(`/social/csr-participations/${participationId}/approve`)
      .then(() => {
        toast('Approved successfully!', 'success');
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to approve.', 'error'));
  };

  const handleReject = (participationId: number) => {
    api.post(`/social/csr-participations/${participationId}/reject`)
      .then(() => {
        toast('Rejected successfully!', 'success');
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to reject.', 'error'));
  };

  const handleNewActivity = () => {
    const title = window.prompt("Enter activity title:");
    if (title) {
      toast("New CSR Activity creation endpoint not fully implemented in UI.", 'info');
    }
  };

  return (
    <div className="space-y-8">
      {/* Sub Tabs */}
      <div className="flex space-x-2 text-sm bg-white/5 p-1 rounded-lg border border-white/5 w-fit">
        {['CSR Activities', 'Employee Participation', 'Diversity Dashboard'].map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-5 py-2 rounded-md font-medium cursor-pointer transition-all ${activeTab === tab ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {tab}
          </div>
        ))}
      </div>

      {activeTab === 'CSR Activities' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex justify-between items-center bg-[#18181b] p-4 rounded-xl border border-white/5">
        <button onClick={handleNewActivity} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
          <span>+</span> New Activity
        </button>
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {mockActivities.map(activity => (
          <div key={activity.id} className="glass-panel rounded-2xl border border-white/5 hover:border-blue-500/30 p-6 flex flex-col justify-between h-48 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-colors"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-gray-100 text-lg leading-tight flex items-center gap-3 mb-3">
                <span className="text-2xl drop-shadow-md">{activity.icon}</span> {activity.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-blue-400 font-medium">{activity.joined}</span> joined
              </div>
              {activity.evidenceReq ? (
                <div className="text-xs text-amber-500/80 mt-2 flex items-center gap-1">
                  <span>📸</span> Evidence Required
                </div>
              ) : (
                <div className="text-xs text-green-500/80 mt-2 flex items-center gap-1">
                  <span>🔓</span> Open to all
                </div>
              )}
            </div>
            
            <div className="mt-4 relative z-10">
              {activity.has_joined ? (
                <button disabled className="w-full bg-white/5 border border-white/10 text-gray-400 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                  Joined
                </button>
              ) : (
                <button onClick={() => handleJoinActivity(activity.id)} className="w-full bg-white/10 hover:bg-blue-500 border border-white/10 hover:border-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-all shadow-sm">
                  Join Activity
                </button>
              )}
            </div>
          </div>
        ))}
        {mockActivities.length === 0 && (
          <div className="col-span-4 text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-2xl">
            <div className="text-4xl mb-3">🤝</div>
            <p>No CSR activities found.</p>
          </div>
        )}
      </div>
      </div>
      )}

      {/* Approval Queue Table */}
      {activeTab === 'Employee Participation' && (
      <div className="glass-panel rounded-2xl overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Employee Participation Queue
          </h3>
        </div>
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Employee</th>
              <th className="px-6 py-4 font-medium">Activity/Challenge</th>
              <th className="px-6 py-4 font-medium">Proof</th>
              <th className="px-6 py-4 font-medium">Points</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mockApprovals.map(approval => (
              <tr key={approval.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">{approval.employee}</td>
                <td className="px-6 py-4">{approval.activity}</td>
                <td className="px-6 py-4 text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">{approval.proof}</td>
                <td className="px-6 py-4 font-medium">{approval.points}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${approval.statusColor.includes('green') ? 'bg-green-500/20 text-green-400' : approval.statusColor.includes('red') ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {approval.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {approval.status === 'Pending' && (
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleApprove(approval.id)}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(approval.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {mockApprovals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No participation records pending approval.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {activeTab === 'Diversity Dashboard' && (
        <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              <h4 className="text-gray-400 text-sm font-medium mb-1">Gender Diversity</h4>
              <p className="text-3xl font-black text-gray-100">42% <span className="text-sm font-medium text-blue-400">+3% YoY</span></p>
              <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              <h4 className="text-gray-400 text-sm font-medium mb-1">Underrepresented Groups</h4>
              <p className="text-3xl font-black text-gray-100">28% <span className="text-sm font-medium text-purple-400">+5% YoY</span></p>
              <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-2 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              <h4 className="text-gray-400 text-sm font-medium mb-1">Pay Equity Gap</h4>
              <p className="text-3xl font-black text-gray-100">1.2% <span className="text-sm font-medium text-emerald-400">-0.5% YoY</span></p>
              <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden flex">
                <div className="bg-emerald-500 h-2" style={{ width: '98.8%' }}></div>
                <div className="bg-red-500 h-2" style={{ width: '1.2%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="glass-panel rounded-2xl overflow-hidden p-8 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
            <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Inclusion Initiatives Tracker
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 font-medium">Unconscious Bias Training Completion</span>
                  <span className="text-blue-400 font-bold">85%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 font-medium">Mentorship Program Enrollments</span>
                  <span className="text-indigo-400 font-bold">62%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: '62%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 font-medium">Employee Resource Group (ERG) Active Members</span>
                  <span className="text-purple-400 font-bold">40%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-purple-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
