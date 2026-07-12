import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Scenario {
  id: string;
  name: string;
  deptId: string;
  deptName: string;
  activityType: string;
  reductionPercent: number;
  currentEmissions: number;
  projectedEmissions: number;
  co2eReduction: number;
  currentEnvScore: number;
  projectedEnvScore: number;
  currentOverallScore: number;
  projectedOverallScore: number;
  recommendation: string;
  goalImpact: string;
}

export default function EcoTwin() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('All');
  const [reductionPercent, setReductionPercent] = useState(20);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Scenarios side by side comparison
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    // Fetch departments for select menu
    api.get('/master_data/departments')
      .then(res => {
        setDepartments(res.data);
        if (res.data.length > 0) {
          setSelectedDept(res.data[0].id.toString());
        }
      })
      .catch(err => console.error("Error fetching departments:", err));
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await api.post('/environmental/simulate', {
        dept_id: parseInt(selectedDept),
        reduction_percent: reductionPercent,
        activity_type: selectedActivity === 'All' ? null : selectedActivity
      });
      setResult(response.data);
      toast("Simulation computed successfully!", "success");
    } catch (err) {
      toast("Failed to compute simulation", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScenario = () => {
    if (!result) return;
    const name = window.prompt("Enter a name for this scenario (e.g. Reduce Diesel 30%):");
    if (!name) return;

    const newScenario: Scenario = {
      id: Date.now().toString(),
      name,
      deptId: selectedDept,
      deptName: result.dept_name,
      activityType: selectedActivity,
      reductionPercent,
      currentEmissions: result.current_emissions,
      projectedEmissions: result.projected_emissions,
      co2eReduction: result.co2e_reduction,
      currentEnvScore: result.current_env_score,
      projectedEnvScore: result.projected_env_score,
      currentOverallScore: result.current_overall_score,
      projectedOverallScore: result.projected_overall_score,
      recommendation: result.recommendation,
      goalImpact: result.goal_impact
    };

    setScenarios([...scenarios, newScenario]);
    toast("Scenario saved for comparison!", "success");
  };

  const handleConvertToGoal = async (scenarioToConvert?: Scenario) => {
    const target = scenarioToConvert || result;
    if (!target) return;

    const deptName = target.dept_name || target.deptName;
    const deptId = target.dept_id || target.deptId;
    const activity = target.activityType || selectedActivity;
    const pct = target.reductionPercent || reductionPercent;
    const co2eRed = target.co2e_reduction || target.co2eReduction;

    const confirm = window.confirm(`Convert this scenario into a Draft Environmental Goal for ${deptName}?`);
    if (!confirm) return;

    try {
      await api.post('/environmental/goals', {
        title: `Reduce ${activity === 'All' ? 'Carbon' : activity} emissions by ${pct}% in ${deptName}`,
        target_metric: "kg CO2e",
        target_value: parseFloat((target.current_emissions || target.currentEmissions) - co2eRed),
        current_value: parseFloat(target.current_emissions || target.currentEmissions),
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10), // 3 months deadline
        dept_id: parseInt(deptId)
      });
      toast("Goal successfully created! Active in Environmental Goals workflow.", "success");
    } catch (err) {
      toast("Failed to convert simulation to goal", "error");
    }
  };

  const chartData = result ? [
    { name: 'Current', emissions: result.current_emissions, envScore: result.current_env_score, overallScore: result.current_overall_score },
    { name: 'Projected', emissions: result.projected_emissions, envScore: result.projected_env_score, overallScore: result.projected_overall_score }
  ] : [];

  const comparisonChartData = scenarios.map(s => ({
    name: s.name,
    reduction: s.co2eReduction,
    envScore: s.projectedEnvScore,
    overallScore: s.projectedOverallScore
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
          🔮 EcoTwin — Digital Twin & What-If Simulator
        </h1>
        <p className="text-gray-400">
          Simulate carbon and score reductions before implementing sustainability decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Configuration Panel */}
        <div className="col-span-1 glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-[20px]"></div>
          <h3 className="text-lg font-bold text-gray-200">Configure Scenario</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400">Target Department</label>
              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 appearance-none"
              >
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id} className="bg-[#18181b]">{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400">Activity Type</label>
              <select 
                value={selectedActivity} 
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 appearance-none"
              >
                <option value="All" className="bg-[#18181b]">All Operational Sources</option>
                <option value="Diesel Fuel" className="bg-[#18181b]">Diesel Fuel (Fleet)</option>
                <option value="Grid Electricity" className="bg-[#18181b]">Grid Electricity (Facilities)</option>
                <option value="Paper Used" className="bg-[#18181b]">Paper Used (Office Expenses)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-gray-400">
                <span>Reduction Target</span>
                <span className="text-green-400 font-bold">{reductionPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="5"
                value={reductionPercent}
                onChange={(e) => setReductionPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
          </div>

          <button 
            onClick={handleSimulate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-3.5 transition-all shadow-lg shadow-green-500/20 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            {loading ? "Computing Twin Projection..." : "Simulate Twin Projection"}
          </button>
        </div>

        {/* Results Panel */}
        <div className="col-span-1 lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 flex flex-col justify-between">
          {result ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-gray-200">Twin Simulation Results</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveScenario}
                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-semibold border border-white/10 transition-colors"
                    >
                      Compare Scenario
                    </button>
                    <button 
                      onClick={() => handleConvertToGoal()}
                      className="px-3.5 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-bold border border-green-500/30 transition-colors"
                    >
                      Convert to Goal
                    </button>
                  </div>
                </div>

                {/* Score Projection Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Carbon Reduction</p>
                    <p className="text-2xl font-black text-green-400">-{result.co2e_reduction} <span className="text-xs font-medium text-gray-500">kg CO2e</span></p>
                    <p className="text-[10px] text-gray-400 mt-1">{result.goal_impact}</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Environmental Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">{result.projected_env_score}</span>
                      <span className="text-xs text-gray-500">/ 100</span>
                      <span className="text-xs text-green-400 font-bold">(+{round(result.projected_env_score - result.current_env_score, 1)})</span>
                    </div>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Overall ESG Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-400">{result.projected_overall_score}</span>
                      <span className="text-xs text-gray-500">/ 100</span>
                      <span className="text-xs text-green-400 font-bold">(+{round(result.projected_overall_score - result.current_overall_score, 1)})</span>
                    </div>
                  </div>
                </div>

                {/* Dual-axis chart comparing state */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="name" stroke="#71717a" tick={{fill: '#71717a', fontSize: 11}} />
                      <YAxis stroke="#71717a" tick={{fill: '#71717a', fontSize: 11}} />
                      <Tooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#3f3f46'}} itemStyle={{color: '#fff'}} />
                      <Legend wrapperStyle={{fontSize: 11}} />
                      <Bar dataKey="emissions" fill="#ef4444" name="CO2e Emissions (kg)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="envScore" fill="#10b981" name="Environmental Score" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recommendation explanation */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl mt-4">
                <p className="text-xs text-indigo-300 font-bold flex items-center gap-1.5 mb-1.5">
                  <span>💡</span> Twin Recommendation
                </p>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  {result.recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-gray-500">
              <div className="text-5xl mb-4 opacity-30">🔮</div>
              <h4 className="text-lg font-bold text-gray-300 mb-1">Awaiting Simulation</h4>
              <p className="text-sm max-w-sm">Configure target department, activity, and reduction percentage to calculate twin impacts.</p>
            </div>
          )}
        </div>

      </div>

      {/* Comparisons Section */}
      {scenarios.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 space-y-6">
          <h3 className="text-lg font-bold text-gray-200">Scenarios Comparison</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-1 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" tick={{fill: '#71717a', fontSize: 10}} />
                  <YAxis stroke="#71717a" tick={{fill: '#71717a', fontSize: 10}} />
                  <Tooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#3f3f46'}} />
                  <Bar dataKey="reduction" fill="#10b981" name="Reduction (kg CO2e)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scenarios List */}
            <div className="lg:col-span-2 space-y-3 max-h-56 overflow-y-auto pr-2">
              {scenarios.map((s) => (
                <div key={s.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center hover:bg-black/40 transition-colors">
                  <div>
                    <h4 className="font-bold text-white text-sm">{s.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{s.deptName} • Reduce {s.activityType} by {s.reductionPercent}%</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-bold uppercase">Projected Overall</p>
                      <p className="font-extrabold text-amber-400 text-sm">{s.projectedOverallScore} <span className="text-[10px] text-green-400">(+{round(s.projectedOverallScore - s.currentOverallScore, 1)})</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-bold uppercase">CO2e Saved</p>
                      <p className="font-extrabold text-green-400 text-sm">-{s.co2eReduction} kg</p>
                    </div>
                    <button 
                      onClick={() => handleConvertToGoal(s)}
                      className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-bold border border-green-500/30 transition-colors"
                    >
                      Create Goal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function round(value: number, precision: number) {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}
