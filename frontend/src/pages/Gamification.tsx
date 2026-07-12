import { useState } from 'react';

const mockChallenges = [
  { id: 1, title: 'Sustainability Sprint', xp: 200, difficulty: 'Hard', deadline: '07/20', status: 'Active', statusColor: 'bg-green-600' },
  { id: 2, title: 'Recycle Challenge', xp: 80, difficulty: 'Easy', deadline: '07/15', status: 'Active', statusColor: 'bg-green-600' },
  { id: 3, title: 'Commute Green Week', xp: 120, difficulty: 'Medium', deadline: '07/25', status: 'Draft', statusColor: 'text-gray-400 bg-gray-800' },
];

export default function Gamification() {
  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex space-x-1 border-b border-gray-800 bg-[#1e1e1e] rounded-t-md overflow-hidden text-sm">
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Dashboard</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Environmental</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Social</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Governance</div>
        <div className="px-6 py-2 bg-gray-800 text-white font-medium border-t-2 border-orange-500">Gamification</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Reports</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Settings</div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 text-xs border-b border-gray-800 pb-2">
        <div className="px-4 py-1.5 bg-orange-500 text-white rounded font-medium cursor-pointer w-40 text-center">Challenges</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-40 text-center">Challenge Participation</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-40 text-center">Badges</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-40 text-center">Rewards</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-40 text-center">Leaderboard</div>
      </div>

      <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-sm transition-colors">+ New Challenge</button>

      {/* Challenge Status Flow */}
      <div className="flex space-x-2 text-xs">
        <div className="flex-1 px-4 py-2 border border-gray-700 rounded text-gray-400">Draft</div>
        <div className="flex-1 px-4 py-2 border border-green-500 text-green-500 rounded bg-[#1e1e1e]">Active</div>
        <div className="flex-1 px-4 py-2 border border-purple-500 text-purple-500 rounded bg-[#1e1e1e]">Under Review</div>
        <div className="flex-1 px-4 py-2 border border-blue-500 text-blue-500 rounded bg-[#1e1e1e]">Completed</div>
        <div className="flex-1 px-4 py-2 border border-gray-700 rounded text-gray-400">Archived</div>
      </div>

      {/* Challenge Cards */}
      <div className="grid grid-cols-3 gap-4">
        {mockChallenges.map(challenge => (
          <div key={challenge.id} className="bg-[#1e1e1e] rounded-xl border border-orange-500/50 p-4 flex flex-col justify-between h-40">
            <div>
              <h3 className="font-medium text-gray-200 flex items-center gap-2">
                <span className="text-orange-400">⚡</span> {challenge.title}
              </h3>
              <p className="text-xs text-gray-400 mt-2">XP: {challenge.xp} - {challenge.difficulty}</p>
              <p className="text-xs text-gray-400">Deadline: {challenge.deadline}</p>
              <span className={`inline-block px-2 py-0.5 mt-2 rounded text-xs ${challenge.status === 'Active' ? 'bg-green-600 text-white' : 'border border-gray-600 text-gray-400'}`}>
                {challenge.status}
              </span>
            </div>
            <button className="mt-2 bg-orange-500 hover:bg-orange-600 text-white py-1 px-4 rounded text-sm self-start transition-colors">Join Challenge</button>
          </div>
        ))}
      </div>

      {/* Bottom Section: Badges & Leaderboard */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <span className="text-orange-400">🏅</span> Badge Gallery
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-orange-500/50 rounded-lg p-3 flex items-center gap-2">
              <span>🌱</span> <span className="text-sm text-gray-200">Green Beginner</span>
            </div>
            <div className="border border-orange-500/50 rounded-lg p-3 flex items-center gap-2">
              <span>♻️</span> <span className="text-sm text-gray-200">Carbon Saver</span>
            </div>
            <div className="border border-orange-500/50 rounded-lg p-3 flex items-center gap-2">
              <span>🌍</span> <span className="text-sm text-gray-200">Sustainability Champion</span>
            </div>
            <div className="border border-orange-500/50 rounded-lg p-3 flex items-center gap-2">
              <span>⭐</span> <span className="text-sm text-gray-200">Team Player</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <span className="text-yellow-500">🏆</span> Leaderboard
          </h3>
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-gray-500 border-b border-gray-800 text-xs">
              <tr>
                <th className="pb-2 font-medium">Rank</th>
                <th className="pb-2 font-medium">Employee/Dept</th>
                <th className="pb-2 font-medium text-right">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td className="py-2">1</td>
                <td className="py-2">Manufacturing Dept</td>
                <td className="py-2 text-right">4,820</td>
              </tr>
              <tr>
                <td className="py-2">2</td>
                <td className="py-2">Aditi Rao</td>
                <td className="py-2 text-right">3,910</td>
              </tr>
              <tr>
                <td className="py-2">3</td>
                <td className="py-2">Corporate Dept</td>
                <td className="py-2 text-right">3,505</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
