import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Gamification() {
  const [activeTab, setActiveTab] = useState('Challenges');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [mockChallenges, setChallenges] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [myStats, setMyStats] = useState({ xp: 0, points: 0 });

  const fetchData = () => {
    api.get('/gamification/challenges').then(res => setChallenges(res.data)).catch(console.error);
    api.get('/gamification/participations').then(res => setParticipations(res.data)).catch(console.error);
    api.get('/master_data/rewards').then(res => setRewards(res.data)).catch(console.error);
    api.get('/gamification/badges').then(res => setBadges(res.data)).catch(console.error);
    api.get('/gamification/leaderboard').then(res => setLeaderboard(res.data)).catch(console.error);
    api.get('/gamification/me').then(res => setMyStats(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchData();
    
    const handleTabChange = (e: any) => {
      const tab = e.detail.tab;
      if (tab === 'Challenges' || tab === 'Participation') {
        setActiveTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (tab === 'Badges') {
        const el = document.getElementById('badges-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'Leaderboard') {
        const el = document.getElementById('leaderboard-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  const handleRedeem = (rewardId: number) => {
    api.post(`/gamification/redemptions?reward_id=${rewardId}`)
      .then(() => {
        toast('Reward redeemed successfully!', 'success');
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to redeem reward.', 'error'));
  };

  const handleJoinChallenge = (challengeId: number) => {
    api.post(`/gamification/challenges/${challengeId}/join`)
      .then(() => {
        fetchData();
        toast("Joined challenge successfully!", "success");
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to join challenge.', 'error'));
  };

  const handleApprove = async (participationId: number) => {
    try {
      await api.post(`/social/challenge-participations/${participationId}/approve`);
      fetchData();
      toast("Participation approved!", "success");
    } catch (err: any) {
      if (err.response?.data?.detail === "Proof URL is required for this challenge") {
        const url = window.prompt("Proof URL is required. Enter a URL to override and approve:");
        if (url) {
           api.post(`/social/challenge-participations/${participationId}/approve?override_proof_url=${encodeURIComponent(url)}`)
             .then(() => {
               fetchData();
               toast("Participation approved with override!", "success");
             })
             .catch(e => toast(e.response?.data?.detail || 'Failed to approve.', 'error'));
        } else {
           toast("Approval cancelled. Proof is required.", "info");
        }
      } else {
        toast(err.response?.data?.detail || 'Failed to approve.', 'error');
      }
    }
  };

  const handleNewChallenge = () => {
    const title = window.prompt("Enter new challenge title:");
    if (!title) return;
    
    api.post('/gamification/challenges', {
      title,
      xp: 150,
      difficulty: "Medium",
      deadline: "12/31",
      status: "Active"
    }).then(() => {
      toast("Challenge created successfully!", "success");
      fetchData();
    }).catch(() => {
      toast("Failed to create challenge.", "error");
    });
  };

  const filteredChallenges = statusFilter === 'All' 
    ? mockChallenges 
    : mockChallenges.filter(c => c.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2 text-sm bg-white/5 p-1 rounded-lg border border-white/5">
          <button 
            onClick={() => setActiveTab('Challenges')} 
            className={`px-5 py-2 rounded-md font-medium transition-all duration-300 ${activeTab === 'Challenges' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Challenges
          </button>
          <button 
            onClick={() => setActiveTab('Participation')} 
            className={`px-5 py-2 rounded-md font-medium transition-all duration-300 ${activeTab === 'Participation' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Challenge Participation
          </button>
        </div>
        <button onClick={handleNewChallenge} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
          <span>+</span> New Challenge
        </button>
      </div>

      {activeTab === 'Challenges' && (
        <div className="space-y-6">
          {/* Challenge Status Flow / Filters */}
          <div className="flex space-x-3 text-xs font-medium">
            {['All', 'Draft', 'Active', 'Under Review', 'Completed', 'Archived'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-center transition-all cursor-pointer border ${
                  statusFilter === status 
                    ? status === 'Active' ? 'border-green-500 bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                    : status === 'Under Review' ? 'border-purple-500 bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : status === 'Completed' ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'border-white/50 bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    : 'border-white/10 text-gray-400 bg-white/5 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Challenge Cards */}
          <div className="grid grid-cols-3 gap-6">
            {filteredChallenges.map(challenge => (
              <div key={challenge.id} className="glass-panel rounded-2xl border border-white/5 hover:border-orange-500/30 p-6 flex flex-col justify-between h-56 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] group-hover:bg-orange-500/20 transition-colors"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-100 text-lg leading-tight">
                      {challenge.title}
                    </h3>
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm shrink-0">⚡</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Reward:</span>
                      <span className="text-orange-400 font-bold">+{challenge.xp} XP</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="text-gray-300">{challenge.difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Deadline:</span>
                      <span className="text-gray-300">{challenge.deadline}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 relative z-10">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${challenge.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                    {challenge.status}
                  </span>
                  
                  {challenge.has_joined ? (
                    <button disabled className="bg-white/5 border border-white/10 text-gray-400 py-1.5 px-4 rounded-lg text-sm cursor-not-allowed">
                      Joined
                    </button>
                  ) : (
                    <button onClick={() => handleJoinChallenge(challenge.id)} className="bg-white/10 hover:bg-orange-500 border border-white/10 hover:border-orange-500 text-white py-1.5 px-4 rounded-lg text-sm transition-all shadow-sm cursor-pointer">
                      Join
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {filteredChallenges.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-500">
                No challenges found matching this status.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Participation' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Challenge Approval Queue
              </h3>
            </div>
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Employee</th>
                  <th className="px-6 py-4 font-medium">Challenge</th>
                  <th className="px-6 py-4 font-medium">Proof</th>
                  <th className="px-6 py-4 font-medium">XP Reward</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {participations.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-200">{p.employee}</td>
                    <td className="px-6 py-4">{p.challenge}</td>
                    <td className="px-6 py-4 text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">{p.proof}</td>
                    <td className="px-6 py-4 font-bold text-orange-400">+{p.xp} XP</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === 'Approved' ? 'bg-green-500/20 text-green-400' : p.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.status === 'Pending' && (
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleApprove(p.id)}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {participations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No participation records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rewards Section */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none"></div>
        <h3 className="text-lg font-semibold text-gray-100 mb-6 flex items-center justify-between w-full relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xl">🎁</span> Rewards Catalog
          </div>
          <div className="bg-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            Your Balance: {myStats.points} Points
          </div>
        </h3>
        <div className="grid grid-cols-3 gap-6 relative z-10">
          {rewards.map(reward => (
            <div key={reward.id} className="bg-[#18181b] border border-white/5 rounded-xl p-5 flex flex-col justify-between group hover:border-amber-500/30 transition-all hover:shadow-lg hover:shadow-amber-500/5">
              <div>
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                  {reward.id % 2 === 0 ? '🌿' : '☕'}
                </div>
                <h4 className="text-base font-semibold text-gray-200">{reward.name}</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{reward.description}</p>
                <div className="flex items-center gap-2 mt-4 mb-2">
                  <span className="text-xs font-medium px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md">
                    {reward.points_required} Points
                  </span>
                  <span className="text-xs text-gray-600">Stock: {reward.stock}</span>
                </div>
              </div>
              <button 
                onClick={() => handleRedeem(reward.id)}
                className="mt-4 w-full bg-white/5 hover:bg-amber-500 text-gray-300 hover:text-white py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
              >
                Redeem Reward
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Badges & Leaderboard */}
      <div className="grid grid-cols-2 gap-6">
        <div id="badges-section" className="glass-panel p-8 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2">
            <span className="text-orange-400 text-xl">🏅</span> Badge Gallery
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {badges.map(badge => (
              <div key={badge.id} className={`border rounded-xl p-4 flex gap-3 transition-all ${badge.earned ? 'border-orange-500/40 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-white/5 bg-white/5 opacity-60 grayscale'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${badge.earned ? 'bg-orange-500/20' : 'bg-black/20'}`}>
                  {badge.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-200">{badge.name}</div>
                  <div className="text-[11px] text-gray-400 mt-1 leading-tight">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="leaderboard-section" className="glass-panel p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[40px] pointer-events-none"></div>
          <h3 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2 relative z-10">
            <span className="text-yellow-500 text-xl">🏆</span> Leaderboard
          </h3>
          <div className="relative z-10">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-gray-500 border-b border-white/10 text-xs uppercase tracking-wider">
                <tr>
                  <th className="pb-3 font-medium px-2">Rank</th>
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium text-right px-2">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((lb, idx) => (
                  <tr key={lb.rank} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-gray-300/20 text-gray-300' : idx === 2 ? 'bg-amber-700/20 text-amber-600' : 'text-gray-500'}`}>
                        {lb.rank}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-gray-200">{lb.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{lb.department}</div>
                    </td>
                    <td className="py-3 text-right px-2">
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                        {lb.xp}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
