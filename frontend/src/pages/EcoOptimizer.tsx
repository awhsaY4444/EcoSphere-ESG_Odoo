import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';
import { Compass, Sparkles, TrendingUp, DollarSign, Calendar, Eye, Activity, Award, CheckCircle, Shield, Users, BarChart3, ClipboardList } from 'lucide-react';

interface OptimalPortfolio {
  actions: string[];
  cost: number;
  timeline: string;
  co2e_saved: number;
  co2e_pct_reduction: number;
  env_gain: number;
  social_gain: number;
  gov_gain: number;
  overall_gain: number;
}

interface RankedRecommendation {
  rank: number;
  id: string;
  name: string;
  cost: number;
  timeline: string;
  co2e_reduction_kg: number;
  esg_gain_env: number;
  esg_gain_social: number;
  esg_gain_gov: number;
  esg_gain_overall: number;
  roi: string;
  confidence: number;
  recommendation: string;
  explanation: string;
}

interface OptimizationResult {
  budget: number;
  timeline: number;
  target_dept: string;
  target_category: string;
  priority: string;
  optimal_portfolio: OptimalPortfolio | null;
  ranked_recommendations: RankedRecommendation[];
  message?: string;
}

export default function EcoOptimizer() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [budget, setBudget] = useState(1000000);
  const [timeline, setTimeline] = useState(12);
  const [targetDept, setTargetDept] = useState('All');
  const [targetCategory, setTargetCategory] = useState('All');
  const [priority, setPriority] = useState('Score Improvement');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  // Track which explainability cards are expanded
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/master_data/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/ecooptimizer/history');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to load optimization history", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchHistory();
  }, []);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budget <= 0) {
      toast("Please enter a valid budget above zero", "error");
      return;
    }
    if (timeline <= 0) {
      toast("Please enter a timeline of at least 1 month", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/ecooptimizer/optimize', {
        budget,
        target_dept: targetDept,
        target_category: targetCategory,
        timeline,
        priority
      });
      setResult(response.data);
      if (response.data.message) {
        toast(response.data.message, "info");
      } else {
        toast("Strategy optimization complete!", "success");
      }
      fetchHistory(); // Refresh history log
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to run action optimizer";
      toast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleExplanation = (id: string) => {
    setExpandedExplanation(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper formatting for currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 mb-2 flex items-center gap-3">
          <Compass className="text-orange-400 w-9 h-9 animate-spin-slow" /> EcoOptimizer — ESG Strategy Control Center
        </h1>
        <p className="text-gray-400">
          Optimize capital allocation by comparing multiple sustainability pathways and selecting the highest ROI action portfolio.
        </p>
      </div>

      {/* Inputs and Portfolio Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* User Configuration Form */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-orange-400" /> Optimization Parameters
          </h2>
          
          <form onSubmit={handleOptimize} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <DollarSign size={14} /> Total Budget Limit (INR)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 font-bold"
                placeholder="e.g. 1000000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Calendar size={14} /> Max Timeline Bounds (Months)
              </label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months (1 Year)</option>
                <option value="18">18 Months</option>
                <option value="24">24 Months (2 Years)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400">Target Department Scope</label>
              <select
                value={targetDept}
                onChange={(e) => setTargetDept(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400">Target ESG Segment</label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
              >
                <option value="All">All Segments (E, S, G)</option>
                <option value="Carbon Reduction">Environmental (E)</option>
                <option value="Social Engagement">Social (S)</option>
                <option value="Governance Compliance">Governance (G)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <TrendingUp size={14} /> Optimization Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
              >
                <option value="Score Improvement">Maximize Overall ESG Score</option>
                <option value="Carbon Reduction">Maximize Carbon Reduction (CO₂)</option>
                <option value="Cost Efficiency">Optimize ROI / Cost Efficiency</option>
                <option value="Compliance Resolution">Prioritize Governance Compliance</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-tr from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Running Optimization Engine...' : 'Generate Optimal Strategy'}
            </button>
          </form>

        </div>

        {/* Optimal Action Portfolio Display */}
        <div className="lg:col-span-2 space-y-6">
          
          {result && result.optimal_portfolio ? (
            <div className="glass-panel p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 space-y-6 relative overflow-hidden animate-in fade-in duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[40px] pointer-events-none -translate-y-12 translate-x-12"></div>
              
              {/* Portfolio stats summary header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">Recommended Optimal Strategy</span>
                  <h3 className="text-xl font-extrabold text-white mt-1">Recommended Action Portfolio</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Expected Completion</span>
                  <p className="text-sm font-bold text-white mt-0.5">{result.optimal_portfolio.timeline}</p>
                </div>
              </div>

              {/* Stats Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">ESG Gain (Overall)</span>
                  <p className="text-xl font-black text-orange-400 mt-1">+{result.optimal_portfolio.overall_gain}</p>
                </div>

                <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Carbon Reduction</span>
                  <p className="text-xl font-black text-green-400 mt-1">-{result.optimal_portfolio.co2e_pct_reduction}%</p>
                  <span className="text-[9px] text-gray-400 mt-0.5 block">({intFormat(result.optimal_portfolio.co2e_saved)} kg saved)</span>
                </div>

                <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Total Project Cost</span>
                  <p className="text-xl font-black text-white mt-1">{formatCurrency(result.optimal_portfolio.cost)}</p>
                </div>

                <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Budget Utilisation</span>
                  <p className="text-xl font-black text-amber-300 mt-1">
                    {roundPct(result.optimal_portfolio.cost, result.budget)}%
                  </p>
                </div>

              </div>

              {/* Progress utilization bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-400">
                  <span>Utilised: {formatCurrency(result.optimal_portfolio.cost)}</span>
                  <span>Limit: {formatCurrency(result.budget)}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" 
                    style={{ width: `${Math.min(100, (result.optimal_portfolio.cost / result.budget) * 100)}%` }}
                  />
                </div>
              </div>

              {/* List of actions inside portfolio */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Included Actions</h4>
                <div className="flex flex-wrap gap-2.5">
                  {result.optimal_portfolio.actions.map((actName, idx) => (
                    <div key={idx} className="bg-black/45 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-gray-200 flex items-center gap-2">
                      <CheckCircle size={14} className="text-orange-400" />
                      {actName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Score gains bars */}
              <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Score Contribution Gain Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-green-400 font-bold flex items-center gap-1"><Shield size={10} /> Environmental Score</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (result.optimal_portfolio.env_gain / 100) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-white font-bold">+{result.optimal_portfolio.env_gain}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1"><Users size={10} /> Social Score</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (result.optimal_portfolio.social_gain / 100) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-white font-bold">+{result.optimal_portfolio.social_gain}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1"><Award size={10} /> Governance Score</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (result.optimal_portfolio.gov_gain / 100) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-white font-bold">+{result.optimal_portfolio.gov_gain}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : result && result.message ? (
            <div className="glass-panel p-12 text-center text-gray-400 border border-white/5 bg-white/5 rounded-2xl">
              {result.message}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center text-gray-400 border border-white/5 bg-white/5 rounded-2xl flex flex-col items-center justify-center space-y-3">
              <Compass className="w-12 h-12 text-gray-600 animate-pulse" />
              <p className="text-sm font-medium">Ready to Optimize. Enter budget/timeline bounds and click calculate.</p>
            </div>
          )}

        </div>

      </div>

      {/* Ranked Recommendations List */}
      {result && result.ranked_recommendations && result.ranked_recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-orange-400" /> Individual Action Ranking (Grounding)
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {result.ranked_recommendations.map((rec) => (
              <div key={rec.id} className="glass-panel p-5 rounded-2xl border border-white/5 bg-white/5 space-y-4 transition-all hover:bg-white/[0.02]">
                
                {/* Header row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-extrabold flex items-center justify-center text-sm shadow-md">
                      #{rec.rank}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-white text-base">{rec.name}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 font-semibold uppercase mt-0.5">
                        <span>Cost: <strong className="text-white">{formatCurrency(rec.cost)}</strong></span>
                        <span>•</span>
                        <span>Timeline: <strong className="text-white">{rec.timeline}</strong></span>
                        <span>•</span>
                        <span>ROI: <strong className="text-orange-400">{rec.roi}</strong></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300">
                      {rec.confidence}% Confidence
                    </div>
                    <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-400">
                      {rec.recommendation}
                    </div>
                    <button
                      onClick={() => toggleExplanation(rec.id)}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-bold text-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} /> {expandedExplanation[rec.id] ? 'Hide Reason' : 'Explain Why'}
                    </button>
                  </div>
                </div>

                {/* Score bar stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/10 p-3 rounded-xl border border-white/5 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Carbon reduction</span>
                    <strong className="text-green-400 font-black">{rec.co2e_reduction_kg > 0 ? `-${intFormat(rec.co2e_reduction_kg)} kg CO2e` : 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Env Gain</span>
                    <strong className="text-white font-extrabold">+{rec.esg_gain_env}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Social Gain</span>
                    <strong className="text-white font-extrabold">+{rec.esg_gain_social}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Gov Gain</span>
                    <strong className="text-white font-extrabold">+{rec.esg_gain_gov}</strong>
                  </div>
                </div>

                {/* Expanded explanation text */}
                {expandedExplanation[rec.id] && (
                  <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 text-xs text-gray-200 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                    <strong>Grounded Optimization Reason:</strong> {rec.explanation}
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Optimization History Logs */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardList className="text-gray-400" /> Optimization Simulation logs
        </h2>
        
        {history.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/30 text-gray-400 border-b border-white/5">
                  <th className="p-4 font-bold">Scope / Department</th>
                  <th className="p-4 font-bold">Budget Limit</th>
                  <th className="p-4 font-bold">Timeline Limit</th>
                  <th className="p-4 font-bold">Optimization Priority</th>
                  <th className="p-4 font-bold">Recommended Portfolio Actions</th>
                  <th className="p-4 font-bold">Overall ESG Gain</th>
                  <th className="p-4 font-bold">Carbon Reduction</th>
                  <th className="p-4 font-bold">Simulated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors text-gray-300">
                    <td className="p-4 font-semibold text-white">{h.target_dept} / {h.target_category}</td>
                    <td className="p-4 font-bold">{formatCurrency(h.budget)}</td>
                    <td className="p-4">{h.timeline} months</td>
                    <td className="p-4">{h.priority}</td>
                    <td className="p-4 max-w-xs truncate text-orange-400 font-semibold">{h.recommended_portfolio}</td>
                    <td className="p-4 font-bold text-green-400">+{h.expected_esg_gain}</td>
                    <td className="p-4 text-green-400 font-bold">-{h.carbon_reduction_pct}%</td>
                    <td className="p-4 text-gray-500">
                      {new Date(h.optimized_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500 italic">No optimization history available. Enter bounds to run a calculation.</div>
        )}
      </div>

    </div>
  );
}

// Helpers
function intFormat(val: number) {
  return val.toLocaleString();
}

function roundPct(val: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.round((val / limit) * 100);
}
