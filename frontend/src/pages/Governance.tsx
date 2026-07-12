import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Governance() {
  const [activeTab, setActiveTab] = useState('Compliance Issues');
  
  const [audits, setAudits] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Policy Creation Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyBody, setPolicyBody] = useState('');

  // Audit Creation Form State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditScope, setAuditScope] = useState('');
  const [auditDateStart, setAuditDateStart] = useState('2026-07-01');
  const [auditDateEnd, setAuditDateEnd] = useState('2026-07-31');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditsRes, issuesRes, policiesRes, acksRes] = await Promise.all([
        api.get('/governance/audits'),
        api.get('/governance/issues'),
        api.get('/governance/policies'),
        api.get('/governance/policies/acknowledgements')
      ]);
      setAudits(auditsRes.data);
      setIssues(issuesRes.data);
      setPolicies(policiesRes.data);
      setAcknowledgements(acksRes.data);
    } catch (err) {
      console.error("Failed to load governance datasets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleTabChange = (e: any) => {
      const tab = e.detail.tab;
      if (tab === 'Compliance Issues' || tab === 'Policies' || tab === 'Audits') {
        setActiveTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  const handleAcknowledgePolicy = (policyId: number) => {
    api.post(`/governance/policies/${policyId}/acknowledge`)
      .then(() => {
        toast('Policy acknowledged successfully!', 'success');
        fetchData();
      })
      .catch(() => toast('Failed to acknowledge policy.', 'error'));
  };

  const handleUploadPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/governance/policies', {
      title: policyTitle,
      body: policyBody
    })
      .then(() => {
        toast('New Corporate Policy uploaded!', 'success');
        setShowUploadModal(false);
        setPolicyTitle('');
        setPolicyBody('');
        fetchData();
      })
      .catch(() => toast('Failed to upload policy.', 'error'));
  };

  const handleSendReminder = (employeeId: number) => {
    api.post(`/governance/employees/${employeeId}/remind-policies`)
      .then(res => {
        toast(res.data.message || 'Reminder notification sent successfully!', 'success');
        fetchData();
      })
      .catch(() => toast('Failed to send policy acknowledgement reminder.', 'error'));
  };

  const handleCreateAudit = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/governance/audits', {
      scope: auditScope,
      date_start: auditDateStart,
      date_end: auditDateEnd,
      dept_id: 3 // Default to Operations for demo compliance linkage
    })
      .then(() => {
        toast('Compliance audit successfully scheduled!', 'success');
        setShowAuditModal(false);
        setAuditScope('');
        fetchData();
      })
      .catch(() => toast('Failed to schedule audit.', 'error'));
  };

  const handleResolveIssue = (id: number) => {
    if (window.confirm("Mark this compliance issue as resolved?")) {
      api.post(`/governance/issues/${id}/resolve`)
        .then(() => {
          toast('Issue marked as resolved. Scores updated.', 'success');
          fetchData();
        })
        .catch(() => toast('Failed to resolve compliance issue.', 'error'));
    }
  };

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'Audits') {
      csvContent += "ID,Scope,Department,Auditor,Date,Status\n"
        + audits.map(a => `${a.id},${a.title},${a.dept},${a.auditor},${a.date},${a.status}`).join("\n");
    } else if (activeTab === 'Compliance Issues') {
      csvContent += "ID,Description,Severity,Department,Due Date,Overdue,Status\n"
        + issues.map(i => `${i.id},${i.issue},${i.severity},${i.dept},${i.due_date},${i.is_overdue},${i.status}`).join("\n");
    } else {
      csvContent += "ID,Title,Effective Date,Status\n"
        + policies.map(p => `${p.id},${p.title},${p.effective_date},${p.status}`).join("\n");
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `governance_${activeTab.toLowerCase().replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Calculate global completion percentage
  const totalEmployees = acknowledgements.length;
  const compliantCount = acknowledgements.filter(a => a.pending_count === 0).length;
  const companyCompletionPct = totalEmployees > 0 ? Math.round((compliantCount / totalEmployees) * 100) : 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 mb-2">
          ⚖️ Governance Module
        </h1>
        <p className="text-gray-400">
          Upload and acknowledge corporate sustainability policies, schedule internal audits, and track compliance resolution.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 text-sm bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        {['Policies', 'Policy Acknowledgements', 'Audits', 'Compliance Issues'].map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-5 py-2.5 rounded-lg font-semibold cursor-pointer transition-all duration-200 ${
              activeTab === tab 
                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="glass-panel p-16 text-center text-gray-400 border border-white/5 bg-white/5 rounded-2xl animate-pulse font-medium">
          Reading corporate registry...
        </div>
      ) : (
        <>
          {/* TAB: COMPLIANCE ISSUES */}
          {activeTab === 'Compliance Issues' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#18181b] p-4 rounded-2xl border border-white/5">
                <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                  Export <span>▾</span>
                </button>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Compliance Issue</th>
                      <th className="px-6 py-4 font-semibold">Severity</th>
                      <th className="px-6 py-4 font-semibold">Department</th>
                      <th className="px-6 py-4 font-semibold">Due Date</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {issues.map(issue => (
                      <tr key={issue.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-200">
                          {issue.issue}
                          {issue.is_overdue && (
                            <span className="ml-3 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-black uppercase rounded border border-red-500/30 animate-pulse">
                              ⚠️ Overdue
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            issue.severity === 'Critical' || issue.severity === 'High' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/20' 
                              : 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                          }`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-350">{issue.dept}</td>
                        <td className={`px-6 py-4 font-mono font-semibold ${issue.is_overdue ? 'text-red-400 font-extrabold' : 'text-gray-400'}`}>{issue.due_date}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                            issue.status === 'Resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                            'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {issue.status !== "Resolved" && (
                            <button onClick={() => handleResolveIssue(issue.id)} className="bg-white/5 hover:bg-green-500/20 text-gray-300 hover:text-green-400 border border-white/10 hover:border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {issues.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                          <div className="text-4xl mb-3">✓</div>
                          <p>All compliance issues resolved.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: AUDITS */}
          {activeTab === 'Audits' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#18181b] p-4 rounded-2xl border border-white/5">
                <button onClick={() => setShowAuditModal(true)} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-500/20">
                  + Schedule Audit
                </button>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Scope title</th>
                      <th className="px-6 py-4 font-semibold">Target Department</th>
                      <th className="px-6 py-4 font-semibold">Auditor Registry</th>
                      <th className="px-6 py-4 font-semibold">Date scheduled</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {audits.map(audit => (
                      <tr key={audit.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-200">{audit.title}</td>
                        <td className="px-6 py-4 font-medium">{audit.dept}</td>
                        <td className="px-6 py-4 text-gray-400">{audit.auditor}</td>
                        <td className="px-6 py-4 text-gray-400 font-mono">{audit.date}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/20">
                            {audit.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: POLICIES */}
          {activeTab === 'Policies' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#18181b] p-4 rounded-2xl border border-white/5">
                <button onClick={() => setShowUploadModal(true)} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-500/20">
                  + Upload Policy
                </button>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Policy Name</th>
                      <th className="px-6 py-4 font-semibold">Policy Overview</th>
                      <th className="px-6 py-4 font-semibold">Effective Date</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Sign-off Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {policies.map(policy => (
                      <tr key={policy.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-200 flex items-center gap-3">
                          <span className="text-xl">📄</span> {policy.title}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400 max-w-sm truncate" title={policy.body}>{policy.body}</td>
                        <td className="px-6 py-4 text-gray-400 font-mono">{policy.effective_date}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/20">
                            {policy.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {policy.acknowledged ? (
                            <span className="text-green-400 text-xs font-bold flex items-center justify-end gap-1">
                              ✓ Signed off
                            </span>
                          ) : (
                            <button onClick={() => handleAcknowledgePolicy(policy.id)} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
                              Acknowledge Policy
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: POLICY ACKNOWLEDGEMENTS */}
          {activeTab === 'Policy Acknowledgements' && (
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6 bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Sign-off Completion Rate
                  </h3>
                  <p className="text-xs text-gray-500">Monitor employee acknowledgements for mandatory policies.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-450">{companyCompletionPct}%</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Compliant Employees</p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Employee</th>
                      <th className="px-6 py-4 font-semibold">Department</th>
                      <th className="px-6 py-4 font-semibold">Pending Policies</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {acknowledgements.map(ack => (
                      <tr key={ack.employee_id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                            {ack.employee.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          {ack.employee}
                        </td>
                        <td className="px-6 py-4 font-medium">{ack.department}</td>
                        <td className="px-6 py-4">
                          {ack.pending_count > 0 ? (
                            <span className="text-red-400 font-bold text-xs" title={ack.pending_policies.join(', ')}>
                              {ack.pending_count} Policy pending ({ack.pending_policies.join(', ')})
                            </span>
                          ) : (
                            <span className="text-green-400 text-xs font-bold">✓ Complete</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {ack.pending_count > 0 && (
                            <button onClick={() => handleSendReminder(ack.employee_id)} className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
                              Send Reminder
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* POLICY UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">Upload New Policy</h3>
            <form onSubmit={handleUploadPolicy} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Policy Title</label>
                <input required type="text" placeholder="e.g. Code of Business Conduct" value={policyTitle} onChange={e => setPolicyTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Policy Text Body</label>
                <textarea required rows={5} placeholder="Paste policy details..." value={policyBody} onChange={e => setPolicyBody(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white rounded-xl text-sm font-semibold transition-all">Publish Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT SCHEDULING MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">Schedule Compliance Audit</h3>
            <form onSubmit={handleCreateAudit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Audit Scope Scope</label>
                <input required type="text" placeholder="e.g. Q4 Logistics Audit" value={auditScope} onChange={e => setAuditScope(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Start Date</label>
                  <input required type="date" value={auditDateStart} onChange={e => setAuditDateStart(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">End Date</label>
                  <input required type="date" value={auditDateEnd} onChange={e => setAuditDateEnd(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowAuditModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white rounded-xl text-sm font-semibold transition-all">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
