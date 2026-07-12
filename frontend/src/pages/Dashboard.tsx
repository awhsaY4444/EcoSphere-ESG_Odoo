import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
=======
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [scores, setScores] = useState({
    env: 0,
    social: 0,
    gov: 0,
    overall: 0
  });
  
  const [deptRankingData, setDeptRankingData] = useState<{name: string, score: number}[]>([]);
  const [emissionsTrend, setEmissionsTrend] = useState<{name: string, value: number}[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [topRisks, setTopRisks] = useState<any[]>([]);
  const [ecopilotInsight, setEcopilotInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [overallRes, deptsRes, txsRes, risksRes, notifsRes] = await Promise.all([
        api.get('/scores/overall'),
        api.get('/scores/departments'),
        api.get('/environmental/carbon-transactions'),
        api.get('/environmental/risk-radar'),
        api.get('/notifications')
      ]);
      
      // 1. Scores
      setScores({
        env: overallRes.data.env_score || 0,
        social: overallRes.data.social_score || 0,
        gov: overallRes.data.gov_score || 0,
        overall: overallRes.data.overall_esg_score || 0
      });
      
      // 2. Department rankings
      const sortedDepts = deptsRes.data
        .sort((a: any, b: any) => b.score - a.score)
        .map((d: any) => ({ name: d.code, score: d.score }));
      setDeptRankingData(sortedDepts);

      // 3. Emissions trend (past 12 months)
      const txs = txsRes.data;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const last12Months: any[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(currentMonth - i);
        last12Months.push({
          monthIndex: d.getMonth(),
          year: d.getFullYear(),
          name: monthNames[d.getMonth()],
          value: 0
        });
<<<<<<< HEAD
        
        const sortedDepts = deptsRes.data
          .sort((a: any, b: any) => b.score - a.score)
          .map((d: any) => ({ name: d.code, score: d.score }));
          
        setDeptRankingData(sortedDepts);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        // Add artificial delay for enterprise feel of loading
        setTimeout(() => setLoading(false), 800);
=======
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
      }
      
      txs.forEach((tx: any) => {
        const txDate = new Date(tx.date);
        const txMonth = txDate.getMonth();
        const txYear = txDate.getFullYear();
        const matched = last12Months.find(m => m.monthIndex === txMonth && m.year === txYear);
        if (matched) {
          matched.value += tx.co2e_calculated;
        }
      });

      setEmissionsTrend(last12Months.map(m => ({
        name: m.name,
        value: Math.round(m.value)
      })));

      // 4. Risks
      setTopRisks(risksRes.data.slice(0, 3));

      // 5. Recent activities
      const activities: any[] = [];
      
      // Push notifications if any
      if (notifsRes.data && notifsRes.data.length > 0) {
        notifsRes.data.slice(0, 4).forEach((n: any) => {
          activities.push({
            type: n.type,
            title: n.message,
            time: 'Notification',
            icon: n.type === 'BadgeUnlock' ? '🏆' : n.type === 'Compliance' ? '⚠️' : '🔔'
          });
        });
      }

      // If less than 3 activities, populate from carbon txs and risks
      if (activities.length < 3) {
        txs.slice(0, 3).forEach((tx: any, idx: number) => {
          activities.push({
            type: 'Environmental',
            title: `Carbon transaction logged: ${tx.quantity} units for ${tx.source_ref_id}`,
            time: `${idx + 1} day(s) ago`,
            icon: '🌱'
          });
        });
      }

      setRecentActivities(activities.slice(0, 3));

      // 6. Ecopilot summary quote
      if (risksRes.data.length > 0) {
        const primaryRisk = risksRes.data[0];
        setEcopilotInsight(`EcoPilot Diagnosis: Operational compliance is at risk due to "${primaryRisk.entity}" (${primaryRisk.evidence}). We recommend executing the intervention: "${primaryRisk.recommended_action}".`);
      } else {
        setEcopilotInsight("EcoPilot Diagnosis: ESG indices are highly stable. Continue monitoring Scope 1/2 transactions and encourage employees to complete their corporate governance policy acknowledgements.");
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const radarData = [
    { subject: 'Environmental', A: scores.env, fullMark: 100 },
    { subject: 'Social', A: scores.social, fullMark: 100 },
    { subject: 'Governance', A: scores.gov, fullMark: 100 },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 glass-panel rounded-2xl bg-white/5 border border-white/5"></div>)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-80 glass-panel rounded-2xl bg-white/5 border border-white/5"></div>
          <div className="col-span-1 h-80 glass-panel rounded-2xl bg-white/5 border border-white/5"></div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-64 glass-panel rounded-2xl bg-white/5 border border-white/5"></div>
          <div className="col-span-1 h-64 glass-panel rounded-2xl bg-white/5 border border-white/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* KPI Cards */}
<<<<<<< HEAD
      <div className="grid grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow"></div> Environmental
=======
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Environmental Score
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">{scores.env}</span>
            <span className="text-sm text-gray-500 font-medium mb-1">/ 100</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
<<<<<<< HEAD
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-slow"></div> Social
=======
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> Social Score
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">{scores.social}</span>
            <span className="text-sm text-gray-500 font-medium mb-1">/ 100</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
<<<<<<< HEAD
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse-slow"></div> Governance
=======
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div> Governance Score
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-600">{scores.gov}</span>
            <span className="text-sm text-gray-500 font-medium mb-1">/ 100</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/5"></div>
          <h3 className="text-sm font-semibold text-amber-200 mb-2 flex items-center gap-2 relative z-10">
            ⭐ Overall ESG Score
          </h3>
          <div className="flex items-end gap-2 relative z-10">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">{scores.overall}</span>
            <span className="text-sm text-amber-500/70 font-medium mb-1">/ 100</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
<<<<<<< HEAD
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> Emissions Trend (12 mo)
            </h3>
            <span className="text-xs font-medium px-3 py-1 bg-white/5 border border-white/10 rounded-full text-green-400">tCO2e Prediction Model</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emissionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
=======
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> Emissions Trend (Past 12 mo)
            </h3>
            <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-green-400">tCO2e Ledger Data</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emissionsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
<<<<<<< HEAD
                  contentStyle={{backgroundColor: 'rgba(24, 24, 27, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)'}} 
=======
                  contentStyle={{backgroundColor: 'rgba(24, 24, 27, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)'}} 
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
                  itemStyle={{color: '#fff'}}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 glass-panel p-6 rounded-2xl">
          <h3 className="text-base font-semibold text-gray-200 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> ESG Radar Analysis
          </h3>
          <div className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#3f3f46" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#a1a1aa', fontSize: 11}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Company Score" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'rgba(24, 24, 27, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px'}} 
                  itemStyle={{color: '#3b82f6', fontWeight: 'bold'}}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
<<<<<<< HEAD
      <div className="grid grid-cols-3 gap-6">
        
        {/* Eco-AI Insights Panel */}
        <div className="col-span-1 glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[30px]"></div>
          <h3 className="text-base font-semibold text-indigo-300 mb-4 flex items-center gap-2 relative z-10">
            <span>✨</span> Eco-AI Insights
          </h3>
          <div className="flex-1 space-y-4 relative z-10">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
              <p className="text-xs text-indigo-200 font-medium mb-1">Anomaly Detected</p>
              <p className="text-sm text-gray-300">We noticed a 15% spike in Scope 1 emissions in the Logistics department this week. Recommend investigating fleet fuel usage.</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
              <p className="text-xs text-green-300 font-medium mb-1">Predictive Analytics</p>
              <p className="text-sm text-gray-300">Based on current trajectory, you are 92% likely to meet your Q3 zero-waste goals ahead of schedule.</p>
            </div>
          </div>
        </div>

        <div className="col-span-1 glass-panel p-6 rounded-2xl">
          <h3 className="text-base font-semibold text-gray-200 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span> Recent Activity Feed
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">✓</div>
              <div>
                <p className="text-sm text-gray-200 font-medium">Priya completed 'Zero Waste Week'</p>
                <p className="text-xs text-gray-500 mt-0.5">2 hours ago • Gamification</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">⚠️</div>
              <div>
                <p className="text-sm text-gray-200 font-medium">New compliance issue flagged in Logistics</p>
                <p className="text-xs text-gray-500 mt-0.5">5 hours ago • Governance</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">📊</div>
              <div>
                <p className="text-sm text-gray-200 font-medium">42 new Carbon Transactions synced</p>
                <p className="text-xs text-gray-500 mt-0.5">Yesterday • Environmental</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-200 mb-6 flex items-center gap-2">
              <span className="text-orange-400">⚡</span> Quick Actions
            </h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/environmental')} className="w-full relative overflow-hidden group bg-[#18181b] border border-white/10 hover:border-green-500/50 rounded-xl p-4 text-left transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-[20px] group-hover:bg-green-500/20 transition-colors"></div>
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">Environmental Metrics</span>
                  <span className="text-gray-500 group-hover:text-green-400 transition-colors">→</span>
                </div>
              </button>
              <button onClick={() => navigate('/gamification')} className="w-full relative overflow-hidden group bg-[#18181b] border border-white/10 hover:border-orange-500/50 rounded-xl p-4 text-left transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-[20px] group-hover:bg-orange-500/20 transition-colors"></div>
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">Gamification Hub</span>
                  <span className="text-gray-500 group-hover:text-orange-400 transition-colors">→</span>
                </div>
              </button>
              <button onClick={() => navigate('/reports')} className="w-full relative overflow-hidden group bg-[#18181b] border border-white/10 hover:border-blue-500/50 rounded-xl p-4 text-left transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[20px] group-hover:bg-blue-500/20 transition-colors"></div>
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">ESG Reports</span>
                  <span className="text-gray-500 group-hover:text-blue-400 transition-colors">→</span>
                </div>
              </button>
            </div>
=======
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* EcoPilot Insights Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[30px]"></div>
          <h3 className="text-base font-semibold text-indigo-300 mb-4 flex items-center gap-2 relative z-10">
            <span>✨</span> EcoPilot Explainable Insights
          </h3>
          <div className="flex-1 space-y-4 relative z-10 flex flex-col justify-between">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">AI Diagnostic Agent</p>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                {ecopilotInsight}
              </p>
            </div>
            <button 
              onClick={() => navigate('/ecopilot')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mt-2 hover:translate-x-0.5 transform duration-200"
            >
              Consult EcoPilot Assistant <span>→</span>
            </button>
>>>>>>> 088d4c3 (feat: enhance EcoSphere ESG modules and intelligence features)
          </div>
        </div>

        {/* Top Risks radar list */}
        <div className="glass-panel p-6 rounded-2xl border border-red-500/10 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> Emerging ESG Risks
            </h3>
            <div className="space-y-3">
              {topRisks.map((risk, idx) => (
                <div key={idx} className="bg-black/20 p-3 rounded-xl border border-white/5 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">{risk.entity}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      risk.level === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/10' :
                      risk.level === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/10' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/10'
                    }`}>{risk.level}</span>
                  </div>
                  <p className="text-gray-400 font-medium mb-1">{risk.evidence}</p>
                  <p className="text-[10px] text-gray-500">Rec: {risk.recommended_action}</p>
                </div>
              ))}
              {topRisks.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-8">No current risks detected by system radars.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick navigation and metrics */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="text-orange-400">⚡</span> ESG Intelligence Quick Links
            </h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/ecotwin')} className="w-full relative overflow-hidden group bg-[#18181b] border border-white/10 hover:border-green-500/50 rounded-xl p-3.5 text-left transition-all">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/15 rounded-full blur-[20px] group-hover:bg-green-500/25 transition-colors"></div>
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <span className="font-bold text-gray-200 group-hover:text-white text-xs block transition-colors">🔮 EcoTwin Simulator</span>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Run What-If scenario projections</span>
                  </div>
                  <span className="text-gray-500 group-hover:text-green-400 transition-colors">→</span>
                </div>
              </button>
              
              <button onClick={() => navigate('/carbon-dna')} className="w-full relative overflow-hidden group bg-[#18181b] border border-white/10 hover:border-blue-500/50 rounded-xl p-3.5 text-left transition-all">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/15 rounded-full blur-[20px] group-hover:bg-blue-500/25 transition-colors"></div>
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <span className="font-bold text-gray-200 group-hover:text-white text-xs block transition-colors">🧬 Carbon DNA Lineage</span>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Trace emissions to ledger transactions</span>
                  </div>
                  <span className="text-gray-500 group-hover:text-blue-400 transition-colors">→</span>
                </div>
              </button>

              <button onClick={() => navigate('/environmental')} className="w-full relative overflow-hidden group bg-[#18181b] border border-white/10 hover:border-emerald-500/50 rounded-xl p-3.5 text-left transition-all">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full blur-[20px] group-hover:bg-emerald-500/25 transition-colors"></div>
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <span className="font-bold text-gray-200 group-hover:text-white text-xs block transition-colors">🌱 Environmental Ledger</span>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Manage factors and log transactions</span>
                  </div>
                  <span className="text-gray-500 group-hover:text-emerald-400 transition-colors">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
