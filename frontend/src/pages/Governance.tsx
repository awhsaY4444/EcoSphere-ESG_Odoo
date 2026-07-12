import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Governance() {
  const [activeTab, setActiveTab] = useState('Audits');
  const [audits, setAudits] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  const fetchData = () => {
    api.get('/governance/audits')
      .then(res => setAudits(res.data))
      .catch(err => console.error(err));
      
    api.get('/governance/issues')
      .then(res => setIssues(res.data))
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

  const handleNewAudit = () => {
    const scope = window.prompt("Enter audit scope:");
    if (!scope) return;
    const date_start = window.prompt("Enter start date (YYYY-MM-DD):", "2026-07-01");
    if (!date_start) return;
    const date_end = window.prompt("Enter end date (YYYY-MM-DD):", "2026-07-31");
    if (!date_end) return;

    api.post('/governance/audits', {
      scope,
      date_start,
      date_end,
      dept_id: null
    }).then(() => {
      fetchData();
    }).catch(err => toast("Error creating audit", 'error'));
  };

  const handleResolveIssue = (id: number) => {
    if (window.confirm("Mark this issue as resolved?")) {
      api.post(`/governance/issues/${id}/resolve`)
        .then(() => fetchData())
        .catch(err => toast("Error resolving issue", 'error'));
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Title,Department,Auditor,Date,Findings,Status\n"
      + audits.map(a => `${a.id},${a.title},${a.dept},${a.auditor},${a.date},${a.findings},${a.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "governance_audits.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-8">
      {/* Sub Tabs */}
      <div className="flex space-x-2 text-sm bg-white/5 p-1 rounded-lg border border-white/5 w-fit">
        {['Policies', 'Policy Acknowledgements', 'Audits', 'Compliance Issues'].map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-5 py-2 rounded-md font-medium cursor-pointer transition-all ${activeTab === tab ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {tab}
          </div>
        ))}
      </div>

      {activeTab === 'Audits' && (
        <div className="space-y-8 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-[#18181b] p-4 rounded-xl border border-white/5">
        <div className="flex space-x-3">
          <button onClick={handleNewAudit} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
            <span>+</span> New Audit
          </button>
          <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
            Export <span>▾</span>
          </button>
        </div>
      </div>

      {/* Audits Table */}
      <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span> Governance Audits
          </h3>
        </div>
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Department</th>
              <th className="px-6 py-4 font-medium">Auditor</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Findings</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {audits.map(audit => (
              <tr key={audit.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">{audit.title}</td>
                <td className="px-6 py-4">{audit.dept}</td>
                <td className="px-6 py-4 text-gray-400">{audit.auditor}</td>
                <td className="px-6 py-4 text-gray-400">{audit.date}</td>
                <td className="px-6 py-4">{audit.findings}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${audit.statusColor.includes('green') ? 'bg-green-500/20 text-green-400 border border-green-500/20' : audit.statusColor.includes('purple') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                    {audit.status}
                  </span>
                </td>
              </tr>
            ))}
            {audits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No audits found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
      )}
      
      {/* Compliance Issues Section */}
      {activeTab === 'Compliance Issues' && (
      <div className="glass-panel rounded-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> Compliance Issues Raised
          </h3>
          <p className="text-xs text-gray-500 ml-4">Severity-flagged issues requiring resolution tracking.</p>
        </div>
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Issue</th>
              <th className="px-6 py-4 font-medium">Severity</th>
              <th className="px-6 py-4 font-medium">Department</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {issues.map(issue => (
              <tr key={issue.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">{issue.issue}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                    issue.severity === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  }`}>
                    {issue.severity}
                  </span>
                </td>
                <td className="px-6 py-4">{issue.dept}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${issue.statusColor.includes('green') ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {issue.status !== "Resolved" && (
                    <button onClick={() => handleResolveIssue(issue.id)} className="bg-white/5 hover:bg-green-500/20 text-gray-300 hover:text-green-400 border border-white/10 hover:border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm">
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No active compliance issues.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {activeTab === 'Policies' && (
        <div className="glass-panel rounded-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Corporate Policies
            </h3>
            <button className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-4 py-1.5 rounded-lg text-xs font-medium transition-all">+ Upload Policy</button>
          </div>
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Policy Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors cursor-pointer">
                <td className="px-6 py-4 font-medium text-gray-200 flex items-center gap-3"><span className="text-xl">📄</span> Anti-Bribery & Corruption</td>
                <td className="px-6 py-4">Ethics</td>
                <td className="px-6 py-4 text-gray-400">12 Oct 2025</td>
                <td className="px-6 py-4 text-center"><span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-green-500/20 text-green-400 border border-green-500/20">Active</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors cursor-pointer">
                <td className="px-6 py-4 font-medium text-gray-200 flex items-center gap-3"><span className="text-xl">📄</span> Data Privacy Framework</td>
                <td className="px-6 py-4">Compliance</td>
                <td className="px-6 py-4 text-gray-400">05 Jan 2026</td>
                <td className="px-6 py-4 text-center"><span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-green-500/20 text-green-400 border border-green-500/20">Active</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors cursor-pointer">
                <td className="px-6 py-4 font-medium text-gray-200 flex items-center gap-3"><span className="text-xl">📄</span> Supplier Code of Conduct</td>
                <td className="px-6 py-4">Procurement</td>
                <td className="px-6 py-4 text-gray-400">18 Jun 2026</td>
                <td className="px-6 py-4 text-center"><span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-amber-500/20 text-amber-400 border border-amber-500/20">Under Review</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Policy Acknowledgements' && (
        <div className="glass-panel rounded-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Acknowledgement Tracking
              </h3>
              <p className="text-xs text-gray-500 ml-4">Monitor employee sign-offs for mandatory policies.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400">92%</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Company Completion</p>
            </div>
          </div>
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Pending Sign-offs</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">JS</div>
                  John Smith
                </td>
                <td className="px-6 py-4">Logistics</td>
                <td className="px-6 py-4 text-red-400 font-medium">2 Policies</td>
                <td className="px-6 py-4 text-right"><button className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">Send Reminder</button></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">AD</div>
                  Alice Doe
                </td>
                <td className="px-6 py-4">Finance</td>
                <td className="px-6 py-4 text-gray-500">None</td>
                <td className="px-6 py-4 text-right"><span className="text-green-400 text-xs font-medium flex items-center justify-end gap-1">✓ Complete</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
