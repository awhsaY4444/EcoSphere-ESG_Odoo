import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Social() {
  const [activeTab, setActiveTab] = useState('CSR Activities');
  const [activities, setActivities] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Create Activity form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(50);
  const [newDesc, setNewDesc] = useState('');
  const [newEvidenceReq, setNewEvidenceReq] = useState(true);

  // Submit Evidence form state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [submitPartId, setSubmitPartId] = useState<number | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofDesc, setProofDesc] = useState('');
  const [impactValue, setImpactValue] = useState('10');
  const [impactMetric, setImpactMetric] = useState('volunteer hours');

  // Stats for diversity
  const [stats, setStats] = useState({
    gender: '42%',
    underrepresented: '28%',
    volunteersCount: 0,
    totalPoints: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actRes, appRes] = await Promise.all([
        api.get('/social/activities'),
        api.get('/social/approvals')
      ]);
      setActivities(actRes.data);
      setApprovals(appRes.data);

      // Compute statistics dynamically
      const approvedCount = appRes.data.filter((p: any) => p.status === 'Approved').length;
      const totalPoints = appRes.data.filter((p: any) => p.status === 'Approved').reduce((sum: number, p: any) => sum + p.points, 0);
      setStats(prev => ({
        ...prev,
        volunteersCount: approvedCount,
        totalPoints: totalPoints
      }));
    } catch (err) {
      console.error("Failed to load CSR data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleTabChange = (e: any) => {
      const tab = e.detail.tab;
      if (tab === 'CSR Activities' || tab === 'Employee Participation') {
        setActiveTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  const handleJoinActivity = (activityId: number) => {
    api.post(`/social/activities/${activityId}/join`)
      .then(() => {
        toast('Joined activity successfully! You can now submit your verification evidence.', 'success');
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to join activity.', 'error'));
  };

  const openSubmitEvidenceModal = (activityId: number) => {
    // We need to find the employee participation ID for this activity
    // For now, since approvals contain all participations, we can find the pending one for this user
    // Wait, let's fetch the approvals or participations first. 
    // To make it easy, we can also look up the approvals list or matching id
    const match = approvals.find(a => a.activity === activities.find(act => act.id === activityId)?.title && a.status === 'Pending');
    if (match) {
      setSubmitPartId(match.id);
      setProofUrl('');
      setProofDesc('');
      setImpactValue('10');
      setImpactMetric('volunteer hours');
      setShowEvidenceModal(true);
    } else {
      toast('Please make sure you have joined the activity first.', 'info');
    }
  };

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitPartId) return;

    api.post(`/social/csr-participations/${submitPartId}/submit-evidence`, {
      proof_url: proofUrl,
      proof_description: proofDesc,
      impact_value: parseFloat(impactValue),
      impact_metric: impactMetric
    })
      .then(() => {
        toast('Evidence submitted successfully! Awaiting coordinator approval.', 'success');
        setShowEvidenceModal(false);
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to submit evidence.', 'error'));
  };

  const handleApprove = (participationId: number) => {
    api.post(`/social/csr-participations/${participationId}/approve`)
      .then(() => {
        toast('Participation approved! Verified impact recorded and points awarded.', 'success');
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to approve.', 'error'));
  };

  const handleReject = (participationId: number) => {
    if (window.confirm("Are you sure you want to reject this participation?")) {
      api.post(`/social/csr-participations/${participationId}/reject`)
        .then(() => {
          toast('Participation rejected.', 'info');
          fetchData();
        })
        .catch(err => toast(err.response?.data?.detail || 'Failed to reject.', 'error'));
    }
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/social/activities', {
      title: newTitle,
      points_value: newPoints,
      description: newDesc,
      evidence_required: newEvidenceReq
    })
      .then(() => {
        toast('CSR Activity created successfully!', 'success');
        setShowCreateModal(false);
        setNewTitle('');
        setNewDesc('');
        fetchData();
      })
      .catch(err => toast(err.response?.data?.detail || 'Failed to create CSR activity.', 'error'));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">
          🤝 Social & CSR Module
        </h1>
        <p className="text-gray-400">
          Publish corporate social responsibility initiatives, submit volunteering proof, and track inclusion progress.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 text-sm bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        {['CSR Activities', 'Employee Participation', 'Diversity Dashboard'].map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-5 py-2.5 rounded-lg font-semibold cursor-pointer transition-all duration-200 ${
              activeTab === tab 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="glass-panel p-16 text-center text-gray-400 border border-white/5 bg-white/5 rounded-2xl animate-pulse font-medium">
          Loading CSR dashboard ledger...
        </div>
      ) : (
        <>
          {/* TAB: ACTIVITIES */}
          {activeTab === 'CSR Activities' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#18181b] p-4 rounded-2xl border border-white/5">
                <button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                  <span>+</span> New Activity
                </button>
              </div>

              {/* Activity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {activities.map(activity => (
                  <div key={activity.id} className="glass-panel rounded-2xl border border-white/5 hover:border-blue-500/30 p-6 flex flex-col justify-between h-56 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 relative overflow-hidden bg-white/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-colors"></div>
                    <div className="relative z-10">
                      <h3 className="font-bold text-gray-100 text-lg leading-tight flex items-center gap-3 mb-2.5">
                        <span className="text-2xl drop-shadow-md">{activity.icon || '🤝'}</span> {activity.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{activity.description}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">{activity.points} Points</span>
                        <span className="text-gray-400"><span className="text-blue-400 font-semibold">{activity.joined}</span> joined</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 relative z-10 flex gap-2">
                      {activity.has_joined ? (
                        <>
                          <button disabled className="flex-1 bg-white/5 border border-white/10 text-gray-400 py-2 rounded-xl text-xs font-semibold cursor-not-allowed">
                            Joined
                          </button>
                          <button onClick={() => openSubmitEvidenceModal(activity.id)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-sm">
                            Proof 📸
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleJoinActivity(activity.id)} className="w-full bg-white/10 hover:bg-blue-500 border border-white/10 hover:border-blue-500 text-white py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm">
                          Join Activity
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="col-span-4 text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    <div className="text-4xl mb-3">🤝</div>
                    <p>No CSR activities found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: APPROVAL QUEUE */}
          {activeTab === 'Employee Participation' && (
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> CSR Verification Queue
                </h3>
              </div>
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Employee</th>
                    <th className="px-6 py-4 font-semibold">CSR Initiative</th>
                    <th className="px-6 py-4 font-semibold">Proof Link</th>
                    <th className="px-6 py-4 font-semibold">Evidence Details</th>
                    <th className="px-6 py-4 font-semibold text-right">Points</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {approvals.map(approval => (
                    <tr key={approval.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-200">{approval.employee}</td>
                      <td className="px-6 py-4 font-medium">{approval.activity}</td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {approval.proof && approval.proof !== 'N/A' ? (
                          <a href={approval.proof} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                            Open Proof Link ↗
                          </a>
                        ) : (
                          <span className="text-gray-600">No URL</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 max-w-xs truncate" title={approval.proof_description}>
                        {approval.proof_description}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold">{approval.points}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          approval.status === 'Approved' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                          approval.status === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 
                          'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                        }`}>
                          {approval.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {approval.status === 'Pending' && (
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => handleApprove(approval.id)}
                              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(approval.id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {approvals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                        <div className="text-4xl mb-3">📂</div>
                        <p>No CSR sign-offs pending in review.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: DIVERSITY DASHBOARD */}
          {activeTab === 'Diversity Dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-white/5 border border-white/5">
                  <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Gender Representation</h4>
                  <p className="text-3xl font-black text-gray-100">{stats.gender}</p>
                  <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{ width: stats.gender }}></div>
                  </div>
                </div>
                
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-white/5 border border-white/5">
                  <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Minority Representation</h4>
                  <p className="text-3xl font-black text-gray-100">{stats.underrepresented}</p>
                  <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-2 rounded-full" style={{ width: stats.underrepresented }}></div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-white/5 border border-white/5">
                  <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Verified Volunteers</h4>
                  <p className="text-3xl font-black text-green-400">{stats.volunteersCount}</p>
                  <p className="text-[10px] text-gray-500 mt-2">Workforce completions registered</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-white/5 border border-white/5">
                  <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total points earned</h4>
                  <p className="text-3xl font-black text-blue-400">{stats.totalPoints} pts</p>
                  <p className="text-[10px] text-gray-500 mt-2">Drawn from live CSR database</p>
                </div>
              </div>
              
              <div className="glass-panel rounded-2xl p-6 bg-white/5 border border-white/5">
                <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Inclusion & Social Initiatives Tracker
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wide">
                      <span className="text-gray-300">Unconscious Bias Training Completion</span>
                      <span className="text-blue-400">85%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wide">
                      <span className="text-gray-300">Mentorship Program Enrollments</span>
                      <span className="text-indigo-400">62%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE ACTIVITY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">Create CSR Activity</h3>
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Activity Title</label>
                <input required type="text" placeholder="e.g. Food Bank Volunteering" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Points Value</label>
                  <input required type="number" value={newPoints} onChange={e => setNewPoints(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Evidence Required</label>
                  <select value={newEvidenceReq ? 'true' : 'false'} onChange={e => setNewEvidenceReq(e.target.value === 'true')} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
                    <option value="true">Yes, require proof upload</option>
                    <option value="false">No, auto-approve or voluntary</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Description</label>
                <textarea required rows={3} placeholder="Describe the activity targets and parameters..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition-all">Publish Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT EVIDENCE MODAL */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">Submit Volunteering Evidence</h3>
            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Proof Document URL</label>
                <input required type="url" placeholder="e.g. https://certificates.org/myproof.pdf" value={proofUrl} onChange={e => setProofUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Action Performed / Evidence Description</label>
                <textarea required rows={2} placeholder="Explain what tasks you performed..." value={proofDesc} onChange={e => setProofDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Claimed Impact Value</label>
                  <input required type="number" step="any" value={impactValue} onChange={e => setImpactValue(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Impact Metric</label>
                  <select value={impactMetric} onChange={e => setImpactMetric(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
                    <option value="volunteer hours">volunteer hours</option>
                    <option value="kg CO2e avoided">kg CO2e avoided</option>
                    <option value="kg waste reduced">kg waste reduced</option>
                    <option value="kWh saved">kWh saved</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowEvidenceModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition-all">Submit Evidence</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
