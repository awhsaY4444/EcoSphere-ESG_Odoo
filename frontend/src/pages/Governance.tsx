import { useState } from 'react';

const mockAudits = [
  { id: 1, title: 'Q2 Waste Audit', dept: 'Manufacturing', auditor: 'S. Nair', date: '2026-06-12', findings: '3 minor issues', status: 'Completed', statusColor: 'border-blue-500 text-blue-500' },
  { id: 2, title: 'Vendor Compliance Check', dept: 'Procurement', auditor: 'R. Iyer', date: '2026-07-01', findings: '1 open issue', status: 'Under Review', statusColor: 'border-purple-500 text-purple-500' },
];

const mockIssues = [
  { id: 1, issue: 'Missing MSDS sheets', severity: 'High', dept: 'Manufacturing', status: 'Open', statusColor: 'border-red-500 text-red-500' },
  { id: 2, issue: 'Late vendor disclosure', severity: 'Medium', dept: 'Procurement', status: 'Resolved', statusColor: 'border-green-500 text-green-500' },
];

export default function Governance() {
  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex space-x-1 border-b border-gray-800 bg-[#1e1e1e] rounded-t-md overflow-hidden text-sm">
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Dashboard</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Environmental</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Social</div>
        <div className="px-6 py-2 bg-gray-800 text-white font-medium border-t-2 border-purple-500">Governance</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Gamification</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Reports</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Settings</div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 text-xs border-b border-gray-800 pb-2">
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-48 text-center">Policies</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-48 text-center">Policy Acknowledgements</div>
        <div className="px-4 py-1.5 bg-purple-500 text-white rounded font-medium cursor-pointer w-48 text-center">Audits</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-48 text-center">Compliance Issues</div>
      </div>

      <div className="flex space-x-2">
        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1.5 rounded text-sm transition-colors">+ New Audit</button>
        <button className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-1.5 rounded text-sm transition-colors">Export ▾</button>
      </div>

      {/* Audits Table */}
      <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-800/50 text-gray-400 border-b border-gray-800 text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Auditor</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Findings</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {mockAudits.map(audit => (
              <tr key={audit.id} className="hover:bg-gray-800/30">
                <td className="px-4 py-3">{audit.title}</td>
                <td className="px-4 py-3">{audit.dept}</td>
                <td className="px-4 py-3">{audit.auditor}</td>
                <td className="px-4 py-3">{audit.date}</td>
                <td className="px-4 py-3">{audit.findings}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-3 py-1 rounded-full border text-xs bg-[#121212] ${audit.statusColor}`}>
                    {audit.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Compliance Issues Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2 mt-2">Compliance issues raised from Audits <span className="text-gray-500 font-normal">— severity-flagged, resolution tracked</span></h3>
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 border-b border-gray-800 text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mockIssues.map(issue => (
                <tr key={issue.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3">{issue.issue}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full border text-xs bg-[#121212] ${
                      issue.severity === 'High' ? 'border-red-500 text-red-500' : 'border-orange-500 text-orange-500'
                    }`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">{issue.dept}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full border text-xs bg-[#121212] ${issue.statusColor}`}>
                      {issue.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
