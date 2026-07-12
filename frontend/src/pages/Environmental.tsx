import { useState } from 'react';

const mockGoals = [
  { id: 1, name: 'Reduce Fleet Emissions', dept: 'Logistics', target: '500 t', current: '380 t', progress: 76, deadline: '2026-12-31', status: 'Active', statusColor: 'border-green-500 text-green-500' },
  { id: 2, name: 'Cut Packaging Waste', dept: 'Manufacturing', target: '120 t', current: '98 t', progress: 82, deadline: '2026-09-30', status: 'On Track', statusColor: 'border-green-500 text-green-500' },
  { id: 3, name: 'Office Energy Cut', dept: 'Corporate', target: '80 t', current: '80 t', progress: 100, deadline: '2026-06-30', status: 'Completed', statusColor: 'border-blue-500 text-blue-500' },
];

export default function Environmental() {
  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex space-x-1 border-b border-gray-800 bg-[#1e1e1e] rounded-t-md overflow-hidden text-sm">
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Dashboard</div>
        <div className="px-6 py-2 bg-gray-800 text-white font-medium border-t-2 border-green-500">Environmental</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Social</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Governance</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Gamification</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Reports</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Settings</div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 text-xs border-b border-gray-800 pb-2">
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer">Emission Factors</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer">Product ESG Profiles</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer">Carbon Transactions</div>
        <div className="px-4 py-1.5 bg-green-600 text-white rounded font-medium cursor-pointer">Environmental Goals</div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm transition-colors">+ New Goal</button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-sm transition-colors">Edit</button>
          <button className="bg-red-400 hover:bg-red-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Delete</button>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-1.5 rounded text-sm transition-colors">Export ▾</button>
        </div>
        <div className="relative">
          <span className="absolute left-2 top-1.5 text-gray-400">🔍</span>
          <input type="text" placeholder="Search goals..." className="bg-[#1e1e1e] border border-gray-700 rounded pl-8 pr-4 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-green-500 w-64" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-800/50 text-gray-400 border-b border-gray-800 text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Target CO₂</th>
              <th className="px-4 py-3 font-medium">Current CO₂</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {mockGoals.map(goal => (
              <tr key={goal.id} className="hover:bg-gray-800/30">
                <td className="px-4 py-3">{goal.name}</td>
                <td className="px-4 py-3">{goal.dept}</td>
                <td className="px-4 py-3">{goal.target}</td>
                <td className="px-4 py-3">{goal.current}</td>
                <td className="px-4 py-3 w-48">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8">{goal.progress}%</span>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{goal.deadline}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-3 py-1 rounded-full border text-xs bg-[#121212] ${goal.statusColor}`}>
                    {goal.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">Row actions: 👁 View  ✎ Edit  🗑 Delete  •  Carbon Transactions auto-generated from Purchase/Manufacturing/Fleet/Expenses</div>
    </div>
  );
}
