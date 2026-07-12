import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

// Mock data for charts
const emissionsData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 200 },
  { name: 'Apr', value: 278 },
  { name: 'May', value: 189 },
  { name: 'Jun', value: 239 },
  { name: 'Jul', value: 349 },
  { name: 'Aug', value: 200 },
  { name: 'Sep', value: 278 },
  { name: 'Oct', value: 189 },
  { name: 'Nov', value: 239 },
  { name: 'Dec', value: 349 },
];

export default function Dashboard() {
  const [scores, setScores] = useState({
    env: 0,
    social: 0,
    gov: 0,
    overall: 0
  });
  
  const [deptRankingData, setDeptRankingData] = useState<{name: string, score: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overallRes, deptsRes] = await Promise.all([
          api.get('/scores/overall'),
          api.get('/scores/departments')
        ]);
        
        setScores({
          env: overallRes.data.env_score || 0,
          social: overallRes.data.social_score || 0,
          gov: overallRes.data.gov_score || 0,
          overall: overallRes.data.overall_esg_score || 0
        });
        
        // Sort and format department data for the chart
        const sortedDepts = deptsRes.data
          .sort((a: any, b: any) => b.score - a.score)
          .map((d: any) => ({ name: d.code, score: d.score }));
          
        setDeptRankingData(sortedDepts);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="text-gray-400 p-8">Loading dashboard metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs (simulated for wireframe match) */}
      <div className="flex space-x-1 border-b border-gray-800 bg-[#1e1e1e] rounded-t-md overflow-hidden">
        <div className="px-6 py-2 bg-gray-800 text-white font-medium border-t-2 border-green-500">Dashboard</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Environmental</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Social</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Governance</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Gamification</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Reports</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Settings</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-green-500/30">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Environmental Score</h3>
          <div className="text-3xl font-bold text-white">{scores.env} <span className="text-lg text-gray-500 font-normal">/ 100</span></div>
        </div>
        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-blue-500/30">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Social Score</h3>
          <div className="text-3xl font-bold text-white">{scores.social} <span className="text-lg text-gray-500 font-normal">/ 100</span></div>
        </div>
        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-purple-500/30">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Governance Score</h3>
          <div className="text-3xl font-bold text-white">{scores.gov} <span className="text-lg text-gray-500 font-normal">/ 100</span></div>
        </div>
        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-blue-400/30">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Overall ESG Score</h3>
          <div className="text-3xl font-bold text-white">{scores.overall} <span className="text-lg text-gray-500 font-normal">/ 100</span></div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2">Features: live KPI tiles - trend arrows - click-through to module</div>

      {/* Charts Section */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Emissions Trend (12 mo)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={emissionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#666'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333'}} />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{fill: '#22c55e', r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Department ESG Ranking
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptRankingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333'}} cursor={{fill: '#2a2a2a'}} />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span> Recent Activity
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm">
              <span className="text-purple-400">✓</span>
              <span className="text-gray-300">Priya completed 'Zero Waste Week'</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="text-orange-400">⚠️</span>
              <span className="text-gray-300">New compliance issue in Logistics</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="text-blue-400">📊</span>
              <span className="text-gray-300">42 new Carbon Transactions logged</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="text-red-400">📝</span>
              <span className="text-gray-300">R&D acknowledged Anti-Corruption Policy</span>
            </li>
          </ul>
        </div>

        <div className="col-span-1 bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <span className="text-orange-500">⚡</span> Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm text-left font-medium transition-colors">
              + Log Carbon Data
            </button>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md text-sm text-left font-medium transition-colors">
              + Start Challenge
            </button>
            <button className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 px-4 rounded-md text-sm text-left font-medium transition-colors">
              📄 View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
