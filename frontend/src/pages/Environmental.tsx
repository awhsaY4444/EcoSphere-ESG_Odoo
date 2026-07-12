import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Environmental() {
  const [activeTab, setActiveTab] = useState('Environmental Goals');
  const [goals, setGoals] = useState<any[]>([]);

  const fetchGoals = () => {
    api.get('/environmental/goals')
      .then(res => setGoals(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchGoals();
    
    const handleTabChange = (e: any) => {
      setActiveTab(e.detail.tab);
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  const handleNewGoal = () => {
    const title = window.prompt("Enter goal title (e.g. Reduce Scope 1 Emissions):");
    if (!title) return;
    const target_value = window.prompt("Enter target value (e.g. 5000):");
    if (!target_value) return;
    const target_metric = window.prompt("Enter metric (e.g. MT CO2e):", "MT CO2e");
    if (!target_metric) return;
    const deadline = window.prompt("Enter deadline (YYYY-MM-DD):", "2026-12-31");
    if (!deadline) return;

    api.post('/environmental/goals', {
      title,
      target_value: parseFloat(target_value),
      target_metric,
      deadline,
      dept_id: null
    }).then(() => {
      fetchGoals();
    }).catch(err => toast("Error creating goal", 'error'));
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      api.delete(`/environmental/goals/${id}`)
        .then(() => fetchGoals())
        .catch(err => toast("Error deleting goal", 'error'));
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Name,Department,Target,Current,Progress,Deadline,Status\n"
      + goals.map(g => `${g.id},${g.name},${g.dept},${g.target},${g.current},${g.progress},${g.deadline},${g.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "environmental_goals.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-8">
      {/* Sub Tabs */}
      <div className="flex space-x-2 text-sm bg-white/5 p-1 rounded-lg border border-white/5 w-fit">
        {['Emission Factors', 'Product ESG Profiles', 'Carbon Transactions', 'Environmental Goals'].map(tab => (
          <div 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md font-medium cursor-pointer transition-all ${activeTab === tab ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {tab}
          </div>
        ))}
      </div>

      {activeTab === 'Environmental Goals' ? (
        <>
          {/* Actions Bar */}
      <div className="flex justify-between items-center bg-[#18181b] p-4 rounded-xl border border-white/5">
        <div className="flex space-x-3">
          <button onClick={handleNewGoal} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-green-500/20 flex items-center gap-2">
            <span>+</span> New Goal
          </button>
          <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
            Export <span>▾</span>
          </button>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">🔍</span>
          <input type="text" placeholder="Search goals..." className="bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 w-72 transition-all" />
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> Sustainability Goals
          </h3>
        </div>
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Goal Name</th>
              <th className="px-6 py-4 font-medium">Department</th>
              <th className="px-6 py-4 font-medium">Target</th>
              <th className="px-6 py-4 font-medium">Current</th>
              <th className="px-6 py-4 font-medium w-48">Progress</th>
              <th className="px-6 py-4 font-medium">Deadline</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {goals.map(goal => (
              <tr key={goal.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-semibold text-gray-200">{goal.name}</td>
                <td className="px-6 py-4 text-gray-400">{goal.dept}</td>
                <td className="px-6 py-4 font-medium">{goal.target} <span className="text-[10px] text-gray-500">MT CO2e</span></td>
                <td className="px-6 py-4 font-medium">{goal.current} <span className="text-[10px] text-gray-500">MT CO2e</span></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium w-9 text-right text-green-400">{goal.progress}%</span>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-1.5 rounded-full relative" style={{ width: `${goal.progress}%` }}>
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{goal.deadline}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${goal.statusColor.includes('green') ? 'bg-green-500/20 text-green-400 border border-green-500/20' : goal.statusColor.includes('orange') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
                    {goal.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => window.prompt("Edit goal title:", goal.name)} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors" title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 hover:bg-red-500/20 rounded-md text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {goals.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-4xl mb-3">🌱</div>
                  <p>No environmental goals found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-black/20 p-3 rounded-lg border border-white/5 w-fit mx-auto mt-4">
        <span className="text-blue-400">ℹ️</span> Carbon Transactions auto-generated from Purchase / Manufacturing / Fleet / Expenses
      </div>
      </>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center text-gray-400 border border-white/5 shadow-2xl">
           <div className="text-4xl mb-4 opacity-50">🚧</div>
           <h3 className="text-xl font-bold text-gray-200 mb-2">{activeTab} Module</h3>
           <p className="text-sm">This module is currently under active development. Data models are initialized but the UI is not yet published.</p>
        </div>
      )}
    </div>
  );
}
