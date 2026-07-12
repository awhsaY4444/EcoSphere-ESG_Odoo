import { useState } from 'react';

const mockActivities = [
  { id: 1, title: 'Tree Plantation', joined: 24, evidenceReq: true, icon: '🌲', color: 'border-green-500' },
  { id: 2, title: 'Blood Donation', joined: 10, evidenceReq: true, icon: '🩸', color: 'border-red-500' },
  { id: 3, title: 'Beach Cleanup', joined: 31, evidenceReq: false, icon: '🏖', color: 'border-orange-500' },
  { id: 4, title: 'ESG Workshop', joined: 52, evidenceReq: false, icon: '🎓', color: 'border-blue-500' },
];

const mockApprovals = [
  { id: 1, employee: 'Aditi Rao', activity: 'Tree Plantation', proof: 'photo.jpg', points: 50, status: 'Pending', statusColor: 'border-orange-500 text-orange-500' },
  { id: 2, employee: 'Kiran Shah', activity: 'ESG Workshop', proof: 'cert.pdf', points: 30, status: 'Approved', statusColor: 'border-green-500 text-green-500' },
];

export default function Social() {
  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex space-x-1 border-b border-gray-800 bg-[#1e1e1e] rounded-t-md overflow-hidden text-sm">
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Dashboard</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Environmental</div>
        <div className="px-6 py-2 bg-gray-800 text-white font-medium border-t-2 border-blue-500">Social</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Governance</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Gamification</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Reports</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Settings</div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 text-xs border-b border-gray-800 pb-2">
        <div className="px-4 py-1.5 bg-blue-500 text-white rounded font-medium cursor-pointer w-48 text-center">CSR Activities</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-48 text-center">Employee Participation</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-48 text-center">Diversity Dashboard</div>
      </div>

      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm transition-colors">+ New Activity</button>

      {/* Activity Cards */}
      <div className="grid grid-cols-4 gap-4">
        {mockActivities.map(activity => (
          <div key={activity.id} className={`bg-[#1e1e1e] rounded-xl border ${activity.color} p-4 flex flex-col justify-between`}>
            <div>
              <h3 className="font-medium text-gray-200 flex items-center gap-2 mb-2">
                {activity.icon} {activity.title}
              </h3>
              <p className="text-xs text-gray-400">{activity.joined} joined</p>
              {activity.evidenceReq ? (
                <p className="text-xs text-gray-500 mt-1">Evidence Required</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Open</p>
              )}
            </div>
            <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded text-sm self-start transition-colors">Join</button>
          </div>
        ))}
      </div>

      {/* Approval Queue Table */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2 mt-4">Employee Participation: approval queue</h3>
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 border-b border-gray-800 text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Activity/Challenge</th>
                <th className="px-4 py-3 font-medium">Proof</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium text-center">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mockApprovals.map(approval => (
                <tr key={approval.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3">{approval.employee}</td>
                  <td className="px-4 py-3">{approval.activity}</td>
                  <td className="px-4 py-3 text-blue-400 hover:underline cursor-pointer">{approval.proof}</td>
                  <td className="px-4 py-3">{approval.points}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full border text-xs bg-[#121212] ${approval.statusColor}`}>
                      {approval.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end gap-2 mt-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm transition-colors">Approve</button>
          <button className="bg-red-400 hover:bg-red-500 text-gray-900 px-4 py-1.5 rounded text-sm transition-colors">Reject</button>
        </div>
      </div>
    </div>
  );
}
