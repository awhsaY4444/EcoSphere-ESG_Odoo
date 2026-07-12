import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Gamification() {
  const [activeTab, setActiveTab] = useState('Challenges');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [challenges, setChallenges] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [myStats, setMyStats] = useState({ xp: 0, points: 0 });

  // Leaderboard toggle state: "xp" or "impact"
  const [leaderboardType, setLeaderboardType] = useState<'xp' | 'impact'>('xp');
  const [impactMetric, setImpactMetric] = useState('volunteer hours');

  // Submit Evidence Modal state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [submitPartId, setSubmitPartId] = useState<number | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofDesc, setProofDesc] = useState('');
  const [claimImpactVal, setClaimImpactVal] = useState('10');
  const [claimImpactMetric, setClaimImpactMetric] = useState('volunteer hours');

  // New Challenge creation modal state
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newXp, setNewXp] = useState(100);
  const [newDifficulty, setNewDifficulty] = useState('Medium');
  const [newDeadline, setNewDeadline] = useState('2026-12-31');

  const fetchData = async () => {
    try {
      const [chRes, partRes, rewRes, badgeRes, statsRes] = await Promise.all([
        api.get('/gamification/challenges'),
        api.get('/gamification/participations'),
        api.get('/master_data/rewards'),
        api.get('/gamification/badges'),
        api.get('/gamification/me')
      ]);
      setChallenges(chRes.data);
      setParticipations(partRes.data);
      setRewards(rewRes.data);
      setBadges(badgeRes.data);
      setMyStats(statsRes.data);

      // Load correct leaderboard based on user toggle
      if (leaderboardType === 'xp') {
        const lbRes = await api.get('/gamification/leaderboard');
        setLeaderboard(lbRes.data);
      } else {
        const lbRes = await api.get(`/gamification/leaderboard/impact`, { params: { metric: impactMetric } });
        setLeaderboard(lbRes.data);
      }
    } catch (err) {
      console.error("Failed to load gamification dataset", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [leaderboardType, impactMetric]);

  useEffect(() => {
    const handleTabChange = (e: any) => {
      const tab = e.detail.tab;
      if (tab === 'Challenges' || tab === 'Participation') {
        setActiveTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  const handleRedeem = (rewardId: number) => {
    api.post(`/gamification/redemptions?reward_id=${rewardId}`)
      .then(() => {
        toast('Reward redeemed successfully! Stock and points updated.', 'success');
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to redeem reward.', 'error'));
  };

  const handleJoinChallenge = (challengeId: number) => {
    api.post(`/gamification/challenges/${challengeId}/join`)
      .then(() => {
        toast("Joined challenge successfully! Submit evidence once completed.", "success");
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to join challenge.', 'error'));
  };

  const openChallengeEvidenceModal = (challengeId: number) => {
    // Find active user's pending participation record matching challengeId
    // Standard approach: parse the participations queue or approvals
    const match = participations.find(p => p.challenge === challenges.find(c => c.id === challengeId)?.title && p.status === 'Pending');
    if (match) {
      setSubmitPartId(match.id);
      setProofUrl('');
      setProofDesc('');
      setClaimImpactVal('5');
      setClaimImpactMetric('kg CO2e avoided');
      setShowEvidenceModal(true);
    } else {
      toast("Please make sure you have joined this challenge first.", "info");
    }
  };

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitPartId) return;

    api.post(`/social/challenge-participations/${submitPartId}/submit-evidence`, {
      proof_url: proofUrl,
      proof_description: proofDesc,
      impact_value: parseFloat(claimImpactVal),
      impact_metric: claimImpactMetric
    })
      .then(() => {
        toast('Evidence submitted! Your claimed impact is pending verification.', 'success');
        setShowEvidenceModal(false);
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to submit evidence.', 'error'));
  };

  const handleApproveChallenge = async (participationId: number) => {
    api.post(`/social/challenge-participations/${participationId}/approve`)
      .then(() => {
        toast("Challenge completion approved! XP and badges evaluated.", "success");
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to approve.', 'error'));
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/gamification/challenges', {
      title: newTitle,
      xp: newXp,
      difficulty: newDifficulty,
      deadline: newDeadline,
      status: "Active"
    })
      .then(() => {
        toast("New sustainability challenge published!", "success");
        setShowChallengeModal(false);
        setNewTitle('');
        fetchData();
      })
      .catch(() => toast("Failed to create challenge.", "error"));
  };

  const filteredChallenges = statusFilter === 'All' 
    ? challenges 
    : challenges.filter(c => c.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2 text-sm bg-white/5 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('Challenges')} 
            className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'Challenges' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Challenges
          </button>
          <button 
            onClick={() => setActiveTab('Participation')} 
            className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'Participation' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Challenge Participation
          </button>
        </div>
        <button onClick={() => setShowChallengeModal(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
          <span>+</span> New Challenge
        </button>
      </div>

      {activeTab === 'Challenges' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex space-x-2 text-xs font-semibold">
            {['All', 'Draft', 'Active', 'Under Review', 'Completed', 'Archived'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer border ${
                  statusFilter === status 
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                    : 'border-white/10 text-gray-400 bg-white/5 hover:bg-white/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredChallenges.map(challenge => (
              <div key={challenge.id} className="glass-panel rounded-2xl border border-white/5 hover:border-orange-500/30 p-6 flex flex-col justify-between h-56 transition-all duration-300 bg-white/5 group hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] group-hover:bg-orange-500/20 transition-colors"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-100 text-lg leading-tight">
                      {challenge.title}
                    </h3>
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm shrink-0">⚡</div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">XP Reward:</span>
                      <span className="text-orange-400 font-bold">+{challenge.xp} XP</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="text-gray-300">{challenge.difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Deadline:</span>
                      <span className="text-gray-300 font-mono">{challenge.deadline}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 relative z-10">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    challenge.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {challenge.status}
                  </span>
                  
                  {challenge.has_joined ? (
                    <div className="flex gap-2">
                      <button disabled className="bg-white/5 border border-white/10 text-gray-400 py-1.5 px-3 rounded-lg text-xs cursor-not-allowed">
                        Joined
                      </button>
                      <button onClick={() => openChallengeEvidenceModal(challenge.id)} className="bg-orange-550 hover:bg-orange-600 text-white py-1.5 px-3 rounded-lg text-xs font-semibold transition-all">
                        Proof 📸
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleJoinChallenge(challenge.id)} className="bg-white/10 hover:bg-orange-500 border border-white/10 hover:border-orange-500 text-white py-1.5 px-4.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                      Join
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {filteredChallenges.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-500">
                No active challenges found.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Participation' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Challenge Approval Queue
            </h3>
          </div>
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Challenge</th>
                <th className="px-6 py-4 font-semibold">Proof Link</th>
                <th className="px-6 py-4 font-semibold">Evidence Details</th>
                <th className="px-6 py-4 font-semibold">XP Reward</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {participations.map(p => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-200">{p.employee}</td>
                  <td className="px-6 py-4 font-medium">{p.challenge}</td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {p.proof && p.proof !== 'N/A' ? (
                      <a href={p.proof} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                        Open Link ↗
                      </a>
                    ) : (
                      <span className="text-gray-650">No URL</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 max-w-xs truncate" title={p.proof_description}>{p.proof_description}</td>
                  <td className="px-6 py-4 font-bold text-orange-400 font-mono">+{p.xp} XP</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      p.status === 'Approved' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                      'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {p.status === 'Pending' && (
                      <button 
                        onClick={() => handleApproveChallenge(p.id)}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {participations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No challenge records pending.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REWARDS CATALOG */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden bg-white/5 border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none"></div>
        <h3 className="text-lg font-semibold text-gray-100 mb-6 flex items-center justify-between w-full relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xl">🎁</span> Rewards Catalog
          </div>
          <div className="bg-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            Your Balance: {myStats.points} Points
          </div>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {rewards.map(reward => (
            <div key={reward.id} className="bg-[#18181b] border border-white/5 rounded-xl p-5 flex flex-col justify-between group hover:border-amber-500/30 transition-all hover:shadow-lg hover:shadow-amber-500/5">
              <div>
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                  {reward.id % 2 === 0 ? '🌿' : '☕'}
                </div>
                <h4 className="text-base font-semibold text-gray-200">{reward.name}</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{reward.description}</p>
                <div className="flex items-center gap-2 mt-4 mb-2">
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md">
                    {reward.points_required} Points
                  </span>
                  <span className={`text-xs ${reward.stock > 0 ? 'text-gray-450' : 'text-red-400 font-bold'}`}>
                    Stock: {reward.stock}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleRedeem(reward.id)}
                disabled={reward.stock <= 0 || myStats.points < reward.points_required}
                className="mt-4 w-full bg-white/5 hover:bg-amber-500 text-gray-300 hover:text-white disabled:hover:bg-white/5 disabled:text-gray-600 disabled:opacity-40 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {reward.stock <= 0 ? 'Out of Stock' : 'Redeem Reward'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* LEADERBOARD & BADGES SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BADGES */}
        <div className="glass-panel p-8 rounded-2xl bg-white/5 border border-white/5">
          <h3 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2">
            <span className="text-orange-400 text-xl">🏅</span> Achievement Gallery
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {badges.map(badge => (
              <div key={badge.id} className={`border rounded-xl p-4 flex gap-3 transition-all ${
                badge.earned 
                  ? 'border-orange-500/40 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                  : 'border-white/5 bg-white/5 opacity-60 grayscale'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${badge.earned ? 'bg-orange-500/20' : 'bg-black/20'}`}>
                  {badge.icon || '🏅'}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-250">{badge.name}</div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-tight">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden bg-white/5 border border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[40px] pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <span className="text-yellow-500 text-xl">🏆</span> ESG Leaderboards
            </h3>
            
            <div className="flex gap-2 text-xs">
              <button 
                onClick={() => setLeaderboardType('xp')}
                className={`px-3 py-1.5 rounded-lg border font-bold ${
                  leaderboardType === 'xp' 
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                    : 'border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                XP
              </button>
              <button 
                onClick={() => setLeaderboardType('impact')}
                className={`px-3 py-1.5 rounded-lg border font-bold ${
                  leaderboardType === 'impact' 
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                    : 'border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                Impact
              </button>
            </div>
          </div>

          {leaderboardType === 'impact' && (
            <div className="mb-4 text-xs relative z-10 flex items-center gap-2">
              <span className="text-gray-450">Impact Category:</span>
              <select 
                value={impactMetric} 
                onChange={e => setImpactMetric(e.target.value)}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-gray-300 focus:outline-none"
              >
                <option value="volunteer hours">volunteer hours</option>
                <option value="kg CO2e avoided">kg CO2e avoided</option>
                <option value="kg waste reduced">kg waste reduced</option>
                <option value="kWh saved">kWh saved</option>
              </select>
            </div>
          )}

          <div className="relative z-10">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-gray-500 border-b border-white/10 text-xs uppercase tracking-wider">
                <tr>
                  <th className="pb-3 font-semibold px-2">Rank</th>
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold text-right px-2">
                    {leaderboardType === 'xp' ? 'XP' : 'Impact Value'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((lb, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                        idx === 1 ? 'bg-gray-300/20 text-gray-300' : 
                        idx === 2 ? 'bg-amber-700/20 text-amber-600' : 
                        'text-gray-500'
                      }`}>
                        {lb.rank}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-gray-200">{lb.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{lb.department}</div>
                    </td>
                    <td className="py-3 text-right px-2">
                      <span className="font-mono font-extrabold text-orange-400">
                        {leaderboardType === 'xp' ? `${lb.xp} XP` : `${lb.impact_value} ${lb.metric}`}
                      </span>
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 text-xs">No records on this board yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CHALLENGE SUBMIT EVIDENCE MODAL */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">Submit Challenge Evidence</h3>
            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Proof Document URL</label>
                <input required type="url" placeholder="https://gpslogs.org/run1.png" value={proofUrl} onChange={e => setProofUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Proof Details</label>
                <textarea required rows={2} placeholder="Explain how you completed this challenge..." value={proofDesc} onChange={e => setProofDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Claimed Impact Value</label>
                  <input required type="number" step="any" value={claimImpactVal} onChange={e => setClaimImpactVal(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Impact Metric Type</label>
                  <select value={claimImpactMetric} onChange={e => setClaimImpactMetric(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50">
                    <option value="kg CO2e avoided">kg CO2e avoided</option>
                    <option value="kg waste reduced">kg waste reduced</option>
                    <option value="volunteer hours">volunteer hours</option>
                    <option value="kWh saved">kWh saved</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowEvidenceModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-semibold transition-all">Submit Evidence</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CHALLENGE MODAL */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">Create Challenge</h3>
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Challenge Title</label>
                <input required type="text" placeholder="e.g. Zero Paper Week" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">XP Value</label>
                  <input required type="number" value={newXp} onChange={e => setNewXp(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Difficulty</label>
                  <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Deadline</label>
                  <input required type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 [color-scheme:dark]" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowChallengeModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-semibold transition-all">Publish Challenge</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
